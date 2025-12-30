import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, ZoomIn, ZoomOut, Maximize, Download, Grid3X3, Check, FileText, Menu } from 'lucide-react';
import type { ChainInfo } from '../types';

interface ContactMapProps {
    isOpen: boolean;
    onClose: () => void;
    chains: ChainInfo[];
    getContactData: () => Promise<{ x: number[], y: number[], z: number[], labels: string[], ss: string[] }[]>;
    onPixelClick?: (chainA: string, resA: number, chainB: string, resB: number) => void;
    isLightMode: boolean;
}

const getInteractionType = (label1: string, label2: string, dist: number) => {
    if (dist > 8.0) return null;

    // Extract residue name (assumes "ALA 123" format or similar, takes first word)
    const getResName = (l: string) => l.trim().split(' ')[0].toUpperCase();
    const r1 = getResName(label1);
    const r2 = getResName(label2);

    const POSITIVE = ['ARG', 'LYS', 'HIS'];
    const NEGATIVE = ['ASP', 'GLU'];
    const AROMATIC = ['PHE', 'TYR', 'TRP', 'HIS'];
    const HYDROPHOBIC = ['ALA', 'VAL', 'ILE', 'LEU', 'MET', 'PHE', 'TYR', 'TRP', 'CYS', 'PRO'];

    // 1. Disulfide (Specific)
    if (r1 === 'CYS' && r2 === 'CYS' && dist < 3.0) return { type: 'Disulfide Bond', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };

    // 2. Salt Bridge (Strong Electrostatic)
    const isP1 = POSITIVE.includes(r1);
    const isN1 = NEGATIVE.includes(r1);
    const isP2 = POSITIVE.includes(r2);
    const isN2 = NEGATIVE.includes(r2);

    if ((isP1 && isN2) || (isN1 && isP2)) return { type: 'Salt Bridge', color: 'text-red-500', bg: 'bg-red-500/10' };

    // 3. Cation-Pi
    const isA1 = AROMATIC.includes(r1);
    const isA2 = AROMATIC.includes(r2);
    if ((isP1 && isA2) || (isA1 && isP2)) return { type: 'Cation-Pi Interaction', color: 'text-indigo-500', bg: 'bg-indigo-500/10' };

    // 4. Pi-Stacking
    if (isA1 && isA2) return { type: 'Pi-Stacking', color: 'text-purple-500', bg: 'bg-purple-500/10' };

    // 5. Hydrophobic (Generic, check dist < 5.0 for meaningful core packing vs just 8.0 contact)
    const isH1 = HYDROPHOBIC.includes(r1);
    const isH2 = HYDROPHOBIC.includes(r2);
    if (isH1 && isH2 && dist < 5.0) return { type: 'Hydrophobic Contact', color: 'text-green-500', bg: 'bg-green-500/10' };

    // Fallback for close contacts
    if (dist < 4.0) return { type: 'Close Contact', color: 'text-neutral-500', bg: 'bg-neutral-500/10' };

    return null;
};

