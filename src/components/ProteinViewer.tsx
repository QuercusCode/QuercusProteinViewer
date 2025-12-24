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
export type ColoringType = 'chainid' | 'element' | 'residue' | 'secondary' | 'hydrophobicity' | 'structure';

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
}

export interface ProteinViewerRef {
    captureImage: () => void;
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
    isMeasurementMode = false
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const componentRef = useRef<any>(null);
    const isMounted = useRef(true);

    const [internalLoading, setInternalLoading] = React.useState(false);
    const [internalError, setInternalError] = React.useState<string | null>(null);

    const loading = externalLoading !== undefined ? externalLoading : internalLoading;
    const setLoading = setExternalLoading || setInternalLoading;
    const error = externalError !== undefined ? externalError : internalError;
    const setError = setExternalError || setInternalError;

    useImperativeHandle(ref, () => ({
        captureImage: () => {
            if (stageRef.current) {
                stageRef.current.makeImage({
                    factor: 1,
                    antialias: true,
                    trim: false,
                    transparent: false
                }).then((blob: Blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `snapshot-${pdbId || 'structure'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                });
            }
        }
    }));

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        try {
            const stage = new window.NGL.Stage(containerRef.current, {
                backgroundColor: "black",
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
                                        // Robust Residue Access
                                        let resNo = r.resno;
                                        if (resNo === undefined && typeof r.getResno === 'function') {
                                            resNo = r.getResno();
                                        }

                                        if (typeof resNo === 'number') {
                                            if (resNo < minSeq) minSeq = resNo;
                                            if (resNo > maxSeq) maxSeq = resNo;
                                        }

                                        // Sequence Extraction
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
            if (!isMeasurementMode || !pickingProxy || !pickingProxy.atom) return;
            const atom = pickingProxy.atom;
            console.log("Atom clicked:", atom);
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
        };
        if (isMeasurementMode) stage.signals.clicked.add(handleClick);
        else {
            stage.signals.clicked.remove(handleClick);
            selectedAtomsRef.current = [];
        }
        return () => { stage.signals.clicked.remove(handleClick); };
    }, [isMeasurementMode]);


    const updateRepresentation = (specificComponent?: any) => {
        if (!isMounted.current) return;
        const component = specificComponent || componentRef.current;
        if (!component || !component.structure) return;
        const NGL = window.NGL;

        try {
            component.removeAllRepresentations();

            // Custom Colors Map
            const schemeId = `custom-scheme-${Date.now()}`;
            const colorMap = new Map<number, number>();
            if (customColors?.length > 0) {
                customColors.forEach(rule => {
                    if (!rule.color || !rule.target) return;
                    try {
                        const colorHex = new NGL.Color(rule.color).getHex();
                        const selection = new NGL.Selection(rule.target);
                        component.structure.eachAtom((atom: any) => {
                            colorMap.set(atom.index, colorHex);
                        }, selection);
                    } catch (e) { }
                });
            }

            let repType = representation || 'cartoon';

            const tryApply = (r: string, c: string) => {
                try {
                    console.log(`Attempting rep: ${r}, color: ${c}`);
                    component.addRepresentation(r, { color: c });
                    return true;
                } catch (e) {
                    console.warn(`Failed: ${r} + ${c}`, e);
                    return false;
                }
            };

            if (customColors.length === 0) {
                let effectiveColoring = coloring;
                if (coloring === 'chainid') {
                    if (pdbId && pdbId.toLowerCase().includes('1crn')) {
                        effectiveColoring = 'element';
                        repType = 'licorice';
                    } else {
                        try {
                            if (component.structure.chainStore.count <= 1) {
                                effectiveColoring = 'chainname';
                            }
                        } catch (e) { }
                    }
                }

                if (!tryApply(repType, effectiveColoring)) {
                    if (!tryApply(repType, 'element')) {
                        if (!tryApply('licorice', 'element')) {
                            tryApply('backbone', 'element');
                        }
                    }
                }
            } else {
                try {
                    const registeredSchemeId = NGL.ColormakerRegistry.addScheme(function (this: any) {
                        this.atomColor = (atom: any) => {
                            if (colorMap.has(atom.index)) return colorMap.get(atom.index);

                            // Fallbacks for Base Color
                            if (coloring === 'element') {
                                const elem = atom.element;
                                if (elem === 'C') return 0x909090; // Carbon
                                if (elem === 'O') return 0xFF0D0D; // Oxygen
                                if (elem === 'N') return 0x3050F8; // Nitrogen
                                if (elem === 'S') return 0xFFFF30; // Sulfur
                                if (elem === 'P') return 0xFFA500; // Phosphorus
                                if (elem === 'H') return 0xFFFFFF; // Hydrogen
                                return 0xCCCCCC;
                            }

                            if (coloring === 'chainid') {
                                // Enhanced Palette matching NGL default visually
                                const colors = [
                                    0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd,
                                    0x8c564b, 0xe377c2, 0x7f7f7f, 0xbcbd22, 0x17becf,
                                    0xFA8072, 0x00FF7F, 0xFFD700, 0x4B0082, 0xFF1493,
                                    0x008080, 0xCD5C5C, 0x000080, 0xDAA520, 0x32CD32
                                ];
                                return colors[(atom.chainIndex || 0) % colors.length];
                            }

                            return 0xCCCCCC;
                        };
                    }, schemeId);
                    component.addRepresentation(repType, { color: registeredSchemeId, sele: "*" });
                } catch (e) {
                    tryApply('licorice', 'element');
                }
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
    }, [representation, coloring, customColors]);

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
