import React from 'react';
import { Star, Trash2, X } from 'lucide-react';
import type { Favorite } from '../hooks/useFavorites';

interface FavoritesPanelProps {
    favorites: Favorite[];
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string, dataSource: 'pdb' | 'pubchem') => void;
    onRemove: (id: string, dataSource: 'pdb' | 'pubchem') => void;
    isLightMode: boolean;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
    favorites,
    isOpen,
    onClose,
    onSelect,
    onRemove,
    isLightMode,
}) => {
    if (!isOpen) return null;

    const bgColor = isLightMode ? 'bg-white/95' : 'bg-black/95';
    const textColor = isLightMode ? 'text-neutral-900' : 'text-white';
    const borderColor = isLightMode ? 'border-neutral-200' : 'border-white/10';
    const hoverBg = isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-white/5';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl border ${bgColor} ${borderColor} backdrop-blur-xl z-50 flex flex-col overflow-hidden`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${borderColor}`}>
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <h2 className={`text-lg font-bold ${textColor}`}>Favorites</h2>
                        <span className={`text-sm ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            ({favorites.length})
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${hoverBg}`}
                    >
                        <X className={`w-5 h-5 ${textColor}`} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {favorites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12">
                            <Star className={`w-16 h-16 mb-4 ${isLightMode ? 'text-neutral-300' : 'text-neutral-700'}`} />
                            <p className={`text-center ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                No favorites yet. Star structures to save them here!
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {favorites.map((fav) => (
                                <div
                                    key={`${fav.dataSource}-${fav.id}`}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${borderColor} ${hoverBg} transition-all group`}
                                >
                                    <button
                                        onClick={() => onSelect(fav.id, fav.dataSource)}
                                        className="flex-1 flex items-center gap-4 text-left"
                                    >
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium ${textColor} truncate`}>
                                                {fav.title || fav.id}
                                            </div>
                                            <div className={`text-sm ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                {fav.dataSource === 'pdb' ? 'PDB' : 'PubChem'}: {fav.id}
                                                {' • '}
                                                {new Date(fav.addedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove(fav.id, fav.dataSource);
                                        }}
                                        className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isLightMode ? 'hover:bg-red-100 text-red-600' : 'hover:bg-red-950/50 text-red-400'}`}
                                        title="Remove from favorites"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
