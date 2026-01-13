import React, { useState } from 'react';
import {
    CircleHelp, X, MousePointer2, Keyboard, Sparkles,
    BookOpen, Layers, Activity, Share2, FileUp, ArrowLeft, Wrench, Palette
} from 'lucide-react';

type FeatureSection = {
    id: string;
    title: string;
    icon: any;
    description: string;
    content: React.ReactNode;
};

export const HelpGuide: React.FC<{ isVisible?: boolean }> = ({ isVisible = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('start');
    const [showMobileList, setShowMobileList] = useState(true);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) setIsOpen(false);
            if ((e.key === '?' || e.key === '/') && !isOpen) {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
                setActiveTab('shortcuts');
                setIsOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const features: FeatureSection[] = [
        {
            id: 'start',
            title: 'Getting Started',
            icon: BookOpen,
            description: 'How to load structures and navigate the interface.',
            content: (
                <div className="space-y-6 intro-slide">
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <FileUp className="w-4 h-4 text-blue-400" /> Loading Structures
                            </h4>
                        </div>
                        <ul className="space-y-3 text-xs text-neutral-300">
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">01</span>
                                <span>
                                    <strong className="text-white block">RCSB PDB</strong>
                                    Enter a 4-character PDB ID (e.g., <code className="bg-neutral-800 px-1 rounded">2B3P</code>) to fetch directly.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">02</span>
                                <span>
                                    <strong className="text-white block">PubChem</strong>
                                    Load small molecules by CID (e.g., <code className="bg-neutral-800 px-1 rounded">2244</code>).
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">03</span>
                                <span>
                                    <strong className="text-white block">Library</strong>
                                    Browse our curated collection of interesting proteins and chemicals.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">04</span>
                                <span>
                                    <strong className="text-white block">Local Files</strong>
                                    Drag and drop <code className="text-blue-300">.pdb</code>, <code className="text-blue-300">.sdf</code>, or <code className="text-blue-300">.mol</code> files anywhere on the screen.
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-neutral-800/50 p-3 rounded-lg flex items-center gap-3 border border-neutral-700/50">
                        <div className="p-2 bg-neutral-700/50 rounded-full">
                            <Sparkles className="w-4 h-4 text-neutral-300" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white mb-0.5">Interactive Tour</h4>
                            <p className="text-[11px] text-neutral-400">
                                Click "Start Tour" in the sidebar for a guided walkthrough of all features.
                            </p>
                        </div>
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
            id: 'layout',
            title: 'Multi-View & Layout',
            icon: Layers,
            description: 'Compare structures side-by-side.',
            content: (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-400" /> Multi-View System
                        </h4>
                        <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                            Visualize up to 4 structures simultaneously. Perfect for comparing mutants, binding sites, or different conformations.
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-black/20 p-2 rounded border border-white/5 flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-indigo-500/20 border border-indigo-500/50" />
                                <span className="text-white">Single View</span>
                            </div>
                            <div className="bg-black/20 p-2 rounded border border-white/5 flex items-center gap-2">
                                <div className="flex gap-0.5 w-4 h-4"><div className="w-full bg-indigo-500/20 border border-indigo-500/50" /><div className="w-full bg-indigo-500/20 border border-indigo-500/50" /></div>
                                <span className="text-white">Side-by-Side</span>
                            </div>
                            <div className="bg-black/20 p-2 rounded border border-white/5 flex items-center gap-2">
                                <div className="flex flex-col gap-0.5 w-4 h-4"><div className="h-full bg-indigo-500/20 border border-indigo-500/50" /><div className="flex gap-0.5 h-full"><div className="w-full bg-indigo-500/20 border border-indigo-500/50" /><div className="w-full bg-indigo-500/20 border border-indigo-500/50" /></div></div>
                                <span className="text-white">Triple View</span>
                            </div>
                            <div className="bg-black/20 p-2 rounded border border-white/5 flex items-center gap-2">
                                <div className="grid grid-cols-2 gap-0.5 w-4 h-4"><div className="bg-indigo-500/20 border border-indigo-500/50" /><div className="bg-indigo-500/20 border border-indigo-500/50" /><div className="bg-indigo-500/20 border border-indigo-500/50" /><div className="bg-indigo-500/20 border border-indigo-500/50" /></div>
                                <span className="text-white">Quad Grid</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'data',
            title: 'History & Favorites',
            icon: BookOpen,
            description: 'Manage your saved structures.',
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50">
                            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                                <span className="text-yellow-500">★</span> Favorites
                            </h4>
                            <p className="text-[11px] text-neutral-400">
                                Click the star icon next to any structure name to save it to your local favorites for quick access.
                            </p>
                        </div>
                        <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50">
                            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                                <span className="text-blue-400">🕒</span> History
                            </h4>
                            <p className="text-[11px] text-neutral-400">
                                Usually revisit structures? We automatically keep track of your last 10 viewed items in the History tab.
                            </p>
                        </div>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-2">Built-in Library</h4>
                        <p className="text-xs text-neutral-400 mb-3">
                            Explore our curated collection of over 1000+ protein structures and small molecule chemicals.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-neutral-700 rounded text-[10px] text-neutral-300">Essential Enzymes</span>
                            <span className="px-2 py-1 bg-neutral-700 rounded text-[10px] text-neutral-300">Viral Proteins</span>
                            <span className="px-2 py-1 bg-neutral-700 rounded text-[10px] text-neutral-300">Drug Targets</span>
                            <span className="px-2 py-1 bg-blue-900/30 text-blue-200 border border-blue-500/20 rounded text-[10px]">Vitamins</span>
                            <span className="px-2 py-1 bg-blue-900/30 text-blue-200 border border-blue-500/20 rounded text-[10px]">Antibiotics</span>
                            <span className="px-2 py-1 bg-blue-900/30 text-blue-200 border border-blue-500/20 rounded text-[10px]">Nucleotides</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'visuals',
            title: 'Visualization',
            icon: Sparkles,
            description: 'Representations, Coloring, and Lighting.',
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 rounded-xl">
                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-400" /> Scientific Palettes
                            </h4>
                            <p className="text-xs text-neutral-300 mb-3">
                                Switch between <span className="text-white">Viridis, Magma, Cividis</span>, and Standard palettes. These are color-blind friendly and perceptually uniform.
                            </p>
                        </div>

                        <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50">
                            <h5 className="text-xs font-bold text-white mb-2">Representations</h5>
                            <ul className="text-xs space-y-1.5 text-neutral-400">
                                <li><strong className="text-neutral-300">Cartoon:</strong> Best for secondary structure.</li>
                                <li><strong className="text-neutral-300">Surface:</strong> visualizing pockets/volume.</li>
                                <li><strong className="text-neutral-300">Ball & Stick:</strong> Atomics & Bond Orders.</li>
                                <li><strong className="text-neutral-300">Licorice:</strong> Ligand interactions.</li>
                                <li><strong className="text-neutral-300">Base:</strong> DNA/RNA Nucleotides.</li>
                            </ul>
                        </div>

                        <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50">
                            <h5 className="text-xs font-bold text-white mb-2">Smart Coloring</h5>
                            <ul className="text-xs space-y-1.5 text-neutral-400">
                                <li><strong className="text-neutral-300">Hydrophobicity:</strong> Residue polarity.</li>
                                <li><strong className="text-neutral-300">B-Factor:</strong> Flexibility/Confidence.</li>
                                <li><strong className="text-neutral-300">Chain ID:</strong> Distinct chain colors.</li>
                                <li><strong className="text-neutral-300">Element:</strong> CPK standard.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'coloring',
            title: 'Custom Coloring',
            icon: Palette,
            description: 'Highlight specific residues and chains.',
            content: (
                <div className="space-y-6">
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-pink-400" /> Custom Selection
                        </h4>
                        <p className="text-xs text-neutral-300 mb-4">
                            Create custom color schemes to highlight specific regions of interest.
                        </p>
                        <ul className="space-y-3 text-xs text-neutral-300">
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">01</span>
                                <span>
                                    <strong className="text-white block">Select Chain</strong>
                                    Choose which chain to apply the coloring to (e.g., Chain A).
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">02</span>
                                <span>
                                    <strong className="text-white block">Define Range</strong>
                                    Enter residue numbers (e.g., <code className="bg-neutral-800 px-1 rounded">10-50</code>) or comma-separated lists.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-neutral-500 font-mono">03</span>
                                <span>
                                    <strong className="text-white block">Apply Color</strong>
                                    Pick a distinct color to make your selection stand out against the rest of the structure.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'tools',
            title: 'Analysis & Tools',
            icon: Wrench,
            description: 'Advanced structural analysis tools.',
            content: (
                <div className="space-y-6">
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-3">Structural Tools</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                <strong className="text-white text-xs block mb-1">Structure Superposition</strong>
                                <p className="text-[11px] text-neutral-400">
                                    Align multiple protein structures (by PDB ID or file) onto the main view to compare conformations and binding sites.
                                </p>
                            </div>
                            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                <strong className="text-white text-xs block mb-1">Measurements</strong>
                                <p className="text-[11px] text-neutral-400">
                                    Click any two atoms to calculate the precise distance (Å) between them. Ideal for active site analysis.
                                </p>
                            </div>
                            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                <strong className="text-white text-xs block mb-1">Contact Map</strong>
                                <p className="text-[11px] text-neutral-400">
                                    Generate a 2D matrix representation of residue-residue contacts (Cα-Cα distance &lt; 8Å).
                                </p>
                            </div>
                            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                <strong className="text-white text-xs block mb-1">Motif Search</strong>
                                <p className="text-[11px] text-neutral-400">
                                    Find specific bioactive sequences (e.g., <code className="bg-neutral-800 px-1 rounded">RGD</code>) instantly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'settings',
            title: 'Personalization',
            icon: Activity, // Using Activity icon as placeholder for settings-like thing if Settings icon isn't imported, but imports show Activity is used for Analysis. Let's check imports.
            description: 'Accessibility and appearance settings.',
            content: (
                <div className="space-y-4">
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-3">Accessibility</h4>
                        <div className="flex items-start gap-3">
                            <div className="bg-black/20 p-2 rounded border border-white/5 shrink-0">
                                <span className="text-lg">Aa</span>
                            </div>
                            <div>
                                <strong className="text-white text-xs block mb-1">OpenDyslexic Font</strong>
                                <p className="text-[11px] text-neutral-400">
                                    Toggle the specialized font designed to mitigate some of the common reading errors caused by dyslexia.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-3">Appearance</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <strong className="text-white text-xs block mb-1">Background Color</strong>
                                <p className="text-[11px] text-neutral-400">
                                    Custom color picker for the viewer background. Try dark blue for presentations!
                                </p>
                            </div>
                            <div>
                                <strong className="text-white text-xs block mb-1">Clean Mode</strong>
                                <p className="text-[11px] text-neutral-400">
                                    Hides all UI elements for distraction-free viewing or clean screenshots.
                                </p>
                            </div>
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
                    <div className="flex justify-between text-neutral-300"><span>Undo</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">⌘Z / Ctrl+Z</kbd></div>
                    <div className="flex justify-between text-neutral-300"><span>Redo</span> <kbd className="font-mono bg-neutral-800 px-1.5 rounded text-neutral-400">⇧⌘Z / Shift+Ctrl+Z</kbd></div>

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
                className="fixed top-4 right-[27px] z-40 p-2 bg-neutral-900/80 text-neutral-400 hover:text-white rounded-full border border-white/10 shadow-lg backdrop-blur-md transition-all hover:scale-105 group"
                title="Viewer Controls & Help"
            >
                <CircleHelp className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-5xl h-[85vh] flex flex-col md:flex-row bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Sidebar */}
                        <div className={`w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50 flex-col min-h-0 ${showMobileList ? 'flex' : 'hidden md:flex'}`}>
                            <div className="p-5 border-b border-neutral-800">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <CircleHelp className="w-5 h-5 text-blue-500" />
                                    User Manual
                                </h2>
                                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Quercus Viewer v1.0</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
                                {features.map(feature => (
                                    <button
                                        key={feature.id}
                                        onClick={() => {
                                            setActiveTab(feature.id);
                                            setShowMobileList(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === feature.id && !showMobileList
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : activeTab === feature.id
                                                ? 'bg-blue-600/10 text-blue-400 md:bg-blue-600 md:text-white md:shadow-lg'
                                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <feature.icon className={`w-4 h-4 ${activeTab === feature.id ? 'text-blue-400 md:text-white' : 'text-neutral-500'}`} />
                                        {feature.title}
                                        <div className="flex-1" />
                                        <div className="md:hidden text-neutral-600">→</div>
                                    </button>
                                ))}
                            </div>
                            <div className="p-4 border-t border-neutral-800 text-center flex justify-between md:justify-center items-center">
                                <button onClick={() => setIsOpen(false)} className="md:hidden text-xs text-neutral-400 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Close
                                </button>
                                <p className="text-[10px] text-neutral-600 hidden md:block">
                                    Press <kbd className="font-mono bg-neutral-800 px-1 rounded text-neutral-400">Esc</kbd> to close
                                </p>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className={`flex-1 flex-col min-w-0 min-h-0 bg-neutral-900/30 ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
                            {/* Header */}
                            <div className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowMobileList(true)}
                                        className="md:hidden p-1.5 -ml-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 active:scale-95 transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{activeFeature.title}</h3>
                                        <p className="text-xs text-neutral-400 hidden sm:block">{activeFeature.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-neutral-700">
                                <div className="max-w-3xl mx-auto">
                                    <p className="sm:hidden text-xs text-neutral-500 mb-6 pb-4 border-b border-neutral-800/50">
                                        {activeFeature.description}
                                    </p>
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        {activeFeature.content}
                                    </div>
                                </div>

                                {/* Shared Footer Attribution */}
                                <div className="mt-12 pt-6 border-t border-neutral-800/50 flex flex-col sm:flex-row justify-between items-center opacity-50 hover:opacity-100 transition-opacity gap-4">
                                    <div className="flex gap-4 text-[10px] text-neutral-500">
                                        <a href="https://www.rcsb.org/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">RCSB PDB</a>
                                        <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">PubChem</a>
                                        <a href="http://nglviewer.org/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">NGL Viewer</a>
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
