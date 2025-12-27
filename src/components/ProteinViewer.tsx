import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import type { CustomColorRule, ChainInfo } from '../types';

declare global {
    interface Window {
        NGL: any;
    }
}

export type RepresentationType = 'cartoon' | 'licorice' | 'backbone' | 'spacefill' | 'surface' | 'ribbon';
export type ColoringType = 'chainid' | 'element' | 'residue' | 'secondary' | 'hydrophobicity' | 'structure' | 'bfactor' | 'charge';

interface ProteinViewerProps {
    pdbId?: string;
    file?: File;
    representation?: string;
    coloring?: string;
    customColors?: CustomColorRule[];
    className?: string;
    onStructureLoaded?: (info: { chains: ChainInfo[] }) => void;
    onError?: (error: string) => void;
    loading?: boolean;
    setLoading?: (loading: boolean) => void;
    error?: string | null;
    setError?: (error: string | null) => void;
    resetCamera?: number;
    isMeasurementMode?: boolean;
    onAtomClick?: (info: { chain: string; resNo: number; resName: string; atomIndex: number } | null) => void;
    backgroundColor?: string;
    showSurface?: boolean;
    showLigands?: boolean;
    isSpinning?: boolean;
}

export interface ProteinViewerRef {
    getSnapshotBlob: () => Promise<Blob | null>;
    highlightResidue: (chain: string, resNo: number) => void;
    focusLigands: () => void;
    clearHighlight: () => void;
}

