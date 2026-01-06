import React, { useState } from 'react';
import {
    CircleHelp, X, MousePointer2, Keyboard, Sparkles,
    BookOpen, Layers, Activity, Share2, FileUp
} from 'lucide-react';

type FeatureSection = {
    id: string;
    title: string;
    icon: any;
    description: string;
    content: React.ReactNode;
};

export const HelpGuide: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('start');

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) setIsOpen(false);
            if (e.key === '?' && !isOpen) {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
                setIsOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const features: FeatureSection[] = [
        {
            id: 'start',
            title: 'Getting Started',
            icon: BookOpen,
            description: 'How to load structures and navigate the interface.',
            content: (
                <div className="space-y-6 intro-slide">
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <FileUp className="w-4 h-4 text-blue-400" /> Loading Structures
                        </h4>
                        <ul className="space-y-3 text-xs text-neutral-300">
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">01</span>
                                <span>
                                    <strong className="text-white block">RCSB PDB</strong>
                                    Enter a 4-character PDB ID (e.g., <code className="bg-neutral-800 px-1 rounded">2B3P</code>) to fetch directly from the database.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">02</span>
                                <span>
                                    <strong className="text-white block">AlphaFold DB</strong>
                                    Search for UniProt IDs to load predicted structures.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">03</span>
                                <span>
                                    <strong className="text-white block">PubChem</strong>
                                    Load small molecules by CID (e.g., <code className="bg-neutral-800 px-1 rounded">2244</code> for Aspirin).
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">04</span>
                                <span>
                                    <strong className="text-white block">Local Files</strong>
                                    Drag and drop <code className="text-blue-300">.pdb</code>, <code className="text-blue-300">.cif</code>, or <code className="text-blue-300">.mol</code> files anywhere on the screen.
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <MousePointer2 className="w-4 h-4 text-purple-400" /> Mouse Controls
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-black/20 p-2 rounded border border-white/5">
                                <strong className="text-white block mb-1">Rotate</strong>
                                <span className="text-neutral-400">Left Click + Drag</span>
                            </div>
                            <div className="bg-black/20 p-2 rounded border border-white/5">
                                <strong className="text-white block mb-1">Zoom</strong>
                                <span className="text-neutral-400">Scroll Wheel</span>
                            </div>
                            <div className="bg-black/20 p-2 rounded border border-white/5">
                                <strong className="text-white block mb-1">Pan</strong>
                                <span className="text-neutral-400">Right Click + Drag</span>
                            </div>
                            <div className="bg-black/20 p-2 rounded border border-white/5">
                                <strong className="text-white block mb-1">Center</strong>
                                <span className="text-neutral-400">Ctrl + Click Atom</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'visuals',
            title: 'Visualization',
            icon: Layers,
            description: 'Representations, Coloring, and Lighting.',
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 rounded-xl">
                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-400" /> Scientific Palettes
                            </h4>
                            <p className="text-xs text-neutral-300 mb-3">
                                Switch between <span className="text-white">Viridis, Magma, Cividis</span>, and Standard palettes. These are color-blind friendly and perceptually uniform, perfect for visualizing data like B-Factors.
                            </p>
                        </div>

                        <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50">
                            <h5 className="text-xs font-bold text-white mb-2">Representations</h5>
                            <ul className="text-xs space-y-1.5 text-neutral-400">
                                <li><strong className="text-neutral-300">Cartoon:</strong> Best for secondary structure overlay.</li>
                                <li><strong className="text-neutral-300">Surface:</strong> visualizing pockets and volume.</li>
                                <li><strong className="text-neutral-300">Ball & Stick:</strong> Detailed atomic inspection.</li>
                                <li><strong className="text-neutral-300">Licorice:</strong> Good for ligand interactions.</li>
                            </ul>
                        </div>

                        <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50">
                            <h5 className="text-xs font-bold text-white mb-2">Smart Coloring</h5>
                            <ul className="text-xs space-y-1.5 text-neutral-400">
                                <li><strong className="text-neutral-300">Hydrophobicity:</strong> Color by residue polarity.</li>
                                <li><strong className="text-neutral-300">B-Factor:</strong> Visualize flexibility/confidence.</li>
                                <li><strong className="text-neutral-300">Chain ID:</strong> Distinct color per chain.</li>
                                <li><strong className="text-neutral-300">Element:</strong> Standard CPK coloring.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'analysis',
            title: 'Analysis Tools',
            icon: Activity,
            description: 'Sequence, Contact Maps, and Measurements.',
            content: (
                <div className="space-y-4">
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-2">Sequence Bar</h4>
                        <p className="text-xs text-neutral-400 mb-3">
                            The interactive sequence bar on the right syncs with your 3D view.
                        </p>
                        <div className="flex gap-2 text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                            <span className="bg-neutral-800 px-2 py-1 rounded">Syncs Colors</span>
                            <span className="bg-neutral-800 px-2 py-1 rounded">Click to Focus</span>
                            <span className="bg-neutral-800 px-2 py-1 rounded">Hover Info</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50">
                            <h4 className="text-xs font-bold text-white mb-2">Contact Map</h4>
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                                Visualize residue-residue interactions in a 2D matrix. Click any pixel to draw a contact line between residues in the 3D structure.
                            </p>
                        </div>
                        <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50">
                            <h4 className="text-xs font-bold text-white mb-2">Measurements</h4>
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                                Press <kbd className="bg-neutral-700 px-1 rounded">M</kbd> to enter measurement mode. Click two atoms to measure distance, three for angle, four for dihedral.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'export',
            title: 'Export & Share',
            icon: Share2,
            description: 'Saving images, movies, and sessions.',
            content: (
                <div className="space-y-4">
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-3">Publication Ready Exports</h4>
                        <div className="grid grid-cols-3 gap-3 text-xs text-center">
                            <div className="bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors">
                                <div className="text-2xl mb-1">📸</div>
                                <div className="font-bold text-white">Image</div>
                                <div className="text-neutral-500 scale-90">Transparent PNG</div>
                            </div>
                            <div className="bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors">
                                <div className="text-2xl mb-1">🎬</div>
                                <div className="font-bold text-white">Movie</div>
                                <div className="text-neutral-500 scale-90">360° Animation</div>
                            </div>
                            <div className="bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors">
                                <div className="text-2xl mb-1">💾</div>
                                <div className="font-bold text-white">Session</div>
                                <div className="text-neutral-500 scale-90">Save JSON State</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h4 className="text-xs font-bold text-blue-400 mb-1">Pro Tip: Clean Mode</h4>
                        <p className="text-[11px] text-neutral-300">
                            Enable "Publication Mode" in Settings to automatically switch to a white background, remove UI elements, and enable high-quality ambient occlusion.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'shortcuts',
            title: 'Shortcuts',
            icon: Keyboard,
            description: 'Keyboard cheat sheet.',
            content: (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div className="col-span-2 pb-1 mb-1 border-b border-neutral-800 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">General</div>
                    <div className="flex justify-between text-neutral-300"><span>Help Guide</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">?</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Command Palette</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">⌘K</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Full Screen</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">F</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Theme Toggle</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">T</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Screenshot</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">S</kbd></div>

                    <div className="col-span-2 pb-1 mb-1 mt-3 border-b border-neutral-800 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Views</div>
                    <div className="flex justify-between text-neutral-300"><span>Reset View</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">R</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Toggle Spin</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">Space</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Measurement</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">M</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Contact Map</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">C</kbd></div>

                    <div className="col-span-2 pb-1 mb-1 mt-3 border-b border-neutral-800 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Representations</div>
                    <div className="flex justify-between text-neutral-300"><span>Cartoon</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">1</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Spacefill</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">2</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Surface</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">3</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Licorice</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">4</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Backbone</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">5</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Ribbon</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">6</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Ball+Stick</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">7</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Line</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">8</kbd></div>

                    <div className="col-span-2 pb-1 mb-1 mt-3 border-b border-neutral-800 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Coloring</div>
                    <div className="flex justify-between text-neutral-300"><span>By Chain</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">Q</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>By Element</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">W</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Hydrophobicity</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">E</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>B-Factor / pLDDT</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">A</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Secondary Structure</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">D</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Charge</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">Z</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Rainbow</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">X</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Residue Name</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">V</kbd></div>
                </div>
            )
        }
    ];

    const activeFeature = features.find(f => f.id === activeTab) || features[0];

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 z-[60] p-2 bg-neutral-900/80 text-neutral-400 hover:text-white rounded-full border border-white/10 shadow-lg backdrop-blur-md transition-all hover:scale-105 group"
                title="Viewer Controls & Help"
            >
                <CircleHelp className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-5xl h-[85vh] flex bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Sidebar */}
                        <div className="w-64 flex-shrink-0 border-r border-neutral-800 bg-neutral-900/50 flex flex-col">
                            <div className="p-5 border-b border-neutral-800">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <CircleHelp className="w-5 h-5 text-blue-500" />
                                    User Manual
                                </h2>
                                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Quercus Viewer v1.0</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                {features.map(feature => (
                                    <button
                                        key={feature.id}
                                        onClick={() => setActiveTab(feature.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === feature.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <feature.icon className={`w-4 h-4 ${activeTab === feature.id ? 'text-white' : 'text-neutral-500'}`} />
                                        {feature.title}
                                    </button>
                                ))}
                            </div>
                            <div className="p-4 border-t border-neutral-800 text-center">
                                <p className="text-[10px] text-neutral-600">
                                    Press <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">Esc</kbd> to close
                                </p>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col min-w-0 bg-neutral-900/30">
                            {/* Header */}
                            <div className="h-16 flex items-center justify-between px-8 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{activeFeature.title}</h3>
                                    <p className="text-xs text-neutral-400">{activeFeature.description}</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-neutral-700">
                                <div className="max-w-3xl mx-auto">
                                    <div className="animate-in fade-in duration-300">
                                        {activeFeature.content}
                                    </div>
                                </div>

                                {/* Shared Footer Attribution */}
                                <div className="mt-12 pt-6 border-t border-neutral-800/50 flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity">
                                    <div className="flex gap-4 text-[10px] text-neutral-500">
                                        <a href="https://www.rcsb.org/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">RCSB PDB</a>
                                        <a href="http://nglviewer.org/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">NGL Viewer</a>
                                        <a href="https://alphafold.ebi.ac.uk/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">AlphaFold DB</a>
                                    </div>
                                    <div className="text-[10px] text-neutral-600">
                                        Powered by React & NGL
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};
