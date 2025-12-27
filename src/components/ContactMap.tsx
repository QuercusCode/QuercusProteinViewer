import React, { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import type { ChainInfo } from '../types';

interface ContactMapProps {
    isOpen: boolean;
    onClose: () => void;
    chains: ChainInfo[];
    getContactData: () => Promise<{ x: number[], y: number[], z: number[], labels: string[] }[]>;
    onPixelClick?: (chainA: string, resA: number, chainB: string, resB: number) => void;
    isLightMode: boolean;
}

export const ContactMap: React.FC<ContactMapProps> = ({
    isOpen,
    onClose,
    chains,
    getContactData,
    onPixelClick,
    isLightMode
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [scale, setScale] = useState(1);
    const [autoFitted, setAutoFitted] = useState(false);
    const [hoverInfo, setHoverInfo] = useState<{ label: string, x: number, y: number, resA: string, resB: string, dist: string } | null>(null);
    const [distanceData, setDistanceData] = useState<{ matrix: number[][], xLabels: { resNo: number, chain: string }[], yLabels: { resNo: number, chain: string }[] } | null>(null);

    // Initial Load
    useEffect(() => {
        if (!isOpen) {
            setDistanceData(null);
            setAutoFitted(false);
            return;
        }

        const computeMap = async () => {
            setLoading(true);
            try {
                const rawChains = await getContactData();
                if (!rawChains || rawChains.length === 0) {
                    setLoading(false);
                    return;
                }

                const allResidues: { x: number, y: number, z: number, chain: string, resNo: number }[] = [];

                rawChains.forEach((c, idx) => {
                    const chainName = chains[idx]?.name || '?';
                    for (let i = 0; i < c.x.length; i++) {
                        const label = c.labels[i] || "";
                        const parts = label.split(" ");
                        const resNo = parseInt(parts[1]) || (i + 1);

                        allResidues.push({
                            x: c.x[i],
                            y: c.y[i],
                            z: c.z[i],
                            chain: chainName,
                            resNo: resNo
                        });
                    }
                });

                const N = allResidues.length;
                if (N > 3000) {
                    alert("Protein too large for browser-based contact map.");
                    setLoading(false);
                    return;
                }

                const matrix: number[][] = [];
                for (let i = 0; i < N; i++) {
                    const row: number[] = new Array(N);
                    for (let j = 0; j < N; j++) {
                        const dx = allResidues[i].x - allResidues[j].x;
                        const dy = allResidues[i].y - allResidues[j].y;
                        const dz = allResidues[i].z - allResidues[j].z;
                        row[j] = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    }
                    matrix.push(row);
                }

                const labels = allResidues.map(r => ({ resNo: r.resNo, chain: r.chain }));
                setDistanceData({ matrix, xLabels: labels, yLabels: labels });
            } catch (e) {
                console.error("Map computation failed", e);
            } finally {
                setLoading(false);
            }
        };

        setTimeout(computeMap, 100);

    }, [isOpen]);

    // Auto-Fit logic
    useEffect(() => {
        if (distanceData && containerRef.current && !autoFitted) {
            const size = distanceData.matrix.length;
            const { clientWidth, clientHeight } = containerRef.current;
            // Pad for axes (e.g. 40px)
            const availableW = clientWidth - 50;
            const availableH = clientHeight - 50;

            const newScale = Math.min(Math.floor(availableW / size), Math.floor(availableH / size));
            setScale(Math.max(1, newScale)); // Minimum 1px per residue
            setAutoFitted(true);
        }
    }, [distanceData, autoFitted]);

    // Draw Canvas
    useEffect(() => {
        if (!distanceData || !canvasRef.current || !isOpen) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const { matrix } = distanceData;
        const size = matrix.length;
        const P = scale;
        const offset = 30; // Margin for axes

        // Set total dimensions including axis margin
        canvasRef.current.width = (size * P) + offset;
        canvasRef.current.height = (size * P) + offset;

        // Background
        ctx.fillStyle = isLightMode ? '#f5f5f5' : '#171717';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Plot Area Background
        ctx.fillStyle = isLightMode ? '#ffffff' : '#000000';
        ctx.fillRect(offset, offset, size * P, size * P);

        // Draw Map
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const dist = matrix[i][j];
                if (dist < 12) {
                    let color = '';
                    if (isLightMode) {
                        if (dist < 5) color = '#dc2626'; // Deep Red
                        else if (dist < 8) color = '#ea580c'; // Orange
                        else color = '#93c5fd'; // Light Blue (faint)
                    } else {
                        // Dark Mode: Glowing
                        if (dist < 5) color = '#f87171'; // Red
                        else if (dist < 8) color = '#fbbf24'; // Amber
                        else color = '#1e3a8a'; // Dark Blue (subtle)
                    }

                    // Optimization: Skip very far/faint ones if dense? No, render all < 12.
                    if (dist >= 8) {
                        ctx.fillStyle = color;
                        ctx.globalAlpha = 0.4;
                    } else {
                        ctx.fillStyle = color;
                        ctx.globalAlpha = 1.0;
                    }

                    ctx.fillRect(offset + (j * P), offset + (i * P), P, P);
                }
            }
        }
        ctx.globalAlpha = 1.0;

        // Draw Axes Tick Marks
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isLightMode ? '#525252' : '#a3a3a3';
        ctx.font = '10px sans-serif';

        const step = Math.ceil(size / 10 / 5) * 5; // e.g., every 5, 10, 20 residues

        for (let i = 0; i < size; i += step) {
            const pos = offset + (i * P) + (P / 2);
            // Y Axis
            ctx.fillText(distanceData.yLabels[i].resNo.toString(), offset - 4, pos);
            // X Axis
            ctx.save();
            ctx.translate(pos, offset - 4);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(distanceData.xLabels[i].resNo.toString(), 0, 0);
            ctx.restore();
        }

        // Crosshair if hovering
        // Crosshair if hovering
        if (hoverInfo) {
            // Future: Draw exact crosshair on canvas?
        }

    }, [distanceData, scale, isLightMode]); // Removing hoverInfo from dependency to avoid redraw lag. Handle crosshair via overlay? 
    // Actually, let's skip canvas-based crosshair for performance and use a DOM overlay or just the tooltip.

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!distanceData) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const offset = 30; // Match render offset
        // Adjust for scale being CSS scale? No, canvas width/height match.

        const xRaw = e.clientX - rect.left;
        const yRaw = e.clientY - rect.top;

        if (xRaw < offset || yRaw < offset) {
            setHoverInfo(null);
            return;
        }

        const x = Math.floor((xRaw - offset) / scale);
        const y = Math.floor((yRaw - offset) / scale);

        if (x >= 0 && x < distanceData.xLabels.length && y >= 0 && y < distanceData.yLabels.length) {
            const resX = distanceData.xLabels[x];
            const resY = distanceData.yLabels[y];
            const dist = distanceData.matrix[y][x].toFixed(1);

            setHoverInfo({
                label: `${resX.chain}${resX.resNo} - ${resY.chain}${resY.resNo}`,
                resA: `${resX.chain}${resX.resNo}`,
                resB: `${resY.chain}${resY.resNo}`,
                dist: dist,
                x: e.clientX,
                y: e.clientY
            });
        } else {
            setHoverInfo(null);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!distanceData || !onPixelClick) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const offset = 30;

        const x = Math.floor((e.clientX - rect.left - offset) / scale);
        const y = Math.floor((e.clientY - rect.top - offset) / scale);

        if (x >= 0 && x < distanceData.xLabels.length && y >= 0 && y < distanceData.yLabels.length) {
            const resX = distanceData.xLabels[x];
            const resY = distanceData.yLabels[y];
            onPixelClick(resX.chain, resX.resNo, resY.chain, resY.resNo);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className={`relative w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ${isLightMode ? 'bg-white text-neutral-900 border border-neutral-200' : 'bg-neutral-900 text-white border border-neutral-800'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-200/10 bg-neutral-50/5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isLightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                            <Maximize className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Contact Map</h3>
                            <p className={`text-xs ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                Visualizing {chains.length} Chains • {distanceData?.matrix.length || 0} Residues
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${isLightMode ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-800 border-neutral-700'}`}>
                            <span className="opacity-60">Scale:</span>
                            <span>{scale}x</span>
                        </div>
                        <button onClick={() => setScale(s => Math.max(1, s - 1))} className="p-2 hover:bg-neutral-500/10 rounded-lg transition-colors"><ZoomOut className="w-4 h-4" /></button>
                        <button onClick={() => setScale(s => Math.min(20, s + 1))} className="p-2 hover:bg-neutral-500/10 rounded-lg transition-colors"><ZoomIn className="w-4 h-4" /></button>
                        <div className="w-px h-6 bg-neutral-500/20 mx-1" />
                        <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Content */}
                <div ref={containerRef} className="flex-1 overflow-auto p-4 flex justify-center bg-neutral-100/5 relative select-none">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-[1px]">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                                <span className="text-sm font-medium">Calculating Distances...</span>
                            </div>
                        </div>
                    )}

                    <canvas
                        ref={canvasRef}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseLeave={() => setHoverInfo(null)}
                        onClick={handleCanvasClick}
                        className="shadow-lg border border-neutral-500/10 image-pixelated bg-white"
                        style={{ imageRendering: 'pixelated' }}
                    />

                    {/* Fancy Tooltip */}
                    {hoverInfo && (
                        <div
                            className="fixed pointer-events-none z-50 flex flex-col gap-1 p-3 rounded-lg shadow-xl backdrop-blur-md border border-white/10"
                            style={{
                                left: hoverInfo.x + 16,
                                top: hoverInfo.y + 16,
                                backgroundColor: isLightMode ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)',
                                color: isLightMode ? '#171717' : '#ffffff'
                            }}
                        >
                            <div className="text-xs font-bold uppercase tracking-wider opacity-60">Interaction</div>
                            <div className="font-mono text-sm flex items-center gap-2">
                                <span>{hoverInfo.resA}</span>
                                <span className="opacity-40">↔</span>
                                <span>{hoverInfo.resB}</span>
                            </div>
                            <div className="mt-1 pt-1 border-t border-neutral-500/20 flex items-center justify-between gap-4">
                                <span className="text-xs opacity-70">Distance</span>
                                <span className={`font-bold ${parseFloat(hoverInfo.dist) < 5 ? 'text-red-500' : 'text-blue-500'}`}>{hoverInfo.dist} Å</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Legend */}
                <div className={`py-3 px-6 border-t font-medium text-xs flex items-center justify-between ${isLightMode ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900 border-neutral-800'}`}>
                    <div className="flex items-center gap-6">
                        <span className="uppercase tracking-wider opacity-50">Legend</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${isLightMode ? 'bg-red-600' : 'bg-red-400'}`} />
                            <span>&lt; 5 Å (Contact)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${isLightMode ? 'bg-orange-600' : 'bg-amber-400'}`} />
                            <span>5 - 8 Å (Proximal)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${isLightMode ? 'bg-blue-300' : 'bg-blue-900'}`} />
                            <span>8 - 12 Å (Distal)</span>
                        </div>
                    </div>
                    <div className="opacity-50">
                        Click to Highlight in 3D
                    </div>
                </div>
            </div>
        </div>
    );
};
