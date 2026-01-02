import React, { useState, useMemo } from 'react';
import { Search, X, BookOpen, Database, FlaskConical, Dna, Activity, Zap, Shield, Grid, Archive, Anchor, Layers, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { OFFLINE_LIBRARY } from '../data/library';

// --- TYPES ---

interface LibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (fileUrl: string) => void;
}

// --- CATEGORY CONFIG ---
// Maps categories to Icons and Color Schemes
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode, style: string, description: string }> = {
    'Enzymes': { icon: <Activity size={20} />, style: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 active-color:bg-amber-500', description: 'Biological catalysts speeding up reactions.' },
    'Structural': { icon: <Grid size={20} />, style: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 active-color:bg-blue-500', description: 'Scaffolding and shape-giving proteins.' },
    'Transport': { icon: <Archive size={20} />, style: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 active-color:bg-emerald-500', description: 'Ferries molecules across membranes/blood.' },
    'Signaling': { icon: <Zap size={20} />, style: 'text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 active-color:bg-purple-500', description: 'Communication switches and receptors.' },
    'Viral': { icon: <FlaskConical size={20} />, style: 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 active-color:bg-red-500', description: 'Viral capsids, spikes, and machinery.' },
    'DNA/RNA': { icon: <Dna size={20} />, style: 'text-pink-400 border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 active-color:bg-pink-500', description: 'Nucleic acid binding and manipulation.' },
    'Toxins': { icon: <Shield size={20} />, style: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 active-color:bg-orange-500', description: 'Poisons and defense molecules.' },
    'Synthetic': { icon: <Layers size={20} />, style: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 active-color:bg-cyan-500', description: 'Engineered or de-novo molecules.' },
    'Immune': { icon: <Shield size={20} />, style: 'text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 active-color:bg-rose-500', description: 'Antibodies and defense systems.' },
    'Energy': { icon: <Zap size={20} />, style: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 active-color:bg-yellow-500', description: 'Photosynthesis and metabolism.' },
    'Chaperone': { icon: <Anchor size={20} />, style: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 active-color:bg-indigo-500', description: 'Helpers for protein folding.' },
};

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
    const [viewMode, setViewMode] = useState<'categories' | 'list'>('categories');

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set(OFFLINE_LIBRARY.map(item => item.category));
        return Array.from(cats).sort();
    }, []);

    // Filter items
    const filteredItems = useMemo(() => {
        const lowerTerm = searchTerm.toLowerCase().trim();
        return OFFLINE_LIBRARY.filter(item => {
            // Category Filter
            if (selectedCategory !== 'All' && item.category !== selectedCategory) {
                return false;
            }

            // Search Filter
            if (!lowerTerm) return true;

            const searchableText = `${item.title} ${item.id} ${item.description} ${item.details || ''}`.toLowerCase();
            return searchableText.includes(lowerTerm);
        });
    }, [searchTerm, selectedCategory]);

    // Handle Category Selection
    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        setViewMode('list');
        setSearchTerm(''); // Clear search when picking a category for purity
    };

    // Handle Back to Home
    const handleBack = () => {
        setViewMode('categories');
        setSelectedCategory('All');
        setSearchTerm('');
    };

    // Handle Search Input (Auto-switches to list view if searching)
    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (term.trim().length > 0 && viewMode === 'categories') {
            setViewMode('list');
            setSelectedCategory('All');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Known Structure Library</h2>
                            <p className="text-gray-400 text-sm">Curated collection of {OFFLINE_LIBRARY.length} famous proteins.</p>
                        </div>
                    </div>

                    {/* Search Bar (Global) */}
                    <div className="relative flex-1 max-w-md mx-6 hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                        />
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-gradient-to-br from-gray-900 via-gray-900 to-black">

                    {/* VIEW: CATEGORY DASHBOARD */}
                    {viewMode === 'categories' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-300">
                            {categories.map(cat => {
                                const config = CATEGORY_CONFIG[cat];
                                const count = OFFLINE_LIBRARY.filter(i => i.category === cat).length;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategorySelect(cat)}
                                        className={clsx(
                                            "group relative flex flex-col items-start text-left p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden",
                                            config?.style.replace(/active-color:[\w-]+/g, '').trim() || "bg-gray-800 border-white/10 text-white"
                                        )}
                                    >
                                        <div className={`absolute -right-4 -bottom-4 opacity-10 scale-[4] group-hover:scale-[4.5] transition-transform duration-500`}>
                                            {config?.icon}
                                        </div>

                                        <div className="mb-4 p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                                            {config?.icon}
                                        </div>

                                        <h3 className="text-xl font-bold mb-1">{cat}</h3>
                                        <p className="text-sm opacity-70 mb-4 h-10">{config?.description || 'Browse collection.'}</p>

                                        <div className="mt-auto py-1 px-3 rounded-full bg-black/20 text-xs font-mono border border-white/10">
                                            {count} proteins
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* VIEW: LIST */}
                    {viewMode === 'list' && (
                        <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-white border border-white/10 hover:bg-gray-700 transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                    Back to Categories
                                </button>
                                {selectedCategory !== 'All' && (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {CATEGORY_CONFIG[selectedCategory]?.icon}
                                        <span className="font-bold">{selectedCategory}</span>
                                    </div>
                                )}
                            </div>

                            {filteredItems.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <Database size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">No proteins found matching your search.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredItems.map(item => {
                                        const config = CATEGORY_CONFIG[item.category];
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => onSelect(`models/${item.id}.pdb`)}
                                                className="group relative flex flex-col items-start text-left bg-gray-800/40 hover:bg-gray-800/80 border border-white/5 hover:border-white/20 rounded-xl p-4 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                                            >
                                                <div className={`absolute top-0 right-0 p-2 opacity-5 scale-150 transition-transform group-hover:scale-[2] group-hover:opacity-10 ${config?.style.split(' ')[0]}`}>
                                                    {config?.icon}
                                                </div>

                                                <div className="flex items-center justify-between w-full mb-3 z-10">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/40 text-blue-200 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                                        {item.id}
                                                    </span>
                                                    <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium", config?.style.replace(/active-color:[\w-]+/g, '').trim())}>
                                                        {config?.icon}
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-1 w-full" title={item.title}>
                                                    {item.title}
                                                </h3>
                                                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed h-8 w-full">
                                                    {item.description}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-white/10 bg-gray-950/80 text-right text-xs text-gray-500 font-mono">
                    Library Version 1.0 • {OFFLINE_LIBRARY.length} entries
                </div>
            </div>
        </div>
    );
};

export default LibraryModal;
