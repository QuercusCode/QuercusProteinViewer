
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
        <div className={`fixed top-16 right-4 bottom-4 w-10 rounded-xl z-40 transition-transform duration-300 transform translate-x-0
            ${isLightMode ? 'bg-white/90 border border-neutral-300 shadow-xl' : 'bg-black/60 border border-neutral-700 shadow-2xl'} 
            backdrop-blur-md flex flex-col overflow-hidden`}>

            {/* Header / Tabs - Compact Vertical */}
            <div className={`flex flex-col items-center py-2 gap-2 border-b ${isLightMode ? 'border-neutral-200' : 'border-neutral-800'} flex-shrink-0`}>
                <div className="flex items-center justify-center w-full" title="Sequence">
                    <Map size={16} className="text-purple-500" />
                </div>

                {chains.length > 1 && (
                    <div className="flex flex-col gap-1 w-full px-1">
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

                <div className="text-[9px] text-neutral-400 font-mono text-center w-full transform -rotate-90 whitespace-nowrap mt-4 mb-2">
                    {activeChain.sequence.length} res
                </div>
            </div>

            {/* Sequence Scroller - Vertical */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-2 select-none scrollbar-hide w-full"
                style={{ scrollBehavior: 'smooth' }}
            >
                <div className="flex flex-col items-center w-full gap-[1px]">
                    {activeChain.sequence.split('').map((res, idx) => {
                        const resNo = idx + 1; // Assuming 1-based indexing
                        const isActive = highlightedResidue?.chain === activeChain.name && highlightedResidue.resNo === resNo;
                        const color = getResidueColor(res, isLightMode);

                        return (
                            <button
                                key={idx}
                                onMouseEnter={() => onHoverResidue(activeChain.name, resNo)}
                                onClick={() => onClickResidue(activeChain.name, resNo)}
                                className={`group relative flex items-center justify-center w-8 h-5 rounded-sm transition-all duration-150 flex-shrink-0
                                    ${isActive
                                        ? 'z-10 scale-110 ring-2 ring-purple-500 z-index-10 shadow-lg'
                                        : 'hover:scale-110 hover:z-10 opacity-90 hover:opacity-100'}`}
                                style={{ backgroundColor: isActive ? '#8b5cf6' : color }}
                            >
                                <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-white' : 'text-black/70'}`}>
                                    {res}
                                </span>

                                {/* Tooltip for context - Left side now */}
                                <div className="absolute right-full mr-2 hidden group-hover:block z-50 whitespace-nowrap bg-black text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none">
                                    {res} {resNo}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};
