import { useState, useEffect, useCallback } from 'react';

export interface HistoryItem {
    id: string;
    dataSource: 'pdb' | 'pubchem';
    timestamp: number;
}

const STORAGE_KEY = 'protein-viewer-history';
const MAX_HISTORY = 10;

export function useHistory() {
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist to localStorage whenever history changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }, [history]);

    const addToHistory = useCallback((id: string, dataSource: 'pdb' | 'pubchem') => {
        setHistory(prev => {
            // Remove existing entry for this ID/Source to prevent duplicates
            const filtered = prev.filter(item => !(item.id === id && item.dataSource === dataSource));

            // Add new item to the top
            const newItem: HistoryItem = {
                id,
                dataSource,
                timestamp: Date.now()
            };

            // Combine and slice to max length
            return [newItem, ...filtered].slice(0, MAX_HISTORY);
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    return {
        history,
        addToHistory,
        clearHistory
    };
}
