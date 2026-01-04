import React, { useRef, useState, useEffect } from 'react';
import {
    Camera,

    Download,
    Eye,
    Hexagon,
    Layers,
    Menu,
    Minimize,
    Moon,
    Plus,
    RefreshCw,
    RotateCcw,
    Ruler,

    Search,
    Sun,
    Trash2,
    Upload,
    Video,
    X,
    Loader2,
    ImageIcon,
    Grid3X3,
    // Bot,
    BookOpen,
    ChevronDown,
    Activity,
    Wrench,
    Share2
} from 'lucide-react';
import type { RepresentationType, ColoringType, ChainInfo, CustomColorRule, Snapshot, Movie, ColorPalette, PDBMetadata } from '../types';

// Reusable Sidebar Section Component - Defined outside to prevent re-renders losing focus
const SidebarSection = ({ title, icon: Icon, children, isOpen, onToggle, isLightMode }: { title: string, icon: any, children: React.ReactNode, isOpen: boolean, onToggle: () => void, isLightMode: boolean }) => (
    <div className={`rounded-xl overflow-hidden transition-colors ${isLightMode
            ? 'border border-neutral-900 bg-white'
            : 'border border-white/10 bg-black/20'
        }`}>
        <button
            onClick={onToggle}
            className={`w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider transition-colors ${isLightMode
                    ? (isOpen ? 'bg-neutral-100 text-black' : 'hover:bg-neutral-50 text-neutral-900 hover:text-black')
                    : (isOpen ? 'bg-white/5 text-blue-400' : 'hover:bg-white/5 text-neutral-400')
                }`}
        >
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {title}
            </div>
            <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-3 h-3" />
            </div>
        </button>
        {isOpen && (
            <div className={`p-3 space-y-3 border-t ${isLightMode ? 'border-neutral-900' : 'border-white/5'}`}>
                {children}
            </div>
        )}
    </div>
);

interface ControlsProps {
    pdbId: string;
    setPdbId: (id: string) => void;
    onUpload: (file: File, isCif?: boolean) => void;
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
    setIsMeasurementMode: (mode: boolean) => void;
    onClearMeasurements: () => void;
    pdbMetadata: PDBMetadata | null;

