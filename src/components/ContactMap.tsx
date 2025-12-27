import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import type { ChainInfo } from '../types';

interface ContactMapProps {
    isOpen: boolean;
    onClose: () => void;
    chains: ChainInfo[];
    getContactData: () => Promise<{ x: number[], y: number[], z: number[], labels: string[] }[]>;
    onPixelClick?: (chainA: string, resA: number, chainB: string, resB: number) => void;
    isLightMode: boolean; // We might ignore this for the map itself to enforce "Paper" look, or adapt subtly.
}

export const ContactMap: React.FC<ContactMapProps> = ({
    isOpen,
    onClose,
    chains,
    getContactData,
    onPixelClick
}) => {
    const mapCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

    const [loading, setLoading] = useState(false);
    const [scale, setScale] = useState(2); // Start a bit larger
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
                            resNo: resNo,
                            label: label
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
            } catch (e) {
                console.error("Map computation failed", e);
            } finally {
                setLoading(false);
            }
        };

        // Delay to allow fade-in
        setTimeout(computeMap, 100);
    }, [isOpen]);

    // Render Base Map (Heavy)
    useEffect(() => {
        if (!distanceData || !mapCanvasRef.current) return;
        const ctx = mapCanvasRef.current.getContext('2d', { alpha: false });
        if (!ctx) return;

        const { matrix, size } = distanceData;

        mapCanvasRef.current.width = size * scale;
        mapCanvasRef.current.height = size * scale;

        // Fill White (Paper style)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, mapCanvasRef.current.width, mapCanvasRef.current.height);

        // Draw Grid Lines (Light Grey)
        ctx.strokeStyle = '#f0f0f0'; // Very subtle
        ctx.lineWidth = 1;

        const gridStep = 25; // Every 25 residues
        ctx.beginPath();
        for (let i = 0; i <= size; i += gridStep) {
            const pos = Math.floor(i * scale) + 0.5; // Snap to pixel
            // Horizontal
            ctx.moveTo(0, pos);
            ctx.lineTo(size * scale, pos);
            // Vertical
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, size * scale);
        }
        ctx.stroke();

        // Draw Diagonals
        ctx.strokeStyle = '#e5e5e5';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * scale, size * scale);
        ctx.stroke();

        // Draw Contacts
        // Optimized: direct pixel manipulation is faster for massive maps, but rects are easier
        // Let's use Rects for < 3000
        for (let i = 0; i < size; i++) {
            for (let j = i; j < size; j++) { // Symmetry optimization? Draw both
                const dist = matrix[i][j];

                // Theme: Clean Academic
                // Contact (<5A): Black/Dark Navy
                // Proximal (5-8A): Grey/Teal
                // Distant (>8A): Hidden

                if (dist < 8) {
                    if (dist < 5) {
                        ctx.fillStyle = '#1e3a8a'; // Dark Blue (Indigo-900)
                    } else {
                        ctx.fillStyle = '#94a3b8'; // Slate-400
                    }

                    // Draw (i,j)
                    ctx.fillRect(j * scale, i * scale, scale, scale);
                    // Draw (j,i) symmetric
                    if (i !== j) {
                        ctx.fillRect(i * scale, j * scale, scale, scale);
                    }
                }
            }
        }

    }, [distanceData, scale]);

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

            // Semi-transparent highlight for the row/col
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Blue-500 low opacity
            ctx.fillRect(0, y, canvas.width, scale);
            ctx.fillRect(x, 0, scale, canvas.height);

            // Crosshair lines
            ctx.strokeStyle = '#3b82f6'; // Blue-500
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Horizontal line
            ctx.moveTo(0, y + scale / 2);
            ctx.lineTo(canvas.width, y + scale / 2);
            // Vertical line
            ctx.moveTo(x + scale / 2, 0);
            ctx.lineTo(x + scale / 2, canvas.height);
            ctx.stroke();

            // Highlight specific pixel
            ctx.strokeRect(x, y, scale, scale);
        }

    }, [distanceData, scale, hoverPos]);


    const handleMouseMove = (e: React.MouseEvent) => {
        if (!distanceData) return;
        const rect = overlayCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        // Map to residue index
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
        const { size } = distanceData;
        const step = 50; // Label every 50
        const ticks = [];
        for (let i = 0; i < size; i += step) {
            if (i === 0 && size > 10) continue; // Skip 0 if crowded or handle 1
            ticks.push(i);
        }

        return {
            x: ticks.map(t => (
                <div key={`x-${t}`} className="absolute text-[10px] text-neutral-500 font-medium transform -translate-x-1/2 flex flex-col items-center" style={{ left: (t * scale) + (scale / 2) }}>
                    <div className="h-1 w-px bg-neutral-300 mb-0.5"></div>
                    <span>{distanceData.labels[t]?.resNo}</span>
                </div>
            )),
            y: ticks.map(t => (
                <div key={`y-${t}`} className="absolute text-[10px] text-neutral-500 font-medium transform -translate-y-1/2 flex items-center justify-end w-8 right-0 pr-1" style={{ top: (t * scale) + (scale / 2) }}>
                    <span>{distanceData.labels[t]?.resNo}</span>
                    <div className="h-px w-1 bg-neutral-300 ml-1"></div>
                </div>
            ))
        };
    }, [distanceData, scale]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden text-neutral-900">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Maximize className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Contact Map</h3>
                            <p className="text-xs text-neutral-400">
                                {distanceData ? `${distanceData.size} Residues • Academic Style` : 'Initializing...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-neutral-100 rounded-lg p-1">
                            <button onClick={() => setScale(s => Math.max(1, s - 1))} className="p-2 hover:bg-white rounded-md transition-all shadow-sm"><ZoomOut className="w-4 h-4 text-neutral-600" /></button>
                            <span className="w-12 text-center text-xs font-mono font-medium">{scale}x</span>
                            <button onClick={() => setScale(s => Math.min(20, s + 1))} className="p-2 hover:bg-white rounded-md transition-all shadow-sm"><ZoomIn className="w-4 h-4 text-neutral-600" /></button>
                        </div>
                        <div className="w-px h-6 bg-neutral-200 mx-2" />
                        <button onClick={onClose} className="p-2 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                {/* Main Content Area - Grid Layout */}
                <div className="flex-1 overflow-auto bg-neutral-50 relative flex justify-center p-8">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                                <span className="text-sm font-medium text-blue-600">Computing Interactions...</span>
                            </div>
                        </div>
                    ) : distanceData && (
                        <div className="relative inline-block bg-white shadow-sm p-4 rounded-lg border border-neutral-200">
                            {/* Y Axis */}
                            <div className="absolute top-4 bottom-4 left-0 w-8" style={{ height: distanceData.size * scale }}>
                                {Axes?.y}
                            </div>

                            {/* Map Container (Offset for Y axis) */}
                            <div className="ml-8 relative" style={{ width: distanceData.size * scale, height: distanceData.size * scale }}>
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

                            {/* X Axis */}
                            <div className="ml-8 relative h-6 mt-1 w-full">
                                {Axes?.x}
                            </div>
                        </div>
                    )}

                    {/* Floating Info Card (Positioned relative to viewport or bottom right) */}
                    {hoverPos && distanceData && (
                        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur shadow-xl border border-neutral-100 rounded-lg p-4 flex flex-col gap-1 w-64 z-50">
                            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                                <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Interaction</span>
                                <span className={`text-sm font-bold ${distanceData.matrix[hoverPos.i][hoverPos.j] < 5 ? 'text-blue-600' : 'text-slate-500'}`}>
                                    {distanceData.matrix[hoverPos.i][hoverPos.j].toFixed(2)} Å
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <span className="text-[10px] text-neutral-400 uppercase">Residue 1</span>
                                    <div className="font-mono text-sm">{distanceData.labels[hoverPos.i].label}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-neutral-400 uppercase">Residue 2</span>
                                    <div className="font-mono text-sm">{distanceData.labels[hoverPos.j].label}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Legend */}
                <div className="bg-white border-t border-neutral-100 px-6 py-3 flex items-center justify-center gap-8 text-xs font-medium text-neutral-600">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#1e3a8a] rounded-sm"></div>
                        <span>Close Contact (&lt; 5 Å)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#94a3b8] rounded-sm"></div>
                        <span>Proximal (5 - 8 Å)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-white border border-neutral-200 rounded-sm"></div>
                        <span>Distal / No Contact (&gt; 8 Å)</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
