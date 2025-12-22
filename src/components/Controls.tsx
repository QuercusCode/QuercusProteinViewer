import React, { useRef, useState } from 'react';
import { Upload, RotateCcw, Search, Plus, Trash2, Menu, X } from 'lucide-react';
import type { RepresentationType, ColoringType } from './ProteinViewer';
import type { ChainInfo, CustomColorRule } from '../types';

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
    customColors: CustomColorRule[];
    setCustomColors: (rules: CustomColorRule[]) => void;
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
    customColors,
    setCustomColors
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localPdbId, setLocalPdbId] = React.useState(pdbId);

    // Custom Color State
    const [targetType, setTargetType] = useState<'chain' | 'residue'>('chain');
    // Initialize default to first chain name if available
    const [selectedChain, setSelectedChain] = useState(chains[0]?.name || '');
    const [viewSequenceChain, setViewSequenceChain] = useState('');
    const [residueRange, setResidueRange] = useState('');
    const [selectedColor, setSelectedColor] = useState('#ff0000');

    // Mobile Sidebar State
    const [isOpen, setIsOpen] = useState(false);

    // Update local input when prop changes (external change)
    React.useEffect(() => {
        setLocalPdbId(pdbId);
    }, [pdbId]);

    // Update selected chain default logic
    React.useEffect(() => {
        const chainNames = chains.map(c => c.name);
        // If we have chains, and the current selection is NOT valid
        const isValid = chainNames.includes(selectedChain);

        // If it's invalid
        if (chains.length > 0 && !isValid) {
            // If we are in 'residue' mode, empty string is valid (All)
            if (targetType === 'residue' && selectedChain === '') {
                return;
            }
            // Otherwise reset to first chain
            setSelectedChain(chains[0].name);
        }
    }, [chains, selectedChain, targetType]);

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
            target = selectedChain;
        } else {
            if (!residueRange.trim()) return;
            // Combine residue range with chain if selected (e.g. "10-20:A")
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
        setResidueRange(''); // Clear text input after adding
    };

    const removeRule = (id: string) => {
        setCustomColors(customColors.filter(r => r.id !== id));
    };

    // Helper to get range for selected chain
    const getSelectedChainRange = () => {
        if (!selectedChain) return null;
        const chain = chains.find(c => c.name === selectedChain);
        return chain ? `${chain.min} - ${chain.max}` : null;
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-4 left-4 z-20 md:hidden p-2 bg-neutral-900/90 text-white rounded-lg border border-white/10 shadow-lg backdrop-blur-md"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Sidebar Container */}
            <div className={`
                absolute top-0 left-0 z-30
                h-[100dvh] w-full sm:w-80 
                bg-neutral-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl
                transition-transform duration-300 ease-in-out
                flex flex-col gap-4 p-4
                overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:top-4 md:left-4 md:h-[calc(100vh-2rem)] md:bg-neutral-900/90 md:backdrop-blur-md md:border md:rounded-xl md:shadow-2xl md:z-10
            `}>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white md:hidden"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex-none space-y-3 pt-8 md:pt-0">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent mb-1">
                        Protein Viewer
                    </h1>
                    <p className="text-neutral-400 text-xs">Visualize 3D structures with NGL</p>
                </div>

                {/* Data Loading */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Load Structure
                    </label>

                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-neutral-500" />
                            <input
                                type="text"
                                value={localPdbId}
                                onChange={(e) => setLocalPdbId(e.target.value)}
                                placeholder="PDB ID (e.g. 4hhb)"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                        >
                            Load
                        </button>
                    </form>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdb,.cif,.ent"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 py-2 rounded-lg transition-all group"
                        >
                            <Upload className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                            <span>Upload File</span>
                        </button>
                    </div>
                </div>

                <div className="h-px bg-neutral-800" />

                {/* Custom Coloring Section */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Custom Colors
                    </label>

                    <form onSubmit={addCustomRule} className="space-y-2 bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={targetType}
                                onChange={(e) => setTargetType(e.target.value as any)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white outline-none"
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
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white outline-none"
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
                                        className="w-1/3 bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white outline-none"
                                    >
                                        <option value="">All</option>
                                        {chains.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="e.g. 10-20"
                                        value={residueRange}
                                        onChange={(e) => setResidueRange(e.target.value)}
                                        className="w-2/3 bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white outline-none placeholder:text-neutral-600"
                                    />
                                </div>
                                {/* Range Helper */}
                                {selectedChain ? (
                                    getSelectedChainRange() && (
                                        <div className="text-[10px] text-neutral-500 px-1">
                                            Valid range: {getSelectedChainRange()}
                                        </div>
                                    )
                                ) : (
                                    chains.length > 0 && (
                                        <div className="text-[10px] text-neutral-500 px-1 max-h-20 overflow-y-auto border border-neutral-800 rounded bg-neutral-900/50 p-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                                            <div className="font-medium text-neutral-400 mb-1 sticky top-0 bg-neutral-900/95 pb-0.5 text-[9px] uppercase tracking-wider">Valid Ranges</div>
                                            {chains.map(c => (
                                                <div key={c.name} className="flex justify-between items-center hover:bg-white/5 rounded px-1 -mx-1 transition-colors">
                                                    <span className="font-semibold text-blue-400 w-4">{c.name}</span>
                                                    <span className="text-neutral-400">{c.min} - {c.max}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={targetType === 'chain' && !selectedChain}
                            className="w-full flex items-center justify-center gap-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs py-1.5 rounded transition-colors disabled:opacity-50"
                        >
                            <Plus className="w-3 h-3" />
                            Add Rule
                        </button>
                    </form>

                    {/* Rules List */}
                    {customColors.length > 0 && (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                            {customColors.map(rule => (
                                <div key={rule.id} className="flex items-center justify-between text-xs bg-neutral-800 px-2 py-1.5 rounded border-l-2" style={{ borderLeftColor: rule.color }}>
                                    {rule.type === 'chain'
                                        ? `Chain ${rule.target}`
                                        : rule.target.includes(':')
                                            ? `Res ${rule.target.split(':')[0]} : Chain ${rule.target.split(':')[1]}`
                                            : `Res ${rule.target} (All Chains)`
                                    }
                                    <button
                                        onClick={() => removeRule(rule.id)}
                                        className="text-neutral-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-px bg-neutral-800" />

                {/* Sequence View */}
                <div className="space-y-3 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            Sequence
                        </label>
                        <select
                            value={viewSequenceChain}
                            onChange={(e) => setViewSequenceChain(e.target.value)}
                            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-[10px] text-white outline-none"
                        >
                            <option value="">All Chains</option>
                            {chains.map(c => <option key={c.name} value={c.name}>Chain {c.name}</option>)}
                        </select>
                    </div>

                    <div className="h-48 min-h-[10rem] bg-neutral-800/50 rounded-lg border border-neutral-800 p-3 flex flex-col resize-y overflow-hidden">
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                            {chains.length === 0 ? (
                                <p className="text-neutral-500 italic text-xs">No sequence data</p>
                            ) : (
                                chains.filter(c => viewSequenceChain ? c.name === viewSequenceChain : true).map(c => (
                                    <div key={c.name} className="mb-4 last:mb-0">
                                        <div className="flex items-center gap-2 mb-1 sticky top-0 bg-neutral-900/95 py-1">
                                            <span className="text-xs font-bold text-blue-400">Chain {c.name}</span>
                                            <span className="text-[10px] text-neutral-500">({c.sequence.length} res)</span>
                                        </div>
                                        <div className="font-mono text-[10px] break-all leading-relaxed text-neutral-300 select-text">
                                            {c.sequence}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-neutral-800" />

                {/* Controls */}
                <div className="space-y-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Visualization
                    </label>

                    <div className="space-y-1.5">
                        <span className="text-neutral-300 text-xs">Representation</span>
                        <select
                            value={representation}
                            onChange={(e) => setRepresentation(e.target.value as RepresentationType)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="cartoon">Cartoon</option>
                            <option value="ball+stick">Ball & Stick</option>
                            <option value="spacefill">Spacefill</option>
                            <option value="surface">Surface</option>
                            <option value="ribbon">Ribbon</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-neutral-300 text-xs">Base Color</span>
                        <select
                            value={coloring}
                            onChange={(e) => setColoring(e.target.value as ColoringType)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="chainid">Chain (Chain Index)</option>
                            <option value="element">Element</option>
                            <option value="resname">Residue Type</option>
                            <option value="structure">Secondary Structure</option>
                        </select>
                    </div>

                    <button
                        onClick={onResetView}
                        className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 py-2 rounded-lg mt-4 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset Camera</span>
                    </button>
                </div>

                <div className="mt-auto pt-4 text-[10px] text-neutral-600 flex justify-center">
                    Powered by NGL.js
                </div>
            </div>
        </>
    );
};
