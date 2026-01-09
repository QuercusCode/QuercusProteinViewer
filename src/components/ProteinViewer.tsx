import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import clsx from 'clsx';
import { Skeleton } from './Skeleton';
import type {
    ChainInfo,
    ColorPalette,
    RepresentationType,
    ColoringType,
    ResidueInfo,
    Measurement,
    StructureInfo,
    MeasurementTextColor,
    SelectedResidue
} from '../types';
import { type DataSource, getStructureUrl } from '../utils/pdbUtils';


declare global {
    interface Window {
        NGL: any;
    }
}


export interface MeasurementData {
    atom1: { chain: string, resNo: number, atomName: string, x: number, y: number, z: number, index?: number };
    atom2: { chain: string, resNo: number, atomName: string, x: number, y: number, z: number, index?: number };
    distance: number;
    shapeId: string;
}

export interface ProteinViewerProps {
    pdbId: string;
    dataSource?: DataSource; // Added source
    file?: File;
    fileType?: 'pdb' | 'mmcif';

    // Appearance
    isLightMode: boolean;
    isSpinning: boolean;
    representation: RepresentationType;
    showSurface: boolean;
    showLigands?: boolean;  // Optional, defaults to true
    showIons?: boolean;     // New prop
    coloring: ColoringType;
    palette: ColorPalette;
    backgroundColor: string;
    customColors?: any[]; // Simplified type for now
    selectedResidues?: SelectedResidue[]; // For byresidue coloring mode
    measurementTextColor?: MeasurementTextColor; // Added prop

    // Quality
    quality?: 'low' | 'medium' | 'high';
    enableAmbientOcclusion?: boolean;


    // Callbacks
    onStructureLoaded?: (info: StructureInfo) => void;
    onError?: (error: string) => void;
    loading?: boolean;
    setLoading?: (loading: boolean) => void;
    error?: string | null;
    setError?: (error: string | null) => void;

    onAtomClick?: (info: ResidueInfo | null) => void;
    onHover?: (info: ResidueInfo | null) => void;

    // Measurement
    isMeasurementMode?: boolean;
    measurements?: Measurement[];
    onAddMeasurement?: (m: Measurement) => void;

    // Actions
    resetCamera?: number; // Increment to trigger reset
    className?: string;
}

export interface ProteinViewerRef {
    getSnapshotBlob: (resolutionFactor?: number, transparent?: boolean) => Promise<Blob | null>;
    highlightResidue: (chain: string, resNo: number) => void;
    focusLigands: () => void;
    clearHighlight: () => void;
    getCameraOrientation: () => any;
    setCameraOrientation: (orientation: any) => void;
    getAtomCoordinates: () => Promise<{ x: number[], y: number[], z: number[], labels: string[], ss: string[] }[]>;
    getTorsionData: () => Promise<{ phi: number | null, psi: number | null, chain: string, resNo: number, resName: string }[]>;
    getAtomPosition: (chain: string, resNo: number, atomName?: string) => { x: number, y: number, z: number } | null;
    getAtomPositionByIndex: (atomIndex: number) => { x: number, y: number, z: number } | null;
    addResidue: (chainName: string, resType: string) => Promise<Blob | null>;
    recordTurntable: (duration?: number) => Promise<Blob>;
    resetCamera: () => void;
    clearMeasurements: () => void;
    getMeasurements: () => MeasurementData[];
    restoreMeasurements: (measurements: { atom1: any, atom2: any }[]) => void; // Legacy internal
    visualizeContact: (chainA: string, resA: number, chainB: string, resB: number) => void;
    captureImage: (resolutionFactor?: number, transparent?: boolean) => Promise<void>;
    highlightRegion: (selection: string, label?: string) => void;
    getLigandInteractions: () => Promise<import('../types').LigandInteraction[]>;
    focusResidue: (chain: string, resNo: number) => void;
    highlightAtom: (serial: number) => void;
}

