import { useState, useEffect, useCallback } from 'react';
import type { DataSource } from '../utils/pdbUtils';

export interface Favorite {
    id: string;
    dataSource: DataSource;
    title?: string;
    addedAt: number;
}

const STORAGE_KEY = 'protein-viewer-favorites';

export function useFavorites() {
    const [favorites, setFavorites] = useState<Favorite[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist to localStorage whenever favorites change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch (e) {
            console.error('Failed to save favorites:', e);
        }
    }, [favorites]);

    const addFavorite = useCallback((id: string, dataSource: DataSource, title?: string) => {
        setFavorites(prev => {
            // Avoid duplicates
            if (prev.some(f => f.id === id && f.dataSource === dataSource)) {
                return prev;
            }
            return [...prev, { id, dataSource, title, addedAt: Date.now() }];
        });
    }, []);

    const removeFavorite = useCallback((id: string, dataSource: DataSource) => {
        setFavorites(prev => prev.filter(f => !(f.id === id && f.dataSource === dataSource)));
    }, []);

    const toggleFavorite = useCallback((id: string, dataSource: DataSource, title?: string) => {
        setFavorites(prev => {
            const exists = prev.some(f => f.id === id && f.dataSource === dataSource);
            if (exists) {
                return prev.filter(f => !(f.id === id && f.dataSource === dataSource));
            } else {
                return [...prev, { id, dataSource, title, addedAt: Date.now() }];
            }
        });
    }, []);

    const isFavorite = useCallback((id: string, dataSource: DataSource) => {
        return favorites.some(f => f.id === id && f.dataSource === dataSource);
    }, [favorites]);

    return {
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
    };
}
