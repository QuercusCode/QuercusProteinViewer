import { useMemo, useState, useEffect } from 'react';
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
    remoteUserName?: string | null;
}

export function HUD({ hoveredResidue, pdbMetadata, pdbId, isLightMode, isEmbedMode = false, peerSession, remoteHoveredResidue, isCameraSynced, onToggleCameraSync, isHost, remoteUserName }: HUDProps) {
    const textColor = isLightMode ? 'text-gray-800' : 'text-gray-200';
    const bgColor = isLightMode ? 'bg-white/80' : 'bg-black/80';
    const borderColor = isLightMode ? 'border-gray-200' : 'border-neutral-800';

    // Stabilize Hover Effect: Prevent rapid switching when moving between atoms
    const [effectiveResidue, setEffectiveResidue] = useState<ResidueInfo | null>(hoveredResidue);

    useEffect(() => {
        if (hoveredResidue) {
            setEffectiveResidue(hoveredResidue);
        } else {
            // Add a small grace period before reverting to Title
            // This prevents the "shifting" flickering when moving mouse across small gaps
            const timer = setTimeout(() => setEffectiveResidue(null), 250);
            return () => clearTimeout(timer);
        }
    }, [hoveredResidue]);

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

    if (!effectiveResidue && (!structTitle || isEmbedMode)) return null;

    return (
        <div className={`absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none transition-all duration-300 font-sans flex flex-col items-center gap-2`}>

            {/* Live Session Indicator */}
            {peerSession?.isConnected && (
                <div className="relative pointer-events-auto flex flex-col items-center animate-in slide-in-from-bottom-2">
                    {/* Ghost Hover (Peer's Pointer) - Absolute formatted with opacity transition */}
                    <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap backdrop-blur-md rounded-full border ${borderColor} bg-indigo-500/90 text-white shadow-lg px-3 py-1 flex items-center gap-2 transition-all duration-300 ${remoteHoveredResidue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                            {remoteUserName || (isHost ? 'GUEST' : 'HOST')}:
                        </span>
                        <span className="text-xs font-mono font-bold">
                            {remoteHoveredResidue?.resName || '...'} {remoteHoveredResidue?.resNo || ''}
                        </span>
                    </div>

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
                                    {isCameraSynced ? 'VIEW' : 'EDIT'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Minimal Capsule */}
            <div className={`backdrop-blur-md rounded-full border ${borderColor} ${bgColor} shadow-sm px-4 md:px-6 py-2 flex items-center justify-center min-w-[240px] transition-all duration-300 ease-out overflow-hidden`}>
                <div className="relative flex items-center justify-center">
                    {/* Residue Info View - Fades In/Out */}
                    <div className={`flex items-center gap-3 transition-opacity duration-300 ${effectiveResidue ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden absolute'}`}>
                        {effectiveResidue && (
                            <>
                                {STANDARD_RESIDUES.has(effectiveResidue.resName.toUpperCase()) ? (
                                    <>
                                        <span className={`font-semibold ${textColor} whitespace-nowrap`}>
                                            {effectiveResidue.resName} <span className="opacity-90">{effectiveResidue.resNo}</span>
                                        </span>
                                        <div className={`h-3 w-px ${isLightMode ? 'bg-black/10' : 'bg-white/20'}`} />
                                        <span className={`text-xs uppercase tracking-wide opacity-80 ${textColor} whitespace-nowrap`}>
                                            Chain {effectiveResidue.chain}
                                        </span>
                                    </>
                                ) : (
                                    (effectiveResidue.atomName) ? (
                                        <span className={`font-mono font-semibold ${textColor} whitespace-nowrap`}>
                                            {effectiveResidue.atomName} <span className="text-xs opacity-80">#{effectiveResidue.atomSerial}</span>
                                        </span>
                                    ) : (
                                        <span className={`font-semibold ${textColor} whitespace-nowrap`}>
                                            {effectiveResidue.resName}
                                        </span>
                                    )
                                )}
                            </>
                        )}
                    </div>

                    {/* Idle Title View - Fades In/Out */}
                    <div className={`text-xs font-medium tracking-wider ${textColor} uppercase text-center truncate max-w-[240px] transition-opacity duration-300 ${!effectiveResidue ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden absolute'}`}>
                        {structTitle}
                    </div>
                </div>
            </div>
        </div>
    );
}
