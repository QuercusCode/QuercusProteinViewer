import React, { useRef, useState, useEffect } from 'react';
import { Upload, RotateCcw, Search, Plus, Trash2, Menu, X, Camera, Ruler, Sun, Moon, Layers, Hexagon, Crosshair, Download, Image as ImageIcon, Eye, RefreshCw, Maximize, Minimize } from 'lucide-react';
import type { RepresentationType, ColoringType } from './ProteinViewer';
import type { ChainInfo, CustomColorRule, Snapshot } from '../types';

interface ControlsProps {
    pdbId: string;
    setPdbId: (id: string) => void;
    onUpload: (file: File) => void;
    representation: RepresentationType;
    setRepresentation: (type: RepresentationType) => void;
    coloring: ColoringType;
    setColoring: (type: ColoringType) => void;
    onResetView: () => void;
    chains: ChainInfo[];
    ligands: string[];
    customColors: CustomColorRule[];
    setCustomColors: (colors: CustomColorRule[]) => void;
    isMeasurementMode: boolean;
    setIsMeasurementMode: (enabled: boolean) => void;
    isLightMode: boolean;
    setIsLightMode: (enabled: boolean) => void;
    highlightedResidue: { chain: string; resNo: number; resName?: string } | null;
    onResidueClick: (chain: string, resNo: number) => void;
    showSurface: boolean;
    setShowSurface: (show: boolean) => void;
    showLigands: boolean;
    setShowLigands: (show: boolean) => void;
    onFocusLigands: () => void;
    proteinTitle?: string | null;
    snapshots: Snapshot[];
    onSnapshot: () => void;
    onDownloadSnapshot: (id: string) => void;
    onDeleteSnapshot: (id: string) => void;
    isSpinning: boolean;
    setIsSpinning: (spinning: boolean) => void;
    isCleanMode: boolean;
    setIsCleanMode: (clean: boolean) => void;
    onSaveSession: () => void;
    onLoadSession: (file: File) => void;
    onToggleContactMap: () => void;

}