    isLightMode: boolean;
    setIsLightMode: (mode: boolean) => void;
    highlightedResidue: { chain: string; resNo: number; resName?: string } | null;
    onResidueClick: (chain: string, resNo: number, resName?: string) => void;
    // onToggleAISidebar: () => void;
    // isAISidebarOpen: boolean;
    onToggleLibrary: () => void;
    showSurface: boolean;
    setShowSurface: (show: boolean) => void;
    showLigands: boolean;
    setShowLigands: (show: boolean) => void;
    onFocusLigands: () => void;
    onRecordMovie: (duration: number) => void;
    isRecording: boolean;
    proteinTitle: string | null;
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
    movies: Movie[];
    onDownloadMovie: (id: string) => void;
    onDeleteMovie: (id: string) => void;
    colorPalette: ColorPalette;
    setColorPalette: (palette: ColorPalette) => void;
    isDyslexicFont: boolean;
    setIsDyslexicFont: (isDyslexic: boolean) => void;
    // Mobile
    onToggleShare: () => void;
    customBackgroundColor?: string | null;
    setCustomBackgroundColor?: (color: string | null) => void;
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
    onClearMeasurements,
    pdbMetadata,
    isLightMode,
    setIsLightMode,
    highlightedResidue,
    onResidueClick,
    showSurface,
    setShowSurface,
    showLigands,
    setShowLigands,
    onFocusLigands,
    onRecordMovie,
    isRecording,
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
    movies,
    onDownloadMovie,
    onDeleteMovie,
    onToggleContactMap,
    colorPalette,
    setColorPalette,
    isDyslexicFont,
    setIsDyslexicFont,
    // onToggleAISidebar,
    // isAISidebarOpen,
    onToggleLibrary,
    onToggleShare,
    customBackgroundColor,
    setCustomBackgroundColor
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sessionInputRef = useRef<HTMLInputElement>(null);
    const [localPdbId, setLocalPdbId] = React.useState(pdbId);
    const [previewSnapshot, setPreviewSnapshot] = useState<Snapshot | null>(null);
    const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);

    // Recording State
    const [recordDuration, setRecordDuration] = useState(4000);

    // Custom Color State
    const [targetType, setTargetType] = useState<'chain' | 'residue'>('chain');
    const [selectedChain, setSelectedChain] = useState(chains[0]?.name || '');
    const [viewSequenceChain, setViewSequenceChain] = useState('');
    const [residueRange, setResidueRange] = useState('');
    const [selectedColor, setSelectedColor] = useState('#ff0000');

    // Helper to get range of residues for selected chain
    const getSelectedChainRange = () => {
        if (!selectedChain) return null;
        const chain = chains.find(c => c.name === selectedChain);
        return chain ? `${chain.min} - ${chain.max}` : null;
    };

    // Styles
    const cardBg = isLightMode ? 'bg-white' : 'bg-neutral-900';
    const subtleText = isLightMode ? 'text-neutral-950 font-medium' : 'text-neutral-400';
    const inputBg = isLightMode ? 'bg-white border-neutral-900 text-black focus:ring-black' : 'bg-neutral-800 border-neutral-700 text-white focus:ring-blue-500';

    // Accordion State
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        'appearance': true,
        'analysis': false,
        'tools': false
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

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
                className={`absolute top-4 left-4 z-40 md:hidden p-2 rounded-lg backdrop-blur-md shadow-lg transition-opacity hover:opacity-80 border ${isLightMode ? 'bg-white border-neutral-900 text-black' : 'bg-neutral-900/90 border-white/10 text-white'}`}
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
                md:translate-x-0 md:top-4 md:left-4 md:h-[calc(100vh-2rem)] md:rounded-xl md:z-10
                ${isLightMode ? 'bg-white border-neutral-900 shadow-none' : 'bg-neutral-900/80 border-white/10 md:shadow-2xl'}
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
                                Quercus Viewer
                            </h1>
                            <p className={`text-xs ${subtleText}`}>Visualize 3D structures</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={onToggleLibrary}
                                className={`p-2 rounded-full transition-colors ${isLightMode ? 'bg-white border border-neutral-900 text-black hover:bg-neutral-100' : 'bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700'}`}
                                title="Open Offline Library"
                            >
                                <BookOpen className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsLightMode(!isLightMode)}
                                className={`p-2 rounded-full transition-colors ${isLightMode ? 'bg-white border border-neutral-900 text-black hover:bg-neutral-100' : 'bg-neutral-800/80 text-blue-300 hover:bg-neutral-700'}`}
                                title="Toggle Theme"
                            >
                                {isLightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className={`flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3 ${isLightMode ? 'scrollbar-thumb-neutral-300' : 'scrollbar-thumb-neutral-700'}`}>

                    {/* 1. CORE INPUT (Always Visible) */}
                    <div className="space-y-3 mb-2">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className={`absolute left-2.5 top-2.5 w-4 h-4 ${subtleText}`} />
                                <input
                                    type="text"
                                    value={localPdbId}
                                    onChange={(e) => setLocalPdbId(e.target.value)}
                                    placeholder="Search PDB ID..."
                                    className={`w-full rounded-lg pl-9 pr-3 py-2 border outline-none transition-all ${inputBg}`}
                                />
                            </div>
                            <button type="submit" className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium">
                                Load
                            </button>
                        </form>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full flex items-center justify-center gap-2 border py-2 rounded-lg transition-all group ${cardBg} hover:opacity-80`}
                            >
                                <Upload className="w-3.5 h-3.5 group-hover:text-blue-500 transition-colors" />
                                <span className="text-xs font-medium">Upload File</span>
                            </button>
                            <input type="file" accept=".pdb,.cif,.ent,.mmcif" className="hidden" ref={fileInputRef} onChange={(e) => {
                                if (e.target.files?.[0]) onUpload(e.target.files[0]);
                            }} />

                            <button
                                onClick={onToggleLibrary}
                                className={`w-full flex items-center justify-center gap-2 border py-2 rounded-lg transition-all group ${cardBg} hover:opacity-80`}
                            >
                                <BookOpen className="w-3.5 h-3.5 group-hover:text-purple-500 transition-colors" />
                                <span className="text-xs font-medium">Library</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. STRUCTURE INFO (Always Visible if loaded) */}
                    {(proteinTitle || chains.length > 0) && (
                        <div className={`p-3 rounded-xl border ${cardBg} shadow-sm`}>
                            {proteinTitle && (
                                <div className="mb-2">
                                    <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${subtleText}`}>Structure</h3>
                                    <p className={`text-xs font-bold leading-snug ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>{proteinTitle}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${subtleText}`}>Residues</span>
                                    <span className={`text-sm font-mono font-bold ${isLightMode ? 'text-neutral-700' : 'text-neutral-300'}`}>
                                        {chains.reduce((acc, chain) => {
                                            if (chain.sequence) return acc + chain.sequence.length;
                                            if (chain.max !== undefined && chain.min !== undefined) return acc + (chain.max - chain.min + 1);
                                            return acc;
                                        }, 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex flex-col border-l pl-3 border-neutral-200 dark:border-neutral-700">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${subtleText}`}>Chains</span>
                                    <span className={`text-sm font-mono font-bold ${isLightMode ? 'text-neutral-700' : 'text-neutral-300'}`}>
                                        {chains.length}
                                    </span>
                                </div>
                            </div>


                            {/* PDB Metadata Display */}
                            {pdbMetadata && (
                                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-2">
                                        <div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Method</span>
                                            <span className={`text-[10px] font-medium leading-tight block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                {pdbMetadata.method.length > 18 ? pdbMetadata.method.substring(0, 15) + '...' : pdbMetadata.method}
                                            </span>
                                        </div>
                                        <div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Resolution</span>
                                            <span className={`text-[10px] font-medium block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                {pdbMetadata.resolution}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            {pdbMetadata.organism && pdbMetadata.organism !== 'Unknown source' && (
                                                <>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Organism</span>
                                                    <span className={`text-[10px] font-medium leading-tight block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                        {pdbMetadata.organism}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Deposited</span>
                                            <span className={`text-[10px] font-medium block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                {pdbMetadata.depositionDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ACCORDION 1: APPEARANCE */}
                    <SidebarSection
                        title="Appearance"
                        icon={Eye}
                        isOpen={openSections['appearance']}
                        onToggle={() => toggleSection('appearance')}
                        isLightMode={isLightMode}
                    >
                        <div className="space-y-3">
                            {/* Visual Style */}
                            <div className="space-y-2">
                                <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtleText}`}>Visualization</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setShowSurface(!showSurface)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${showSurface ? 'bg-blue-500/10 border-blue-500 text-blue-500' : `${cardBg} opacity-80 hover:opacity-100`}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-3.5 h-3.5" />
                                            <span className="text-xs font-medium">Surface</span>
                                        </div>
                                        <div className={`w-1.5 h-1.5 rounded-full ${showSurface ? 'bg-blue-500' : 'bg-neutral-500'}`} />
                                    </button>
                                    <button
                                        onClick={() => setIsSpinning(!isSpinning)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${isSpinning ? 'bg-blue-500/10 border-blue-500 text-blue-500' : `${cardBg} opacity-80 hover:opacity-100`}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                                            <span className="text-xs font-medium">Spin</span>
                                        </div>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isSpinning ? 'bg-blue-500' : 'bg-neutral-500'}`} />
                                    </button>
                                    <button
                                        onClick={() => setIsDyslexicFont(!isDyslexicFont)}
                                        className={`col-span-2 flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${isDyslexicFont ? 'bg-blue-500/10 border-blue-500 text-blue-500' : `${cardBg} opacity-80 hover:opacity-100`}`}
                                    >
                                        <span className="text-xs font-medium">Dyslexic Font</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isDyslexicFont ? 'bg-blue-500' : 'bg-neutral-500'}`} />
                                    </button>
                                </div>

                                {/* Background Controls */}
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtleText}`}>Background</label>
                                    <div className="grid grid-cols-5 gap-1">
                                        {[
                                            { color: '#000000', label: 'Black' },
                                            { color: '#ffffff', label: 'White' },
                                            { color: '#1a1a1a', label: 'Dark' },
                                            { color: '#f5f5f5', label: 'Light' },
                                            { color: '#000020', label: 'Navy' },
                                        ].map((preset) => (
                                            <button
                                                key={preset.color}
                                                onClick={() => setCustomBackgroundColor?.(preset.color)}
                                                className={`h-6 rounded border transition-all ${customBackgroundColor === preset.color ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-black' : 'hover:scale-105'}`}
                                                style={{ backgroundColor: preset.color, borderColor: isLightMode ? '#e5e5e5' : '#333' }}
                                                title={preset.label}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <div className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded border ${inputBg}`}>
                                            <input
                                                type="color"
                                                value={customBackgroundColor || (isLightMode ? '#ffffff' : '#000000')}
                                                onChange={(e) => setCustomBackgroundColor?.(e.target.value)}
                                                className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                                            />
                                            <span className="text-[10px] font-mono opacity-70 uppercase">
                                                {customBackgroundColor || 'Auto'}
                                            </span>
                                        </div>
                                        {customBackgroundColor && (
                                            <button
                                                onClick={() => setCustomBackgroundColor?.(null)}
                                                className={`px-3 py-1.5 rounded border text-[10px] font-bold uppercase transition-colors hover:bg-red-500/10 hover:text-red-500 ${isLightMode ? 'border-neutral-900 text-black bg-white' : 'border-neutral-700 text-neutral-400'}`}
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${subtleText}`}>Style</label>
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
                                    </div>

                                    <div>
                                        <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${subtleText}`}>Colors</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={coloring}
                                                onChange={(e) => setColoring(e.target.value as ColoringType)}
                                                className={`w-full border rounded px-2 py-1.5 text-xs outline-none ${inputBg}`}
                                            >
                                                <option value="chainid">By Chain</option>
                                                <option value="resname">By Residue</option>
                                                <option value="structure">Secondary Structure</option>
                                                <option value="hydrophobicity">Hydrophobicity</option>
                                                <option value="bfactor">B-Factor</option>


                                            </select>
                                            <select
                                                value={colorPalette}
                                                onChange={(e) => setColorPalette(e.target.value as ColorPalette)}
                                                className={`w-full border rounded px-2 py-1.5 text-xs outline-none ${inputBg}`}
                                            >
                                                <option value="standard">Standard</option>
                                                <option value="viridis">Viridis</option>
                                                <option value="magma">Magma</option>
                                                <option value="cividis">Cividis</option>
                                            </select>
                                        </div>
                                        <p className={`text-[9px] mt-1.5 opacity-70 leading-relaxed ${subtleText}`}>
                                            {({
                                                chainid: "Distinct colors for each chain.",
                                                resname: "Standard amino acid colors (RasMol).",
                                                residue: "Standard amino acid colors.",
                                                structure: "Helices (Magenta), Sheets (Yellow), Loops (White).",
                                                hydrophobicity: "Blue (Hydrophilic) → Red (Hydrophobic).",
                                                bfactor: "Blue (Stable) → Red (Flexible/Mobile).",


                                                secondary: "Secondary structure delineation.",
                                                residueindex: "Rainbow gradient by residue position."
                                            } as Record<string, string>)[coloring]}
                                        </p>
                                    </div>

                                    {/* Custom Rules */}
                                    <div className="pt-2 border-t border-white/5">
                                        <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${subtleText}`}>Custom Rules</label>
                                        <form onSubmit={addCustomRule} className="space-y-2">
                                            <div className="flex gap-1 bg-black/20 p-1 rounded-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => setTargetType('chain')}
                                                    className={`flex-1 text-[10px] py-1 rounded-md transition-all ${targetType === 'chain' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                                                >
                                                    Chain
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTargetType('residue')}
                                                    className={`flex-1 text-[10px] py-1 rounded-md transition-all ${targetType === 'residue' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                                                >
                                                    Residue
                                                </button>
                                            </div>

                                            <div className="flex gap-2">
                                                {targetType === 'chain' ? (
                                                    <select
                                                        value={selectedChain}
                                                        onChange={(e) => setSelectedChain(e.target.value)}
                                                        className={`flex-1 min-w-0 bg-transparent border-b ${isLightMode ? 'border-neutral-300' : 'border-neutral-700'} text-xs px-1 py-1 outline-none`}
                                                    >
                                                        {chains.map(c => <option key={c.name} value={c.name}>Chain {c.name}</option>)}
                                                    </select>
                                                ) : (
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <select
                                                            value={selectedChain}
                                                            onChange={(e) => setSelectedChain(e.target.value)}
                                                            className={`w-full bg-transparent border-b ${isLightMode ? 'border-neutral-300' : 'border-neutral-700'} text-[10px] px-1 py-1 outline-none`}
                                                        >
                                                            {chains.map(c => <option key={c.name} value={c.name}>Chain {c.name}</option>)}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={residueRange}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                // Allow numbers, hyphens, and commas only
                                                                if (/^[0-9,\-]*$/.test(val)) {
                                                                    setResidueRange(val);
                                                                }
                                                            }}
                                                            placeholder="e.g. 10-20"
                                                            className={`w-full bg-transparent border-b ${isLightMode ? 'border-neutral-300' : 'border-neutral-700'} text-xs px-1 py-1 outline-none`}
                                                        />
                                                        {getSelectedChainRange() && (
                                                            <div className={`text-[9px] mt-0.5 ${subtleText} opacity-80`}>
                                                                Range: {getSelectedChainRange()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <input
                                                    type="color"
                                                    value={selectedColor}
                                                    onChange={(e) => setSelectedColor(e.target.value)}
                                                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
                                                />
                                                <button
                                                    type="submit"
                                                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                                                    disabled={targetType === 'residue' && !residueRange}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </form>

                                        {customColors.length > 0 && (
                                            <div className="space-y-1 mt-2">
                                                {customColors.map(rule => (
                                                    <div key={rule.id} className={`flex justify-between items-center text-[10px] px-2 py-1 rounded border ${isLightMode ? 'bg-white border-neutral-200' : 'bg-black/20 border-white/5'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-1 py-0.5 rounded text-[9px] uppercase font-bold ${isLightMode ? 'bg-neutral-100' : 'bg-white/10'}`}>{rule.type}</span>
                                                            <span className="font-mono">{rule.target}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full border border-white/10" style={{ background: rule.color }} />
                                                            <button onClick={() => removeRule(rule.id)} className="text-neutral-500 hover:text-red-500 transition-colors">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SidebarSection>

                    {/* ACCORDION 2: ANALYSIS */}
                    <SidebarSection
                        title="Analysis"
                        icon={Activity}
                        isOpen={openSections['analysis']}
                        onToggle={() => toggleSection('analysis')}
                        isLightMode={isLightMode}
                    >

                        {/* Ligands */}
                        {ligands.length > 0 && (
                            <div className={`p-2 rounded-lg border ${cardBg}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Hexagon className="w-3.5 h-3.5 text-blue-500" />
                                        <span className={`text-xs font-bold ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Ligands ({ligands.length})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={onFocusLigands}
                                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors bg-transparent text-neutral-500 hover:bg-neutral-50`}
                                        >
                                            Focus
                                        </button>
                                        <button
                                            onClick={() => setShowLigands(!showLigands)}
                                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${showLigands ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-transparent text-neutral-500 hover:bg-neutral-50'}`}
                                        >
                                            {showLigands ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {ligands.map(lig => (
                                        <span key={lig} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600">
                                            {lig}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setIsMeasurementMode(!isMeasurementMode)}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${isMeasurementMode ? 'bg-amber-500/10 border-amber-500 text-amber-500' : `${cardBg} hover:opacity-80`}`}
                            >
                                <span className="text-xs font-medium">Measure</span>
                                <Ruler className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={onToggleContactMap}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${cardBg} hover:opacity-80`}
                            >
                                <span className="text-xs font-medium">Contact Map</span>
                                <Grid3X3 className="w-3.5 h-3.5" />
                            </button>
                            {isMeasurementMode && (
                                <button
                                    onClick={onClearMeasurements}
                                    className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${cardBg} hover:text-red-500 hover:border-red-500`}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">Clear Measurements</span>
                                </button>
                            )}
                        </div>

                        {/* Sequence Viewer Component */}
                        <div className={`p-2 rounded-lg border flex flex-col ${cardBg}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-bold ${subtleText}`}>Sequence</span>
                                <select
                                    value={viewSequenceChain}
                                    onChange={(e) => setViewSequenceChain(e.target.value)}
                                    className={`bg-transparent border-none text-[10px] outline-none cursor-pointer text-right ${subtleText}`}
                                >
                                    <option value="">All Chains</option>
                                    {chains.map(c => <option key={c.name} value={c.name}>Chain {c.name}</option>)}
                                </select>
                            </div>
                            <div className={`h-24 p-1 overflow-y-auto scrollbar-thin ${isLightMode ? 'bg-neutral-50' : 'bg-neutral-800'} rounded`} ref={sequenceContainerRef}>
                                {chains.length === 0 ? <p className={`italic text-[10px] ${subtleText}`}>No sequence data</p> : (
                                    chains.filter(c => viewSequenceChain ? c.name === viewSequenceChain : true).map(c => (
                                        <div key={c.name} className="mb-3 relative">
                                            <div className={`sticky top-0 z-10 py-1 px-1 mb-1 text-[10px] font-extrabold uppercase tracking-widest border-b shadow-sm ${isLightMode ? 'bg-neutral-100 border-neutral-200 text-neutral-800' : 'bg-neutral-800 border-neutral-700 text-white'}`}>
                                                Chain {c.name}
                                            </div>
                                            <div className="flex flex-wrap text-[10px] font-mono leading-none break-all">
                                                {c.sequence.split('').map((char, idx) => {
                                                    const resNo = c.min + idx;
                                                    const isHighlighted = highlightedResidue?.chain === c.name && highlightedResidue.resNo === resNo;
                                                    return (
                                                        <span
                                                            key={idx}
                                                            ref={(el) => { if (el) residueRefs.current.set(`${c.name}-${resNo}`, el); }}
                                                            onClick={() => onResidueClick(c.name, resNo, char)}
                                                            className={`w-4 h-4 flex items-center justify-center cursor-pointer rounded-sm transition-colors ${isHighlighted ? 'bg-blue-600 text-white font-bold' : 'hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}
                                                            title={`${char}${resNo}`}
                                                        >
                                                            {char}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </SidebarSection>

                    {/* ACCORDION 3: TOOLS */}
                    <SidebarSection
                        title="Tools"
                        icon={Wrench}
                        isOpen={openSections['tools']}
                        onToggle={() => toggleSection('tools')}
                        isLightMode={isLightMode}
                    >
                        <div className="space-y-3">
                            {/* Session Controls */}
                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${subtleText}`}>Session</label>
                                <div className="flex gap-2">
                                    <button onClick={onSaveSession} className={`flex-1 flex items-center justify-center gap-2 border py-1.5 rounded-lg transition-all text-xs font-medium ${cardBg} hover:bg-neutral-100 dark:hover:bg-neutral-800`}>
                                        <Download className="w-3.5 h-3.5" /> Save
                                    </button>
                                    <button onClick={() => sessionInputRef.current?.click()} className={`flex-1 flex items-center justify-center gap-2 border py-1.5 rounded-lg transition-all text-xs font-medium ${cardBg} hover:bg-neutral-100 dark:hover:bg-neutral-800`}>
                                        <Upload className="w-3.5 h-3.5" /> Load
                                    </button>
                                    <input type="file" accept=".json" className="hidden" ref={sessionInputRef} onChange={(e) => e.target.files?.[0] && onLoadSession(e.target.files[0])} />
                                </div>
                            </div>

                            {/* Actions & Recording */}
                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${subtleText}`}>Actions & Recording</label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <button onClick={onResetView} className={`flex-1 flex items-center justify-center gap-2 border py-2 rounded-lg transition-all ${cardBg} hover:opacity-80`}>
                                            <RotateCcw className="w-3.5 h-3.5" /> <span className="text-xs">Reset</span>
                                        </button>
                                        <button onClick={onSnapshot} className={`flex-1 flex items-center justify-center gap-2 border py-2 rounded-lg transition-all ${cardBg} hover:text-blue-500 hover:border-blue-500/50`}>
                                            <Camera className="w-3.5 h-3.5" /> <span className="text-xs">Snapshot</span>
                                        </button>
                                        <button onClick={onToggleShare} className={`flex-1 flex items-center justify-center gap-2 border py-2 rounded-lg transition-all ${cardBg} hover:text-green-500 hover:border-green-500/50`}>
                                            <Share2 className="w-3.5 h-3.5" /> <span className="text-xs">Share</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center gap-2 pl-2 pr-1 py-1.5 border rounded-lg ${cardBg}`}>
                                            <span className={`text-[9px] font-bold ${subtleText}`}>SEC</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="60"
                                                value={recordDuration / 1000}
                                                onChange={(e) => setRecordDuration(Math.max(1, Number(e.target.value)) * 1000)}
                                                disabled={isRecording}
                                                className={`w-8 bg-transparent text-center text-xs outline-none font-mono ${isRecording ? 'opacity-50' : ''}`}
                                            />
                                        </div>
                                        <button
                                            onClick={() => onRecordMovie(recordDuration)}
                                            disabled={isRecording}
                                            className={`flex-1 flex items-center justify-center gap-2 border py-1.5 rounded-lg transition-all text-xs font-medium ${isRecording ? 'bg-red-500 text-white border-red-500' : `${cardBg} hover:text-red-500 hover:border-red-500/50`}`}
                                        >
                                            {isRecording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                                            {isRecording ? 'Recording...' : 'Record'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Galleries */}
                            {(snapshots.length > 0 || movies.length > 0) && (
                                <div className="pt-2 border-t border-white/5 space-y-3">
                                    {snapshots.length > 0 && (
                                        <div className="space-y-2">
                                            <label className={`text-[9px] font-bold uppercase tracking-wider ${subtleText} flex items-center gap-2`}>
                                                <ImageIcon className="w-3 h-3" /> Snapshots ({snapshots.length})
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {snapshots.map(snap => (
                                                    <div key={snap.id} className="group relative aspect-video rounded border border-neutral-700/50 bg-neutral-900 cursor-pointer overflow-hidden" onClick={() => setPreviewSnapshot(snap)}>
                                                        <img src={snap.url} alt="Snapshot" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                            <button onClick={(e) => { e.stopPropagation(); setPreviewSnapshot(snap); }} className="p-1 bg-neutral-600 hover:bg-neutral-500 text-white rounded-full"><Eye className="w-2.5 h-2.5" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); onDownloadSnapshot(snap.id); }} className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-full"><Download className="w-2.5 h-2.5" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); onDeleteSnapshot(snap.id); }} className="p-1 bg-red-600/80 hover:bg-red-500/80 text-white rounded-full"><Trash2 className="w-2.5 h-2.5" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {movies.length > 0 && (
                                        <div className="space-y-2">
                                            <label className={`text-[9px] font-bold uppercase tracking-wider ${subtleText} flex items-center gap-2`}>
                                                <Video className="w-3 h-3" /> Movies ({movies.length})
                                            </label>
                                            <div className="space-y-2">
                                                {movies.map(movie => (
                                                    <div key={movie.id} className="group relative rounded border border-neutral-700/50 bg-neutral-900 flex items-center p-1.5 gap-2 cursor-pointer" onClick={() => setPreviewMovie(movie)}>
                                                        <div className="w-8 h-8 bg-black rounded flex items-center justify-center relative overflow-hidden flex-none">
                                                            <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-white border-b-[3px] border-b-transparent" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[9px] font-medium text-white truncate">Movie {movie.id.slice(0, 4)}</div>
                                                            <div className="text-[8px] text-neutral-400">{Math.round(movie.duration)}s</div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={(e) => { e.stopPropagation(); onDownloadMovie(movie.id); }} className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded"><Download className="w-2.5 h-2.5" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); onDeleteMovie(movie.id); }} className="p-1 bg-red-600/80 hover:bg-red-500/80 text-white rounded"><Trash2 className="w-2.5 h-2.5" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </SidebarSection>
                </div >
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

            {/* Movie Preview Modal */}
            {
                previewMovie && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewMovie(null)}>
                        <div className="relative max-w-4xl max-h-[90vh] w-full rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 bg-black" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setPreviewMovie(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <video src={previewMovie.url} controls autoPlay className="w-full h-full object-contain bg-neutral-900 max-h-[80vh]" />
                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4">
                                <button
                                    onClick={() => onDownloadMovie(previewMovie.id)}
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