export const ProteinViewer = forwardRef<ProteinViewerRef, ProteinViewerProps>(({
    pdbId,
    file,
    representation = 'cartoon',
    coloring = 'chainid',
    customColors = [],
    className,
    onStructureLoaded,
    loading: externalLoading,
    setLoading: setExternalLoading,
    error: externalError,
    setError: setExternalError,
    resetCamera,
    isMeasurementMode = false,
    onAtomClick,
    backgroundColor = "black",
    showSurface = false,
    showLigands = false,
    isSpinning = false
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const componentRef = useRef<any>(null);
    const highlightComponentRef = useRef<any>(null);
    const isMounted = useRef(true);

    const [internalLoading, setInternalLoading] = React.useState(false);
    const [internalError, setInternalError] = React.useState<string | null>(null);

    const loading = externalLoading !== undefined ? externalLoading : internalLoading;
    const setLoading = setExternalLoading || setInternalLoading;
    const error = externalError !== undefined ? externalError : internalError;
    const setError = setExternalError || setInternalError;

    useImperativeHandle(ref, () => ({
        getSnapshotBlob: async () => {
            if (!stageRef.current) return null;
            try {
                // High Quality Export (3x)
                return await stageRef.current.makeImage({
                    factor: 3,
                    type: 'png',
                    antialias: true,
                    trim: false,
                    transparent: false
                });
            } catch (err) {
                console.warn("High-res export failed, trying low-res fallback...", err);
                try {
                    return await stageRef.current.makeImage({
                        factor: 1,
                        type: 'png',
                        antialias: true,
                        trim: false,
                        transparent: false
                    });
                } catch (err2) {
                    console.error("Snapshot failed:", err2);
                    return null;
                }
            }
        },
        captureImage: async () => {
            const fixPngBlob = async (blob: Blob): Promise<Blob> => {
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);

                    // Standard PNG Signature
                    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

                    // Check if signature is missing
                    let isMissingSignature = false;
                    for (let i = 0; i < pngSignature.length; i++) {
                        if (uint8Array[i] !== pngSignature[i]) {
                            isMissingSignature = true;
                            break;
                        }
                    }

                    if (isMissingSignature) {
                        console.warn("Detected missing PNG signature. Repairing file...");
                        const newBuffer = new Uint8Array(pngSignature.length + uint8Array.length);
                        newBuffer.set(pngSignature, 0);
                        newBuffer.set(uint8Array, pngSignature.length);
                        return new Blob([newBuffer], { type: 'image/png' });
                    }

                    return blob;
                } catch (e) {
                    console.error("Error checking PNG signature:", e);
                    return blob;
                }
            };

            const downloadBlob = async (blob: Blob, suffix: string = '') => {
                const fixedBlob = await fixPngBlob(blob);
                const url = URL.createObjectURL(fixedBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `snapshot-${pdbId || 'structure'}${suffix}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            };

            if (stageRef.current) {
                // High Quality Export (3x resolution)
                stageRef.current.makeImage({
                    factor: 3,
                    type: 'png',
                    antialias: true,
                    trim: false,
                    transparent: false
                }).then((blob: Blob) => {
                    downloadBlob(blob);
                }).catch((err: any) => {
                    console.warn("High-res export failed, trying low-res fallback...", err);
                    // Fallback to standard resolution
                    stageRef.current.makeImage({
                        factor: 1,
                        type: 'png',
                        antialias: true,
                        trim: false,
                        transparent: false
                    }).then((blob: Blob) => {
                        downloadBlob(blob, '-lowres');
                    }).catch((err2: any) => {
                        console.error("Export definitely failed:", err2);
                        setError("Failed to export image.");
                    });
                });
            }
        },
        highlightResidue: (chain: string, resNo: number) => {
            if (!componentRef.current || !stageRef.current) return;
            const component = componentRef.current;

            try {
                if (highlightComponentRef.current) {
                    component.removeRepresentation(highlightComponentRef.current);
                    highlightComponentRef.current = null;
                }

                if (!chain || resNo === undefined) return;

                const selection = `:${chain} and ${resNo}`;
                console.log(`Highlighting selection: ${selection}`);

                highlightComponentRef.current = component.addRepresentation('ball+stick', {
                    sele: selection,
                    color: 'element',
                    radius: 0.3
                });

                const duration = 1000;
                component.autoView(selection, duration);

            } catch (e) {
                console.warn("Highlight residue failed:", e);
            }
        },
        focusLigands: () => {
            if (!componentRef.current || !stageRef.current) return;
            const component = componentRef.current;
            try {
                // "ligand" selector usually works for hetatms not water
                const selection = "ligand and not (water or ion)";
                // Check if any atom matches
                let count = 0;
                component.structure.eachAtom(() => { count++; }, new window.NGL.Selection(selection));

                if (count > 0) {
                    console.log(`Focusing on ${count} ligand atoms`);
                    component.autoView(selection, 1000);
                } else {
                    console.log("No ligands found to focus on.");
                }
            } catch (e) { console.warn("Focus ligands failed", e); }
        },
        clearHighlight: () => {
            if (!componentRef.current) return;
            const component = componentRef.current;
            try {
                if (highlightComponentRef.current) {
                    component.removeRepresentation(highlightComponentRef.current);
                    highlightComponentRef.current = null;
                }
            } catch (e) {
                console.warn("Clear highlight failed:", e);
            }
        }
    }));

    useEffect(() => {
        if (stageRef.current) {
            stageRef.current.setSpin(isSpinning);
        }
    }, [isSpinning]);

    // Handle Window Resize
    useEffect(() => {
        if (stageRef.current) {
            stageRef.current.setParameters({ backgroundColor });
        }
    }, [backgroundColor]);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        try {
            const stage = new window.NGL.Stage(containerRef.current, {
                backgroundColor: backgroundColor,
                tooltip: true,
            });
            stageRef.current = stage;

            const handleResize = () => stage.handleResize();
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                try { stage.dispose(); } catch (e) { }
                stageRef.current = null;
            };
        } catch (err) {
            console.error("Failed to init NGL Stage:", err);
            setError("WebGL initialization failed.");
        }
    }, []);

    useEffect(() => {
        const loadStructure = async () => {
            if (!stageRef.current) return;
            const stage = stageRef.current;

            try {
                if (stage.viewer) {
                    try { stage.removeAllComponents(); } catch (e) { }
                }
            } catch (e) { /* ignore */ }

            componentRef.current = null;
            if (isMounted.current) setError(null);
            if (isMounted.current) setLoading(true);

            const currentPdbId = pdbId;
            const currentFile = file;

            try {
                let component;
                if (currentFile) {
                    console.log("Loading from file:", currentFile.name);
                    component = await stage.loadFile(currentFile, { defaultRepresentation: false });
                } else if (currentPdbId) {
                    const cleanId = String(currentPdbId).trim().toLowerCase();
                    if (cleanId.length < 3) {
                        if (isMounted.current) setLoading(false);
                        return;
                    }

                    const AVAILABLE_LOCAL_PDBS = ['2b3p', '4hhb'];
                    let url = `https://files.rcsb.org/download/${cleanId}.pdb`;
                    if (AVAILABLE_LOCAL_PDBS.includes(cleanId)) {
                        url = `./${cleanId}.pdb`;
                    }
                    console.log(`Fetching from: ${url}`);
                    component = await stage.loadFile(url, { defaultRepresentation: false });
                } else {
                    if (isMounted.current) setLoading(false);
                    return;
                }

                if (component && isMounted.current) {
                    console.log("Component loaded. Type:", component.type);
                    componentRef.current = component;

                    if (component.structure && onStructureLoaded) {
                        try {
                            const chains: ChainInfo[] = [];
                            const seenChains = new Set<string>();

                            component.structure.eachChain((c: any) => {
                                if (seenChains.has(c.chainname)) return;
                                seenChains.add(c.chainname);

                                let seq = "";
                                let minSeq = Infinity;
                                let maxSeq = -Infinity;

                                try {
                                    c.eachResidue((r: any) => {
                                        let resNo = r.resno;
                                        if (resNo === undefined && typeof r.getResno === 'function') {
                                            resNo = r.getResno();
                                        }

                                        if (typeof resNo === 'number') {
                                            if (resNo < minSeq) minSeq = resNo;
                                            if (resNo > maxSeq) maxSeq = resNo;
                                        }

                                        let resName = 'X';
                                        if (r.getResname1) resName = r.getResname1();
                                        else if (r.resname) resName = r.resname[0];
                                        seq += resName;
                                    });
                                } catch (eRes) {
                                    console.warn(`Residue iteration failed for chain ${c.chainname}`, eRes);
                                }

                                if (minSeq === Infinity) minSeq = 0;
                                if (maxSeq === -Infinity) maxSeq = 0;

                                console.log(`Chain ${c.chainname}: Range ${minSeq}-${maxSeq}, SeqLen: ${seq.length}`);
                                chains.push({ name: c.chainname, min: minSeq, max: maxSeq, sequence: seq });
                            });
                            onStructureLoaded({ chains });
                        } catch (e) { console.warn("Chain parsing error", e); }
                    }

                    console.log("Applying initial representation...");
                    try {
                        updateRepresentation(component);
                    } catch (reprErr) {
                        console.error("Initial representation failure:", reprErr);
                    }

                    setTimeout(() => {
                        if (!isMounted.current) return;
                        try {
                            console.log("AutoView & Resize...");
                            stage.handleResize();
                            component.autoView();
                            if (stage.viewer) stage.viewer.requestRender();
                        } catch (e) { console.warn("AutoView failed", e); }
                    }, 1000);
                }
            } catch (err) {
                if (isMounted.current) {
                    console.error("Load Error (caught):", err);
                    setError(`Failed to load: ${err instanceof Error ? err.message : String(err)}`);
                }
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        if (file || (pdbId && String(pdbId).length >= 3)) {
            loadStructure();
        } else {
            if (stageRef.current) stageRef.current.removeAllComponents();
            componentRef.current = null;
        }
    }, [pdbId, file]);

    const selectedAtomsRef = useRef<any[]>([]);

    useEffect(() => {
        if (!stageRef.current) return;
        const stage = stageRef.current;

        const handleClick = (pickingProxy: any) => {
            if (!pickingProxy || !pickingProxy.atom) {
                // Only clear highlight if we are NOT in measurement mode and clicked background
                if (!isMeasurementMode && onAtomClick) onAtomClick(null);
                return;
            }
            const atom = pickingProxy.atom;

            // Measurement Mode Logic takes precedence
            if (isMeasurementMode) {
                console.log("Atom clicked (Measure):", atom);
                const Vector3 = window.NGL.Vector3;
                selectedAtomsRef.current.push(atom);
                const currentSelection = selectedAtomsRef.current;
                if (currentSelection.length === 2) {
                    const atom1 = currentSelection[0];
                    const atom2 = currentSelection[1];
                    try {
                        const v1 = new Vector3(atom1.x, atom1.y, atom1.z);
                        const v2 = new Vector3(atom2.x, atom2.y, atom2.z);
                        const distance = v1.distanceTo(v2).toFixed(2);
                        console.log(`Measured distance: ${distance} A`);
                        const shape = new window.NGL.Shape("distance-shape");
                        shape.addCylinder([atom1.x, atom1.y, atom1.z], [atom2.x, atom2.y, atom2.z], [1, 0.8, 0], 0.2);
                        shape.addText([(atom1.x + atom2.x) / 2, (atom1.y + atom2.y) / 2, (atom1.z + atom2.z) / 2], [1, 1, 1], 1.5, `${distance} A`);
                        const shapeComp = stage.addComponentFromObject(shape);
                        shapeComp.addRepresentation("buffer");
                        shapeComp.autoView();
                        selectedAtomsRef.current = [];
                    } catch (e) { selectedAtomsRef.current = []; }
                }
                // Do NOT trigger onAtomClick
                return;
            }

            // Standard Interaction (Bi-directional Sync)
            if (onAtomClick) {
                onAtomClick({
                    chain: atom.chainname,
                    resNo: atom.resno,
                    resName: atom.resname,
                    atomIndex: atom.index
                });
            }
        };

        stage.signals.clicked.add(handleClick);
        return () => { stage.signals.clicked.remove(handleClick); };
    }, [isMeasurementMode, onAtomClick]);


    const updateRepresentation = (specificComponent?: any) => {
        if (!isMounted.current) return;
        const component = specificComponent || componentRef.current;
        if (!component || !component.structure) return;

        const NGL = window.NGL;

        // Stable Color Palettes
        const CHAIN_COLORS = [
            0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd,
            0x8c564b, 0xe377c2, 0x7f7f7f, 0xbcbd22, 0x17becf,
            0xFA8072, 0x00FF7F, 0xFFD700, 0x4B0082, 0xFF1493,
            0x008080, 0xCD5C5C, 0x000080, 0xDAA520, 0x32CD32
        ];

        const ELEMENT_COLORS: { [key: string]: number } = {
            'C': 0x909090,
            'O': 0xFF0D0D,
            'N': 0x3050F8,
            'S': 0xFFFF30,
            'P': 0xFFA500,
            'H': 0xFFFFFF,
            'DEFAULT': 0xCCCCCC
        };

        try {
            component.removeAllRepresentations();
            highlightComponentRef.current = null;

            let repType = representation || 'cartoon';
            let currentColoring = coloring;

            // Handle special 1crn case (legacy support)
            if (coloring === 'chainid' && pdbId && pdbId.toLowerCase().includes('1crn')) {
                currentColoring = 'element';
                repType = 'licorice';
            }

            // Strategy: Unified Custom Scheme
            // For simple coloring modes (chainid, element), we use a purely manual scheme
            // This ensures that "base" colors are identical whether a custom rule exists or not.

            if (currentColoring === 'chainid' || currentColoring === 'element' || currentColoring === 'charge') {
                const schemeId = `unified-scheme-${Date.now()}`;

                // Pre-calculate custom colors for fast lookup
                const customColorMap = new Map<number, number>();
                if (customColors?.length > 0) {
                    customColors.forEach(rule => {
                        if (!rule.color || !rule.target) return;
                        try {
                            const colorHex = new NGL.Color(rule.color).getHex();
                            const selection = new NGL.Selection(rule.target);
                            component.structure.eachAtom((atom: any) => {
                                customColorMap.set(atom.index, colorHex);
                            }, selection);
                        } catch (e) { }
                    });
                }

                try {
                    const registeredSchemeId = NGL.ColormakerRegistry.addScheme(function (this: any) {
                        this.atomColor = (atom: any) => {
                            // 1. Custom Override (Highest Priority)
                            if (customColorMap.has(atom.index)) {
                                return customColorMap.get(atom.index);
                            }

                            // 2. Charge Coloring
                            if (currentColoring === 'charge') {
                                const resName = atom.resname;
                                // Positive: Blue
                                if (['ARG', 'LYS', 'HIS'].includes(resName)) return 0x0000FF;
                                // Negative: Red
                                if (['ASP', 'GLU'].includes(resName)) return 0xFF0000;
                                // Neutral: White/Grey
                                return 0xCCCCCC;
                            }

                            // 3. Base Coloring (Stable)
                            if (currentColoring === 'element') {
                                return ELEMENT_COLORS[atom.element] || ELEMENT_COLORS['DEFAULT'];
                            }

                            // Default: Chain ID
                            return CHAIN_COLORS[(atom.chainIndex || 0) % CHAIN_COLORS.length];
                        };
                    }, schemeId);

                    console.log(`Applying Unified Scheme: ${repType}, ID: ${registeredSchemeId}`);
                    component.addRepresentation(repType, { color: registeredSchemeId, sele: "*" });

                } catch (e) {
                    console.warn("Unified Scheme failed, falling back to standard", e);
                    component.addRepresentation(repType, { color: currentColoring, sele: "*" });
                }

            } else {
                // FALLBACK: Layered Strategy for complex types (structure, hydrophobicity, etc.)
                // These are harder to replicate manually, so we accept minor shifts or use the layered approach.
                // We'll stick to the "Base + Custom Layers" approach from Attempt 1 for these edge cases.

                // 1. Define Base Selection
                let baseSelection = "*";
                if (customColors?.length > 0) {
                    const exclusionList = customColors
                        .filter(c => c.target)
                        .map(c => `(${c.target})`)
                        .join(" or ");
                    if (exclusionList) baseSelection = `not (${exclusionList})`;
                }

                // 2. Apply Base
                try {
                    if (baseSelection !== "not ()") { // Only if something remains
                        component.addRepresentation(repType, { color: currentColoring, sele: baseSelection });
                    }
                } catch (e) { }

                // 3. Apply Custom Layers
                if (customColors?.length > 0) {
                    customColors.forEach(rule => {
                        if (rule.color && rule.target) {
                            try {
                                component.addRepresentation(repType, { color: rule.color, sele: rule.target });
                            } catch (e) { }
                        }
                    });
                }
            }

            const tryApply = (r: string, c: string, sele: string, params: any = {}) => {
                try {
                    component.addRepresentation(r, { color: c, sele: sele, ...params });
                } catch (e) { }
            };

            // --- Visualization Overlays ---

            // Surface Overlay
            if (showSurface) {
                console.log("Adding Surface Overlay...");
                tryApply('surface', 'white', "*", { opacity: 0.4, depthWrite: false, side: 'front' });
            }

            // Ligand Highlight
            if (showLigands) {
                console.log("Adding Ligand Highlight...");
                // "ligand" keyword in NGL (non-polymer)
                // Filter out Water/Ions if wanted: ligand and not (water or ion)
                tryApply('ball+stick', 'element', 'ligand and not (water or ion)', { scale: 2.0 });
            }

            if (stageRef.current?.viewer) {
                stageRef.current.viewer.requestRender();
            }

        } catch (e) {
            console.error("Critical error in updateRepresentation:", e);
        }
    };

    useEffect(() => {
        updateRepresentation();
    }, [representation, coloring, customColors, showSurface, showLigands]);

    useEffect(() => {
        if (stageRef.current && resetCamera) {
            try { stageRef.current.autoView(); } catch (e) { }
        }
    }, [resetCamera]);

    return (
        <div className={clsx("relative w-full h-full", className)}>
            <div ref={containerRef} className="w-full h-full" />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-red-900/80 text-white px-4 py-2 rounded-lg border border-red-500 backdrop-blur-sm shadow-xl">
                        {error}
                    </div>
                </div>
            )}
        </div>
    );
});
ProteinViewer.displayName = 'ProteinViewer';