export const ProteinViewer = forwardRef<ProteinViewerRef, ProteinViewerProps>(({
    pdbId,
    dataSource = 'pdb',
    file,
    representation = 'cartoon',
    coloring = 'chainid',
    customColors = [],
    selectedResidues = [], // For byresidue coloring
    palette: colorPalette = 'standard', // Rename to matches internal usage
    className,
    onStructureLoaded,
    loading: externalLoading,
    setLoading: setExternalLoading,
    error: externalError,
    setError: setExternalError,
    resetCamera,

    onAtomClick,
    backgroundColor = "black",
    showSurface = false,
    showLigands = false,
    showIons = false,
    isSpinning = false,
    isMeasurementMode = false,
    measurements,
    onAddMeasurement,
    onHover,
    isLightMode,
    quality = 'medium',
    enableAmbientOcclusion = false,
    measurementTextColor = 'auto',
}: ProteinViewerProps, ref: React.Ref<ProteinViewerRef>) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const componentRef = useRef<any>(null);
    const highlightComponentRef = useRef<any>(null);
    const isMounted = useRef(true);
    const onHoverRef = useRef(onHover);

    // Update ref when prop changes
    useEffect(() => {
        onHoverRef.current = onHover;
    }, [onHover]);

    const measurementsRef = useRef<MeasurementData[]>([]);
    const measurementRepsRef = useRef<any[]>([]); // Track NGL Representations for cleanup
    const contactLineRepRef = useRef<any>(null); // Track single contact line representation
    const regionHighlightRepRef = useRef<any>(null); // V6: Track region highlight
    const selectedAtomsRef = useRef<any[]>([]);

    // Helper to find atom
    const findAtom = (chain: string, resNo: number, atomName: string) => {
        if (!componentRef.current) return null;
        let found: any = null;
        // Selection string must be robust
        const selection = new window.NGL.Selection(`${resNo}:${chain} and .${atomName}`);
        if (componentRef.current && componentRef.current.structure) {
            componentRef.current.structure.eachAtom((atom: any) => {
                found = atom;
            }, selection);
        }
        return found;
    };

    const drawMeasurement = (m: MeasurementData) => {
        // Legacy internal measurement drawing - kept for compatibility if needed,
        // but we are moving to props-driven measurements.
        // Unused for now in new mode.
        console.log(m);
        const atom1 = findAtom(m.atom1.chain, m.atom1.resNo, m.atom1.atomName);
        const atom2 = findAtom(m.atom2.chain, m.atom2.resNo, m.atom2.atomName);

        if (atom1 && atom2 && stageRef.current) {
            // Use Native NGL Distance Representation (Most Robust)
            // This bypasses Shape primitive issues by using built-in measurement rendering
            // We need atom indices for this
            let idx1 = m.atom1.index;
            let idx2 = m.atom2.index;

            // Fallback for legacy data or if index is missing: careful lookups
            // Note: We avoid holding two proxies simultaneously to prevent reuse issues
            if (idx1 === undefined) {
                const a1 = findAtom(m.atom1.chain, m.atom1.resNo, m.atom1.atomName);
                if (a1) idx1 = a1.index;
            }
            if (idx2 === undefined) {
                const a2 = findAtom(m.atom2.chain, m.atom2.resNo, m.atom2.atomName);
                if (a2) idx2 = a2.index;
            }

            if (typeof idx1 === 'number' && typeof idx2 === 'number') {
                const params = {
                    labelUnit: 'angstrom',
                    labelSize: 2.0,
                    labelColor: 'white',
                    color: 'yellow',
                    atomPair: [[idx1, idx2]],
                    opacity: 1.0
                };

                try {
                    const distanceRep = componentRef.current.addRepresentation("distance", params);
                    if (distanceRep) {
                        measurementRepsRef.current.push(distanceRep);
                    }
                } catch (e) {
                    console.warn("Failed to add distance representation", e);
                }
            } else {
                console.warn("Could not find atom indices for distance rep", m);
            }
        }
    };




    const [internalLoading, setInternalLoading] = React.useState(false);
    const [internalError, setInternalError] = React.useState<string | null>(null);

    const loading = externalLoading !== undefined ? externalLoading : internalLoading;
    const setLoading = setExternalLoading || setInternalLoading;
    const error = externalError !== undefined ? externalError : internalError;
    const setError = setExternalError || setInternalError;

    const performVideoRecord = async (duration: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            if (!stageRef.current || !stageRef.current.viewer) {
                reject(new Error("Viewer not initialized"));
                return;
            }
            const stage = stageRef.current;
            const canvas = containerRef.current?.querySelector('canvas');
            if (!canvas) {
                reject(new Error("No canvas found"));
                return;
            }

            // 1. Setup Stream
            const stream = canvas.captureStream(30);

            // Robust MIME type detection
            const mimeTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm',
                'video/mp4'
            ];

            let selectedMimeType = '';
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    break;
                }
            }

            const options: MediaRecorderOptions = {
                mimeType: selectedMimeType || 'video/webm',
                videoBitsPerSecond: 8000000
            };

            try {
                const mediaRecorder = new MediaRecorder(stream, options);
                const chunks: Blob[] = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                // Store original state
                const originalSpin = stage.spinAnimation.paused;
                const oldSpeed = stage.getParameters().spinSpeed;
                const originalPixelRatio = stage.viewer.pixelRatio;

                mediaRecorder.onstop = () => {
                    // Restore state immediately
                    if (originalSpin) stage.setSpin(false);
                    stage.setParameters({ spinSpeed: oldSpeed, pixelRatio: originalPixelRatio });

                    const blob = new Blob(chunks, { type: selectedMimeType || 'video/webm' });
                    resolve(blob);
                };

                mediaRecorder.onerror = (e: any) => {
                    console.error("MediaRecorder Error:", e);
                    if (originalSpin) stage.setSpin(false);
                    stage.setParameters({ spinSpeed: oldSpeed, pixelRatio: originalPixelRatio });
                    reject(new Error(e.error?.message || "MediaRecorder error"));
                };

                // 2. Start Recording
                mediaRecorder.start();

                // 3. Perform Spin
                const startTime = performance.now();
                const defaultSpeed = 0.01;
                const targetSpeed = defaultSpeed * (4000 / duration);

                // Boost Quality
                stage.setParameters({ spinSpeed: targetSpeed, pixelRatio: 3 });
                stage.setSpin(true);

                const animate = () => {
                    const now = performance.now();
                    const elapsed = now - startTime;

                    if (elapsed >= duration) {
                        mediaRecorder.stop();
                        return;
                    }

                    stage.viewer.requestRender();
                    requestAnimationFrame(animate);
                };

                requestAnimationFrame(animate);

            } catch (e: any) {
                reject(e);
            }
        });
    };

    useImperativeHandle(ref, () => ({
        highlightRegion: (selection: string, _label?: string) => {
            if (!componentRef.current) return;
            const component = componentRef.current;

            // 1. Remove Previous Highlight
            if (regionHighlightRepRef.current) {
                try {
                    component.removeRepresentation(regionHighlightRepRef.current);
                    regionHighlightRepRef.current = null;
                } catch (e) { }
            }

            if (!selection) return;

            // 2. Add New Highlight (Ball & Stick)
            try {
                const rep = component.addRepresentation('ball+stick', {
                    sele: selection,
                    color: 'magenta',
                    radius: 0.3,
                    name: 'region-highlight'
                });
                regionHighlightRepRef.current = rep;

                // 3. Focus View
                component.autoView(selection, 1000);
            } catch (e) {
                console.warn("Failed to highlight region:", selection, e);
            }
        },
        focusResidue: (chain: string, resNo: number) => {
            if (!componentRef.current) return;
            const selection = `:${chain} and ${resNo}`;

            // 1. Remove previous click-highlight if any
            // We need a way to track the specific representation added by this click action.
            // Since we don't have a dedicated state for "click highlight rep" in the ref easily accessible here 
            // without refactoring the whole component state, we can use a "name" for the representation 
            // and remove it by name if NGL supports it, or just manage it if we add a ref for it.
            // For now, let's try to add a uniquely named representation or just use the highlight mechanism.

            // Actually, let's use a simpler approach: Add a new Ball+Stick representation for just this residue.
            // We should ideally track it to remove it later when another residue is clicked.
            // Let's assume we want "only one focused residue at a time".

            // Remove ANY existing 'user-focus' representations
            componentRef.current.stage.getRepresentationsByName('user-focus').dispose();

            // 2. Add new Ball+Stick representation
            componentRef.current.addRepresentation('ball+stick', {
                sele: selection,
                name: 'user-focus',
                colorVal: '#ff0000', // Highlight color? Or keep element colors?
                // Let's use element coloring but maybe specific scale or just default
                colorScheme: 'element',
                radiusScale: 2.0 // Make it pop
            });

            // 3. Zoom
            try {
                componentRef.current.autoView(selection, 1000);
            } catch (e) {
                console.warn("AutoView failed:", e);
            }
        },
        getSnapshotBlob: async (resolutionFactor: number = 3, transparent: boolean = true) => {
            if (!stageRef.current) return null;

            const fixPngBlob = async (blob: Blob): Promise<Blob> => {
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);
                    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
                    let isMissingSignature = false;
                    for (let i = 0; i < pngSignature.length; i++) {
                        if (uint8Array[i] !== pngSignature[i]) {
                            isMissingSignature = true;
                            break;
                        }
                    }
                    if (isMissingSignature) {
                        const newBuffer = new Uint8Array(pngSignature.length + uint8Array.length);
                        newBuffer.set(pngSignature, 0);
                        newBuffer.set(uint8Array, pngSignature.length);
                        return new Blob([newBuffer], { type: 'image/png' });
                    }
                    return blob;
                } catch (e) {
                    return blob;
                }
            };

            try {
                // High Quality Export
                const blob = await stageRef.current.makeImage({
                    factor: resolutionFactor,
                    type: 'png',
                    antialias: true,
                    trim: false,
                    transparent: transparent
                });
                return await fixPngBlob(blob);
            } catch (err) {
                console.warn("High-res export failed, trying low-res fallback...", err);
                try {
                    const blob = await stageRef.current.makeImage({
                        factor: 1,
                        type: 'png',
                        antialias: true,
                        trim: false,
                        transparent: transparent
                    });
                    return await fixPngBlob(blob);
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
        captureImage: async (resolutionFactor: number = 3, transparent: boolean = false) => {
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
                // High Quality Export with custom parameters
                stageRef.current.makeImage({
                    factor: resolutionFactor,
                    type: 'png',
                    antialias: true,
                    trim: false,
                    transparent: transparent
                }).then((blob: Blob) => {
                    downloadBlob(blob);
                }).catch((err: any) => {
                    console.warn("High-res export failed, trying fallback...", err);
                    // Fallback to standard resolution if custom fails
                    stageRef.current.makeImage({
                        factor: 1,
                        type: 'png',
                        antialias: true,
                        trim: false,
                        transparent: transparent
                    }).then((blob: Blob) => {
                        downloadBlob(blob, '-fallback');
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
        highlightAtom: (serial: number) => {
            if (!componentRef.current) return;
            const component = componentRef.current;
            try {
                if (highlightComponentRef.current) {
                    component.removeRepresentation(highlightComponentRef.current);
                    highlightComponentRef.current = null;
                }
                const selection = `@${serial}`;
                console.log(`Highlighting atom: ${selection}`);

                highlightComponentRef.current = component.addRepresentation('spacefill', {
                    sele: selection,
                    color: '#FFD700', // Gold
                    radius: 0.5
                });

                // component.autoView(selection, 1000);
                // Manual Zoom to avoid being too close (inside the atom)
                let atomCenter: any = null;
                component.structure.eachAtom((a: any) => {
                    atomCenter = new window.NGL.Vector3(a.x, a.y, a.z);
                }, new window.NGL.Selection(selection));

                if (atomCenter && stageRef.current) {
                    // Zoom distance -20 ensuring we see the atom clearly but not too close
                    stageRef.current.animationControls.zoomMove(atomCenter, -20, 1000);
                } else {
                    component.autoView(selection, 1000);
                }
            } catch (e) { console.warn("Highlight atom failed:", e); }
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
        resetCamera: () => {
            if (stageRef.current) stageRef.current.autoView();
        },

        getAtomCoordinates: async () => {
            if (!componentRef.current) return [];
            const component = componentRef.current;
            const data: { x: number[], y: number[], z: number[], labels: string[], ss: string[] }[] = [];

            // Iterate chains
            component.structure.eachChain((chain: any) => {
                const x: number[] = [];
                const y: number[] = [];
                const z: number[] = [];
                const labels: string[] = [];
                const ss: string[] = [];

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

                        // Capture Secondary Structure (h=helix, s=sheet, etc.)
                        ss.push(res.sstruc || "");
                    }
                });

                if (x.length > 0) {
                    data.push({ x, y, z, labels, ss });
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
        },
        recordTurntable: async (duration: number = 4000) => {
            return performVideoRecord(duration);
        },


        addResidue: async (chainName: string, resType: string) => {
            if (!componentRef.current) return null;
            const structure = componentRef.current.structure;
            const NGL = window.NGL;
            // 1. Find the Chain
            let targetChain: any = null;
            structure.eachChain((c: any) => {
                if (c.chainname === chainName) targetChain = c;
            });

            if (!targetChain) {
                console.warn(`Chain ${chainName} not found.`);
                return null;
            }

            // 2. Find Last Valid Residue (must have Backbone Atoms)
            let maxResNo = -Infinity;
            targetChain.eachResidue((r: any) => {
                // Check for CA and C atoms to ensure it's a valid extension point
                const ca = r.getAtomByName('CA');
                const c = r.getAtomByName('C');
                if (ca && c && r.resno > maxResNo) {
                    maxResNo = r.resno;
                }
            });

            if (maxResNo === -Infinity) {
                console.warn("No valid C-terminus found.");
                return null;
            }

            // 3. Get Reference Atoms SAFELY (Re-finding the residue)
            let vCA: any = null;
            let vC: any = null;

            targetChain.eachResidue((r: any) => {
                if (r.resno === maxResNo) {
                    const atomCA = r.getAtomByName('CA');
                    const atomC = r.getAtomByName('C');
                    if (atomCA && atomC) {
                        // Clone coordinates immediately to avoid Proxy issues
                        vCA = new NGL.Vector3(atomCA.x, atomCA.y, atomCA.z);
                        vC = new NGL.Vector3(atomC.x, atomC.y, atomC.z);
                    }
                }
            });

            if (!vCA || !vC) {
                console.warn("Could not retrieve backbone atoms for last residue.");
                return null;
            }

            // 4. Calculate New Position (Simple Extension)
            // Vector: CA -> C (Using vCA/vC from above)
            const dir = new NGL.Vector3().subVectors(vC, vCA).normalize();

            // Place New N approx 1.33A away
            const newN = new NGL.Vector3().copy(vC).add(dir.clone().multiplyScalar(1.33));
            // Place New CA approx 1.45A from N (slightly angled? simplified: straight line for MVP)
            const newCA = new NGL.Vector3().copy(newN).add(dir.clone().multiplyScalar(1.45));
            // Place New C approx 1.52A from CA
            const newC = new NGL.Vector3().copy(newCA).add(dir.clone().multiplyScalar(1.52));
            // Place New O
            const orth = new NGL.Vector3(0, 1, 0); // Arbitrary up
            const newO = new NGL.Vector3().copy(newC).add(orth.multiplyScalar(1.23));

            // 5. Generate PDB Records
            // We need to fetch the existing PDB string first
            let originalPdb = '';
            try {
                // NGL writer isn't exposed easily on structure object directly in all versions, 
                // but we can try getting the blob from the component?
                // Easier: Just assume we loaded a PDB and modify the 'file' content? 
                // No, we need the *current* structure state (rotated? no, coords are static).
                // Use built-in writer:
                const writer = new NGL.PdbWriter(structure);
                originalPdb = writer.getData();
            } catch (e) {
                console.error("Failed to write PDB:", e);
                return null;
            }


            const lines = originalPdb.split('\n');
            let lastSerial = 0;
            // Scan from bottom
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].startsWith("ATOM") || lines[i].startsWith("HETATM")) {
                    const serialStr = lines[i].substring(6, 11).trim();
                    lastSerial = parseInt(serialStr) || 0;
                    break;
                }
            }

            const formatAtom = (serial: number, name: string, resName: string, chain: string, resSeq: number, x: number, y: number, z: number) => {
                const sSerial = String(serial).padStart(5);
                const sName = name.padEnd(4); // "N   "
                const sResName = resName.padStart(3);
                const sChain = chain.substring(0, 1);
                const sResSeq = String(resSeq).padStart(4);
                const sX = x.toFixed(3).padStart(8);
                const sY = y.toFixed(3).padStart(8);
                const sZ = z.toFixed(3).padStart(8);
                const element = name.substring(0, 1);
                return `ATOM  ${sSerial} ${sName} ${sResName} ${sChain}${sResSeq}    ${sX}${sY}${sZ}  1.00 20.00           ${element}`;
            };

            const nextResNo = maxResNo + 1;
            const newLines = [];

            // Add N
            lastSerial++;
            newLines.push(formatAtom(lastSerial, " N  ", resType, chainName, nextResNo, newN.x, newN.y, newN.z));
            // Add CA
            lastSerial++;
            newLines.push(formatAtom(lastSerial, " CA ", resType, chainName, nextResNo, newCA.x, newCA.y, newCA.z));
            // Add C
            lastSerial++;
            newLines.push(formatAtom(lastSerial, " C  ", resType, chainName, nextResNo, newC.x, newC.y, newC.z));
            // Add O
            lastSerial++;
            newLines.push(formatAtom(lastSerial, " O  ", resType, chainName, nextResNo, newO.x, newO.y, newO.z));

            // Append to PDB (filtering out END if present)
            const cleanPdb = originalPdb.replace(/^END\s*$/m, '');
            const finalPdb = cleanPdb.trimEnd() + '\n' + newLines.join('\n') + '\nEND';

            return new Blob([finalPdb], { type: 'text/plain' });
        },

        visualizeContact: (chainA: string, resA: number, chainB: string, resB: number) => {
            if (!componentRef.current) return;
            const comp = componentRef.current;

            // 1. Clean up previous contact line
            if (contactLineRepRef.current) {
                try {
                    comp.removeRepresentation(contactLineRepRef.current);
                } catch (e) { }
                contactLineRepRef.current = null;
            }

            // 2. Find Atoms (Prefer CA, fallback to center or first atom)
            const getSafeAtomIndex = (c: string, r: number, preferredAtom: string | null = null) => {
                let idx: number | null = null;

                // If specific atom requested (e.g. CA or CB), try that first
                if (preferredAtom && comp.structure) {
                    const sel = new window.NGL.Selection(`${r}:${c} and .${preferredAtom}`);
                    comp.structure.eachAtom((atom: any) => {
                        // Capture index immediately!
                        idx = atom.index;
                    }, sel);
                }

                if (idx !== null) return idx;

                // Fallback: Try CA (Alpha Carbon/Backbone)
                if (comp.structure) {
                    const sel = new window.NGL.Selection(`${r}:${c} and .CA`);
                    comp.structure.eachAtom((atom: any) => {
                        idx = atom.index;
                    }, sel);
                }

                if (idx !== null) return idx;

                // Fallback: First atom of residue
                if (comp.structure) {
                    const sel = new window.NGL.Selection(`${r}:${c}`);
                    comp.structure.eachAtom((atom: any) => {
                        if (idx === null) idx = atom.index;
                    }, sel);
                }

                return idx;
            };

            // Use 'CA' (Alpha Carbon) to match the Contact Map data generation (getAtomCoordinates uses CA)
            // and the visual backbone (Cartoon/Ribbon).
            const idx1 = getSafeAtomIndex(chainA, resA, 'CA');
            const idx2 = getSafeAtomIndex(chainB, resB, 'CA');

            if (idx1 !== null && idx2 !== null) {
                try {
                    const params = {
                        labelVisible: false,
                        color: '#d946ef', // Magenta-500 (High visibility)
                        atomPair: [[idx1, idx2]],
                        opacity: 1.0,
                        linewidth: 5.0
                    };
                    const rep = comp.addRepresentation("distance", params);
                    contactLineRepRef.current = rep;
                } catch (e) {
                    console.warn("Failed to visual contact", e);
                }
            }
        },

        getLigandInteractions: async () => {
            if (!componentRef.current) return [];
            const component = componentRef.current;
            const interactions: import('../types').LigandInteraction[] = [];

            try {
                // 1. Identify Ligands via Residue Scan
                const ligandIndices = new Set<number>();
                const ligandMetadata = new Map<number, { resname: string, chainname: string, resno: number }>();

                // Sequential Numbering Logic
                const residueSeqMap = new Map<string, number>(); // Key: "Chain:ResNo" -> SeqIdx
                const chainCounters = new Map<string, number>();

                component.structure.eachResidue((r: any) => {
                    const name = r.resname.trim().toUpperCase();

                    // Track sequential index for proteins
                    if (r.isProtein()) {
                        const cName = r.chainname;
                        const currentCount = chainCounters.get(cName) || 0;
                        const newCount = currentCount + 1;
                        chainCounters.set(cName, newCount);
                        residueSeqMap.set(`${cName}:${r.resno}`, newCount);
                    }

                    // Log everything for first few residues to sanity check
                    if (r.index < 5 || name === 'HEM' || name === 'ZN') {
                        console.log(`[LigandDebug] Inspect: ${name} (idx: ${r.index}) IsProtein: ${r.isProtein()} IsWater: ${r.isWater()} IsNucleic: ${r.isNucleic()}`);
                    }

                    // Check standard flags
                    if (r.isWater()) return;
                    if (r.isProtein()) return;
                    if (r.isNucleic()) return;

                    if (['HOH', 'WAT', 'DOD', 'SOL', 'TIP3', 'TIP4'].includes(name)) return;

                    // It's a valid ligand/ion
                    ligandIndices.add(r.index);
                    ligandMetadata.set(r.index, { resname: name, chainname: r.chainname, resno: r.resno });
                    console.log(`[LigandDebug] ACCEPTED: ${name} (idx: ${r.index})`);
                });

                console.log(`[LigandDebug] Total identified ligand residues: ${ligandIndices.size}`);

                if (ligandIndices.size === 0) {
                    console.warn("[LigandDebug] No ligands passed filtering!");
                    return [];
                }

                // 2. Collect Atoms
                const ligandAtomsMap = new Map<number, { x: number, y: number, z: number }[]>();
                const proteinAtoms: { x: number, y: number, z: number, chain: string, resno: number, resname: string, seqIdx?: number }[] = [];

                let totalLigandAtoms = 0;
                let totalProteinAtoms = 0;

                component.structure.eachAtom((a: any) => {
                    if (ligandIndices.has(a.residueIndex)) {
                        // Ligand Atom
                        if (!ligandAtomsMap.has(a.residueIndex)) {
                            ligandAtomsMap.set(a.residueIndex, []);
                        }
                        ligandAtomsMap.get(a.residueIndex)?.push({ x: a.x, y: a.y, z: a.z });
                        totalLigandAtoms++;
                    } else if (a.residue.isProtein()) {
                        // Protein Atom
                        const seqIdx = residueSeqMap.get(`${a.chainname}:${a.resno}`);
                        proteinAtoms.push({
                            x: a.x, y: a.y, z: a.z,
                            chain: a.chainname, resno: a.resno, resname: a.resname,
                            seqIdx: seqIdx
                        });
                        totalProteinAtoms++;
                    }
                });



                // 3. Distance Calculation
                for (const [rIndex, lAtoms] of ligandAtomsMap.entries()) {
                    const meta = ligandMetadata.get(rIndex);
                    if (!meta) continue;



                    const contacts: any[] = [];
                    const seenResidues = new Set<string>();

                    for (const pAtom of proteinAtoms) {
                        const resKey = `${pAtom.chain}:${pAtom.resno}`;
                        if (seenResidues.has(resKey)) continue;

                        let isContact = false;
                        let minDist = 100.0;

                        for (const lAtom of lAtoms) {
                            const dist = Math.sqrt(
                                Math.pow(pAtom.x - lAtom.x, 2) +
                                Math.pow(pAtom.y - lAtom.y, 2) +
                                Math.pow(pAtom.z - lAtom.z, 2)
                            );
                            if (dist < minDist) minDist = dist;
                            if (dist <= 5.0) {
                                isContact = true;
                                break;
                            }
                        }

                        if (isContact) {
                            seenResidues.add(resKey);
                            contacts.push({
                                residueChain: pAtom.chain,
                                residueNumber: pAtom.resno,
                                residueSeq: pAtom.seqIdx, // Pass sequential index
                                residueName: pAtom.resname,
                                distance: parseFloat(minDist.toFixed(2))
                            });
                        }
                    }

                    if (contacts.length > 0) {

                        interactions.push({
                            ligandName: meta.resname,
                            ligandChain: meta.chainname,
                            ligandResNo: meta.resno,
                            contacts: contacts.sort((a, b) => a.distance - b.distance)
                        });
                    } else {

                    }
                }

            } catch (e) {
                console.error("Failed to calculate ligand interactions:", e);
            }


            return interactions;
        },

        clearMeasurements: () => {
            measurementsRef.current = [];
            selectedAtomsRef.current = [];

            // 1. Remove Representations (Distance Lines)
            if (componentRef.current) {
                const comp = componentRef.current;
                measurementRepsRef.current.forEach(rep => {
                    try {
                        comp.removeRepresentation(rep);
                        // Also try removing from the internal reprList if removeRepresentation doesn't fully work (NGL quirk)
                        // But mostly removeRepresentation is enough
                    } catch (e) {
                        console.warn("Failed to remove measurement representation", e);
                    }
                });
                measurementRepsRef.current = [];
            }

            // 2. Remove selection spheres (Shapes)
            if (stageRef.current) {
                stageRef.current.eachComponent((comp: any) => {
                    if (comp.name && (comp.name.startsWith("measure-") || comp.name.startsWith("sel-"))) {
                        stageRef.current.removeComponent(comp);
                    }
                });
            }
        },
        getMeasurements: () => measurementsRef.current,
        restoreMeasurements: (list: { atom1: any, atom2: any }[]) => {
            if (!componentRef.current || !list || list.length === 0) return;
            // Clear existing first
            measurementsRef.current = [];

            // Helper to find atom index
            const findAtom = (info: any) => {
                let found: any = null;
                if (!componentRef.current) return null;
                // Try precise match first
                const sel = new window.NGL.Selection(`${info.r}:${info.c} and .${info.a}`);
                componentRef.current.structure.eachAtom((atom: any) => {
                    found = atom;
                }, sel);
                return found;
            };

            list.forEach(m => {
                const a1 = findAtom({ c: m.atom1.chain, r: m.atom1.resNo, a: m.atom1.atomName });
                const a2 = findAtom({ c: m.atom2.chain, r: m.atom2.resNo, a: m.atom2.atomName });

                if (a1 && a2) {
                    const dx = a1.x - a2.x;
                    const dy = a1.y - a2.y;
                    const dz = a1.z - a2.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    const mData: MeasurementData = {
                        atom1: { chain: a1.chainname, resNo: a1.resno, atomName: a1.atomname, x: a1.x, y: a1.y, z: a1.z, index: a1.index },
                        atom2: { chain: a2.chainname, resNo: a2.resno, atomName: a2.atomname, x: a2.x, y: a2.y, z: a2.z, index: a2.index },
                        distance: dist,
                        shapeId: `measure-${Date.now()}-${Math.random()}`
                    };
                    measurementsRef.current.push(mData);
                    drawMeasurement(mData);
                }
            });
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
            const bgColor = backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : backgroundColor;
            stageRef.current.setParameters({ backgroundColor: bgColor });
        }
    }, [backgroundColor]);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        try {
            const bgColor = backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : backgroundColor;
            const stage = new window.NGL.Stage(containerRef.current, {
                backgroundColor: bgColor,
                tooltip: false, // Disable default NGL tooltip to use HUD
                webglParams: {
                    preserveDrawingBuffer: true,
                    alpha: true // Enable transparency support
                }
            });
            stageRef.current = stage;

            // --- MOUSE CONTROLS ---
            stage.mouseControls.add("drag-left", window.NGL.MouseActions.rotateDrag);
            stage.mouseControls.add("scroll", window.NGL.MouseActions.zoomScroll);
            stage.mouseControls.add("drag-right", window.NGL.MouseActions.panDrag);

            // --- HOVER HANDLING (HUD) ---
            let hoveredAtomIndex = -1;
            stage.signals.hovered.add((pickingProxy: any) => {
                if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
                    const atom = pickingProxy.atom || (pickingProxy.bond ? pickingProxy.bond.atom1 : null);

                    if (atom && atom.index !== hoveredAtomIndex) {
                        hoveredAtomIndex = atom.index;
                        if (onHoverRef.current) {
                            let displayResName = atom.resname;
                            // Use Structure Title/Filename for generic HET residues (chemicals)
                            if (['HET', 'UNL', 'LIG', 'UNK'].includes(displayResName) && atom.structure && atom.structure.name) {
                                const cleanName = atom.structure.name.split('.')[0];
                                if (cleanName) displayResName = cleanName;
                            }

                            onHoverRef.current({
                                chain: atom.chainname,
                                resNo: atom.resno,
                                resName: displayResName,
                                atomIndex: atom.index,
                                atomName: atom.atomname,
                                atomSerial: atom.serial,
                                element: atom.element
                            });
                        }
                    }
                } else {
                    if (hoveredAtomIndex !== -1) {
                        hoveredAtomIndex = -1;
                        if (onHoverRef.current) onHoverRef.current(null);
                    }
                }
            });

            // Handle Container Resize (Robust)
            const resizeObserver = new ResizeObserver(() => {
                stage.handleResize();
            });
            if (containerRef.current) {
                resizeObserver.observe(containerRef.current);
            }

            return () => {
                resizeObserver.disconnect();
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
                // Generic Loader Function
                const loadStructure = async () => {
                    if (currentFile) {
                        console.log("Loading from file:", currentFile.name);
                        // Detect extension
                        const rawExt = currentFile.name.split('.').pop()?.toLowerCase() || 'pdb';
                        let ext = rawExt;

                        // Normalize extensions
                        if (ext === 'ent') {
                            ext = 'pdb';
                        }

                        // We read as ArrayBuffer to handle all file types correctly (PDB/CIF/BinaryCIF)
                        const fileContent = await new Promise<ArrayBuffer>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
                            reader.onerror = (e) => reject(e);
                            reader.readAsArrayBuffer(currentFile);
                        });

                        const blob = new Blob([fileContent], { type: 'application/octet-stream' });
                        const objectUrl = URL.createObjectURL(blob);

                        console.log(`Loading via Object URL: ${objectUrl} as ${ext}`);

                        const safeName = `structure.${ext}`;
                        try {
                            return await stage.loadFile(objectUrl, {
                                defaultRepresentation: false,
                                ext,
                                name: safeName
                            });
                        } finally {
                            // URL.revokeObjectURL(objectUrl);
                        }
                    }


                    if (currentPdbId) {
                        const cleanId = String(currentPdbId).trim().toLowerCase();
                        if (cleanId.length < 3) return null;

                        let url = getStructureUrl(cleanId, dataSource);
                        let loadParams: any = { defaultRepresentation: false };

                        // Add extension hint for NGL if needed
                        if (dataSource === 'pubchem') loadParams.ext = 'sdf';

                        const AVAILABLE_LOCAL_PDBS = ['2b3p', '4hhb'];
                        if (dataSource === 'pdb' && AVAILABLE_LOCAL_PDBS.includes(cleanId)) {
                            url = `./${cleanId}.pdb`;
                        }

                        console.log(`Fetching from: ${url}`);
                        return await stage.loadFile(url, loadParams);
                    }
                    return null;
                };

                const component = await loadStructure();
                if (!component) {
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

                            console.log("Structure details:", {
                                atomCount: component.structure.atomCount,
                                modelCount: component.structure.modelStore.count,
                                chainCount: component.structure.chainStore.count
                            });

                            if (component.structure.atomCount === 0) {
                                console.warn("Loaded structure has 0 atoms.");
                                if (currentFile) {
                                    // Check if it might be a Structure Factors file
                                    const fileContent = await currentFile.text(); // Re-read text safe here since it already loaded
                                    if (!fileContent.includes('_atom_site')) {
                                        const isSF = currentFile.name.includes('-sf') || fileContent.includes('_refln');
                                        const msg = isSF
                                            ? "This appears to be a Structure Factors file (diffraction data), not a coordinate model. Please upload the model file (usually .pdb or .cif without '-sf')."
                                            : "The file was parsed but contains no atoms. Please check the file format.";

                                        if (isMounted.current) setError(msg);
                                        return;
                                    }
                                }
                            }

                            component.structure.eachChain((c: any) => {
                                if (seenChains.has(c.chainname)) return;
                                seenChains.add(c.chainname);

                                let seq = "";
                                let minSeq = Infinity;
                                let maxSeq = -Infinity;
                                let nucleicCount = 0;
                                let proteinCount = 0;

                                const resMap: number[] = [];
                                const bFactors: number[] = [];

                                try {
                                    c.eachResidue((r: any) => {
                                        let resNo = r.resno;
                                        if (resNo === undefined && typeof r.getResno === 'function') {
                                            resNo = r.getResno();
                                        }

                                        if (typeof resNo === 'number') {
                                            if (resNo < minSeq) minSeq = resNo;
                                            if (resNo > maxSeq) maxSeq = resNo;
                                            resMap.push(resNo); // Valid residue number
                                        } else {
                                            // Fallback for weird cases
                                            resMap.push((maxSeq > -Infinity ? maxSeq : 0) + 1);
                                        }

                                        // B-Factor Extraction (Average of atoms in residue)
                                        let bSum = 0;
                                        let bCount = 0;
                                        r.eachAtom((a: any) => {
                                            bSum += a.bfactor;
                                            bCount++;
                                        });
                                        const avgB = bCount > 0 ? bSum / bCount : 0;
                                        bFactors.push(avgB);

                                        // Determine Type
                                        if (r.isNucleic()) nucleicCount++;
                                        else if (r.isProtein()) proteinCount++;

                                        // Parse Residue Name
                                        let resName = 'X';
                                        if (r.isNucleic()) {
                                            const rawName = r.resname.trim().toUpperCase();
                                            // DNA: DA, DT, DC, DG
                                            // RNA: A, U, C, G
                                            if (rawName.length === 1) resName = rawName;
                                            else if (rawName.length === 2 && rawName.startsWith('D')) resName = rawName[1];
                                            else if (rawName.length === 2 && rawName.endsWith('A')) resName = 'A'; // Weird cases
                                            else resName = rawName.substring(0, 1); // Best guess
                                        } else {
                                            // Protein
                                            if (r.getResname1) resName = r.getResname1();
                                            else if (r.resname) resName = r.resname[0];
                                        }
                                        seq += resName;
                                    });
                                } catch (eRes) {
                                    console.warn(`Residue iteration failed for chain ${c.chainname}`, eRes);
                                }

                                if (minSeq === Infinity) minSeq = 0;
                                if (maxSeq === -Infinity) maxSeq = 0;

                                // Infer Chain Type
                                let chainType: 'protein' | 'nucleic' | 'unknown' = 'unknown';
                                if (nucleicCount > proteinCount) chainType = 'nucleic';
                                else if (proteinCount > 0) chainType = 'protein';

                                // Extract Atoms for Small Molecules
                                let atomList: any[] = [];
                                if (chainType === 'unknown' && seq.length < 50) { // Limit to reasonable size
                                    try {
                                        c.eachResidue((r: any) => {
                                            r.eachAtom((a: any) => {
                                                atomList.push({
                                                    serial: a.serial,
                                                    name: a.atomname,
                                                    element: a.element,
                                                    resNo: r.resno,
                                                    chain: c.chainname
                                                });
                                            });
                                        });
                                    } catch (eAtom) { console.warn("Atom iteration failed", eAtom); }
                                }

                                console.log(`Chain ${c.chainname}: Range ${minSeq}-${maxSeq}, SeqLen: ${seq.length}, Type: ${chainType}, Atoms: ${atomList.length}`);
                                chains.push({
                                    name: c.chainname,
                                    min: minSeq,
                                    max: maxSeq,
                                    sequence: seq,
                                    residueMap: resMap,
                                    type: chainType,
                                    atoms: atomList.length > 0 ? atomList : undefined,
                                    bFactors: bFactors // Added
                                });
                            });

                            // Extract Ligands
                            const ligandSet = new Set<string>();
                            component.structure.eachResidue((r: any) => {
                                // Basic filter for ligands: isHetero and not Water/Ion (generic check)
                                // NGL might mark waters as hetero. Typical water names: HOH, WAT, TIP
                                const invalidLigands = ['HOH', 'WAT', 'TIP', 'SOL', 'DOD'];
                                if (r.isHetero() && !invalidLigands.includes(r.resname)) {
                                    ligandSet.add(r.resname);
                                }
                            });
                            const ligands = Array.from(ligandSet).sort();

                            if (onStructureLoaded) {
                                onStructureLoaded({ chains, ligands });
                            }
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
    }, [pdbId, dataSource, file]);



    // --- MEASUREMENT RENDERING ---
    useEffect(() => {
        if (!stageRef.current) return;
        const stage = stageRef.current;

        // Clean up old measurement shapes
        stage.getComponentsByName("measurement-shape").list.forEach((c: any) => stage.removeComponent(c));

        measurements?.forEach((m: Measurement) => {
            const shape = new window.NGL.Shape("measurement-shape");
            const p1 = [m.atom1.position?.x || 0, m.atom1.position?.y || 0, m.atom1.position?.z || 0];
            const p2 = [m.atom2.position?.x || 0, m.atom2.position?.y || 0, m.atom2.position?.z || 0];

            // Draw Line
            // NGL colors are [r, g, b] 0-1. We need to convert hex string.
            // For simplicity, let's use a standard color or parse the hex.
            // Using a simple hash for now or default to orange [1, 0.5, 0]
            // Ideally we parse m.color

            // Convert simple hex (e.g. #ff0000) to RGB array
            const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [
                    parseInt(result[1], 16) / 255,
                    parseInt(result[2], 16) / 255,
                    parseInt(result[3], 16) / 255
                ] : [1, 1, 1];
            };
            const colorArr = hexToRgb(m.color);

            // Determine text color
            let labelColor = [0, 0, 0];
            const getBrightness = (color: string) => {
                let r, g, b;
                if (color.startsWith('#')) {
                    const hex = color.substring(1);
                    r = parseInt(hex.substring(0, 2), 16);
                    g = parseInt(hex.substring(2, 4), 16);
                    b = parseInt(hex.substring(4, 6), 16);
                } else if (color === 'white') {
                    return 255;
                } else if (color === 'black') {
                    return 0;
                } else {
                    return isLightMode ? 255 : 0;
                }
                return (r * 299 + g * 587 + b * 114) / 1000;
            };

            if (measurementTextColor !== 'auto' && measurementTextColor.startsWith('#')) {
                // Custom Hex Color
                const hex = measurementTextColor.substring(1);
                labelColor = [
                    parseInt(hex.substring(0, 2), 16) / 255,
                    parseInt(hex.substring(2, 4), 16) / 255,
                    parseInt(hex.substring(4, 6), 16) / 255
                ];
            } else if (measurementTextColor === 'black') {
                labelColor = [0, 0, 0];
            } else if (measurementTextColor === 'white') {
                labelColor = [1.0, 0.8, 0.0]; // Keeping 'Gold' for legacy 'white'
            } else {
                // Auto mode
                const bgBrightness = getBrightness(backgroundColor || (isLightMode ? 'white' : 'black'));
                labelColor = bgBrightness > 128 ? [0, 0, 0] : [1.0, 0.8, 0.0];
            }

            shape.addCylinder(p1, p2, colorArr, 0.1);
            shape.addSphere(p1, colorArr, 0.2);
            shape.addSphere(p2, colorArr, 0.2);
            shape.addText(
                [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2],
                labelColor,
                2.5, // Increased size from 0.8
                m.distance.toFixed(2) + " A" // Use 'A' instead of symbol for compatibility
            );

            const comp = stage.addComponentFromObject(shape);
            comp.addRepresentation("buffer", { depthTest: false });
        });

    }, [measurements, isLightMode, backgroundColor, measurementTextColor]);


    useEffect(() => {
        if (!stageRef.current) return;
        const stage = stageRef.current;

        const handleClick = (pickingProxy: any) => {
            if (!pickingProxy || !pickingProxy.atom) {
                if (onAtomClick) onAtomClick(null);
                selectedAtomsRef.current = []; // Reset selection on background click
                // Clear temp selection shapes?
                stage.getComponentsByName("temp-selection").list.forEach((c: any) => stage.removeComponent(c));
                return;
            }
            const atom = pickingProxy.atom;

            // MEASUREMENT MODE LOGIC
            if (isMeasurementMode) {
                const atomData = {
                    chain: atom.chainname,
                    resNo: atom.resno,
                    resName: atom.resname,
                    atomIndex: atom.index,
                    atomName: atom.atomname,
                    position: { x: atom.x, y: atom.y, z: atom.z }
                };

                selectedAtomsRef.current.push(atomData);

                // Highlight choice
                const shape = new window.NGL.Shape("temp-selection");
                shape.addSphere([atom.x, atom.y, atom.z], [1, 0.84, 0], 0.3); // Gold
                const comp = stage.addComponentFromObject(shape);
                comp.addRepresentation("buffer", { depthTest: false });

                // Check for pair
                if (selectedAtomsRef.current.length === 2) {
                    const a1 = selectedAtomsRef.current[0];
                    const a2 = selectedAtomsRef.current[1];

                    // Calculate distance
                    const dx = a1.position.x - a2.position.x;
                    const dy = a1.position.y - a2.position.y;
                    const dz = a1.position.z - a2.position.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    // Generate measurement name
                    let measurementName: string;
                    const isChemical = a1.resName === 'HET' && a2.resName === 'HET';

                    if (isChemical && a1.atomName && a2.atomName) {
                        // For chemicals, show only atom names
                        measurementName = `${a1.atomName}-${a2.atomName}`;
                    } else {
                        // For proteins or mixed, show full residue info
                        measurementName = `${a1.resName} ${a1.resNo}${a1.atomName ? ` (${a1.atomName})` : ''}-${a2.resName} ${a2.resNo}${a2.atomName ? ` (${a2.atomName})` : ''}`;
                    }

                    const newMeasurement: Measurement = {
                        id: crypto.randomUUID(),
                        name: measurementName,
                        distance: dist,
                        color: '#3b82f6', // Default blue
                        atom1: a1,
                        atom2: a2
                    };

                    if (onAddMeasurement) onAddMeasurement(newMeasurement);

                    // Reset selection
                    selectedAtomsRef.current = [];
                    stage.getComponentsByName("temp-selection").list.forEach((c: any) => stage.removeComponent(c));
                }
                return;
            }

            console.log("DEBUG: Clicked Atom:", atom);



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
    }, [onAtomClick, isMeasurementMode]);


    const updateRepresentation = (specificComponent?: any) => {
        if (!isMounted.current) return;
        const component = specificComponent || componentRef.current;
        if (!component || !component.structure) return;

        const NGL = window.NGL;

        try {
            component.removeAllRepresentations();
            highlightComponentRef.current = null;




            let repType = representation || 'cartoon';
            let currentColoring = coloring || 'chainid'; // SAFETY DEFAULT

            // Handle special 1crn case
            if (currentColoring === 'chainid' && pdbId && pdbId.toLowerCase().includes('1crn')) {
                currentColoring = 'residue';
                repType = 'licorice';
            }

            if (coloring === 'structure' || (coloring as string) === 'sstruc' || (coloring as string) === 'secondary-structure') {
                currentColoring = 'sstruc' as ColoringType;
            }

            // Check for VALID custom rules only
            const hasValidCustomRules = customColors && customColors.length > 0 && customColors.some(r => r.target && r.color);

            console.log("Coloring Debug:", { currentColoring, repType, hasValidCustomRules, rules: customColors });

            // --- STRATEGY: MULTI-REPRESENTATION OVERLAY (RESTORED & IMPROVED) ---
            // NGL Custom Schemes proved fragile for this user.
            // We implementation "High Contrast Chain Coloring" by EXPLICITLY adding a representation for each chain.
            // This relies only on basic NGL primitives (addRepresentation with selection), which is 100% robust.

            if (currentColoring === 'chainid') {
                // FALLBACK: If we have a chemical (single/no chain info) or source is pubchem, 'chainid' is meaningless.
                // Force Element coloring to ensure visibility (e.g. Licorice needs atoms!).
                const chainCount = component.structure.chainStore.count;
                // If effective chain count is 0 or 1, or weird names, fallback to element.
                // Or if user selected "chainid" but it's a chemical (implied by context or single chain).

                let forceElement = false;
                if (chainCount <= 1 || dataSource === 'pubchem') {
                    forceElement = true;
                }

                if (forceElement) {
                    component.addRepresentation(repType, {
                        color: 'element',
                        sele: '*', // Select ALL
                        name: 'base_chemical'
                    });
                } else {
                    const highContrastColors = [
                        0xFF0000, // Red
                        0x0000FF, // Blue
                        0x00CC00, // Green 
                        0xFFD700, // Gold
                        0xFF00FF, // Magenta
                        0x00FFFF, // Cyan
                        0xFF8C00, // Orange
                        0x8A2BE2, // Purple
                        0xA52A2A, // Brown
                        0x7FFF00, // Chartreuse
                    ];

                    let chainIdx = 0;
                    component.structure.eachChain((chain: any) => {
                        const color = highContrastColors[chainIdx % highContrastColors.length];
                        // Robust selector for empty chain names (common in MDF/SDF)
                        const sele = chain.chainname ? `:${chain.chainname}` : '*';
                        // If separate chains have empty names, they are indistinguishable by name selector.

                        component.addRepresentation(repType, {
                            color: color,
                            sele: sele,
                            name: `chain_base_${chain.chainname || 'unk'}`
                        });
                        chainIdx++;
                    });
                }
            } else if (currentColoring === 'charge') {
                // CHARGE COLORING: Multi-representation approach
                component.addRepresentation(repType, {
                    color: 0x0000FF,
                    sele: 'ARG or LYS or HIS',
                    name: 'charge_positive'
                });
                component.addRepresentation(repType, {
                    color: 0xFF0000,
                    sele: 'ASP or GLU',
                    name: 'charge_negative'
                });
                component.addRepresentation(repType, {
                    color: 0xFFFFFF,
                    sele: 'not (ARG or LYS or HIS or ASP or GLU)',
                    name: 'charge_neutral'
                });
            } else if (currentColoring === 'byresidue') {
                // BY-RESIDUE COLORING: Custom colors for specific residues
                // First, add default gray for all residues
                component.addRepresentation(repType, {
                    color: 0x999999,
                    name: 'byresidue_default'
                });


                // Then add colored representations for each selected residue
                if (selectedResidues && selectedResidues.length > 0) {
                    selectedResidues.forEach((residue) => {
                        // NGL selection syntax: :chain and residue_number
                        const selection = `:${residue.chain} and ${residue.resNo}`;
                        try {
                            component.addRepresentation(repType, {
                                color: residue.color,
                                sele: selection,
                                name: `byresidue_${residue.chain}_${residue.resNo}`
                            });
                        } catch (e) {
                            console.warn(`Failed to color residue ${selection}:`, e);
                        }
                    });
                }
            } else {
                // Standard Coloring for other modes (sstruc, element, etc.) -> Robust Native NGL
                // REVERTED to use 'color' property as previously working.

                // Safety: Ensure structure is calculated if mode is sstruc
                if ((currentColoring as string) === 'sstruc') {
                    try {
                        component.structure.eachModel((m: any) => {
                            if (m.calculateSecondaryStructure) m.calculateSecondaryStructure();
                        });
                    } catch (e) { }
                }

                // Custom Color Scales for NGL
                const PALETTES: Record<string, string[]> = {
                    'viridis': ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
                    'magma': ['#000004', '#51127c', '#b73779', '#fc8961', '#fcfdbf'],
                    'cividis': ['#00204d', '#002051', '#7c7b78', '#fdea45', '#fdea45'], // NGL interpolates 
                    'plasma': ['#0d0887', '#7e03a8', '#cc4778', '#f89540', '#f0f921'],
                    'standard': [] // NGL default (Blue-Red usually)
                };

                // Helper to get scale
                const getColorScale = (p: string) => {
                    return PALETTES[p] || undefined;
                };

                // Unified cartoon with optimized parameters for arrows and helices
                if (repType === 'cartoon') {
                    // Force recalculation of secondary structure
                    try {
                        component.structure.eachModel((m: any) => {
                            if (m.calculateSecondaryStructure) m.calculateSecondaryStructure();
                        });
                    } catch (e) { }

                    const params: any = {
                        color: currentColoring,
                        aspectRatio: 5,          // Flat arrows for sheets
                        subdiv: 12,              // Smooth curves
                        radialSegments: 20,      // Smooth helix cylinders
                    };

                    const scale = getColorScale(colorPalette);
                    if (scale && scale.length > 0) {
                        params.colorScale = scale;
                    }
                    component.addRepresentation('cartoon', params);
                } else {
                    // Non-cartoon representations
                    const params: any = {
                        color: currentColoring
                    };
                    const scale = getColorScale(colorPalette);
                    if (scale && scale.length > 0) {
                        params.colorScale = scale;
                    }
                    component.addRepresentation(repType, params);
                }
            }

            // 2. Add Custom Representations (Overlay)
            if (hasValidCustomRules) {
                console.log("Applying Custom Rules as Overlays:", customColors.length);
                customColors.forEach((rule, idx) => {
                    if (rule.color && rule.target) {
                        try {
                            // Add a separate representation for this rule
                            component.addRepresentation(repType, {
                                color: new NGL.Color(rule.color).getHex(),
                                sele: rule.target,
                                name: `custom_rule_${idx}`
                            });
                        } catch (e) {
                            console.warn("Failed to apply custom rule:", rule, e);
                        }
                    }
                });
            }

            // --- OVERLAYS ---
            const tryApply = (r: string, c: string, sele: string, params: any = {}) => {
                try { component.addRepresentation(r, { color: c, sele: sele, ...params }); } catch (e) { }
            };

            // Fix for "Licorice looks like Ball+Stick":
            // If we are visualizing a chemical/small molecule (chainCount <= 1) AND using an atomic representation (licorice/spacefill),
            // the Base Representation (which selects '*') already draws the ligands.
            // We should NOT apply the "Ball+Stick" overlay on top, as it hides the style of the base rep.
            const atomicReps = ['licorice', 'ball+stick', 'spacefill', 'line', 'point', 'hyperball'];
            const isBaseRepAtomic = atomicReps.includes(repType);
            const chainCount = component.structure ? component.structure.chainStore.count : 0;
            const isSmallMoleculeOrSingleChain = chainCount <= 1 || dataSource === 'pubchem';

            const skipLigandOverlay = isBaseRepAtomic && isSmallMoleculeOrSingleChain;

            if (showSurface) tryApply('surface', 'white', "*", { opacity: 0.4, depthWrite: false, side: 'front' });
            if (showLigands && !skipLigandOverlay) tryApply('ball+stick', 'element', 'ligand and not (water or ion)', { scale: 2.0 });
            if (showIons) tryApply('ball+stick', 'element', 'ion', { scale: 2.0 });



            if (stageRef.current?.viewer) {
                stageRef.current.viewer.requestRender();
            }

        } catch (e) {
            console.error("Critical error in updateRepresentation:", e);
        }
    };

    // --- VISUAL ECSTASY: Stage Parameters Update ---
    useEffect(() => {
        if (!stageRef.current) return;
        const stage = stageRef.current;

        // NGL Stage Parameters for High Quality / Ambient Occlusion
        const params: any = {
            backgroundColor: backgroundColor,
            quality: quality, // 'medium' or 'high'
            lightIntensity: 1.0, // Standard key light
        };

        if (enableAmbientOcclusion) {
            params.sampleLevel = 2; // -1/0 = off, 1 = low, 2 = medium, 4 = high
            params.ambientColor = 0x202020; // Soft grey shadow rather than pitch black
            params.ambientIntensity = 1.0;
        } else {
            params.sampleLevel = 0;
            params.ambientIntensity = 0.0;
        }

        try {
            stage.setParameters(params);
        } catch (e) { console.warn("Failed to set stage params", e); }

    }, [backgroundColor, quality, enableAmbientOcclusion]);

    useEffect(() => {
        updateRepresentation();
    }, [representation, coloring, customColors, showSurface, showLigands, showIons, colorPalette, selectedResidues]);

    useEffect(() => {
        if (stageRef.current) {
            stageRef.current.setSpin(isSpinning);
        }
    }, [isSpinning]);

    useEffect(() => {
        if (stageRef.current && resetCamera) {
            try { stageRef.current.autoView(); } catch (e) { }
        }
    }, [resetCamera]);

    return (
        <div className={clsx("relative w-full h-full", className)} style={backgroundColor === 'transparent' ? { background: 'transparent' } : {}}>
            <div ref={containerRef} className="w-full h-full" style={backgroundColor === 'transparent' ? { background: 'transparent' } : {}} />
            {loading && (
                <div className="absolute inset-0 bg-neutral-900 z-50 flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24 mb-6">
                        <Skeleton variant="circular" className="absolute inset-0 border-4 border-neutral-800 bg-transparent animate-[spin_3s_linear_infinite]" />
                        <Skeleton variant="circular" className="absolute inset-4 border-4 border-neutral-700 bg-transparent animate-[spin_2s_linear_infinite_reverse]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Skeleton variant="circular" className="w-4 h-4 bg-blue-500/50" />
                        </div>
                    </div>
                    <div className="space-y-2 text-center">
                        <Skeleton variant="text" className="w-32 h-4 mx-auto bg-neutral-800" />
                        <Skeleton variant="text" className="w-24 h-3 mx-auto bg-neutral-800/50" />
                    </div>
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
