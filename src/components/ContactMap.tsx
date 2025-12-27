import React, { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import type { ChainInfo } from '../types';

interface ContactMapProps {
    isOpen: boolean;
    onClose: () => void;
    chains: ChainInfo[];
    getContactData: () => Promise<{ x: number[], y: number[], z: number[], labels: string[] }[]>; // Returns CA coords per chain
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
    const [hoverInfo, setHoverInfo] = useState<{ label: string, x: number, y: number } | null>(null);
    const [distanceData, setDistanceData] = useState<{ matrix: number[][], xLabels: { resNo: number, chain: string }[], yLabels: { resNo: number, chain: string }[] } | null>(null);

    // Initial Load
    useEffect(() => {
        if (!isOpen) {
            setDistanceData(null);
            return;
        }

        const computeMap = async () => {
            setLoading(true);
            try {
                // Fetch coords
                // Simplifying: We only map the FIRST chain against ITSELF for now, or ALL vs ALL if manageable.
                // Let's do ALL vs ALL for comprehensive view, but limited to CA.

                const rawChains = await getContactData();
                if (!rawChains || rawChains.length === 0) {
                    setLoading(false);
                    return;
                }

                // Flatten all residues into a single list
                const allResidues: { x: number, y: number, z: number, chain: string, resNo: number }[] = [];

                // Assuming getContactData returns logical structure matching 'chains' prop index
                rawChains.forEach((c, idx) => {
                    const chainName = chains[idx]?.name || '?';
                    for (let i = 0; i < c.x.length; i++) {
                        // We need the ACTUAL resNo. The 'labels' might have it or we infer from index + minSeq
                        // Let's assume the helper returns aligned data. 
                        // To be robust, the helper should return objects, but let's assume strict index mapping for now 
                        // or better: The helper should return strictly CA atoms.

                        // Actually, let's just push "Residue i"
                        // We need resNo for interaction. 
                        // Let's assume sequential for now or parse from labels if provided.
                        // But we passed 'labels' in the interface.
                        const label = c.labels[i] || ""; // "ALA 12"
                        const parts = label.split(" ");
                        const resNo = parseInt(parts[1]) || (i + 1); // Fallback

                        allResidues.push({
                            x: c.x[i],
                            y: c.y[i],
                            z: c.z[i],
                            chain: chainName,
                            resNo: resNo
                        });
                    }
                });

                // Compute N x N matrix
                const N = allResidues.length;
                if (N > 2000) {
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

        // Small delay to allow UI to open
        setTimeout(computeMap, 100);

    }, [isOpen]); // Re-run if chains change? Maybe add 'chains' dependency if needed.

    // Draw Canvas
    useEffect(() => {
        if (!distanceData || !canvasRef.current || !isOpen) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const { matrix } = distanceData;
        const size = matrix.length;
        const pixelSize = scale; // px per residue

        canvasRef.current.width = size * pixelSize;
        canvasRef.current.height = size * pixelSize;

        // Clear
        ctx.fillStyle = isLightMode ? '#ffffff' : '#000000';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const dist = matrix[i][j];
                if (dist < 12) { // Threshold 12A usually captures contacts
                    // 0 distance = black/darkest. 12 = white/lightest (in inverted logic)
                    // Heatmap: 
                    // < 4A (Contact/H-bond): Red/Black
                    // 4-8A (Near): Orange/Gray
                    // 8-12A (Far): Yellow/Light

                    let color = '';
                    if (isLightMode) {
                        // Light Mode: Contact = Dark
                        const intensity = Math.floor((dist / 12) * 255);
                        color = `rgb(${intensity}, ${intensity}, ${intensity})`;
                    } else {
                        // Dark Mode: Contact = Bright/Colored
                        if (dist < 5) color = '#ef4444'; // Red (Close)
                        else if (dist < 8) color = '#f59e0b'; // Amber (Med)
                        else color = '#3b82f6'; // Blue (Far)
                    }
                    ctx.fillStyle = color;
                    ctx.fillRect(j * pixelSize, i * pixelSize, pixelSize, pixelSize);
                }
            }
        }

    }, [distanceData, scale, isLightMode]);

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!distanceData) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = Math.floor((e.clientX - rect.left) / scale);
        const y = Math.floor((e.clientY - rect.top) / scale);

        if (x >= 0 && x < distanceData.xLabels.length && y >= 0 && y < distanceData.yLabels.length) {
            const resX = distanceData.xLabels[x];
            const resY = distanceData.yLabels[y];
            const dist = distanceData.matrix[y][x].toFixed(1);

            setHoverInfo({
                label: `Contact: ${resX.chain}${resX.resNo} - ${resY.chain}${resY.resNo} (${dist}Å)`,
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

        const x = Math.floor((e.clientX - rect.left) / scale);
        const y = Math.floor((e.clientY - rect.top) / scale);

        if (x >= 0 && x < distanceData.xLabels.length && y >= 0 && y < distanceData.yLabels.length) {
            const resX = distanceData.xLabels[x];
            const resY = distanceData.yLabels[y];
            onPixelClick(resX.chain, resX.resNo, resY.chain, resY.resNo);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className={`relative w-full max-w-2xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ${isLightMode ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-200/20">
                    <h3 className="font-bold text-lg">Contact Map</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs opacity-60 mr-2">Scale: {scale}x</span>
                        <button onClick={() => setScale(s => Math.max(1, s - 1))} className="p-1.5 hover:bg-neutral-500/20 rounded"><ZoomOut className="w-4 h-4" /></button>
                        <button onClick={() => setScale(s => Math.min(10, s + 1))} className="p-1.5 hover:bg-neutral-500/20 rounded"><ZoomIn className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-neutral-500/30 mx-1" />
                        <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Content */}
                <div ref={containerRef} className="flex-1 overflow-auto p-4 flex justify-center bg-neutral-100/5 relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                    )}

                    <canvas
                        ref={canvasRef}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseLeave={() => setHoverInfo(null)}
                        onClick={handleCanvasClick}
                        className="cursor-crosshair shadow-lg border border-neutral-500/20 image-pixelated"
                        style={{ imageRendering: 'pixelated' }}
                    />

                    {/* Hover Tooltip */}
                    {hoverInfo && (
                        <div
                            className="fixed pointer-events-none px-2 py-1 bg-black/80 text-white text-xs rounded z-50 whitespace-nowrap"
                            style={{
                                left: hoverInfo.x + 10,
                                top: hoverInfo.y + 10
                            }}
                        >
                            {hoverInfo.label}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
