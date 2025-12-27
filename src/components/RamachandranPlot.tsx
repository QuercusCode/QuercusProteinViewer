import React, { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, Activity } from 'lucide-react';

interface RamachandranPlotProps {
    isOpen: boolean;
    onClose: () => void;
    getData: () => Promise<{ phi: number | null, psi: number | null, chain: string, resNo: number, resName: string }[]>;
    onPointClick?: (chain: string, resNo: number) => void;
    isLightMode: boolean;
    pdbId?: string;
}

export const RamachandranPlot: React.FC<RamachandranPlotProps> = ({
    isOpen,
    onClose,
    getData,
    onPointClick,
    isLightMode,
    pdbId
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{ phi: number | null, psi: number | null, chain: string, resNo: number, resName: string }[] | null>(null);
    const [scale, setScale] = useState(1.5); // Fixed scale relative to 360x360 base
    const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, item: any } | null>(null);

    // Initial Load
    useEffect(() => {
        if (!isOpen) {
            setData(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getData();
                setData(result);
            } catch (e) {
                console.error("Failed to get torsion data", e);
            } finally {
                setLoading(false);
            }
        };

        // Slight delay to allow animation or structure load
        const timer = setTimeout(fetchData, 100);
        return () => clearTimeout(timer);
    }, [isOpen, pdbId]);

    // Draw Plot
    useEffect(() => {
        if (!data || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const size = 360 * scale; // Map -180..180 to 0..size
        canvasRef.current.width = size;
        canvasRef.current.height = size;

        // Theme Colors
        const bg = isLightMode ? '#ffffff' : '#171717';
        const axisColor = isLightMode ? '#cbd5e1' : '#404040'; // Slate-300 / Neutral-700
        const gridColor = isLightMode ? '#f1f5f9' : '#262626'; // Slate-100 / Neutral-800
        const pointColor = isLightMode ? 'rgba(30, 58, 138, 0.6)' : 'rgba(96, 165, 250, 0.7)'; // Blue-900 / Blue-400
        const favoredColor = isLightMode ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.05)'; // Subtle Green Tint

        // 1. Background
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);

        // helper to map angle (-180..180) to pixels (0..size)
        // Y-Axis is inverted in Canvas (0 is top), but standard plots have +180 at top.
        // Let's map: Psi 180 -> 0 (top), Psi -180 -> size (bottom)
        const mapX = (deg: number) => ((deg + 180) / 360) * size;
        const mapY = (deg: number) => size - ((deg + 180) / 360) * size;

        // 2. Draw Regions (Simplistic)
        ctx.fillStyle = favoredColor;
        // Beta Sheet (Top Left) approx: Phi -180..-45, Psi 45..180
        ctx.fillRect(mapX(-180), mapY(180), mapX(-45) - mapX(-180), mapY(45) - mapY(180));
        // Alpha Helix (Mid Left) approx: Phi -180..-45, Psi -90..-15
        ctx.fillRect(mapX(-180), mapY(-15), mapX(-45) - mapX(-180), mapY(-90) - mapY(-15));


        // 3. Grid & Axes
        ctx.lineWidth = 1;
        ctx.strokeStyle = gridColor;

        // Grid lines every 60 deg
        ctx.beginPath();
        for (let d = -120; d < 180; d += 60) {
            if (d === 0) continue;
            // Vert
            ctx.moveTo(mapX(d), 0); ctx.lineTo(mapX(d), size);
            // Horz
            ctx.moveTo(0, mapY(d)); ctx.lineTo(size, mapY(d));
        }
        ctx.stroke();

        // Zero Axes (Stronger)
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Y Axis (Phi=0)
        ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), size);
        // X Axis (Psi=0)
        ctx.moveTo(0, mapY(0)); ctx.lineTo(size, mapY(0));
        ctx.stroke();

        // 4. Points
        data.forEach(p => {
            if (p.phi === null || p.psi === null || isNaN(p.phi) || isNaN(p.psi)) return;
            const x = mapX(p.phi);
            const y = mapY(p.psi);

            ctx.beginPath();
            ctx.arc(x, y, 3 * scale, 0, Math.PI * 2);
            ctx.fillStyle = pointColor;
            ctx.fill();
        });

    }, [data, scale, isLightMode]);

    // Handle Interaction (Overlay 2)
    useEffect(() => {
        if (!overlayRef.current) return;
        const cvs = overlayRef.current;
        const size = 360 * scale;
        cvs.width = size;
        cvs.height = size;
    }, [scale]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!data || !overlayRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const ctx = overlayRef.current.getContext('2d');
        if (!ctx) return;

        const size = 360 * scale;
        const mapX = (deg: number) => ((deg + 180) / 360) * size;
        const mapY = (deg: number) => size - ((deg + 180) / 360) * size;

        // Clear previous
        ctx.clearRect(0, 0, size, size);

        // Find closest point
        let closest = null;
        let minDist = 10 * scale;

        for (const p of data) {
            if (p.phi === null || p.psi === null) continue;
            const px = mapX(p.phi);
            const py = mapY(p.psi);
            const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
            if (dist < minDist) {
                minDist = dist;
                closest = { ...p, px, py };
            }
        }

        if (closest) {
            setHoverInfo({ x: e.clientX, y: e.clientY, item: closest });

            // Highlight point
            ctx.beginPath();
            ctx.arc(closest.px, closest.py, 6 * scale, 0, Math.PI * 2);
            ctx.strokeStyle = isLightMode ? '#ef4444' : '#f87171'; // Red
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw crosshair
            ctx.strokeStyle = isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(closest.px, 0); ctx.lineTo(closest.px, size);
            ctx.moveTo(0, closest.py); ctx.lineTo(size, closest.py);
            ctx.stroke();

            // Cursor
            document.body.style.cursor = 'pointer';
        } else {
            setHoverInfo(null);
            document.body.style.cursor = 'default';
        }
    };

    const handleClick = () => {
        if (hoverInfo && onPointClick) {
            onPointClick(hoverInfo.item.chain, hoverInfo.item.resNo);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ${isLightMode ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white border border-neutral-800'}`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isLightMode ? 'bg-white border-neutral-100' : 'bg-neutral-900 border-neutral-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isLightMode ? 'bg-teal-50 text-teal-600' : 'bg-teal-900/20 text-teal-400'}`}>
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Ramachandran Plot</h3>
                            <p className="text-xs opacity-60">Validation Suite • Phi (φ) vs Psi (ψ)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`flex items-center rounded-lg p-1 ${isLightMode ? 'bg-neutral-100' : 'bg-neutral-800'}`}>
                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className={`p-2 rounded-md transition-all shadow-sm ${isLightMode ? 'hover:bg-white text-neutral-600' : 'hover:bg-neutral-700 text-neutral-300'}`}><ZoomOut className="w-4 h-4" /></button>
                            <span className="w-12 text-center text-xs font-mono font-medium opacity-70">{scale.toFixed(2)}x</span>
                            <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className={`p-2 rounded-md transition-all shadow-sm ${isLightMode ? 'hover:bg-white text-neutral-600' : 'hover:bg-neutral-700 text-neutral-300'}`}><ZoomIn className="w-4 h-4" /></button>
                        </div>
                        <div className={`w-px h-6 mx-2 ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-700'}`} />
                        <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 opacity-60 hover:opacity-100 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`flex-1 overflow-auto relative flex justify-center p-8 ${isLightMode ? 'bg-neutral-50' : 'bg-black/20'}`}>
                    {loading ? (
                        <div className={`absolute inset-0 flex items-center justify-center z-10 ${isLightMode ? 'bg-white/80' : 'bg-black/80'}`}>
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
                                <span className="text-sm font-medium opacity-70">Calculating Torsion Angles...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative inline-block">
                            {/* Axis Labels Y */}
                            <div className="absolute left-[-40px] top-0 bottom-0 flex flex-col justify-between text-xs font-mono opacity-50 py-2">
                                <span>180</span>
                                <span>90</span>
                                <span>0</span>
                                <span>-90</span>
                                <span>-180</span>
                            </div>
                            <div className="absolute left-[-60px] top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold uppercase tracking-wider opacity-40">Psi (ψ)</div>

                            {/* Axis Labels X */}
                            <div className="absolute bottom-[-30px] left-0 right-0 flex justify-between text-xs font-mono opacity-50 px-2">
                                <span>-180</span>
                                <span>-90</span>
                                <span>0</span>
                                <span>90</span>
                                <span>180</span>
                            </div>
                            <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider opacity-40">Phi (φ)</div>


                            <div className={`shadow-lg border rounded-lg overflow-hidden relative ${isLightMode ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-700'}`}>
                                <canvas ref={canvasRef} className="block" />
                                <canvas
                                    ref={overlayRef}
                                    className="absolute inset-0 cursor-crosshair"
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={() => { setHoverInfo(null); document.body.style.cursor = 'default'; }}
                                    onClick={handleClick}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tooltip */}
            {hoverInfo && (
                <div
                    className={`fixed z-[70] pointer-events-none p-3 rounded-lg shadow-xl border backdrop-blur-md ${isLightMode ? 'bg-white/95 border-neutral-200 text-neutral-900' : 'bg-neutral-800/95 border-neutral-700 text-white'}`}
                    style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
                >
                    <div className="font-bold text-sm mb-1">{hoverInfo.item.resName} {hoverInfo.item.resNo}</div>
                    <div className="text-xs font-mono opacity-70 grid grid-cols-2 gap-x-4">
                        <span>Phi (φ):</span> <span>{hoverInfo.item.phi?.toFixed(1)}°</span>
                        <span>Psi (ψ):</span> <span>{hoverInfo.item.psi?.toFixed(1)}°</span>
                    </div>
                </div>
            )}

        </div>
    );
};
