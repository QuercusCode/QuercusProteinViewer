import React, { useState } from 'react';
import { CircleHelp, X, MousePointer2, Keyboard } from 'lucide-react';

export const HelpGuide: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
            if (e.key === '?' && !isOpen) {
                // Check if user is typing in an input
                if (
                    e.target instanceof HTMLInputElement ||
                    e.target instanceof HTMLTextAreaElement ||
                    e.target instanceof HTMLSelectElement
                ) {
                    return;
                }
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

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
                    <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50 flex-shrink-0">
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
                        <div className="p-6 space-y-6 overflow-y-auto">

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

                            {/* Keyboard Shortcuts */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                    <Keyboard className="w-4 h-4" /> Keyboard Shortcuts
                                </h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                    <div className="col-span-2 pb-1 mb-1 border-b border-neutral-800 font-bold text-neutral-400">General</div>
                                    <div className="flex justify-between text-neutral-300"><span>Help Guide</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">?</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Command Palette</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">⌘K</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Full Screen</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">F</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Toggle Theme</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">T</kbd></div>

                                    <div className="col-span-2 pb-1 mb-1 mt-2 border-b border-neutral-800 font-bold text-neutral-400">Views</div>
                                    <div className="flex justify-between text-neutral-300"><span>Reset View</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">R</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Toggle Spin</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">Space</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Measurement</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">M</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Contact Map</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">C</kbd></div>

                                    <div className="col-span-2 pb-1 mb-1 mt-2 border-b border-neutral-800 font-bold text-neutral-400">Representations</div>
                                    <div className="flex justify-between text-neutral-300"><span>Cartoon</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">1</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Spacefill</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">2</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Surface</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">3</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Licorice</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">4</kbd></div>

                                    <div className="col-span-2 pb-1 mb-1 mt-2 border-b border-neutral-800 font-bold text-neutral-400">Coloring</div>
                                    <div className="flex justify-between text-neutral-300"><span>By Chain</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">Q</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>By Element</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">W</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>Hydrophobicity</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">E</kbd></div>
                                    <div className="flex justify-between text-neutral-300"><span>pLDDT Conf.</span> <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">A</kbd></div>
                                </div>
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
                        <div className="p-4 bg-neutral-950/50 border-t border-neutral-800 text-center flex-shrink-0">
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
