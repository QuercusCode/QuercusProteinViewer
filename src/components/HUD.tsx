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
    peerNames?: Record<string, string>;
    onGrantControl?: (peerId: string | null) => void;
    controllerId?: string | null;
}

export function HUD({ hoveredResidue, pdbMetadata, pdbId, isLightMode, isEmbedMode = false, peerSession, remoteHoveredResidue, isCameraSynced, onToggleCameraSync, isHost, remoteUserName, peerNames = {}, onGrantControl, controllerId }: HUDProps) {
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

    // Stabilize Remote Hover Effect: Prevent rapid switching for Guest View
    const [effectiveRemoteResidue, setEffectiveRemoteResidue] = useState<ResidueInfo | null>(remoteHoveredResidue || null);

    useEffect(() => {
        if (remoteHoveredResidue) {
            setEffectiveRemoteResidue(remoteHoveredResidue);
        } else {
            const timer = setTimeout(() => setEffectiveRemoteResidue(null), 250);
            return () => clearTimeout(timer);
        }
    }, [remoteHoveredResidue]);

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

    const [isRosterOpen, setIsRosterOpen] = useState(false);

    // Close roster when clicking outside (simple check)
    // For now, toggle-based is fine.

    if (!effectiveResidue && (!structTitle || isEmbedMode)) return null;

    return (
        <div className={`absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none transition-all duration-300 font-sans flex flex-col items-center gap-2`}>

            {/* Live Session Indicator */}
            {peerSession?.isConnected && (
                <div className="relative pointer-events-auto flex flex-col items-center animate-in slide-in-from-bottom-2">

                    {/* Roster Popover (Host Only) */}
                    {isHost && isRosterOpen && (
                        <div className="absolute bottom-full mb-4 bg-black/90 text-white rounded-xl backdrop-blur-md border border-neutral-700 p-2 min-w-[200px] flex flex-col gap-1 shadow-2xl animate-in slide-in-from-bottom-2 fade-in">
                            <div className="px-2 py-1 text-[10px] uppercase font-bold text-neutral-400 border-b border-white/10 mb-1 flex justify-between items-center">
                                <span>Classroom ({peerSession.connections.length})</span>
                                <button onClick={() => setIsRosterOpen(false)} className="hover:text-white">×</button>
                            </div>

                            {/* Host (Me) */}
                            <div className={`px-2 py-1.5 rounded flex items-center justify-between transition-colors ${!controllerId ? 'bg-green-500/20 text-green-300' : 'hover:bg-white/10'}`}>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    <span className="text-xs font-medium">You (Host)</span>
                                </div>
                                {controllerId && (
                                    <button
                                        onClick={() => onGrantControl?.(null)}
                                        className="text-[10px] bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded ml-2"
                                    >
                                        Take Back
                                    </button>
                                )}
                            </div>

                            {/* Students */}
                            {peerSession.connections.map(conn => {
                                const isController = controllerId === conn.peer;
                                const name = peerNames[conn.peer] || 'Student';

                                return (
                                    <div key={conn.peer} className={`px-2 py-1.5 rounded flex items-center justify-between transition-colors ${isController ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/10'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isController ? 'bg-indigo-400' : 'bg-neutral-600'}`} />
                                            <span className="text-xs font-medium truncate max-w-[100px]">{name}</span>
                                        </div>
                                        {isController ? (
                                            <span className="text-[10px] font-bold opacity-50">CONTROL</span>
                                        ) : (
                                            <button
                                                onClick={() => onGrantControl?.(conn.peer)}
                                                className="text-[10px] bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded ml-2"
                                            >
                                                Grant
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Controller Status Indicator (for Guests) */}
                    {!isHost && controllerId && (
                        <div className="absolute bottom-full mb-2 bg-indigo-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md shadow-lg animate-pulse">
                            Controlled by {controllerId === peerSession.peerId ? 'You' : (peerNames[controllerId] || 'Assistant')}
                        </div>
                    )}

                    {/* Ghost Hover (Peer's Pointer) - Absolute formatted with opacity transition */}
                    {/* Ghost Hover (Peer's Pointer) - Absolute formatted with opacity transition */}
                    <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap backdrop-blur-md rounded-full border ${borderColor} bg-indigo-500/90 text-white shadow-lg px-2 py-1 flex items-center justify-between gap-2 min-w-[140px] transition-all duration-300 ${effectiveRemoteResidue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex-shrink-0 text-right w-[45%]">
                            {remoteUserName || (isHost ? 'GUEST' : 'HOST')}:
                        </span>
                        <span className="text-xs font-mono font-bold w-[55%] text-left truncate">
                            {effectiveRemoteResidue?.resName || '...'} {effectiveRemoteResidue?.resNo || ''}
                        </span>
                    </div>

                    {/* Connection Status & Follow Toggle */}
                    <div className={`backdrop-blur-md rounded-full border ${borderColor} ${bgColor} shadow-sm px-3 py-1 flex items-center gap-2`}>
                        {/* Host can click to open roster */}
                        <button
                            onClick={isHost ? () => setIsRosterOpen(!isRosterOpen) : undefined}
                            className={`flex items-center gap-2 ${isHost ? 'cursor-pointer hover:opacity-80' : ''}`}
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <span className={`text-[10px] font-bold tracking-wider ${textColor}`}>
                                LIVE • {peerSession.connections.length} PEER{peerSession.connections.length !== 1 ? 'S' : ''}
                            </span>
                        </button>

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
