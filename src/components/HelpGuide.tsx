import React, { useState } from 'react';
import { CircleHelp, X, MousePointer2, Search } from 'lucide-react';

export const HelpGuide: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Help Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-4 right-4 z-20 p-2 bg-neutral-900/80 text-neutral-400 hover:text-white rounded-full border border-white/10 shadow-lg backdrop-blur-md transition-all hover:scale-105"
                title="Viewer Controls & Help"
            >
                <CircleHelp className="w-6 h-6" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <CircleHelp className="w-5 h-5 text-blue-400" />
                                Viewer Guide
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">

                            {/* Mouse Controls */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                    <MousePointer2 className="w-4 h-4" /> Mouse Controls
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                                        <div className="text-sm font-medium text-white mb-1">Rotate</div>
                                        <div className="text-xs text-neutral-400">Left Click + Drag</div>
                                    </div>
                                    <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                                        <div className="text-sm font-medium text-white mb-1">Zoom</div>
                                        <div className="text-xs text-neutral-400">Scroll Wheel</div>
                                    </div>
                                    <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                                        <div className="text-sm font-medium text-white mb-1">Pan</div>
                                        <div className="text-xs text-neutral-400">Right Click + Drag</div>
                                    </div>
                                    <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                                        <div className="text-sm font-medium text-white mb-1">Center</div>
                                        <div className="text-xs text-neutral-400">Ctrl + Click Atom</div>
                                    </div>
                                </div>
                            </div>

                            {/* Features Key */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                    <Search className="w-4 h-4" /> Features
                                </h3>
                                <ul className="space-y-2 text-sm text-neutral-300">
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                        <span>Use the <strong>Sidebar</strong> (Top Left) to load PDBs or upload files.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                                        <span><strong>Sequence View</strong> lets you see amino acids and their chains.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                                        <span>Create <strong>Custom Color Rules</strong> to highlight specific chains or residues.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                        <span><strong>Record Movies</strong> (Turntable) with custom duration settings. Videos are saved to your local gallery.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <span>Manage <strong>Snapshots & Movies</strong> in the gallery. Preview, download, or delete media.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                                        <span><strong>Save & Load Sessions</strong> to persist your visualization settings and custom rules.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                                        <span>Advanced Analysis: Use the <strong>Contact Map</strong> or <strong>Measurement Tool</strong> for structural insights.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Attribution */}
                            <div className="pt-4 border-t border-neutral-800">
                                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 mb-2">Powered By</h3>
                                <div className="flex gap-4 text-[10px] text-neutral-500">
                                    <a href="https://www.rcsb.org/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                                        RCSB PDB Data
                                    </a>
                                    <a href="http://nglviewer.org/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                                        NGL Viewer
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-neutral-950/50 border-t border-neutral-800 text-center">
                            <p className="text-[10px] text-neutral-500">
                                Press <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-300">Esc</kbd> to close
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
