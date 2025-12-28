import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import type { CustomColorRule, ChainInfo, Annotation } from '../types';

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
    annotations?: Annotation[];
    className?: string;
    onStructureLoaded?: (info: { chains: ChainInfo[] }) => void;
    onError?: (error: string) => void;
    loading?: boolean;
    setLoading?: (loading: boolean) => void;
    error?: string | null;
    setError?: (error: string | null) => void;
    resetCamera?: number;
    isMeasurementMode?: boolean;
    onAtomClick: (info: { chain: string; resNo: number; resName: string; atomIndex: number; position?: { x: number, y: number, z: number } } | null) => void;
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
    getCameraOrientation: () => any;
    setCameraOrientation: (orientation: any) => void;
    getAtomCoordinates: () => Promise<{ x: number[], y: number[], z: number[], labels: string[] }[]>;
    getAtomPosition: (chain: string, resNo: number, atomName?: string) => { x: number, y: number, z: number } | null;
    getAtomPositionByIndex: (atomIndex: number) => { x: number, y: number, z: number } | null;
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
    isSpinning = false,
    annotations = []
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

    // Render Annotations
    useEffect(() => {
        if (!stageRef.current) return;

        // Clean up previous annotations
        stageRef.current.eachComponent((comp: any) => {
            if (comp.name === "annotation-component") {
                stageRef.current.removeComponent(comp);
            }
        });

        if (annotations.length === 0) return;

        // Create new shape for annotations
        const shape = new window.NGL.Shape("annotations");

        // Calculate center of structure for outward direction
        let center = new window.NGL.Vector3();
        if (componentRef.current && componentRef.current.structure) {
            try {
                const box = componentRef.current.structure.getBoundingBox();
                box.getCenter(center);
            } catch (e) { console.warn("Could not get structure center", e); }
        }

        annotations.forEach(note => {
            const atomPos = new window.NGL.Vector3(note.position.x, note.position.y, note.position.z);

            // Calculate direction from center to atom
            const dir = atomPos.clone().sub(center).normalize();

            // Push text out by 20 Angstroms
            const textPos = atomPos.clone().add(dir.multiplyScalar(20));

            const posArray = [textPos.x, textPos.y, textPos.z];
            const atomPosArray = [atomPos.x, atomPos.y, atomPos.z];

            const color = [1, 1, 0]; // Bright Yellow
            const size = 5.0;

            try {
                // Draw connecting line
                shape.addCylinder(atomPosArray, posArray, [1, 1, 1], 0.2);

                // Add Text at new position
                try {
                    shape.addText(posArray, color, size, note.text);
                } catch (e) {
                    shape.addText(posArray, note.text, color, size);
                }
            } catch (e) {
                console.error("Failed to add annotation visual:", e);
            }

            try {
                shape.addSphere(atomPosArray, [1, 0, 1], 1.0); // Anchor on atom
            } catch (e) { }
        });

        const shapeComp = stageRef.current.addComponentFromObject(shape);
        // depthTest: false forces rendering on top of everything
        shapeComp.addRepresentation("buffer", {
            depthTest: false,
            opacity: 1.0
        });
        shapeComp.setName("annotation-component");
        shapeComp.autoView(); // Optional: might disrupt user view, better remove it.

    }, [annotations]);

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
        getAtomPosition: (chain: string, resNo: number, atomName: string = 'CA') => {
            // Helper to get 3D coordinates for a residue
            if (!componentRef.current) return null;
            let position: { x: number, y: number, z: number } | null = null;

            componentRef.current.structure.eachResidue((res: any) => {
                if (res.chain.name === chain && res.resno === resNo) {
                    const atom = res.getAtomByName(atomName) || res.getAtomByName('C3\'') || res.getAtomByName('P') || res.getAtomByIndex(0);
                    if (atom) {
                        position = { x: atom.x, y: atom.y, z: atom.z };
                    }
                }
            });
            return position;
        },
        getAtomPositionByIndex: (atomIndex: number) => {
            if (!componentRef.current) return null;
            try {
                const proxy = componentRef.current.structure.getAtomProxy(atomIndex);
                if (proxy) {
                    return { x: proxy.x, y: proxy.y, z: proxy.z };
                }
            } catch (e) { console.error("Error getting atom by index", e); }
            return null;
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
        },
        getCameraOrientation: () => {
            if (!stageRef.current || !stageRef.current.viewerControls) return null;
            return stageRef.current.viewerControls.getOrientation();
        },
        setCameraOrientation: (orientation: any) => {
            if (!stageRef.current || !stageRef.current.viewerControls || !orientation) return;
            try {
                stageRef.current.viewerControls.orient(orientation);
            } catch (e) {
                console.warn("Failed to set orientation:", e);
            }
        },
        getAtomCoordinates: async () => {
            if (!componentRef.current) return [];
            const component = componentRef.current;
            const data: { x: number[], y: number[], z: number[], labels: string[] }[] = [];

            // Iterate chains
            component.structure.eachChain((chain: any) => {
                const x: number[] = [];
                const y: number[] = [];
                const z: number[] = [];
                const labels: string[] = [];

                // Iterate CA atoms
                chain.eachResidue((res: any) => {
                    let atomToUse: any = null;

                    // Prioritize CA (Protein) > C3' (Nucleic) > P (Backbone fallback)
                    res.eachAtom((atom: any) => {
                        const name = atom.atomname;
                        if (name === 'CA') atomToUse = atom;
                        else if (!atomToUse && name === "C3'") atomToUse = atom;
                        else if (!atomToUse && name === 'P') atomToUse = atom;
                    });

                    if (atomToUse) {
                        x.push(atomToUse.x);
                        y.push(atomToUse.y);
                        z.push(atomToUse.z);
                        // Robust chain name
                        const cName = chain.chainname || chain.name || chain.id || "?";
                        labels.push(`${cName}:${res.resname} ${res.resno}`);
                    }
                });

                if (x.length > 0) {
                    data.push({ x, y, z, labels });
                }
            });

            return data;
        },
        getTorsionData: async () => {
            if (!componentRef.current) return [];
            const component = componentRef.current;
            const results: { phi: number | null, psi: number | null, chain: string, resNo: number, resName: string }[] = [];

            const Vector3 = window.NGL.Vector3;

            // Helper: Calculate Dihedral Angle (in degrees)
            const calculateDihedral = (a: any, b: any, c: any, d: any) => {
                if (!a || !b || !c || !d) return null;

                const v1 = new Vector3().subVectors(b, a);
                const v2 = new Vector3().subVectors(c, b);
                const v3 = new Vector3().subVectors(d, c);

                const n1 = new Vector3().crossVectors(v1, v2).normalize();
                const n2 = new Vector3().crossVectors(v2, v3).normalize();

                const x = n1.dot(n2);
                const y = new Vector3().crossVectors(n1, n2).dot(v2.normalize());

                return -Math.atan2(y, x) * (180 / Math.PI);
            };

            component.structure.eachChain((chain: any) => {
                const residues: any[] = [];
                chain.eachResidue((res: any) => residues.push(res));

                // Need random access for prev/next
                for (let i = 0; i < residues.length; i++) {
                    const curr = residues[i];
                    const prev = i > 0 ? residues[i - 1] : null;
                    const next = i < residues.length - 1 ? residues[i + 1] : null;

                    // Helper: Get Atom Coordinates safely
                    const getAtomPos = (r: any, name: string): any => {
                        let pos = null;
                        r.eachAtom((at: any) => {
                            if (at.atomname === name) {
                                pos = new window.NGL.Vector3(at.x, at.y, at.z);
                            }
                        });
                        return pos;
                    };

                    const vN = getAtomPos(curr, 'N');
                    const vCA = getAtomPos(curr, 'CA');
                    const vC = getAtomPos(curr, 'C');

                    let phi = null;
                    let psi = null;

                    // Calculate Phi: C(prev) - N - CA - C
                    if (prev && vN && vCA && vC) {
                        const vPrevC = getAtomPos(prev, 'C');
                        if (vPrevC) {
                            // Check connectivity distance (~1.33A) to ensure unbroken chain
                            if (vPrevC.distanceTo(vN) < 2.0) {
                                phi = calculateDihedral(vPrevC, vN, vCA, vC);
                            }
                        }
                    }

                    // Calculate Psi: N - CA - C - N(next)
                    if (next && vN && vCA && vC) {
                        const vNextN = getAtomPos(next, 'N');
                        if (vNextN) {
                            // Check connectivity
                            if (vC.distanceTo(vNextN) < 2.0) {
                                psi = calculateDihedral(vN, vCA, vC, vNextN);
                            }
                        }
                    }

                    if (phi !== null || psi !== null) {
                        results.push({
                            phi,
                            psi,
                            chain: chain.chainname,
                            resNo: curr.resno,
                            resName: curr.resname
                        });
                    }
                }
            });
            return results;
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
            console.log("DEBUG: Clicked Atom:", atom);
            console.log("DEBUG: Atom Coords:", atom.x, atom.y, atom.z);

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
                // Try to get exact click position, or fall back to atom center
                let pos = null;
                if (pickingProxy.position) {
                    pos = { x: pickingProxy.position.x, y: pickingProxy.position.y, z: pickingProxy.position.z };
                } else if (atom) {
                    pos = { x: atom.x, y: atom.y, z: atom.z };
                }

                console.log("DEBUG: Final Position for Click:", pos);

                onAtomClick({
                    chain: atom.chainname,
                    resNo: atom.resno,
                    resName: atom.resname,
                    atomIndex: atom.index,
                    position: pos || undefined
                });
            }
        };

        stage.signals.clicked.add(handleClick);

        return () => {
            stage.signals.clicked.remove(handleClick);

        };
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
