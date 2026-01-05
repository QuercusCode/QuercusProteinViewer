
import { Activity, Database, Box, Layers, Zap } from 'lucide-react';
import type { ResidueInfo, PDBMetadata } from '../types';

interface HUDProps {
    hoveredResidue: ResidueInfo | null;
    stats: {
        chainCount: number;
        residueCount: number;
        ligandCount: number;
    };
    pdbMetadata: PDBMetadata | null;
    isLightMode: boolean;
}

export function HUD({ hoveredResidue, stats, pdbMetadata, isLightMode }: HUDProps) {
    const textColor = isLightMode ? 'text-blue-900' : 'text-blue-100';
    const borderColor = isLightMode ? 'border-blue-900/20' : 'border-blue-400/20';
    const bgColor = isLightMode ? 'bg-white/60' : 'bg-black/60';
    const accentColor = isLightMode ? 'text-blue-600' : 'text-cyan-400';

    return (
        <div className={`absolute bottom-6 right-6 z-10 pointers-events-none select-none transition-all duration-300 font-mono tracking-wide ${textColor}`}>

            {/* Main HUD Container */}
            <div className={`backdrop-blur-md rounded-lg border ${borderColor} ${bgColor} shadow-lg overflow-hidden`}>

                {/* Header / Target Status */}
                <div className={`flex items-center justify-between px-3 py-1.5 border-b ${borderColor} bg-opacity-10 ${isLightMode ? 'bg-blue-100' : 'bg-blue-900'}`}>
                    <div className="flex items-center gap-2">
                        <Activity className={`w-3 h-3 ${accentColor} animate-pulse`} />
                        <span className="text-[10px] font-bold uppercase opacity-80">System Status: Online</span>
                    </div>
                    <div className="text-[9px] opacity-60">HUD v2.0</div>
                </div>

                <div className="p-3 min-w-[200px] space-y-3">

                    {/* Active Target (Hover Info) */}
                    <div className="relative">
                        <div className="text-[9px] uppercase opacity-50 mb-0.5">Active Target</div>
                        {hoveredResidue ? (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-150">
                                <div className={`text-xl font-bold ${accentColor} leading-none flex items-baseline gap-2`}>
                                    {hoveredResidue.resName}
                                    <span className="text-sm opacity-80 decoration-dotted underline">{hoveredResidue.resNo}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs opacity-80">
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                        Chain {hoveredResidue.chain}
                                    </span>
                                    {/* Placeholder for Atom Name if available later */}
                                    <span className="opacity-50">Atom: CA</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm italic opacity-40 py-1">
                                -- No Target --
                            </div>
                        )}

                        {/* Decorative Corner Markers */}
                        <div className={`absolute -top-1 -right-1 w-2 h-2 border-t border-r ${borderColor} opactiy-50`} />
                        <div className={`absolute -bottom-1 -left-1 w-2 h-2 border-b border-l ${borderColor} opactiy-50`} />
                    </div>

                    {/* Structure Data (divider) */}
                    <div className={`h-px w-full ${borderColor}`} />

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">

                        {/* Resolution */}
                        <div className="flex flex-col">
                            <span className="opacity-50 flex items-center gap-1">
                                <Box className="w-2.5 h-2.5" /> Resolution
                            </span>
                            <span className="font-bold">
                                {(pdbMetadata?.resolution && !isNaN(Number(pdbMetadata.resolution)))
                                    ? `${Number(pdbMetadata.resolution).toFixed(2)} Å`
                                    : 'N/A'}
                            </span>
                        </div>

                        {/* Residues */}
                        <div className="flex flex-col">
                            <span className="opacity-50 flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" /> Residues
                            </span>
                            <span className="font-bold">{stats.residueCount.toLocaleString()}</span>
                        </div>

                        {/* Chains */}
                        <div className="flex flex-col">
                            <span className="opacity-50 flex items-center gap-1">
                                <Database className="w-2.5 h-2.5" /> Chains
                            </span>
                            <span className="font-bold">{stats.chainCount}</span>
                        </div>

                        {/* Ligands */}
                        <div className="flex flex-col">
                            <span className="opacity-50 flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" /> Ligands
                            </span>
                            <span className="font-bold">{stats.ligandCount}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className={`h-1 w-full bg-gradient-to-r from-transparent via-${isLightMode ? 'blue-500' : 'cyan-500'} to-transparent opacity-20`} />
            </div>
        </div>
    );
}