export const Controls: React.FC<ControlsProps> = ({
    pdbId,
    setPdbId,
    onUpload,
    representation,
    setRepresentation,
    coloring,
    setColoring,
    onResetView,
    chains,
    ligands,
    customColors,
    setCustomColors,
    isMeasurementMode,
    setIsMeasurementMode,
    isLightMode,
    setIsLightMode,
    highlightedResidue,
    onResidueClick,
    showSurface,
    setShowSurface,
    showLigands,
    setShowLigands,
    onFocusLigands,
    proteinTitle,
    snapshots,
    onSnapshot,
    onDownloadSnapshot,
    onDeleteSnapshot,
    isSpinning,
    setIsSpinning,
    isCleanMode,
    setIsCleanMode,
    onSaveSession,
    onLoadSession,
    onToggleContactMap,

}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sessionInputRef = useRef<HTMLInputElement>(null);
    const [localPdbId, setLocalPdbId] = React.useState(pdbId);
    const [previewSnapshot, setPreviewSnapshot] = useState<Snapshot | null>(null);

    // Custom Color State
    const [targetType, setTargetType] = useState<'chain' | 'residue'>('chain');
    const [selectedChain, setSelectedChain] = useState(chains[0]?.name || '');
    const [viewSequenceChain, setViewSequenceChain] = useState('');
    const [residueRange, setResidueRange] = useState('');
    const [selectedColor, setSelectedColor] = useState('#ff0000');

    // Mobile Sidebar State
    const [isOpen, setIsOpen] = useState(false);

    // Refs for scrolling
    const sequenceContainerRef = useRef<HTMLDivElement>(null);
    const residueRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

    // Update local input when prop changes (external change)
    useEffect(() => {
        setLocalPdbId(pdbId);
    }, [pdbId]);

    // Update selected chain default logic
    useEffect(() => {
        const chainNames = chains.map(c => c.name);
        if (chains.length > 0 && selectedChain && !chainNames.includes(selectedChain)) {
            if (chains.length > 0) setSelectedChain(chains[0].name);
        } else if (chains.length > 0 && !selectedChain) {
            setSelectedChain(chains[0].name);
        }
    }, [chains, selectedChain]);

    // Auto-scroll to highlighted residue
    useEffect(() => {
        if (highlightedResidue && residueRefs.current) {
            if (viewSequenceChain && viewSequenceChain !== highlightedResidue.chain) {
                setViewSequenceChain(highlightedResidue.chain);
            }

            const key = `${highlightedResidue.chain}-${highlightedResidue.resNo}`;
            const element = residueRefs.current.get(key);
            const container = sequenceContainerRef.current;

            if (element && container) {
                // Calculate position relative to container to avoid scrolling the whole page (mobile fix)
                const elementTop = element.offsetTop;
                const elementHeight = element.offsetHeight;
                const containerHeight = container.clientHeight;

                // Center the element
                container.scrollTo({
                    top: elementTop - (containerHeight / 2) + (elementHeight / 2),
                    behavior: 'smooth'
                });
            }
        }
    }, [highlightedResidue, viewSequenceChain]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPdbId(localPdbId);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    const addCustomRule = (e: React.FormEvent) => {
        e.preventDefault();
        let target = '';
        if (targetType === 'chain') {
            if (!selectedChain) return;
            target = `:${selectedChain}`;
        } else {
            if (!residueRange.trim()) return;
            target = selectedChain
                ? `${residueRange.trim()}:${selectedChain}`
                : residueRange.trim();
        }

        const newRule: CustomColorRule = {
            id: crypto.randomUUID(),
            type: targetType,
            target,
            color: selectedColor
        };

        setCustomColors([...customColors, newRule]);
        setResidueRange('');
    };

    const removeRule = (id: string) => {
        setCustomColors(customColors.filter(r => r.id !== id));
    };

    const getSelectedChainRange = () => {
        if (!selectedChain) return null;
        const chain = chains.find(c => c.name === selectedChain);
        return chain ? `${chain.min} - ${chain.max}` : null;
    };

    // Styles
    const cardBg = isLightMode ? 'bg-white' : 'bg-neutral-900';
    const subtleText = isLightMode ? 'text-neutral-500' : 'text-neutral-400';
    const inputBg = isLightMode ? 'bg-white border-neutral-300 text-neutral-900 focus:ring-blue-500' : 'bg-neutral-800 border-neutral-700 text-white focus:ring-blue-500';

    // Clean Mode: Return only the exit button
    if (isCleanMode) {
        return (
            <button
                onClick={() => setIsCleanMode(false)}
                className={`absolute bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-transform hover:scale-110 ${isLightMode ? 'bg-white text-neutral-800' : 'bg-neutral-800 text-white'}`}
                title="Exit Presentation Mode"
            >
                <Minimize className="w-5 h-5" />
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`absolute top-4 left-4 z-40 md:hidden p-2 rounded-lg backdrop-blur-md shadow-lg transition-opacity hover:opacity-80 border ${isLightMode ? 'bg-white/90 border-neutral-200 text-neutral-800' : 'bg-neutral-900/90 border-white/10 text-white'}`}
            >
                <Menu className="w-6 h-6" />
            </button>

            <div className={`
                absolute top-0 left-0 z-50
                h-[100dvh] w-full sm:w-80 
                backdrop-blur-xl border-r shadow-2xl
                transition-transform duration-300 ease-in-out
                flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:top-4 md:left-4 md:h-[calc(100vh-2rem)] md:rounded-xl md:shadow-2xl md:z-10
                ${isLightMode ? 'bg-white/90 border-neutral-200' : 'bg-neutral-900/95 border-white/10'}
            `}>
                {/* Header - Fixed */}
                <div className="flex-none p-4 pb-2 relative">
                    <button
                        onClick={() => setIsOpen(false)}
                        className={`absolute top-4 right-4 p-1 md:hidden ${subtleText}`}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex items-center justify-between pt-8 md:pt-0">
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent mb-1">
                                Protein Viewer
                            </h1>
                            <p className={`text-xs ${subtleText}`}>Visualize 3D structures</p>
                        </div>

                        <button
                            onClick={() => setIsLightMode(!isLightMode)}
                            className={`p-2 rounded-full transition-colors ${isLightMode ? 'bg-neutral-100 text-amber-500 hover:bg-neutral-200' : 'bg-neutral-800 text-blue-300 hover:bg-neutral-700'}`}
                            title="Toggle Theme"
                        >
                            {isLightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className={`h-px mt-4 ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-800'}`} />
                </div>

                {/* Scrollable Content */}
                <div className={`flex-1 overflow-y-auto scrollbar-thin p-4 pt-0 space-y-4 ${isLightMode ? 'scrollbar-thumb-neutral-300' : 'scrollbar-thumb-neutral-700'}`}>

                    {/* Structure Details (Top Sidebar) */}
                    {(proteinTitle || ligands.length > 0) && (
                        <div className="space-y-3">
                            <label className={`text-xs font-semibold uppercase tracking-wider ${subtleText}`}>Structure Details</label>

                            {/* Protein Title */}
                            {proteinTitle && typeof proteinTitle === 'string' && (
                                <div className={`p-3 rounded-lg border ${cardBg} mb-1 shadow-sm`}>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${subtleText}`}>Structure Title</h3>
                                    <p className={`text-xs font-medium leading-relaxed ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>
                                        {proteinTitle}
                                    </p>
                                </div>
                            )}

                            {/* Ligand Info Box */}
                            <div className={`p-3 rounded-lg border ${cardBg} shadow-sm`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Hexagon className="w-3.5 h-3.5 text-blue-500" />
                                        <span className={`text-xs font-semibold ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Ligands</span>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ligands.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                        {ligands.length}
                                    </span>
                                </div>

                                {ligands.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-1">
                                            {ligands.map(lig => (
                                                <span key={lig} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600">
                                                    {lig}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setShowLigands(!showLigands)}
                                                className={`flex-1 text-[10px] py-1 rounded border transition-colors ${showLigands ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-transparent text-neutral-500 hover:bg-neutral-50'}`}
                                            >
                                                {showLigands ? 'Hide' : 'Show'}
                                            </button>
                                            <button
                                                onClick={onFocusLigands}
                                                className="flex-1 text-[10px] py-1 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Crosshair className="w-3 h-3" /> Focus
                                            </button>
                                        </div>
                                        {/* Educational Tooltip/Text */}
                                        <div className={`mt-2 text-[10px] leading-relaxed italic ${subtleText}`}>
                                            Small molecules bound to the protein complex.
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`text-[10px] italic ${subtleText}`}>No ligands detected.</div>
                                )}
                            </div>
                        </div>
                    )}


                    <div className={`h-px ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-800'}`} />

                    {/* Load */}
                    <div className="space-y-3">
                        <label className={`text-xs font-semibold uppercase tracking-wider ${subtleText}`}>Load Structure</label>
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className={`absolute left-2.5 top-2.5 w-4 h-4 ${subtleText}`} />
                                <input
                                    type="text"
                                    value={localPdbId}
                                    onChange={(e) => setLocalPdbId(e.target.value)}
                                    placeholder="PDB ID (e.g. 4hhb)"
                                    className={`w-full rounded-lg pl-9 pr-3 py-2 border outline-none transition-all ${inputBg}`}
                                />
                            </div>
                            <button type="submit" className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium">
                                Load
                            </button>
                        </form>
                        <div className="relative">
                            <input type="file" accept=".pdb,.cif,.ent" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full flex items-center justify-center gap-2 border py-2 rounded-lg transition-all group ${cardBg} hover:opacity-80`}
                            >
                                <Upload className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                                <span>Upload File</span>
                            </button>
                        </div>
                    </div>

                    <div className={`h-px ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-800'}`} />

                    {/* Visualization */}
                    <div className="space-y-3">
                        <label className={`text-xs font-semibold uppercase tracking-wider ${subtleText}`}>Visualization</label>

                        <div className="space-y-2">
                            <button
                                onClick={() => setShowSurface(!showSurface)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${showSurface ? 'bg-blue-500/10 border-blue-500 text-blue-500' : `${cardBg} opacity-80 hover:opacity-100`}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    <span className="text-xs font-medium">Show Surface</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${showSurface ? 'bg-blue-500' : 'bg-neutral-500'}`} />
                            </button>



                        </div>

                        <div className="space-y-1.5 pt-2">
                            <span className={`text-xs ${subtleText}`}>Style</span>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={representation}
                                    onChange={(e) => setRepresentation(e.target.value as RepresentationType)}
                                    className={`w-full border rounded px-2 py-1.5 text-xs outline-none ${inputBg}`}
                                >
                                    <option value="cartoon">Cartoon</option>
                                    <option value="ball+stick">Ball & Stick</option>
                                    <option value="spacefill">Spacefill</option>
                                    <option value="surface">Surface</option>
                                    <option value="ribbon">Ribbon</option>
                                </select>
                                <select
                                    value={coloring}
                                    onChange={(e) => setColoring(e.target.value as ColoringType)}
                                    className={`w-full border rounded px-2 py-1.5 text-xs outline-none ${inputBg}`}
                                >
                                    <option value="chainid">Chain</option>
                                    <option value="element">Element</option>
                                    <option value="resname">Residue</option>
                                    <option value="structure">Structure</option>
                                    <option value="hydrophobicity">Hydrophobicity</option>
                                    <option value="bfactor">B-Factor (Flexibility)</option>
                                    <option value="charge">Charge (+/-)</option>
                                </select>
                            </div>
                        </div>
                        <div className={`mt-2 p-2 rounded border text-xs leading-snug ${isLightMode ? 'bg-neutral-50/50 border-neutral-100 text-neutral-600' : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400'}`}>
                            {(() => {
                                const descriptions: Record<string, string> = {
                                    chainid: "Different color for each polymer chain.",
                                    element: "CPK: Carbon (Grey), Oxygen (Red), Nitrogen (Blue), Sulfur (Yellow).",
                                    resname: "Unique color for each amino acid type.",
                                    structure: "Helix (Pink), Sheet (Yellow), Coil (Green).",
                                    hydrophobicity: "Red = Hydrophobic (Core), White = Hydrophilic (Surface).",
                                    bfactor: "Red = Flexible/Mobile regions, Blue = Rigid/Stable regions.",
                                    charge: "Blue = Positive (Arg/Lys/His), Red = Negative (Asp/Glu)."
                                };
                                return descriptions[coloring] || "Select a coloring mode";
                            })()}
                        </div>
                    </div>

                    <div className={`h-px ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-800'}`} />



                    {/* Analysis */}
                    <div className="space-y-3">
                        <label className={`text-xs font-semibold uppercase tracking-wider ${subtleText}`}>Analysis</label>
                        <div className="space-y-2">
                            <button
                                onClick={onToggleContactMap}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${cardBg} hover:opacity-80`}
                            >
                                <div className="flex items-center gap-2">
                                    <Maximize className="w-4 h-4" />
                                    <span className="text-xs font-medium">Contact Map</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setIsMeasurementMode(!isMeasurementMode)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${isMeasurementMode
                                    ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                    : `${cardBg} hover:opacity-80`
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Ruler className="w-4 h-4" />
                                    <span className="text-xs font-medium">{isMeasurementMode ? 'Measurement Active' : 'Measure Distance'}</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${isMeasurementMode ? 'bg-amber-500' : 'bg-neutral-500'}`} />
                            </button>


                        </div>
                    </div>

                    {/* Session */}
                    <div className="space-y-3">
                        <label className={`text-xs font-semibold uppercase tracking-wider ${subtleText}`}>Session</label>
                        <div className="flex gap-2">
                            <button
                                onClick={onSaveSession}
                                className={`flex-1 flex items-center justify-center gap-2 border py-2 rounded-lg transition-all ${cardBg} hover:opacity-80`}
                            >
                                <Download className="w-4 h-4" /> Save
                            </button>
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                ref={sessionInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        onLoadSession(e.target.files[0]);
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <button
                                onClick={() => sessionInputRef.current?.click()}
                                className={`flex-1 flex items-center justify-center gap-2 border py-2 rounded-lg transition-all ${cardBg} hover:opacity-80`}
                            >
                                <Upload className="w-4 h-4" /> Load
                            </button>
                        </div>
                    </div>



                    {/* Colors */}
                    <div className="space-y-3">
                        <label className={`text-xs font-semibold uppercase tracking-wider ${subtleText}`}>Custom Colors</label>
                        <form onSubmit={addCustomRule} className={`space-y-2 p-3 rounded-lg border ${cardBg}`}>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={targetType}
                                    onChange={(e) => setTargetType(e.target.value as any)}
                                    className={`w-full border rounded px-2 py-1.5 text-xs outline-none ${inputBg}`}
                                >
                                    <option value="chain">Chain</option>
                                    <option value="residue">Residues</option>
                                </select>
                                <input
                                    type="color"
                                    value={selectedColor}
                                    onChange={(e) => setSelectedColor(e.target.value)}
                                    className="w-full h-full min-h-[26px] bg-transparent cursor-pointer rounded overflow-hidden"
                                />
                            </div>

                            {targetType === 'chain' ? (
                                <select
                                    value={selectedChain}
                                    onChange={(e) => setSelectedChain(e.target.value)}
                                    disabled={chains.length === 0}
                                    className={`w-full border rounded px-2 py-1.5 text-xs outline-none ${inputBg}`}
                                >
                                    {chains.length === 0 && <option>No chains loaded</option>}
                                    {chains.map(c => <option key={c.name} value={c.name}>Chain {c.name}</option>)}
                                </select>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedChain || ""}
                                            onChange={(e) => setSelectedChain(e.target.value)}
                                            disabled={chains.length === 0}
                                            className={`w-1/3 border rounded px-2 py-1.5 text-xs outline-none ${inputBg}`}
                                        >
                                            <option value="">All</option>
                                            {chains.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="e.g. 10-20"
                                            value={residueRange}
                                            onChange={(e) => setResidueRange(e.target.value)}
                                            className={`w-2/3 border rounded px-2 py-1.5 text-xs outline-none ${inputBg}`}
                                        />
                                    </div>
                                    {selectedChain && getSelectedChainRange() && (
                                        <div className={`text-[10px] px-1 ${subtleText}`}>Valid range: {getSelectedChainRange()}</div>
                                    )}
                                </div>
                            )}
                            <button type="submit" disabled={targetType === 'chain' && !selectedChain} className="w-full flex items-center justify-center gap-1.5 bg-neutral-600 hover:bg-neutral-500 text-white text-xs py-1.5 rounded transition-colors disabled:opacity-50">
                                <Plus className="w-3 h-3" /> Add Rule
                            </button>
                        </form>

                        {customColors.length > 0 && (
                            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {customColors.map(rule => (
                                    <div key={rule.id} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded border-l-2 ${cardBg}`} style={{ borderLeftColor: rule.color }}>
                                        {rule.type === 'chain' ? `Chain ${rule.target}` : `Res ${rule.target}`}
                                        <button onClick={() => removeRule(rule.id)} className={`${subtleText} hover:text-red-500`}><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={`h-px ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-800'}`} />

                    {/* Sequence */}
                    <div className="space-y-3 flex flex-col md:flex-none">

                        <div className="flex items-center justify-between">
                            <label className={`text-xs font-semibold uppercase tracking-wider ${subtleText}`}>Sequence</label>
                            <select
                                value={viewSequenceChain}
                                onChange={(e) => setViewSequenceChain(e.target.value)}
                                className={`border rounded px-2 py-0.5 text-[10px] outline-none ${inputBg}`}
                            >
                                <option value="">All Chains</option>
                                {chains.map(c => <option key={c.name} value={c.name}>Chain {c.name}</option>)}
                            </select>
                        </div>

                        <div className={`h-64 md:h-48 rounded-lg border p-3 flex flex-col resize-y overflow-hidden ${cardBg}`}>
                            <div ref={sequenceContainerRef} className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
                                {chains.length === 0 ? (
                                    <p className={`italic text-xs ${subtleText}`}>No sequence data</p>
                                ) : (
                                    chains.filter(c => viewSequenceChain ? c.name === viewSequenceChain : true).map(c => (
                                        <div key={c.name} className="mb-4 last:mb-0">
                                            <div className={`flex items-center gap-2 mb-1 sticky top-0 py-1 z-10 ${isLightMode ? 'bg-white/95' : 'bg-neutral-900/95'}`}>
                                                <span className="text-xs font-bold text-blue-500">Chain {c.name}</span>
                                                <span className={`text-[10px] ${subtleText}`}>({c.max - c.min + 1} residues)</span>
                                            </div>
                                            <div className="flex flex-wrap text-[10px] font-mono leading-none content-start">
                                                {c.sequence.split('').map((char, idx) => {
                                                    const resNo = c.min + idx;
                                                    const isHighlighted = highlightedResidue?.chain === c.name && highlightedResidue.resNo === resNo;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => onResidueClick(c.name, resNo)}
                                                            className={`
                                                                w-6 h-6 flex items-center justify-center text-[10px] font-mono
                                                                cursor-pointer select-none transition-all duration-150 rounded-sm
                                                                ${isHighlighted ? 'bg-blue-600 text-white font-bold scale-110 shadow-sm z-10' :
                                                                    'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                                                                }
                                                            `}
                                                            title={`${char}${resNo}`}
                                                        >
                                                            {char}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Tools - Fixed */}
                <div className={`flex-none p-4 pt-4 border-t ${isLightMode ? 'border-neutral-200' : 'border-neutral-800'}`}>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={onResetView} className={`flex-1 flex items-center justify-center gap-2 border py-2 rounded-lg transition-all ${cardBg} hover:opacity-80`}>
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                            <button onClick={onSnapshot} className={`flex-1 flex items-center justify-center gap-2 border py-2 rounded-lg transition-all ${cardBg} hover:text-blue-500 hover:border-blue-500/50`}>
                                <Camera className="w-4 h-4" /> Snapshot
                            </button>
                        </div>

                        {/* Snapshot Gallery */}
                        {snapshots.length > 0 && (
                            <div className={`space-y-2 pt-2 border-t ${isLightMode ? 'border-neutral-200' : 'border-neutral-800'}`}>
                                <label className={`text-xs font-semibold uppercase tracking-wider ${subtleText} flex items-center gap-2`}>
                                    <ImageIcon className="w-3.5 h-3.5" /> Gallery ({snapshots.length})
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {snapshots.map(snap => (
                                        <div key={snap.id} className="group relative aspect-video rounded-lg overflow-hidden border border-neutral-700/50 bg-neutral-900 cursor-pointer" onClick={() => setPreviewSnapshot(snap)}>
                                            <img src={snap.url} alt="Snapshot" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setPreviewSnapshot(snap); }}
                                                    className="p-1.5 bg-neutral-600 hover:bg-neutral-500 text-white rounded-full transition-colors"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDownloadSnapshot(snap.id); }}
                                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteSnapshot(snap.id); }}
                                                    className="p-1.5 bg-red-600/80 hover:bg-red-500/80 text-white rounded-full transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pb-2">
                            <button
                                onClick={() => setIsSpinning(!isSpinning)}
                                className={`flex-1 flex items-center justify-center gap-2 border py-2 rounded-lg transition-all ${isSpinning
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-500'
                                    : `${cardBg} hover:opacity-80`
                                    }`}
                            >
                                <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                                <span>{isSpinning ? 'Spinning' : 'Spin'}</span>
                            </button>
                            <button
                                onClick={() => setIsCleanMode(true)}
                                className={`flex-1 flex items-center justify-center gap-2 border py-2 rounded-lg transition-all ${cardBg} hover:opacity-80`}
                            >
                                <Maximize className="w-4 h-4" />
                                <span>Clean Mode</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div >

            {/* Snapshot Preview Modal */}
            {
                previewSnapshot && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewSnapshot(null)}>
                        <div className="relative max-w-4xl max-h-[90vh] w-full rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setPreviewSnapshot(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <img src={previewSnapshot.url} alt="Preview" className="w-full h-full object-contain bg-neutral-900" />
                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4">
                                <button
                                    onClick={() => onDownloadSnapshot(previewSnapshot.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};
