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
    HelpCircle,
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
    Share2,
    ScanSearch // Added Icon
} from 'lucide-react';
import type { RepresentationType, ColoringType, ChainInfo, CustomColorRule, Snapshot, Movie, ColorPalette, PDBMetadata } from '../types';
import type { DataSource } from '../utils/pdbUtils';
import { formatChemicalId } from '../utils/pdbUtils';
import { findMotifs } from '../utils/searchUtils';
import type { MotifMatch } from '../utils/searchUtils';
import { MOTIF_LIBRARY } from '../data/motifLibrary';

// Reusable Sidebar Section Component - Defined outside to prevent re-renders losing focus
const SidebarSection = ({ title, icon: Icon, children, isOpen, onToggle, isLightMode, id }: { title: string, icon: any, children: React.ReactNode, isOpen: boolean, onToggle: () => void, isLightMode: boolean, id?: string }) => (
    <div id={id} className={`rounded-xl overflow-hidden transition-colors ${isLightMode
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

// Clean Structure Image Modal Component
const StructureImageModal = ({ cid }: { cid: string }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            {/* Thumbnail */}
            <div className="mt-1">
                <div
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white p-3 rounded-sm border border-neutral-200 hover:border-blue-400 cursor-pointer transition-all flex justify-center items-center min-h-[120px] group"
                >
                    <img
                        src={`https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${cid}&t=l`}
                        alt="2D Structure"
                        className="max-h-[100px] w-auto object-contain mix-blend-multiply"
                    />
                </div>
                <div className="text-[8px] text-center text-neutral-400 mt-1">
                    Click to enlarge
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold">2D Chemical Structure</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-neutral-500 hover:text-black transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-white p-4 rounded border border-neutral-200 flex justify-center">
                            <img
                                src={`https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${cid}&t=l`}
                                alt="2D Structure (Large View)"
                                className="max-w-full h-auto"
                            />
                        </div>

                        <div className="mt-4 flex justify-center">
                            <a
                                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                                View on PubChem →
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Chemical Properties Panel Component
const ChemicalPropertiesPanel = ({ cid, isLightMode, cardBg, subtleText }: { cid: string; isLightMode: boolean; cardBg: string; subtleText: string }) => {
    const [properties, setProperties] = useState<{
        smiles?: string;
        xLogP?: number;
        hBondDonorCount?: number;
        hBondAcceptorCount?: number;
        rotatableBondCount?: number;
        heavyAtomCount?: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IsomericSMILES,XLogP,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,HeavyAtomCount/JSON`);
                if (res.ok) {
                    const data = await res.json();
                    const props = data.PropertyTable?.Properties?.[0];
                    if (props) {
                        setProperties({
                            smiles: props.IsomericSMILES,
                            xLogP: props.XLogP,
                            hBondDonorCount: props.HBondDonorCount,
                            hBondAcceptorCount: props.HBondAcceptorCount,
                            rotatableBondCount: props.RotatableBondCount,
                            heavyAtomCount: props.HeavyAtomCount,
                        });
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch chemical properties', e);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, [cid]);

    return (
        <div className={`col-span-2 rounded-lg border ${cardBg} overflow-hidden`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 hover:opacity-80 transition-all"
            >
                <span className="text-xs font-medium">Chemical Properties</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                        </div>
                    ) : properties ? (
                        <>
                            {properties.smiles && (
                                <div>
                                    <div className={`text-[9px] font-bold uppercase tracking-wider ${subtleText}`}>SMILES</div>
                                    <div className={`text-[10px] font-mono break-all ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                        {properties.smiles}
                                    </div>
                                </div>
                            )}
                            {properties.xLogP !== undefined && (
                                <div>
                                    <div className={`text-[9px] font-bold uppercase tracking-wider ${subtleText}`}>XLogP</div>
                                    <div className={`text-[10px] ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                        {properties.xLogP.toFixed(2)} (Lipophilicity)
                                    </div>
                                </div>
                            )}
                            {properties.hBondDonorCount !== undefined && (
                                <div>
                                    <div className={`text-[9px] font-bold uppercase tracking-wider ${subtleText}`}>H-Bond Donors</div>
                                    <div className={`text-[10px] ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                        {properties.hBondDonorCount}
                                    </div>
                                </div>
                            )}
                            {properties.hBondAcceptorCount !== undefined && (
                                <div>
                                    <div className={`text-[9px] font-bold uppercase tracking-wider ${subtleText}`}>H-Bond Acceptors</div>
                                    <div className={`text-[10px] ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                        {properties.hBondAcceptorCount}
                                    </div>
                                </div>
                            )}
                            {properties.rotatableBondCount !== undefined && (
                                <div>
                                    <div className={`text-[9px] font-bold uppercase tracking-wider ${subtleText}`}>Rotatable Bonds</div>
                                    <div className={`text-[10px] ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                        {properties.rotatableBondCount}
                                    </div>
                                </div>
                            )}
                            {properties.heavyAtomCount && (
                                <div>
                                    <div className={`text-[9px] font-bold uppercase tracking-wider ${subtleText}`}>Heavy Atoms</div>
                                    <div className={`text-[10px] ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                        {properties.heavyAtomCount} atoms
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={`text-[10px] italic ${subtleText}`}>No properties available</div>
                    )}
                </div>
            )}
        </div>
    );
};

interface ControlsProps {
    pdbId: string;
    setPdbId: (id: string) => void;
    dataSource: DataSource;
    setDataSource: (source: DataSource) => void;
    isChemical?: boolean; // New prop for chemical handling
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
    isPublicationMode: boolean;
    setIsPublicationMode: (val: boolean) => void;
    onShare: () => void;
    onToggleMeasurement?: () => void;
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
    onHighlightRegion?: (selection: string, label: string) => void;
    onDownloadPDB: () => void;
    onDownloadSequence: () => void;
    showIons?: boolean;
    setShowIons?: (show: boolean) => void;
    onStartTour?: () => void;

    // UI State Lifted Info
    openSections?: Record<string, boolean>;
    onToggleSection?: (section: string) => void;
}

export const Controls: React.FC<ControlsProps> = ({
    pdbId,
    setPdbId,
    dataSource,
    setDataSource,
    isChemical = false,
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
    onToggleMeasurement,
    onClearMeasurements,
    isPublicationMode,
    setIsPublicationMode,
    pdbMetadata,
    isLightMode,
    setIsLightMode,
    highlightedResidue,
    onResidueClick,
    showSurface,
    setShowSurface,
    showLigands,
    setShowLigands,
    showIons,
    setShowIons,
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
    setCustomBackgroundColor,
    onHighlightRegion,
    onDownloadPDB,
    onDownloadSequence,
    onStartTour,
    openSections: propOpenSections,
    onToggleSection
}) => {
    // Motif Search State
    const [searchPattern, setSearchPattern] = useState('');
    const [searchResults, setSearchResults] = useState<MotifMatch[]>([]);
    const [isSearching, setIsSearching] = useState(false);


    const handleSearch = () => {
        setIsSearching(true);
        setTimeout(() => {
            const results = findMotifs(chains, searchPattern);
            setSearchResults(results);
            setIsSearching(false);
        }, 10);
    };

    const handleResultClick = (match: MotifMatch) => {
        if (onHighlightRegion) {
            let range = `${match.startResNo}`;
            if (match.startResNo !== match.endResNo) {
                range = `${match.startResNo}-${match.endResNo}`;
            }
            const selection = `:${match.chain} and ${range}`;
            onHighlightRegion(selection, `Motif: ${match.sequence}`);
        } else {
            // Fallback
            onResidueClick(match.chain, match.startResNo, match.sequence);
        }
    };


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

    // Accordion State - Use lifted state from props if available
    const openSections = propOpenSections || {
        'appearance': true,
        'analysis': false,
        'tools': false,
        'motif-search': false
    };

    const toggleSection = (section: string) => {
        if (onToggleSection) {
            onToggleSection(section);
        }
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
                                onClick={onStartTour}
                                className={`hidden md:flex p-2 rounded-full transition-colors ${isLightMode ? 'bg-white border border-neutral-900 text-black hover:bg-neutral-100' : 'bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700'}`}
                                title="Start Interactive Tour"
                                id="help-button"
                            >
                                <HelpCircle className="w-4 h-4" />
                            </button>
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
                    <div className="space-y-3 mb-2" id="upload-section">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                            {/* Datasource Selector */}
                            <select
                                value={dataSource}
                                onChange={(e) => setDataSource(e.target.value as DataSource)}
                                className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium border outline-none transition-all appearance-none cursor-pointer ${isLightMode
                                    ? 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300'
                                    : 'bg-white/5 border-white/10 text-neutral-300 hover:border-white/20'
                                    }`}
                            >
                                <option value="pdb">RCSB PDB (Protein/Macromolecules)</option>
                                <option value="pubchem">PubChem (Small Molecules)</option>
                            </select>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className={`absolute left-2.5 top-2.5 w-4 h-4 ${subtleText}`} />
                                    <input
                                        type="text"
                                        value={localPdbId}
                                        onChange={(e) => setLocalPdbId(e.target.value)}
                                        placeholder={
                                            dataSource === 'pubchem' ? "PubChem CID (e.g. 2244)" :
                                                "PDB ID (e.g. 1crn)"
                                        }
                                        className={`w-full rounded-lg pl-9 pr-3 py-2 border outline-none transition-all ${inputBg}`}
                                    />
                                </div>
                                <button type="submit" className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium">
                                    Load
                                </button>
                            </div>
                        </form>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full flex items-center justify-center gap-2 border py-2 rounded-lg transition-all group ${cardBg} hover:opacity-80`}
                            >
                                <Upload className="w-3.5 h-3.5 group-hover:text-blue-500 transition-colors" />
                                <span className="text-xs font-medium">Upload File</span>
                            </button>
                            <input
                                id="file-upload-input"
                                type="file"
                                accept=".pdb,.cif,.ent,.mmcif,.mol,.sdf,.mol2,.xyz"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files?.[0]) onUpload(e.target.files[0]);
                                }}
                            />

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
                        <div id="metadata-box" className={`p-3 rounded-xl border ${cardBg} shadow-sm`}>
                            {proteinTitle && (
                                <div className="mb-2">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${subtleText}`}>Structure</h3>
                                        <button
                                            onClick={onDownloadPDB}
                                            title="Download PDB Structure"
                                            className={`p-1 rounded-md transition-colors ${isLightMode ? 'hover:bg-neutral-200 text-neutral-500 hover:text-black' : 'hover:bg-white/10 text-neutral-400 hover:text-white'}`}
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className={`text-xs font-bold leading-snug break-words ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>{proteinTitle}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-2">
                                {/* Stats */}
                                {/* Stats: Only Show for Proteins */}
                                {!isChemical && (
                                    <>
                                        <div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Residues</span>
                                            <span className={`text-sm font-mono font-bold ${isLightMode ? 'text-neutral-700' : 'text-neutral-300'}`}>
                                                {chains.reduce((acc, chain) => {
                                                    if (chain.sequence) return acc + chain.sequence.length;
                                                    if (chain.max !== undefined && chain.min !== undefined) return acc + (chain.max - chain.min + 1);
                                                    return acc;
                                                }, 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="pl-2 border-l border-neutral-200 dark:border-neutral-800">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Chains</span>
                                            <span className={`text-sm font-mono font-bold ${isLightMode ? 'text-neutral-700' : 'text-neutral-300'}`}>
                                                {chains.length}
                                            </span>
                                        </div>
                                    </>
                                )}

                                {/* Metadata: Only Show for Proteins */}
                                {pdbMetadata && !isChemical && (
                                    <>
                                        <div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Method</span>
                                            <span className={`text-[10px] font-medium leading-tight block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                {pdbMetadata.method.length > 20 ? pdbMetadata.method.substring(0, 18) + '...' : pdbMetadata.method}
                                            </span>
                                        </div>
                                        <div className="pl-2 border-l border-neutral-200 dark:border-neutral-800">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Resolution</span>
                                            <span className={`text-[10px] font-medium block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                {pdbMetadata.resolution}
                                            </span>
                                        </div>

                                        {pdbMetadata.organism && pdbMetadata.organism !== 'Unknown source' && (
                                            <div className="pt-1 border-t border-neutral-200 dark:border-neutral-800" style={{ borderTopStyle: 'dashed' }}>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Organism</span>
                                                <span className={`text-[10px] font-medium leading-tight block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                    {pdbMetadata.organism}
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            className={`pt-1 border-t border-neutral-200 dark:border-neutral-800 ${pdbMetadata.organism && pdbMetadata.organism !== 'Unknown source' ? 'pl-2 border-l' : ''}`}
                                            style={{ borderTopStyle: 'dashed' }}
                                        >
                                            <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Deposited</span>
                                            <span className={`text-[10px] font-medium block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                {pdbMetadata.depositionDate}
                                            </span>
                                        </div>
                                    </>
                                )}

                                {/* Chemical Metadata */}
                                {pdbMetadata && isChemical && (
                                    <>
                                        {pdbMetadata.formula && (
                                            <div>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Formula</span>
                                                <span className={`text-[10px] font-medium leading-tight block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                    {pdbMetadata.formula}
                                                </span>
                                            </div>
                                        )}
                                        {pdbMetadata.molecularWeight && (
                                            <div className="pl-2 border-l border-neutral-200 dark:border-neutral-800">
                                                <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>Mol. Weight</span>
                                                <span className={`text-[10px] font-medium block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                    {pdbMetadata.molecularWeight.toFixed(2)} g/mol
                                                </span>
                                            </div>
                                        )}

                                        {/* Structure Image or Source */}
                                        <div
                                            className={`pt-1 border-t border-neutral-200 dark:border-neutral-800 ${(pdbMetadata.formula || pdbMetadata.molecularWeight) ? 'pl-2 border-l' : ''}`}
                                            style={{ borderTopStyle: 'dashed' }}
                                        >
                                            <span className={`text-[9px] font-bold uppercase tracking-wider block ${subtleText}`}>
                                                {pdbMetadata.cid ? 'Structure' : 'Source'}
                                            </span>

                                            {pdbMetadata.cid ? (
                                                <StructureImageModal cid={pdbMetadata.cid} />
                                            ) : (
                                                <span className={`text-[10px] font-medium block ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                                                    {pdbMetadata.title}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ACCORDION X: MOTIF SEARCH */}


                    {/* ACCORDION 1: APPEARANCE */}
                    <SidebarSection
                        title="Appearance"
                        icon={Eye}
                        isOpen={openSections['appearance']}
                        onToggle={() => toggleSection('appearance')}
                        isLightMode={isLightMode}
                        id="visualization-controls"
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
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${isDyslexicFont ? 'bg-blue-500/10 border-blue-500 text-blue-500' : `${cardBg} opacity-80 hover:opacity-100`}`}
                                    >
                                        <span className="text-xs font-medium">Dyslexic</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isDyslexicFont ? 'bg-blue-500' : 'bg-neutral-500'}`} />
                                    </button>
                                    <div className="grid grid-cols-1 gap-1.5 mt-1">
                                        {[
                                            { id: 'standard', label: 'Standard', gradient: 'linear-gradient(to right, #3b82f6, #ef4444)' }, // Blue to Red fallback
                                            { id: 'viridis', label: 'Viridis', gradient: 'linear-gradient(to right, #440154, #31688e, #35b779, #fde725)' },
                                            { id: 'magma', label: 'Magma', gradient: 'linear-gradient(to right, #000004, #51127c, #b73779, #fcfdbf)' },
                                            { id: 'cividis', label: 'Cividis', gradient: 'linear-gradient(to right, #00204d, #7c7b78, #fdea45)' },
                                            // { id: 'plasma', label: 'Plasma', gradient: 'linear-gradient(to right, #0d0887, #cc4678, #f0f921)' }
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => setColorPalette(p.id as ColorPalette)}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-all ${colorPalette === p.id
                                                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                                                    : `border-transparent ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-white/5'} opacity-70 hover:opacity-100`}`}
                                            >
                                                <div className="h-3 w-12 rounded-sm border border-black/10 shadow-sm" style={{ background: p.gradient }} />
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{p.label}</span>
                                                {colorPalette === p.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
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
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${subtleText}`}>Style</label>
                                            <select
                                                value={representation}
                                                onChange={(e) => setRepresentation(e.target.value as RepresentationType)}
                                                className={`w-full border rounded-lg px-2 py-2 text-xs outline-none ${inputBg}`}
                                            >
                                                {!isChemical && <option value="cartoon">Cartoon</option>}
                                                <option value="ball+stick">Ball & Stick</option>
                                                <option value="licorice">Licorice</option>
                                                {!isChemical && <option value="backbone">Backbone</option>}
                                                <option value="spacefill">Spacefill</option>
                                                <option value="surface">Surface</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${subtleText}`}>Colors</label>
                                            <select
                                                value={coloring}
                                                onChange={(e) => setColoring(e.target.value as ColoringType)}
                                                className={`w-full border rounded-lg px-2 py-2 text-xs outline-none ${inputBg}`}
                                            >
                                                {!isChemical && <option value="chainid">By Chain</option>}
                                                {!isChemical && <option value="secondary-structure">Structure</option>}
                                                {!isChemical && <option value="hydrophobicity">Hydrophobicity</option>}
                                                <option value="bfactor">B-Factor</option>
                                                <option value="uniform">Uniform</option>
                                                <option value="element">Element (CPK)</option>
                                            </select>
                                        </div>

                                    </div>

                                    {/* Tools: Publication & Measure */}
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        <button
                                            onClick={() => setIsPublicationMode(!isPublicationMode)}
                                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isPublicationMode
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                                : (isLightMode ? 'bg-neutral-100 hover:bg-purple-50 text-neutral-600 hover:text-purple-600 border border-neutral-200' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-white/10')
                                                }`}
                                            title="Publication Mode: High Quality, White BG, Soft Shadows"
                                        >
                                            {isPublicationMode ? <X className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                                            {isPublicationMode ? "Exit Pub. Mode" : "Publication & Screenshot Mode"}
                                        </button>
                                    </div>
                                </div>


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

                            {/* Custom Rules */}
                            {!isChemical && (
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
                            )}
                        </div>
                    </SidebarSection>


                    {/* ACCORDION 2: ANALYSIS */}
                    <SidebarSection
                        title="Analysis"
                        icon={Activity}
                        isOpen={openSections['analysis']}
                        onToggle={() => toggleSection('analysis')}
                        isLightMode={isLightMode}
                        id="analysis-tools"
                    >

                        {/* Ligands */}
                        {
                            ligands.length > 0 && (
                                <div className={`p-2 rounded-lg border ${cardBg}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Hexagon className="w-3.5 h-3.5 text-blue-500" />
                                            <span className={`text-xs font-bold ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Ligands ({ligands.length})</span>
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <button
                                            onClick={() => setShowLigands(!showLigands)}
                                            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-medium transition-all
                                                ${showLigands
                                                    ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : `${isLightMode ? 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'}`
                                                }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${showLigands ? 'bg-blue-500' : 'bg-neutral-400'}`} />
                                            {showLigands ? 'Ligands On' : 'Ligands Off'}
                                        </button>
                                        <button
                                            onClick={() => setShowIons && setShowIons(!showIons)}
                                            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-medium transition-all
                                                ${showIons
                                                    ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400'
                                                    : `${isLightMode ? 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'}`
                                                }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${showIons ? 'bg-purple-500' : 'bg-neutral-400'}`} />
                                            {showIons ? 'Ions On' : 'Ions Off'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {ligands.map(lig => (
                                            <span key={lig} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600">
                                                {formatChemicalId(lig)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )
                        }

                        <div className="grid grid-cols-2 gap-2">

                            <button
                                onClick={() => {
                                    setIsMeasurementMode(!isMeasurementMode);
                                    if (!isMeasurementMode && onToggleMeasurement) onToggleMeasurement();
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${isMeasurementMode ? 'bg-amber-500/10 border-amber-500 text-amber-500' : `${cardBg} hover:opacity-80`} ${isChemical ? 'col-span-2' : ''}`}
                            >
                                <span className="text-xs font-medium">Measure</span>
                                <Ruler className="w-3.5 h-3.5" />
                            </button>
                            {/* Contact Map - Only for Proteins */}
                            {!isChemical && (
                                <button
                                    onClick={onToggleContactMap}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${cardBg} hover:opacity-80`}
                                >
                                    <span className="text-xs font-medium">Contact Map</span>
                                    <Grid3X3 className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {isMeasurementMode && (
                                <button
                                    onClick={onClearMeasurements}
                                    className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${cardBg} hover:text-red-500 hover:border-red-500`}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">Clear Measurements</span>
                                </button>
                            )}

                            {/* Chemical Properties - Only for Chemicals */}
                            {isChemical && pdbMetadata?.cid && (
                                <ChemicalPropertiesPanel cid={pdbMetadata.cid} isLightMode={isLightMode} cardBg={cardBg} subtleText={subtleText} />
                            )}
                        </div>


                        {/* Sequence Viewer Component - Only for Proteins */}
                        {!isChemical && (
                            <div className={`p-2 rounded-lg border flex flex-col ${cardBg}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${subtleText}`}>Sequence</span>
                                        <button
                                            onClick={onDownloadSequence}
                                            title="Download FASTA Sequence"
                                            className={`p-1 rounded-md transition-colors ${isLightMode ? 'hover:bg-neutral-200 text-neutral-500 hover:text-black' : 'hover:bg-white/10 text-neutral-400 hover:text-white'}`}
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
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
                        )}
                    </SidebarSection>

                    {/* ACCORDION X: MOTIF SEARCH */}
                    {
                        !isChemical && (
                            <SidebarSection
                                title="Motif Search"
                                icon={ScanSearch}
                                isOpen={openSections['motif-search']}
                                onToggle={() => toggleSection('motif-search')}
                                isLightMode={isLightMode}
                                id="motif-search"
                            >
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Sequence Pattern</label>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) setSearchPattern(e.target.value);
                                            }}
                                            className={`w-full mb-1 bg-transparent border rounded px-2 py-1 text-xs outline-none focus:border-blue-500
                                            ${isLightMode
                                                    ? 'border-neutral-300 text-black'
                                                    : 'border-white/20 text-white'}`}
                                            defaultValue=""
                                        >
                                            {MOTIF_LIBRARY.map((m) => (
                                                <option key={m.name} value={m.pattern} className="text-black">
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={searchPattern}
                                                onChange={(e) => setSearchPattern(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="e.g. R-G-D or H-x-x-H"
                                                className={`flex-1 bg-transparent border rounded px-2 py-1 text-xs font-mono outline-none focus:border-blue-500
                                            ${isLightMode
                                                        ? 'border-neutral-300 placeholder-neutral-400 text-black'
                                                        : 'border-white/20 placeholder-white/20 text-white'}`}
                                            />
                                            <button
                                                onClick={handleSearch}
                                                disabled={!searchPattern}
                                                className={`p-1 rounded transition-colors ${!searchPattern ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500/20 text-blue-400'}`}
                                            >
                                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-[9px] opacity-50">Use 'x' as wildcard. Dashes ignored.</p>
                                    </div>

                                    {/* Results List */}
                                    {searchResults.length > 0 && (
                                        <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                                            <div className="flex justify-between items-center pb-1 border-b border-white/5">
                                                <span className="text-[10px] font-bold opacity-70">{searchResults.length} Matches</span>
                                                <button onClick={() => setSearchResults([])} className="p-1 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                            {searchResults.map((match, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleResultClick(match)}
                                                    className={`w-full text-left p-2 rounded flex justify-between items-center group transition-colors
                                                ${isLightMode
                                                            ? 'hover:bg-neutral-100 border border-transparent hover:border-neutral-200'
                                                            : 'hover:bg-white/5 border border-transparent hover:border-white/10'}`}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-mono font-bold text-blue-400">{match.sequence}</span>
                                                        <span className="text-[10px] opacity-60">Chain {match.chain} : {match.startResNo}-{match.endResNo}</span>
                                                    </div>
                                                    <ScanSearch className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </SidebarSection>
                        )}

                    {/* ACCORDION 3: TOOLS */}
                    <SidebarSection
                        title="Tools"
                        icon={Wrench}
                        isOpen={openSections['tools']}
                        onToggle={() => toggleSection('tools')}
                        isLightMode={isLightMode}
                        id="export-tools"
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
                                        <button onClick={onSnapshot} className={`flex-1 flex items-center justify-center gap-1 border py-2 rounded-lg transition-all ${cardBg} hover:text-blue-500 hover:border-blue-500/50`}>
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
                </div>
            </div>

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
