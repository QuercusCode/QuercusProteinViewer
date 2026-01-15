import type { ResidueInfo } from '../types';

interface HUDProps {
    hoveredResidue: ResidueInfo | null;
    isLightMode: boolean;
}

export function HUD({ hoveredResidue, isLightMode }: HUDProps) {
    const textColor = isLightMode ? 'text-gray-800' : 'text-gray-200';
    const bgColor = isLightMode ? 'bg-white/80' : 'bg-black/80';
    const borderColor = isLightMode ? 'border-gray-200' : 'border-neutral-800';

    // Standard residues list to filter out atom details for proteins/nucleic acids
    const STANDARD_RESIDUES = new Set([
        'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE',
        'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL',
        'A', 'C', 'G', 'T', 'U', 'DA', 'DC', 'DG', 'DT'
    ]);

    // Only show HUD when hovering over a residue
    if (!hoveredResidue) return null;

    return (
        <div className={`absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none transition-all duration-300 font-sans`}>

            {/* Minimal Capsule */}
            <div className={`backdrop-blur-md rounded-full border ${borderColor} ${bgColor} shadow-sm px-3 md:px-4 py-1 md:py-1.5 flex items-center justify-center min-w-[100px] md:min-w-[120px]`}>

                <div className="flex items-center gap-3 animate-in fade-in duration-200">
                    {/* Logic: 
                            - Standard Residues (Protein/DNA): Show ResName + ResNo + Chain.
                            - Chemicals/Ligands: Show ONLY Atom details (Name + Serial). Hide ResName + Chain.
                        */}

                    {STANDARD_RESIDUES.has(hoveredResidue.resName.toUpperCase()) ? (
                        // PROTEIN / NUCLEIC ACID VIEW
                        <>
                            <span className={`font-semibold ${textColor}`}>
                                {hoveredResidue.resName} <span className="opacity-90">{hoveredResidue.resNo}</span>
                            </span>
                            <div className={`h-3 w-px ${isLightMode ? 'bg-black/10' : 'bg-white/20'}`} />
                            <span className={`text-xs uppercase tracking-wide opacity-80 ${textColor}`}>
                                Chain {hoveredResidue.chain}
                            </span>
                        </>
                    ) : (
                        // CHEMICAL / LIGAND VIEW
                        // Show only atom info relative to the chemical
                        (hoveredResidue.atomName) ? (
                            <span className={`font-mono font-semibold ${textColor}`}>
                                {hoveredResidue.atomName} <span className="text-xs opacity-80">#{hoveredResidue.atomSerial}</span>
                            </span>
                        ) : (
                            // Fallback if no atom info (unlikely for NGL hover)
                            <span className={`font-semibold ${textColor}`}>
                                {hoveredResidue.resName}
                            </span>
                        )
                    )}
                </div>

            </div>
        </div>
    );
}
