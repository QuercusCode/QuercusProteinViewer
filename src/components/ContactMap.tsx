import React, { useEffect, useRef, useState, useMemo } from 'react';
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
    getContactData,
    onPixelClick,
    isLightMode
}) => {
    const mapCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

    const [loading, setLoading] = useState(false);
    const [scale, setScale] = useState(2);
    const [distanceData, setDistanceData] = useState<{ matrix: number[][], size: number, labels: { resNo: number, chain: string, label: string }[] } | null>(null);
    const [hoverPos, setHoverPos] = useState<{ i: number, j: number, x: number, y: number } | null>(null);

    // Initial Data Calculation
    useEffect(() => {
        if (!isOpen) {
            setDistanceData(null);
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

                const allResidues: { x: number, y: number, z: number, chain: string, resNo: number, label: string }[] = [];

                rawChains.forEach((c) => {
                    for (let i = 0; i < c.x.length; i++) {
                        const rawLabel = c.labels[i] || "";
                        // Expected format: "Chain:ResName ResNo" e.g., "A:ALA 10"
                        // Or fallback if old format: "ALA 10"

                        let chainName = "?";
                        let residueLabel = rawLabel;

                        if (rawLabel.includes(":")) {
                            const firstSplit = rawLabel.split(":");
                            chainName = firstSplit[0];
                            residueLabel = firstSplit.slice(1).join(":");
                        }

                        const parts = residueLabel.trim().split(" ");
                        const resNo = parseInt(parts[parts.length - 1]) || (i + 1);

                        allResidues.push({
                            x: c.x[i],
                            y: c.y[i],
                            z: c.z[i],
                            chain: chainName,
                            resNo: resNo,
                            label: residueLabel
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

                setDistanceData({
                    matrix,
                    size: N,
                    labels: allResidues.map(r => ({ resNo: r.resNo, chain: r.chain, label: r.label }))
                });

                // Auto-scale to fit view (aim for ~600px or fit within container)
                const optimalScale = Math.max(1, Math.min(20, Math.floor(600 / N)));
                setScale(optimalScale);

            } catch (e) {
                console.error("Map computation failed", e);
            } finally {
                setLoading(false);
            }
        };

        setTimeout(computeMap, 100);
    }, [isOpen]);

    // Render Base Map (Theme Aware)
    useEffect(() => {
        if (!distanceData || !mapCanvasRef.current) return;
        const ctx = mapCanvasRef.current.getContext('2d', { alpha: false });
        if (!ctx) return;

        const { matrix, size } = distanceData;

        const P = scale;
        mapCanvasRef.current.width = size * P;
        mapCanvasRef.current.height = size * P;

        // Theme Colors
        const bg = isLightMode ? '#ffffff' : '#171717';
        const grid = isLightMode ? '#f0f0f0' : '#262626';
        const diag = isLightMode ? '#e5e5e5' : '#404040';

        // Fill Bg
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, mapCanvasRef.current.width, mapCanvasRef.current.height);

        // Draw Grid Lines (Light Grey)
        ctx.strokeStyle = grid;
        ctx.lineWidth = 1;

        const gridStep = 25;
        ctx.beginPath();
        for (let i = 0; i <= size; i += gridStep) {
            const pos = Math.floor(i * P) + 0.5;
            ctx.moveTo(0, pos);
            ctx.lineTo(size * P, pos);
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, size * P);
        }
        ctx.stroke();

        // Draw Diagonals
        ctx.strokeStyle = diag;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * P, size * P);
        ctx.stroke();

        // Draw Contacts
        for (let i = 0; i < size; i++) {
            for (let j = i; j < size; j++) {
                const dist = matrix[i][j];

                if (dist < 8) {
                    if (dist < 5) {
                        ctx.fillStyle = isLightMode ? '#1e3a8a' : '#60a5fa';
                    } else {
                        ctx.fillStyle = isLightMode ? '#94a3b8' : '#475569';
                    }

                    ctx.fillRect(j * P, i * P, P, P);
                    if (i !== j) {
                        ctx.fillRect(i * P, j * P, P, P);
                    }
                }
            }
        }

    }, [distanceData, scale, isLightMode]);

    // Render Overlay (Crosshair) - Light
    useEffect(() => {
        if (!distanceData || !overlayCanvasRef.current) return;
        const canvas = overlayCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { size } = distanceData;
        canvas.width = size * scale;
        canvas.height = size * scale;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (hoverPos) {
            const { i, j } = hoverPos;
            const x = j * scale;
            const y = i * scale;

            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.fillRect(0, y, canvas.width, scale);
            ctx.fillRect(x, 0, scale, canvas.height);

            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y + scale / 2);
            ctx.lineTo(canvas.width, y + scale / 2);
            ctx.moveTo(x + scale / 2, 0);
            ctx.lineTo(x + scale / 2, canvas.height);
            ctx.stroke();

            ctx.strokeRect(x, y, scale, scale);
        }

    }, [distanceData, scale, hoverPos]);


    const handleMouseMove = (e: React.MouseEvent) => {
        if (!distanceData) return;
        const rect = overlayCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        const j = Math.floor(rawX / scale);
        const i = Math.floor(rawY / scale);

        if (i >= 0 && i < distanceData.size && j >= 0 && j < distanceData.size) {
            setHoverPos({ i, j, x: e.clientX, y: e.clientY });
        } else {
            setHoverPos(null);
        }
    };

    const handleClick = () => {
        if (hoverPos && distanceData && onPixelClick) {
            const { i, j } = hoverPos;
            const resA = distanceData.labels[i];
            const resB = distanceData.labels[j];
            onPixelClick(resA.chain, resA.resNo, resB.chain, resB.resNo);
        }
    };

    // Generate Axis Labels
    const Axes = useMemo(() => {
        if (!distanceData) return null;
        const { size, labels } = distanceData;

        // Check finding actual unique chains in the data
        const uniqueChains = new Set(labels.map(l => l.chain));
        const showChain = uniqueChains.size > 1;

        const step = 20;
        const ticks = [];
        for (let i = 0; i < size; i += step) {
            if (i === 0 && size > 10) continue;
            ticks.push(i);
        }

        return {
            x: ticks.map(t => {
                const data = labels[t];
                const label = showChain ? `${data?.chain}:${data?.resNo}` : data?.resNo;
                return (
                    <div key={`x-${t}`} className="absolute text-[10px] text-neutral-500 font-medium transform -translate-x-1/2 flex flex-col items-center" style={{ left: (t * scale) + (scale / 2) }}>
                        <span className="whitespace-nowrap mb-0.5">{label}</span>
                        <div className="h-1 w-px bg-neutral-300"></div>
                    </div>
                );
            }),
            y: ticks.map(t => {
                const data = labels[t];
                const label = showChain ? `${data?.chain}:${data?.resNo}` : data?.resNo;
                return (
                    <div key={`y-${t}`} className="absolute text-[10px] text-neutral-500 font-medium transform -translate-y-1/2 flex items-center justify-end w-12 right-0 pr-1" style={{ top: (t * scale) + (scale / 2) }}>
                        <span className="whitespace-nowrap">{label}</span>
                        <div className="h-px w-1 bg-neutral-300 ml-1"></div>
                    </div>
                );
            })
        };
    }, [distanceData, scale]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className={`relative w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ${isLightMode ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white border border-neutral-800'}`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isLightMode ? 'bg-white border-neutral-100' : 'bg-neutral-900 border-neutral-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isLightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400'}`}>
                            <Maximize className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Contact Map</h3>
                            <p className="text-xs opacity-60">
                                {distanceData ? `${distanceData.size} Residues` : 'Loading Map...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`flex items-center rounded-lg p-1 ${isLightMode ? 'bg-neutral-100' : 'bg-neutral-800'}`}>
                            <button onClick={() => setScale(s => Math.max(1, s - 1))} className={`p-2 rounded-md transition-all shadow-sm ${isLightMode ? 'hover:bg-white text-neutral-600' : 'hover:bg-neutral-700 text-neutral-300'}`}><ZoomOut className="w-4 h-4" /></button>
                            <span className="w-12 text-center text-xs font-mono font-medium opacity-70">{scale}x</span>
                            <button onClick={() => setScale(s => Math.min(20, s + 1))} className={`p-2 rounded-md transition-all shadow-sm ${isLightMode ? 'hover:bg-white text-neutral-600' : 'hover:bg-neutral-700 text-neutral-300'}`}><ZoomIn className="w-4 h-4" /></button>
                        </div>
                        <div className={`w-px h-6 mx-2 ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-700'}`} />
                        <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 opacity-60 hover:opacity-100 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                {/* Main Content Area - Grid Layout for Sticky Axes */}
                <div className={`flex-1 overflow-auto relative p-0 ${isLightMode ? 'bg-neutral-50' : 'bg-black/20'}`}>
                    {loading ? (
                        <div className={`absolute inset-0 flex items-center justify-center z-10 ${isLightMode ? 'bg-white/80' : 'bg-black/80'}`}>
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                                <span className={`text-sm font-medium ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>Computing Interactions...</span>
                            </div>
                        </div>
                    ) : distanceData && (
                        <div className="inline-grid grid-cols-[auto_1fr] grid-rows-[auto_1fr]">

                            {/* Top-Left Corner (Sticky) */}
                            <div className={`sticky top-0 left-0 z-20 w-12 h-8 ${isLightMode ? 'bg-neutral-50' : 'bg-neutral-900'}`} />

                            {/* X Axis (Sticky Top) */}
                            <div className={`sticky top-0 z-10 h-8 relative border-b ${isLightMode ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900 border-neutral-800'}`} style={{ width: distanceData.size * scale }}>
                                {Axes?.x}
                            </div>

                            {/* Y Axis (Sticky Left) */}
                            <div className={`sticky left-0 z-10 w-12 relative border-r ${isLightMode ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900 border-neutral-800'}`} style={{ height: distanceData.size * scale }}>
                                {Axes?.y}
                            </div>

                            {/* Map Canvas */}
                            <div className="relative" style={{ width: distanceData.size * scale, height: distanceData.size * scale }}>
                                <canvas
                                    ref={mapCanvasRef}
                                    className="absolute inset-0 pointer-events-none image-pixelated"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <canvas
                                    ref={overlayCanvasRef}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={() => setHoverPos(null)}
                                    onClick={handleClick}
                                    className="absolute inset-0 cursor-crosshair image-pixelated"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Floating Info Card */}
                    {hoverPos && distanceData && (
                        <div className={`absolute bottom-6 right-6 backdrop-blur shadow-xl border rounded-lg p-4 flex flex-col gap-1 w-64 z-50 ${isLightMode ? 'bg-white/95 border-neutral-100' : 'bg-neutral-800/95 border-neutral-700'}`}>
                            <div className={`flex items-center justify-between pb-2 border-b ${isLightMode ? 'border-neutral-100' : 'border-neutral-700'}`}>
                                <span className="text-xs font-bold uppercase opacity-50 tracking-wider">Interaction</span>
                                <span className={`text-sm font-bold ${distanceData.matrix[hoverPos.i][hoverPos.j] < 5 ? 'text-blue-500' : 'opacity-70'}`}>
                                    {distanceData.matrix[hoverPos.i][hoverPos.j].toFixed(2)} Å
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <span className="text-[10px] opacity-50 uppercase">Residue 1</span>
                                    <div className="font-mono text-sm">{distanceData.labels[hoverPos.i].label}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] opacity-50 uppercase">Residue 2</span>
                                    <div className="font-mono text-sm">{distanceData.labels[hoverPos.j].label}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Legend */}
                <div className={`border-t px-6 py-3 flex items-center justify-center gap-8 text-xs font-medium ${isLightMode ? 'bg-white border-neutral-100 text-neutral-600' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${isLightMode ? 'bg-[#1e3a8a]' : 'bg-blue-400'}`}></div>
                        <span>Close Contact (&lt; 5 Å)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${isLightMode ? 'bg-[#94a3b8]' : 'bg-slate-600'}`}></div>
                        <span>Proximal (5 - 8 Å)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 border rounded-sm ${isLightMode ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-700'}`}></div>
                        <span>Distal / No Contact (&gt; 8 Å)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
