import React, { useState, useMemo } from 'react';
import { Search, X, BookOpen, Database, FlaskConical, Dna, Activity, Zap, Shield, Grid, Archive, Anchor, Layers } from 'lucide-react';
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
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode, style: string }> = {
    'Enzymes': { icon: <Activity size={14} />, style: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 active-color:bg-amber-500' },
    'Structural': { icon: <Grid size={14} />, style: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 active-color:bg-blue-500' },
    'Transport': { icon: <Archive size={14} />, style: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 active-color:bg-emerald-500' },
    'Signaling': { icon: <Zap size={14} />, style: 'text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 active-color:bg-purple-500' },
    'Viral': { icon: <FlaskConical size={14} />, style: 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 active-color:bg-red-500' },
    'DNA/RNA': { icon: <Dna size={14} />, style: 'text-pink-400 border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 active-color:bg-pink-500' },
    'Toxins': { icon: <Shield size={14} />, style: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 active-color:bg-orange-500' },
    'Synthetic': { icon: <Layers size={14} />, style: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 active-color:bg-cyan-500' },
    'Immune': { icon: <Shield size={14} />, style: 'text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 active-color:bg-rose-500' },
    'Energy': { icon: <Zap size={14} />, style: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 active-color:bg-yellow-500' },
    'Chaperone': { icon: <Anchor size={14} />, style: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 active-color:bg-indigo-500' },
};

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set(OFFLINE_LIBRARY.map(item => item.category));
        return ['All', ...Array.from(cats).sort()];
    }, []);

    // Filter items
    const filteredItems = useMemo(() => {
        return OFFLINE_LIBRARY.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

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
                            <p className="text-gray-400 text-sm">Curated collection of {OFFLINE_LIBRARY.length} famous proteins, available offline.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* CONTROLS */}
                <div className="p-4 border-b border-white/10 flex flex-col gap-4 bg-gray-950/30">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or function..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                        />
                    </div>

                    {/* Category Filter - Wrapped Grid */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => {
                            const config = CATEGORY_CONFIG[cat];
                            const isActive = selectedCategory === cat;

                            // Parse bg color for active state from the style string or default to white
                            // Simple hack: We just use conditional classes heavily here
                            let activeClass = "bg-white text-black border-white";
                            if (cat !== 'All' && config) {
                                // Extract the 'active-color:bg-xyz' part
                                const activeColorMatch = config.style.match(/active-color:(bg-[\w-]+)/);
                                if (activeColorMatch) {
                                    activeClass = `${activeColorMatch[1]} text-white border-transparent shadow-lg shadow-${activeColorMatch[1].replace('bg-', '')}/25`;
                                }
                            }

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5",
                                        isActive
                                            ? activeClass
                                            : (cat === 'All' ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white" : config?.style.replace(/active-color:[\w-]+/g, '').trim())
                                    )}
                                >
                                    {cat !== 'All' && config?.icon}
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* GRID */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-gradient-to-br from-gray-900 via-gray-900 to-black">
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

                {/* FOOTER */}
                <div className="p-4 border-t border-white/10 bg-gray-950/80 text-right text-xs text-gray-500 font-mono">
                    Library Version 1.0 • {filteredItems.length} entries
                </div>
            </div>
        </div>
    );
};

export default LibraryModal;
