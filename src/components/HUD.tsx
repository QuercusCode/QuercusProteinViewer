import { useMemo, useState, useEffect } from 'react';
import type { ResidueInfo, PDBMetadata } from '../types';
import type { PeerSession } from '../hooks/usePeerSession';
import { Eye, Wrench, Lock, Unlock } from 'lucide-react';

interface HUDProps {
    hoveredResidue: ResidueInfo | null;
    pdbMetadata: PDBMetadata | null;
    pdbId: string | null;
    isLightMode: boolean;
    isEmbedMode?: boolean; // Optional, defaults to false
    peerSession?: PeerSession;
    remoteHoveredResidue?: ResidueInfo | null;
    isHost?: boolean;
    remoteUserName?: string | null;
    peerNames?: Record<string, string>;
    controllerId?: string | null;
    isCameraSynced?: boolean;
    onToggleCameraSync?: () => void;
    userName?: string | null; // Added local user name
}

export function HUD({ hoveredResidue, pdbMetadata, pdbId, isLightMode, isEmbedMode = false, peerSession, remoteHoveredResidue, isHost, remoteUserName, peerNames = {}, controllerId, isCameraSynced, onToggleCameraSync, userName }: HUDProps) {
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

    // Close roster when clicking outside (simple check)
    // For now, toggle-based is fine.

    if (!effectiveResidue && (!structTitle || isEmbedMode)) return null;

    return (
        <>
            {/* Live Session Participants (Top Right) */}
            {peerSession?.isConnected && (
                <div className="fixed top-20 right-28 z-40 flex flex-col gap-2 items-end pointer-events-auto">
                    <div className={`backdrop-blur-md rounded-xl border ${borderColor} ${bgColor} shadow-lg p-3 min-w-[180px] animate-in slide-in-from-right-4 transition-all duration-300`}>
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                            <span className={`text-[10px] font-bold uppercase tracking-wider opacity-70 ${textColor}`}>Live Session</span>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className={`text-[10px] font-bold ${textColor}`}>{peerSession.connections.length + 1}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {/* Me */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    <span className={`text-xs font-medium ${textColor}`}>You {isHost ? '(Host)' : ''}</span>
                                </div>
                                {controllerId === peerSession.peerId && (
                                    <Wrench className="w-3 h-3 text-amber-500" />
                                )}
                            </div>

                            {/* Peers */}
                            {peerSession.connections.map(conn => {
                                const name = peerNames[conn.peer] || 'Student';
                                const isController = controllerId === conn.peer;

                                return (
                                    <div key={conn.peer} className="flex flex-col gap-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isController ? 'bg-amber-500' : 'bg-neutral-500'}`} />
                                                <span className={`text-xs font-medium opacity-80 ${textColor}`}>{name}</span>
                                            </div>
                                            {isController && <Wrench className="w-3 h-3 text-amber-500" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Remote Hover Indicator (Floating below list) */}
                    {effectiveRemoteResidue && (
                        <div className="backdrop-blur-md rounded-lg border border-indigo-500/30 bg-indigo-500/90 text-white shadow-xl px-3 py-2 animate-in fade-in slide-in-from-right-2 max-w-[200px]">
                            <div className="flex items-center justify-between gap-3 text-[10px] uppercase font-bold tracking-wider mb-0.5 opacity-80">
                                <span>{remoteUserName || 'Peer'}</span>
                                <Eye className="w-3 h-3" />
                            </div>
                            <div className="text-xs font-mono font-bold truncate">
                                {effectiveRemoteResidue.resName} {effectiveRemoteResidue.resNo}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Center HUD Container */}
            <div className={`absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none transition-all duration-300 font-sans flex flex-col items-center gap-2`}>

                {/* Restored Live Indicator & View/Edit Toggle (Bottom Center) */}
                {peerSession?.isConnected && (
                    <div className={`pointer-events-auto backdrop-blur-md rounded-full border ${borderColor} ${bgColor} shadow-sm px-3 py-1 flex items-center gap-2 mb-1 animate-in slide-in-from-bottom-2`}>
                        <div className="flex items-center gap-2 pr-3 border-r border-gray-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <span className={`text-[10px] font-bold tracking-wider ${textColor}`}>
                                LIVE • {peerSession.connections.length + 1}
                            </span>
                        </div>

                        {/* Reaction Buttons */}
                        <div className="flex items-center gap-1">
                            {['👍', '👎', '❤️', '👏', '🎉'].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => peerSession.broadcastReaction?.(emoji, userName || 'Guest')}
                                    className={`w-6 h-6 flex items-center justify-center rounded-full text-sm hover:scale-125 transition-transform active:scale-90 ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-white/10'}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        {/* View/Edit Toggle for Guests */}
                        {!isHost && onToggleCameraSync && (
                            <div className="pl-3 border-l border-gray-500/20">
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
                            </div>
                        )}
                    </div>
                )}

                {/* Minimal Capsule (Bottom Center) */}
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
        </>
    );
}
