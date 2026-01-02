import React, { useState, useMemo } from 'react';
import { Search, X, BookOpen, Database, FlaskConical, Dna, Activity, Zap, Shield, Grid, Archive, AlignJustify } from 'lucide-react';
import clsx from 'clsx';
import { OFFLINE_LIBRARY, LibraryEntry } from '../data/library';

// --- TYPES ---

interface LibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (fileUrl: string) => void;
}

// --- CATEGORY ICONS ---
const CategoryIcons: Record<string, React.ReactNode> = {
    'Enzymes': <Activity size={16} />,
    'Structural': <Grid size={16} />,
    'Transport': <Archive size={16} />,
    'Signaling': <Zap size={16} />,
    'Viral': <FlaskConical size={16} />,
    'DNA/RNA': <Dna size={16} />,
    'Toxins': <Shield size={16} />,
    'Synthetic': <FlaskConical size={16} />,
    'Immune': <Shield size={16} />,
    'Energy': <Zap size={16} />,
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
            <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">

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
                <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 bg-gray-900/30">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or function..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2",
                                    selectedCategory === cat
                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {cat !== 'All' && CategoryIcons[cat]}
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GRID */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <Database size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No proteins found matching your search.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(`${window.location.origin}/models/${item.id}.pdb`)}
                                    className="group flex flex-col items-start text-left bg-gray-800/50 hover:bg-gray-800 border border-white/5 hover:border-blue-500/50 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
                                >
                                    <div className="flex items-center justify-between w-full mb-3">
                                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-black/40 text-blue-300 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                            {item.id}
                                        </span>
                                        <span className={clsx("text-xs flex items-center gap-1 opacity-70", getCategoryColor(item.category))}>
                                            {CategoryIcons[item.category]}
                                            {item.category}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-1" title={item.title}>
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed h-10 w-full">
                                        {item.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-white/10 bg-gray-900/50 text-right text-xs text-gray-500">
                    Showing {filteredItems.length} of {OFFLINE_LIBRARY.length} proteins
                </div>
            </div>
        </div>
    );
};

// Helper for category colors
const getCategoryColor = (cat: string) => {
    switch (cat) {
        case 'Viral': return 'text-red-400';
        case 'Toxins': return 'text-orange-400';
        case 'DNA/RNA': return 'text-purple-400';
        case 'Structural': return 'text-green-400';
        case 'Enzymes': return 'text-yellow-400';
        default: return 'text-blue-400';
    }
};

export default LibraryModal;