export const ContactMap: React.FC<ContactMapProps> = ({
    isOpen,
    onClose,
    getContactData,
    onPixelClick,
    isLightMode
}) => {
    const mapCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const miniMapCanvasRef = useRef<HTMLCanvasElement>(null);

    const [loading, setLoading] = useState(false);
    const [scale, setScale] = useState(2);
    const [distanceData, setDistanceData] = useState<{ matrix: number[][], size: number, labels: { resNo: number, chain: string, label: string, ss: string }[] } | null>(null);
    const [hoverPos, setHoverPos] = useState<{ i: number, j: number, x: number, y: number } | null>(null);

    // MiniMap State
    const [miniView, setMiniView] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

    // Settings State
    const [contactThreshold, setContactThreshold] = useState(5);
    const [proximalThreshold, setProximalThreshold] = useState(8);
    const [showGrid, setShowGrid] = useState(true);
    const [showIntraChain, setShowIntraChain] = useState(true);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    const [filters, setFilters] = useState({
        all: true,
        hydrophobic: false,
        saltBridge: false,
        piStacking: false,
        disulfide: false
    });

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

                const allResidues: { x: number, y: number, z: number, chain: string, resNo: number, label: string, ss: string }[] = [];

                rawChains.forEach((c) => {
                    for (let i = 0; i < c.x.length; i++) {
                        const rawLabel = c.labels[i] || "";
                        let chainName = "?";
                        let residueLabel = rawLabel;

                        if (rawLabel.includes(":")) {
                            const firstSplit = rawLabel.split(":");
                            chainName = firstSplit[0];
                            residueLabel = firstSplit.slice(1).join(":");
                        }

                        const parts = residueLabel.trim().split(" ");
                        const resNo = parseInt(parts[parts.length - 1]) || (i + 1);
                        const ssRaw = c.ss?.[i] || ""; // Safe access

                        allResidues.push({
                            x: c.x[i],
                            y: c.y[i],
                            z: c.z[i],
                            chain: chainName,
                            resNo: resNo,
                            label: residueLabel,
                            ss: ssRaw
                        });
                    }
                });

                // ... (N check) ...
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
                    labels: allResidues.map(r => ({ resNo: r.resNo, chain: r.chain, label: r.label, ss: r.ss }))
                });

                // ... (scaling) ...
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

    // Refs for SS Tracks
    const topSSCanvasRef = useRef<HTMLCanvasElement>(null);
    const leftSSCanvasRef = useRef<HTMLCanvasElement>(null);

    // Draw SS Tracks
    useEffect(() => {
        if (!distanceData || !topSSCanvasRef.current || !leftSSCanvasRef.current) return;
        const { labels, size } = distanceData;
        const P = scale;

        // Colors
        // h: Helix (alpha) -> Red
        // s: Sheet (beta) -> Yellow/Orange
        // g: 3-10 helix -> Red/Pink
        // i: pi-helix -> Red/Purple
        // b: bridge -> Yellow
        // t: turn -> Blue/Cyan? (Maybe keep neutral or light blue)
        // e: extended -> Yellow

        const getColor = (ss: string) => {
            const c = ss.toLowerCase();
            if (c === 'h') return '#ef4444'; // Red-500
            if (c === 'g') return '#f472b6'; // Pink-400
            if (c === 'i') return '#a855f7'; // Purple-500
            if (c === 's' || c === 'e' || c === 'b') return '#eab308'; // Yellow-500
            if (c === 't') return '#bfdbfe'; // Blue-200 (Turn - optional)
            return null; // Coil/Other -> Transparent
        };

        // Draw Top Canvas (Horizontal)
        const ctxTop = topSSCanvasRef.current.getContext('2d');
        topSSCanvasRef.current.width = size * P;
        topSSCanvasRef.current.height = 10; // Fixed height (0.5remish)
        if (ctxTop) {
            ctxTop.clearRect(0, 0, topSSCanvasRef.current.width, topSSCanvasRef.current.height);
            labels.forEach((l, i) => {
                const color = getColor(l.ss);
                if (color) {
                    ctxTop.fillStyle = color;
                    ctxTop.fillRect(i * P, 0, P, 10);
                }
            });
        }

        // Draw Left Canvas (Vertical)
        const ctxLeft = leftSSCanvasRef.current.getContext('2d');
        leftSSCanvasRef.current.width = 10;
        leftSSCanvasRef.current.height = size * P;
        if (ctxLeft) {
            ctxLeft.clearRect(0, 0, leftSSCanvasRef.current.width, leftSSCanvasRef.current.height);
            labels.forEach((l, i) => {
                const color = getColor(l.ss);
                if (color) {
                    ctxLeft.fillStyle = color;
                    ctxLeft.fillRect(0, i * P, 10, P);
                }
            });
        }

    }, [distanceData, scale]);

    // --- MINI MAP LOGIC ---

    // 1. Initial Render of MiniMap (Static Heatmap)
    useEffect(() => {
        if (!distanceData || !miniMapCanvasRef.current) return;
        const ctx = miniMapCanvasRef.current.getContext('2d', { alpha: false });
        if (!ctx) return;

        const { matrix, size } = distanceData;
        const miniSize = 150; // Fixed width/height for mini-map
        miniMapCanvasRef.current.width = miniSize;
        miniMapCanvasRef.current.height = miniSize;

        // Use ImageData for fast pixel pushing
        const imgData = ctx.createImageData(miniSize, miniSize);
        const data = imgData.data;
        const step = size / miniSize; // Sampling step

        const bg = isLightMode ? 255 : 23; // #171717

        for (let y = 0; y < miniSize; y++) {
            for (let x = 0; x < miniSize; x++) {
                // Map mini-coord to real matrix coord
                const rY = Math.floor(y * step);
                const rX = Math.floor(x * step);

                // If out of bounds or invalid
                if (rY >= size || rX >= size) continue;

                const dist = matrix[rY][rX];
                const i = (y * miniSize + x) * 4;

                // Simple Greyscale/Blue logic for visibility
                if (dist < contactThreshold) {
                    // Blue (Close)
                    data[i] = 59; data[i + 1] = 130; data[i + 2] = 246; data[i + 3] = 255; // #3b82f6
                } else if (dist < proximalThreshold) {
                    // Light Blue
                    data[i] = 147; data[i + 1] = 197; data[i + 2] = 253; data[i + 3] = 255;
                } else {
                    // Background
                    data[i] = bg; data[i + 1] = bg; data[i + 2] = bg; data[i + 3] = 255;
                }
                // Draw Diagonal
                if (Math.abs(rX - rY) < (size * 0.02)) {
                    data[i] = 200; data[i + 1] = 200; data[i + 2] = 200; data[i + 3] = 255;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);

    }, [distanceData, contactThreshold, proximalThreshold, isLightMode]);

    // 2. Sync Viewport Rect & Scroll Handling
    const handleScroll = () => {
        if (!scrollContainerRef.current || !distanceData) return;
        const container = scrollContainerRef.current;
        const totalW = distanceData.size * scale;
        const totalH = distanceData.size * scale;

        // Container Viewport
        const vW = container.clientWidth;
        const vH = container.clientHeight;
        const sL = container.scrollLeft;
        const sT = container.scrollTop;

        // Calculate fractions
        const xPct = sL / totalW;
        const yPct = sT / totalH;
        const wPct = vW / totalW;
        const hPct = vH / totalH;

        setMiniView({
            x: xPct * 150,
            y: yPct * 150,
            w: Math.min(150, wPct * 150),
            h: Math.min(150, hPct * 150)
        });
    };

    // Attach Scroll Listener
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.addEventListener('scroll', handleScroll);
            // Initial calc
            handleScroll();
        }
        return () => el?.removeEventListener('scroll', handleScroll);
    }, [distanceData, scale]);

    // 3. MiniMap Interaction (Click to Jump)
    const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!scrollContainerRef.current || !distanceData) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const xPct = clickX / 150;
        const yPct = clickY / 150;

        const totalW = distanceData.size * scale;
        const totalH = distanceData.size * scale;

        // Center the view on click
        scrollContainerRef.current.scrollTo({
            left: (xPct * totalW) - (scrollContainerRef.current.clientWidth / 2),
            top: (yPct * totalH) - (scrollContainerRef.current.clientHeight / 2),
            behavior: 'auto'
        });
    };


    // Render Base Map (Theme Aware) ... existing ...

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
        if (showGrid) {
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
        }

        // Draw Diagonals
        ctx.strokeStyle = diag;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * P, size * P);
        ctx.stroke();

        // Draw Chain Separators
        const { labels } = distanceData;
        ctx.strokeStyle = '#eab308'; // Yellow-500 for visibility
        ctx.lineWidth = 1;
        ctx.beginPath();

        let lastChain = labels[0]?.chain;
        for (let i = 1; i < size; i++) {
            const currentChain = labels[i]?.chain;
            if (currentChain !== lastChain) {
                const pos = i * P; // Exact pixel position
                // Horizontal line
                ctx.moveTo(0, pos);
                ctx.lineTo(size * P, pos);
                // Vertical line
                ctx.moveTo(pos, 0);
                ctx.lineTo(pos, size * P);
                lastChain = currentChain;
            }
        }
        ctx.stroke();

        // Draw Contacts
        for (let i = 0; i < size; i++) {
            for (let j = i; j < size; j++) {
                // Interface Mode Check
                if (!showIntraChain) {
                    const c1 = labels[i]?.chain;
                    const c2 = labels[j]?.chain;
                    if (c1 === c2) continue; // Skip intra-chain
                }

                const dist = matrix[i][j];

                // Filtering Logic
                if (dist > proximalThreshold && filters.all) continue; // Skip if too far and showing all (optimization)

                if (!filters.all) {
                    // Specific Filter Mode
                    const typeData = getInteractionType(labels[i].label, labels[j].label, dist);

                    if (!typeData) continue; // Not a recognized interaction type

                    // Check if this type corresponds to an active filter
                    // Note: Mapping type strings to filter keys
                    let match = false;
                    let color = '#a3a3a3'; // Fallback

                    if (typeData.type === 'Salt Bridge' && filters.saltBridge) { match = true; color = '#ef4444'; } // red-500
                    else if (typeData.type === 'Disulfide Bond' && filters.disulfide) { match = true; color = '#eab308'; } // yellow-500
                    else if (typeData.type === 'Hydrophobic Contact' && filters.hydrophobic) { match = true; color = '#22c55e'; } // green-500
                    else if ((typeData.type === 'Pi-Stacking' || typeData.type === 'Cation-Pi Interaction') && filters.piStacking) { match = true; color = '#a855f7'; } // purple-500

                    if (!match) continue; // Skip if filter not active

                    // Draw with specific color for filtered mode
                    ctx.fillStyle = color;
                    ctx.fillRect(j * P, i * P, P, P);

                } else {
                    // Default "Show All" Mode (Blue Heatmap)
                    if (dist < proximalThreshold) {
                        if (dist < contactThreshold) {
                            ctx.fillStyle = isLightMode ? '#1e3a8a' : '#60a5fa';
                        } else {
                            ctx.fillStyle = isLightMode ? '#94a3b8' : '#475569';
                        }

                        ctx.fillRect(j * P, i * P, P, P);
                    }
                }
            }
        }

    }, [distanceData, scale, isLightMode, contactThreshold, proximalThreshold, showGrid, showIntraChain, filters]);


    const handleDownload = () => {
        if (!mapCanvasRef.current) return;

        // Create a temporary canvas to combine grid and overlay if needed, 
        // but for now just the map canvas is the most important part.
        // Actually, let's download exactly what is drawn on the main canvas.
        const url = mapCanvasRef.current.toDataURL('image/png');

        const a = document.createElement('a');
        a.href = url;
        a.download = `contact-map-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDownloadCSV = () => {
        if (!distanceData) return;
        const { matrix, labels } = distanceData;

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Chain1,ResNo1,Residue1,Chain2,ResNo2,Residue2,Distance(A)\n";

        // Generate Rows (Upper Triangle only to avoid duplicates, including diagonal)
        for (let i = 0; i < matrix.length; i++) {
            for (let j = i; j < matrix.length; j++) {
                // Export any interaction < 15A to capture all potential contacts of interest
                // This covers close (<5), proximal (5-8), and distal/near (8-15) contacts
                const dist = matrix[i][j];
                if (dist <= 15.0) {
                    const l1 = labels[i];
                    const l2 = labels[j];
                    const row = `${l1.chain},${l1.resNo},${l1.label},${l2.chain},${l2.resNo},${l2.label},${dist.toFixed(3)}`;
                    csvContent += row + "\n";
                }
            }
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `interaction_data_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

    // Calculate Chain Ranges
    const chainRanges = useMemo(() => {
        if (!distanceData) return [];
        const ranges: { chain: string, start: number, end: number }[] = [];
        const { labels } = distanceData;
        if (labels.length === 0) return [];

        let currentChain = labels[0].chain;
        let startIndex = 0;

        for (let i = 1; i < labels.length; i++) {
            if (labels[i].chain !== currentChain) {
                ranges.push({ chain: currentChain, start: startIndex, end: i });
                currentChain = labels[i].chain;
                startIndex = i;
            }
        }
        ranges.push({ chain: currentChain, start: startIndex, end: labels.length });
        return ranges;
    }, [distanceData]);

    if (!isOpen) return null;




    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className={`relative w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ${isLightMode ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white border border-neutral-800'}`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isLightMode ? 'bg-white border-neutral-100' : 'bg-neutral-900 border-neutral-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isLightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400'}`}>
                            <Maximize className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Contact Map</h3>
                            <p className="text-xs opacity-60">
                                {distanceData ? `${distanceData.size} Residues • ${distanceData.labels.length > 0 ? new Set(distanceData.labels.map(l => l.chain)).size : 0} Chains` : 'Loading Map...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                            className={`md:hidden p-2 rounded-lg transition-colors ${showMobileSidebar ? (isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/40 text-blue-400') : (isLightMode ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-800 text-neutral-300')}`}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={handleDownloadCSV}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isLightMode ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}
                            >
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isLightMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Save Image</span>
                            </button>
                            <div className={`w-px h-6 mx-2 ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-700'}`} />
                        </div>

                        <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 opacity-60 hover:opacity-100 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                {/* Main Content: Flex Row */}
                <div className="flex flex-1 overflow-hidden relative">

                    {/* Left Column: Map Area */}
                    <div ref={scrollContainerRef} className={`flex-1 overflow-auto relative p-0 ${isLightMode ? 'bg-neutral-50' : 'bg-black/20'}`}>
                        {loading ? (
                            <div className={`absolute inset-0 flex items-center justify-center z-10 ${isLightMode ? 'bg-white/80' : 'bg-black/80'}`}>
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                                    <span className={`text-sm font-medium ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>Computing Interactions...</span>
                                </div>
                            </div>
                        ) : distanceData && (
                            <div className="inline-grid grid-cols-[2rem_0.5rem_3rem_1fr] grid-rows-[2rem_0.5rem_2rem_1fr]">

                                {/* CORNERS (Sticky Block) */}
                                <div className={`col-span-3 row-span-3 sticky top-0 left-0 z-30 ${isLightMode ? 'bg-neutral-50' : 'bg-neutral-900'} border-b border-r ${isLightMode ? 'border-neutral-200' : 'border-neutral-800'}`} style={{ gridRow: '1 / span 3', gridColumn: '1 / span 3' }} />

                                {/* 1. TOP CHAIN BARS */}
                                <div className={`sticky top-0 z-20 h-8 relative whitespace-nowrap overflow-hidden ${isLightMode ? 'bg-neutral-100/80 backdrop-blur' : 'bg-neutral-900/80 backdrop-blur'}`} style={{ gridRow: 1, gridColumn: 4, width: distanceData.size * scale }}>
                                    {chainRanges.map((range, idx) => (
                                        <div
                                            key={`top-chain-${idx}`}
                                            className={`absolute h-full flex items-center justify-center border-l first:border-l-0 ${isLightMode ? 'border-neutral-300 text-neutral-600' : 'border-neutral-700 text-neutral-400'}`}
                                            style={{
                                                left: range.start * scale,
                                                width: (range.end - range.start) * scale
                                            }}
                                        >
                                            <span className="text-xs font-bold px-2 truncate">Chain {range.chain}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* 2. TOP SS TRACK */}
                                <div className={`sticky top-8 z-20 h-2 relative ${isLightMode ? 'bg-white' : 'bg-neutral-950'}`} style={{ gridRow: 2, gridColumn: 4, width: distanceData.size * scale }}>
                                    <canvas ref={topSSCanvasRef} className="absolute inset-0 w-full h-full block" />
                                </div>

                                {/* 3. TOP AXIS */}
                                <div className={`sticky top-10 z-20 h-8 relative border-b ${isLightMode ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900 border-neutral-800'}`} style={{ gridRow: 3, gridColumn: 4, width: distanceData.size * scale }}>
                                    {Axes?.x}
                                </div>

                                {/* 4. LEFT CHAIN BARS */}
                                <div className={`sticky left-0 z-20 w-8 relative overflow-hidden ${isLightMode ? 'bg-neutral-100/80 backdrop-blur' : 'bg-neutral-900/80 backdrop-blur'}`} style={{ gridRow: 4, gridColumn: 1, height: distanceData.size * scale }}>
                                    {chainRanges.map((range, idx) => (
                                        <div
                                            key={`left-chain-${idx}`}
                                            className={`absolute w-full flex items-center justify-center border-t first:border-t-0 ${isLightMode ? 'border-neutral-300 text-neutral-600' : 'border-neutral-700 text-neutral-400'}`}
                                            style={{
                                                top: range.start * scale,
                                                height: (range.end - range.start) * scale
                                            }}
                                        >
                                            <span className="text-xs font-bold -rotate-90 whitespace-nowrap">Chain {range.chain}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* 5. LEFT SS TRACK */}
                                <div className={`sticky left-8 z-20 w-2 relative ${isLightMode ? 'bg-white' : 'bg-neutral-950'}`} style={{ gridRow: 4, gridColumn: 2, height: distanceData.size * scale }}>
                                    <canvas ref={leftSSCanvasRef} className="absolute inset-0 w-full h-full block" />
                                </div>

                                {/* 6. LEFT AXIS */}
                                <div className={`sticky left-10 z-20 w-12 relative border-r ${isLightMode ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900 border-neutral-800'}`} style={{ gridRow: 4, gridColumn: 3, height: distanceData.size * scale }}>
                                    {Axes?.y}
                                </div>

                                {/* 7. MAIN MAP */}
                                <div className="relative" style={{ gridRow: 4, gridColumn: 4, width: distanceData.size * scale, height: distanceData.size * scale }}>
                                    <canvas ref={mapCanvasRef} className="absolute inset-0 pointer-events-none image-pixelated" style={{ imageRendering: 'pixelated' }} />
                                    <canvas ref={overlayCanvasRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverPos(null)} onClick={handleClick} className="absolute inset-0 cursor-crosshair image-pixelated" style={{ imageRendering: 'pixelated' }} />
                                </div>
                            </div>
                        )}

                        {/* MINI MAP NAVIGATOR (Sticky Bottom-Right) */}
                        {distanceData && (
                            <div
                                className={`sticky bottom-6 left-[calc(100%-170px)] z-[60] w-[150px] h-[150px] shadow-2xl rounded-lg border overflow-hidden transition-opacity duration-300 group hover:opacity-100 ${isLightMode ? 'bg-white border-neutral-200' : 'bg-neutral-900/90 border-neutral-800'}`}
                                style={{
                                    marginBottom: '1.5rem',
                                    marginLeft: 'auto',
                                    marginRight: '1.5rem',
                                    // Only show if content is bigger than viewport
                                    display: (distanceData.size * scale > (scrollContainerRef.current?.clientWidth || 0)) ? 'block' : 'none'
                                }}
                                onClick={handleMiniMapClick}
                            >
                                <canvas ref={miniMapCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ imageRendering: 'pixelated' }} />
                                {/* Viewport Rect */}
                                {miniView && (
                                    <div
                                        className="absolute border-2 border-red-500 bg-red-500/10 cursor-move transition-transform duration-75"
                                        style={{
                                            left: 0, top: 0,
                                            width: miniView.w,
                                            height: miniView.h,
                                            transform: `translate(${miniView.x}px, ${miniView.y}px)`
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Persistent Floating Tooltip inside Map Area */}
                        {hoverPos && distanceData && (
                            <div className={`absolute bottom-6 right-6 backdrop-blur shadow-xl border rounded-lg p-4 flex flex-col gap-1 w-64 z-50 pointer-events-none ${isLightMode ? 'bg-white/95 border-neutral-100' : 'bg-neutral-800/95 border-neutral-700'}`}>
                                <div className={`flex items-center justify-between pb-2 border-b ${isLightMode ? 'border-neutral-100' : 'border-neutral-700'}`}>
                                    <span className="text-xs font-bold uppercase opacity-50 tracking-wider">Interaction</span>
                                    <span className={`text-sm font-bold ${distanceData.matrix[hoverPos.i][hoverPos.j] < 5 ? 'text-blue-500' : 'opacity-70'}`}>
                                        {distanceData.matrix[hoverPos.i][hoverPos.j].toFixed(2)} Å
                                    </span>
                                </div>
                                {(() => {
                                    const interaction = getInteractionType(distanceData.labels[hoverPos.i].label, distanceData.labels[hoverPos.j].label, distanceData.matrix[hoverPos.i][hoverPos.j]);
                                    return interaction ? (
                                        <div className={`mt-2 px-2 py-1 rounded text-xs font-bold text-center border ${interaction.color} ${interaction.bg.replace('/10', '/5')} border-current opacity-80`}>
                                            {interaction.type}
                                        </div>
                                    ) : null;
                                })()}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div><span className="text-[10px] opacity-50 uppercase">Residue 1</span><div className="font-mono text-sm"><span className="text-blue-500 font-bold mr-1">{distanceData?.labels[hoverPos.i].chain}</span>{distanceData?.labels[hoverPos.i].label}</div></div>
                                    <div className="text-right"><span className="text-[10px] opacity-50 uppercase">Residue 2</span><div className="font-mono text-sm"><span className="text-blue-500 font-bold mr-1">{distanceData?.labels[hoverPos.j].chain}</span>{distanceData?.labels[hoverPos.j].label}</div></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Control Sidebar */}
                    {/* Mobile Overlay */}
                    {showMobileSidebar && (
                        <div className="absolute inset-0 bg-black/50 z-40 md:hidden animate-in fade-in" onClick={() => setShowMobileSidebar(false)} />
                    )}

                    <div className={`
                        absolute inset-y-0 right-0 z-50 w-80 shadow-2xl transition-transform duration-300 ease-in-out md:shadow-none
                        ${showMobileSidebar ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:relative md:flex md:flex-col md:border-l md:overflow-y-auto
                        flex flex-col border-l overflow-y-auto
                        ${isLightMode ? 'bg-white border-neutral-100' : 'bg-neutral-900 border-neutral-800'}
                    `}>

                        {/* Section: View & Zoom */}
                        <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 space-y-3">
                            <h4 className="text-xs font-bold uppercase opacity-50 tracking-wider">View Options</h4>

                            <div className={`flex items-center justify-between p-1 rounded-lg ${isLightMode ? 'bg-neutral-100' : 'bg-neutral-800'}`}>
                                <button onClick={() => setScale(s => Math.max(1, s - 1))} className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-md transition-all"><ZoomOut className="w-4 h-4" /></button>
                                <span className="text-xs font-mono font-medium opacity-70">{scale}x</span>
                                <button onClick={() => setScale(s => Math.min(20, s + 1))} className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-md transition-all"><ZoomIn className="w-4 h-4" /></button>
                            </div>

                            <button
                                onClick={() => setShowGrid(!showGrid)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${showGrid ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'}`}
                            >
                                <div className="flex items-center gap-2"><Grid3X3 className="w-4 h-4" /> Show Grid</div>
                                {showGrid && <Check className="w-3 h-3" />}
                            </button>

                            <button
                                onClick={() => setShowIntraChain(!showIntraChain)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${!showIntraChain ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'}`}
                            >
                                <div className="flex items-center gap-2"><Maximize className="w-4 h-4" /> Interface Focus</div>
                                {!showIntraChain && <Check className="w-3 h-3" />}
                            </button>
                        </div>

                        {/* Section: Map Legend */}
                        <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 space-y-3">
                            <h4 className="text-xs font-bold uppercase opacity-50 tracking-wider">Map Legend</h4>

                            {/* Secondary Structure */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className={`flex items-center gap-2 px-2 py-1.5 rounded border ${isLightMode ? 'bg-red-50 border-red-100' : 'bg-red-900/10 border-red-900/20'}`}>
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-[10px] font-medium opacity-80">Helix</span>
                                </div>
                                <div className={`flex items-center gap-2 px-2 py-1.5 rounded border ${isLightMode ? 'bg-yellow-50 border-yellow-100' : 'bg-yellow-900/10 border-yellow-900/20'}`}>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <span className="text-[10px] font-medium opacity-80">Sheet</span>
                                </div>
                            </div>

                            {/* Contact Distance */}
                            <div className={`p-2 rounded border flex flex-col gap-1.5 ${isLightMode ? 'bg-neutral-50 border-neutral-100' : 'bg-neutral-800/50 border-neutral-800'}`}>
                                <div className="flex items-center justify-between text-[10px] opacity-70">
                                    <span>Close (&lt;{contactThreshold}Å)</span>
                                    <span>Distal (&lt;{proximalThreshold}Å)</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-800 via-blue-400 to-neutral-200 dark:from-blue-600 dark:via-blue-900 dark:to-neutral-800" />
                            </div>
                        </div>

                        {/* Section: Filters */}
                        <div className={`p-3 border-b border-neutral-100 dark:border-neutral-800 space-y-3 ${filters.all ? '' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}>
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase opacity-50 tracking-wider">Interaction Filters</h4>
                                {!filters.all && <button onClick={() => setFilters({ ...filters, all: true })} className="text-[10px] text-blue-500 hover:underline">Reset All</button>}
                            </div>

                            <label className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${filters.all ? (isLightMode ? 'bg-neutral-100 font-medium' : 'bg-neutral-800 font-medium') : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${filters.all ? 'bg-blue-500 border-blue-500 text-white' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                    <input
                                        type="checkbox"
                                        checked={filters.all}
                                        onChange={(e) => setFilters({ ...filters, all: e.target.checked, hydrophobic: false, saltBridge: false, piStacking: false, disulfide: false })}
                                        className="hidden"
                                    />
                                    {filters.all && <Check className="w-3 h-3" />}
                                </div>
                                <span className="text-xs">Show All Interactions</span>
                            </label>

                            <div className="grid grid-cols-1 gap-1 pl-2 border-l-2 border-neutral-100 dark:border-neutral-800 ml-2">
                                {[
                                    { id: 'saltBridge', label: 'Salt Bridge', color: 'bg-red-500', activeClass: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' },
                                    { id: 'disulfide', label: 'Disulfide Bond', color: 'bg-yellow-500', activeClass: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30' },
                                    { id: 'hydrophobic', label: 'Hydrophobic', color: 'bg-green-500', activeClass: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' },
                                    { id: 'piStacking', label: 'Pi-Stacking', color: 'bg-purple-500', activeClass: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30' },
                                ].map((f) => (
                                    <label key={f.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all border border-transparent ${filters[f.id as keyof typeof filters] ? f.activeClass : 'opacity-60 hover:opacity-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${filters[f.id as keyof typeof filters] ? `border-current` : 'border-neutral-300 dark:border-neutral-600'}`}>
                                            <input
                                                type="checkbox"
                                                checked={filters[f.id as keyof typeof filters] as boolean}
                                                onChange={(e) => {
                                                    const newState = { ...filters, [f.id]: e.target.checked };
                                                    if (e.target.checked) newState.all = false;
                                                    setFilters(newState);
                                                }}
                                                className="hidden"
                                            />
                                            {filters[f.id as keyof typeof filters] && <div className={`w-2 h-2 rounded-full ${f.color}`} />}
                                        </div>
                                        <span className="text-xs font-medium">{f.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Section: Sensitivity */}
                        <div className="p-3 space-y-4">
                            <h4 className="text-xs font-bold uppercase opacity-50 tracking-wider">Map Sensitivity</h4>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold">Contact Threshold</label>
                                    <span className="text-xs font-mono text-blue-500">{contactThreshold} Å</span>
                                </div>
                                <input
                                    type="range"
                                    min="3" max="12" step="0.5"
                                    value={contactThreshold}
                                    onChange={(e) => setContactThreshold(Number(e.target.value))}
                                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-blue-500"
                                />
                                <p className="text-[10px] opacity-50">Defines close contacts (Dark Blue).</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold">Proximal Threshold</label>
                                    <span className="text-xs font-mono opacity-70">{proximalThreshold} Å</span>
                                </div>
                                <input
                                    type="range"
                                    min="5" max="20" step="1"
                                    value={proximalThreshold}
                                    onChange={(e) => setProximalThreshold(Number(e.target.value))}
                                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-neutral-500"
                                />
                                <p className="text-[10px] opacity-50">Defines nearby residues (Light Blue).</p>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};
