
import React, { useRef, useEffect, useState } from 'react';
import { Map } from 'lucide-react';

interface SequenceTrackProps {
    chains: { name: string; sequence: string }[];
    highlightedResidue: { chain: string; resNo: number } | null;
    onHoverResidue: (chain: string, resNo: number) => void;
    onClickResidue: (chain: string, resNo: number) => void;
    isLightMode: boolean;
}

const AMINO_ACID_COLORS: Record<string, string> = {
    // Hydrophobic (Red-ish)
    A: '#fca5a5', V: '#f87171', L: '#ef4444', I: '#dc2626', M: '#b91c1c', F: '#991b1b', W: '#7f1d1d', P: '#fecaca',
    // Polar (Blue-ish)
    G: '#e0f2fe', S: '#bae6fd', T: '#7dd3fc', C: '#38bdf8', Y: '#0ea5e9', N: '#0284c7', Q: '#0369a1',
    // Positive (Blue/Purple)
    K: '#60a5fa', R: '#3b82f6', H: '#2563eb',
    // Negative (Red/Pink)
    D: '#f472b6', E: '#ec4899'
};

const getResidueColor = (res: string, isLight: boolean) => {
    // Basic Hydrophobicity/Charge coloring
    // For now, let's use a simpler verified palette or the one above
    return AMINO_ACID_COLORS[res.toUpperCase()] || (isLight ? '#e5e5e5' : '#404040');
};

export const SequenceTrack: React.FC<SequenceTrackProps> = ({
    chains,
    highlightedResidue,
    onHoverResidue,
    onClickResidue,
    isLightMode
}) => {
    const [activeChainIndex, setActiveChainIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const activeChain = chains[activeChainIndex];

    // Scroll to highlighted residue
    useEffect(() => {
        if (highlightedResidue && activeChain && highlightedResidue.chain === activeChain.name) {
            const index = highlightedResidue.resNo - 1; // 1-based to 0-based approximation

            if (scrollContainerRef.current) {
                const element = scrollContainerRef.current.children[0]?.children[index] as HTMLElement;
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        }
    }, [highlightedResidue, activeChain]);

    if (!activeChain) return null;

    return (
        <div className={`fixed top-16 right-4 bottom-4 w-24 rounded-xl z-40 transition-transform duration-300 transform translate-x-0
            ${isLightMode ? 'bg-white/90 border border-neutral-300 shadow-xl' : 'bg-black/60 border border-neutral-700 shadow-2xl'} 
            backdrop-blur-md flex flex-col overflow-hidden`}>

            {/* Header / Tabs - Compact Vertical */}
            <div className={`flex flex-col items-center py-3 gap-2 border-b ${isLightMode ? 'border-neutral-200' : 'border-neutral-800'} flex-shrink-0`}>
                <div className="flex items-center justify-center w-full" title="Sequence">
                    <Map size={16} className="text-purple-500" />
                </div>

                {chains.length > 1 && (
                    <div className="flex flex-col gap-1 w-full px-2">
                        {chains.map((chain, idx) => (
                            <button
                                key={chain.name}
                                onClick={() => setActiveChainIndex(idx)}
                                className={`w-full aspect-square flex items-center justify-center text-[10px] font-bold rounded-md transition-colors
                                    ${activeChainIndex === idx
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'}`}
                                title={`Chain ${chain.name}`}
                            >
                                {chain.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="text-[10px] text-neutral-500 font-mono font-bold text-center w-full mt-1">
                    {activeChain.sequence.length} res
                </div>
            </div>

            {/* Sequence Scroller - Vertical */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-1 select-none scrollbar-hide w-full"
                style={{ scrollBehavior: 'smooth' }}
            >
                <div className="flex flex-col items-center w-full gap-1">
                    {activeChain.sequence.split('').map((res, idx) => {
                        const resNo = idx + 1; // Assuming 1-based indexing
                        const isActive = highlightedResidue?.chain === activeChain.name && highlightedResidue.resNo === resNo;
                        const color = getResidueColor(res, isLightMode);

                        return (
                            <button
                                key={idx}
                                onMouseEnter={() => onHoverResidue(activeChain.name, resNo)}
                                onClick={() => onClickResidue(activeChain.name, resNo)}
                                className={`group relative flex items-center gap-2 px-2 w-full h-8 rounded-lg transition-all duration-150 flex-shrink-0
                                    ${isActive
                                        ? 'bg-purple-500/10 z-10 ring-1 ring-purple-500'
                                        : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                {/* Residue Box */}
                                <span
                                    className={`w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-mono font-bold shadow-sm
                                    ${isActive ? 'text-white scale-110' : 'text-neutral-900 dark:text-white'}`}
                                    style={{ backgroundColor: isActive ? '#8b5cf6' : color }}
                                >
                                    {res}
                                </span>

                                {/* Residue Number */}
                                <span className={`text-[10px] font-mono flex-1 text-right ${isActive ? 'text-purple-400 font-bold' : 'text-neutral-400'}`}>
                                    {resNo}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};
