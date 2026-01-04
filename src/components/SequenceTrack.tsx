
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
            // Ideally we need exact index mapping if numbering is discontinuous, 
            // but for now assuming 1-based sequential or close enough for visual feedback.
            // If we have residue mapping, use it. Here we assume sequence is 1..N

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
        <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 transform translate-y-0 pb-1
            ${isLightMode ? 'bg-white/95 border-t border-neutral-300' : 'bg-neutral-900/95 border-t border-neutral-700'} 
            backdrop-blur-md shadow-2xl safe-area-bottom`}>

            {/* Header / Tabs */}
            <div className={`flex items-center px-4 py-1 gap-2 border-b ${isLightMode ? 'border-neutral-200' : 'border-neutral-800'}`}>
                <div className="flex items-center gap-1.5 mr-4">
                    <Map size={14} className="text-purple-500" />
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-neutral-800' : 'text-neutral-200'}`}>
                        Sequence
                    </span>
                </div>

                {chains.length > 1 && (
                    <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 overflow-x-auto no-scrollbar max-w-[60vw]">
                        {chains.map((chain, idx) => (
                            <button
                                key={chain.name}
                                onClick={() => setActiveChainIndex(idx)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md whitespace-nowrap transition-colors
                                    ${activeChainIndex === idx
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'}`}
                            >
                                Chain {chain.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 text-right text-[10px] text-neutral-400 font-mono">
                    {activeChain.sequence.length} residues
                </div>
            </div>

            {/* Sequence Scroller */}
            <div
                ref={scrollContainerRef}
                className="overflow-x-auto overflow-y-hidden py-2 px-4 select-none scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
            >
                <div className="flex gap-[1px]">
                    {activeChain.sequence.split('').map((res, idx) => {
                        const resNo = idx + 1; // Assuming 1-based indexing for now
                        const isActive = highlightedResidue?.chain === activeChain.name && highlightedResidue.resNo === resNo;
                        const color = getResidueColor(res, isLightMode);

                        return (
                            <button
                                key={idx}
                                onMouseEnter={() => onHoverResidue(activeChain.name, resNo)}
                                onClick={() => onClickResidue(activeChain.name, resNo)}
                                className={`group relative flex flex-col items-center justify-center min-w-[20px] h-10 rounded-sm transition-all duration-150
                                    ${isActive
                                        ? 'z-10 scale-125 ring-2 ring-purple-500 z-index-10'
                                        : 'hover:scale-110 hover:z-10 opacity-90 hover:opacity-100'}`}
                                style={{ backgroundColor: isActive ? '#8b5cf6' : color }}
                            >
                                <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-white' : 'text-black/70'}`}>
                                    {res}
                                </span>
                                <span className="text-[7px] text-black/50 font-mono absolute bottom-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {resNo}
                                </span>

                                {/* Tooltip for context */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 whitespace-nowrap bg-black text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none">
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
