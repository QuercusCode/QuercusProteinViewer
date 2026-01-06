import { useMemo } from 'react';
import type { ResidueInfo, PDBMetadata } from '../types';

interface HUDProps {
    hoveredResidue: ResidueInfo | null;
    pdbMetadata: PDBMetadata | null;
    pdbId: string | null;
    isLightMode: boolean;
}

export function HUD({ hoveredResidue, pdbMetadata, pdbId, isLightMode }: HUDProps) {
    const textColor = isLightMode ? 'text-gray-800' : 'text-gray-200';
    const bgColor = isLightMode ? 'bg-white/80' : 'bg-black/80';
    const borderColor = isLightMode ? 'border-gray-200' : 'border-neutral-800';

    // Show ID or Title when idle
    const structTitle = useMemo(() => {
        if (pdbMetadata?.title) return pdbMetadata.title;
        return pdbId ? pdbId.toUpperCase() : "Loaded Model";
    }, [pdbMetadata, pdbId]);

    return (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none transition-all duration-300 font-sans`}>

            {/* Minimal Capsule */}
            <div className={`backdrop-blur-md rounded-full border ${borderColor} ${bgColor} shadow-sm px-4 py-1.5 flex items-center justify-center min-w-[120px]`}>

                {hoveredResidue ? (
                    <div className="flex items-center gap-3 animate-in fade-in duration-200">
                        {/* Residue Info */}
                        <span className={`font-semibold ${textColor}`}>
                            {hoveredResidue.resName} <span className="opacity-70">{hoveredResidue.resNo}</span>
                        </span>

                        {/* Atom Info (if available) - Separated by bullet */}
                        {hoveredResidue.atomName && (
                            <>
                                <span className={`opacity-40 ${textColor}`}>•</span>
                                <span className={`font-mono text-sm opacity-90 ${textColor}`}>
                                    {hoveredResidue.atomName} <span className="text-[10px] opacity-60">#{hoveredResidue.atomSerial}</span>
                                </span>
                            </>
                        )}

                        <div className={`h-3 w-px ${isLightMode ? 'bg-black/10' : 'bg-white/20'}`} />
                        <span className={`text-xs uppercase tracking-wide opacity-60 ${textColor}`}>
                            Chain {hoveredResidue.chain}
                        </span>
                    </div>
                ) : (
                    <div className={`text-xs font-medium tracking-wider opacity-50 ${textColor} uppercase`}>
                        {structTitle}
                    </div>
                )}

            </div>
        </div>
    );
}
