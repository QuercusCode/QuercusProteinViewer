import { useMemo } from 'react';
import type { ResidueInfo, PDBMetadata } from '../types';
import type { PeerSession } from '../hooks/usePeerSession';
import { Lock, Unlock } from 'lucide-react';

interface HUDProps {
    hoveredResidue: ResidueInfo | null;
    pdbMetadata: PDBMetadata | null;
    pdbId: string | null;
    isLightMode: boolean;
    isEmbedMode?: boolean; // Optional, defaults to false
    peerSession?: PeerSession;
    remoteHoveredResidue?: ResidueInfo | null;
    isCameraSynced?: boolean;
    onToggleCameraSync?: () => void;
    isHost?: boolean;
}

export function HUD({ hoveredResidue, pdbMetadata, pdbId, isLightMode, isEmbedMode = false, peerSession, remoteHoveredResidue, isCameraSynced, onToggleCameraSync, isHost }: HUDProps) {
    const textColor = isLightMode ? 'text-gray-800' : 'text-gray-200';
    const bgColor = isLightMode ? 'bg-white/80' : 'bg-black/80';
    const borderColor = isLightMode ? 'border-gray-200' : 'border-neutral-800';

    // Show ID or Title when idle
    const structTitle = useMemo(() => {
        if (pdbMetadata?.title) return pdbMetadata.title;
        return pdbId ? pdbId.toUpperCase() : null;
    }, [pdbMetadata, pdbId]);

    // Standard residues list to filter out atom details for proteins/nucleic acids
    const STANDARD_RESIDUES = new Set([
        'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE',
        'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL',
        'A', 'C', 'G', 'T', 'U', 'DA', 'DC', 'DG', 'DT'
    ]);

    // Position at bottom center to avoid interfering with any viewports

    if (!hoveredResidue && (!structTitle || isEmbedMode)) return null;

    return (
        <div className={`absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none transition-all duration-300 font-sans flex flex-col items-center gap-2`}>

            {/* Live Session Indicator */}
            {peerSession?.isConnected && (
                <div className="flex flex-col items-center gap-1.5 animate-in slide-in-from-bottom-2">
                    {/* Ghost Hover (Host's Pointer) */}
                    {remoteHoveredResidue && !isHost && (
                        <div className={`backdrop-blur-md rounded-full border ${borderColor} bg-indigo-500/90 text-white shadow-lg px-3 py-1 flex items-center gap-2 mb-1`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Host:</span>
                            <span className="text-xs font-mono font-bold">
                                {remoteHoveredResidue.resName} {remoteHoveredResidue.resNo}
                            </span>
                        </div>
                    )}

                    {/* Connection Status & Follow Toggle */}
                    <div className={`backdrop-blur-md rounded-full border ${borderColor} ${bgColor} shadow-sm px-3 py-1 flex items-center gap-2`}>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className={`text-[10px] font-bold tracking-wider ${textColor}`}>
                            LIVE • {peerSession.connections.length} PEER{peerSession.connections.length !== 1 ? 'S' : ''}
                        </span>

                        {/* Follow Mode Toggle (Guest Only) */}
                        {!isHost && onToggleCameraSync && (
                            <>
                                <div className={`h-3 w-px ${isLightMode ? 'bg-black/10' : 'bg-white/20'}`} />
                                <button
                                    onClick={onToggleCameraSync}
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 ${isCameraSynced
                                        ? (isLightMode ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50')
                                        : (isLightMode ? 'text-neutral-500 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200' : 'text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700')
                                        }`}
                                >
                                    {isCameraSynced ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                    {isCameraSynced ? 'FOLLOWING' : 'UNSYNCED'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Minimal Capsule */}
            <div className={`backdrop-blur-md rounded-full border ${borderColor} ${bgColor} shadow-sm px-3 md:px-4 py-1 md:py-1.5 flex items-center justify-center min-w-[100px] md:min-w-[120px]`}>

                {hoveredResidue ? (
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
                ) : (
                    <div className={`text-xs font-medium tracking-wider ${textColor} uppercase`}>
                        {structTitle}
                    </div>
                )}

            </div>
        </div>
    );
}
