import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import type { CustomColorRule, ChainInfo, ColorPalette } from '../types';
import { getPaletteColor } from '../utils/colorUtils';

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

interface ProteinViewerProps {
    pdbId?: string;
    file?: File;
    fileType?: string; // e.g. 'pdb' or 'mmcif'
    representation?: string;
    coloring?: string;
    customColors?: CustomColorRule[];
    colorPalette?: ColorPalette;

    className?: string;
    onStructureLoaded?: (info: { chains: ChainInfo[], ligands: string[] }) => void;
    onError?: (error: string) => void;
    loading?: boolean;
    setLoading?: (loading: boolean) => void;
    error?: string | null;
    setError?: (error: string | null) => void;
    resetCamera?: number;

    onAtomClick: (info: { chain: string; resNo: number; resName: string; atomIndex: number; position?: { x: number, y: number, z: number } } | null) => void;
    backgroundColor?: string;
    showSurface?: boolean;
    showLigands?: boolean;
    isSpinning?: boolean;
    isMeasurementMode?: boolean;
}

export interface ProteinViewerRef {
    getSnapshotBlob: () => Promise<Blob | null>;
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
    restoreMeasurements: (measurements: { atom1: any, atom2: any }[]) => void;
    visualizeContact: (chainA: string, resA: number, chainB: string, resB: number) => void;
    captureImage: () => Promise<void>;
    highlightRegion: (selection: string, label?: string) => void;
}

export const ProteinViewer = forwardRef<ProteinViewerRef, ProteinViewerProps>(({
    pdbId,
    file,
    representation = 'cartoon',
    coloring = 'chainid',
    customColors = [],
    colorPalette = 'standard',
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
    isSpinning = false,
    isMeasurementMode = false
}: ProteinViewerProps, ref: React.Ref<ProteinViewerRef>) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const componentRef = useRef<any>(null);
    const highlightComponentRef = useRef<any>(null);
    const isMounted = useRef(true);

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
                webglParams: { preserveDrawingBuffer: true }
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

                        const AVAILABLE_LOCAL_PDBS = ['2b3p', '4hhb'];
                        let url = `https://files.rcsb.org/download/${cleanId}.pdb`;
                        if (AVAILABLE_LOCAL_PDBS.includes(cleanId)) {
                            url = `./${cleanId}.pdb`;
                        }
                        console.log(`Fetching from: ${url}`);
                        return await stage.loadFile(url, { defaultRepresentation: false });
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

                            onStructureLoaded({ chains, ligands });
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



    useEffect(() => {
        if (!stageRef.current) return;
        const stage = stageRef.current;

        const handleClick = (pickingProxy: any) => {
            if (!pickingProxy || !pickingProxy.atom) {
                // Only clear highlight if we are NOT in measurement mode and clicked background
                if (onAtomClick) onAtomClick(null);
                return;
            }
            const atom = pickingProxy.atom;

            // MEASUREMENT MODE LOGIC
            if (isMeasurementMode) {
                console.log("Measurement Mode Click:", atom);

                // IMPORTANT: NGL reuses the same AtomProxy object for performance during iteration.
                // We MUST clone the data immediately, otherwise both references in our array will 
                // point to the same updated object (the last clicked atom), resulting in distance 0.
                const atomData = {
                    chainname: atom.chainname,
                    resno: atom.resno,
                    atomname: atom.atomname,
                    x: atom.x,
                    y: atom.y,
                    z: atom.z,
                    index: atom.index // Store index directly!
                };

                selectedAtomsRef.current.push(atomData);

                // Highlight the selected atom temporarily?
                // Maybe draw a small sphere?
                const shapeId = `sel-${Date.now()}`;
                const shape = new window.NGL.Shape(shapeId);
                shape.addSphere([atom.x, atom.y, atom.z], [1, 0.5, 0], 0.3); // Orange selection
                const comp = stage.addComponentFromObject(shape);
                comp.addRepresentation("buffer", { depthTest: false });
                // Track this temp shape to remove later? 
                // For now just leave it until measurement is done or cleared.

                if (selectedAtomsRef.current.length === 2) {
                    const a1 = selectedAtomsRef.current[0];
                    const a2 = selectedAtomsRef.current[1];
                    const dx = a1.x - a2.x;
                    const dy = a1.y - a2.y;
                    const dz = a1.z - a2.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    const mData: MeasurementData = {
                        atom1: { chain: a1.chainname, resNo: a1.resno, atomName: a1.atomname, x: a1.x, y: a1.y, z: a1.z, index: a1.index },
                        atom2: { chain: a2.chainname, resNo: a2.resno, atomName: a2.atomname, x: a2.x, y: a2.y, z: a2.z, index: a2.index },
                        distance: dist,
                        shapeId: `measure-${Date.now()}`
                    };

                    measurementsRef.current.push(mData);
                    drawMeasurement(mData);

                    // Clear selection
                    selectedAtomsRef.current = [];
                    // Optionally clear the temp spheres? 
                    // Currently clearMeasurements clears ALL measurement- components. 
                    // We should name our shapes consistently.
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
            let currentColoring = coloring;

            // Handle special 1crn case
            if (coloring === 'chainid' && pdbId && pdbId.toLowerCase().includes('1crn')) {
                // Legacy: Since we removed element, fallback to chainid or residue
                currentColoring = 'residue';
                repType = 'licorice';
            }

            if (currentColoring === 'structure') currentColoring = 'sstruc';

            // --- STRATEGY: UNIFIED CUSTOM SCHEME ---
            // To prevent gaps in the 3D mesh, we must use a SINGLE representation.
            // We create a custom NGL Color Scheme that handles BOTH custom overrides and result fallback.

            // 1. Pre-calculate Atom Map for Custom Colors (Performance optimization)
            const atomColorMap = new Map<number, number>(); // AtomIndex -> HexColor
            if (customColors?.length > 0) {
                customColors.forEach(rule => {
                    if (rule.color && rule.target) {
                        try {
                            const sel = new NGL.Selection(rule.target);
                            // NGL Selection doesn't track changes if structure changes, but structure is static here
                            const colorHex = new NGL.Color(rule.color).getHex();

                            component.structure.eachAtom((atom: any) => {
                                atomColorMap.set(atom.index, colorHex);
                            }, sel);
                        } catch (e) {
                            console.warn("Invalid selection for rule:", rule);
                        }
                    }
                });
            }

            // 2. Define the Unified Scheme
            // We use a unique ID each time to force NGL to refresh
            const unifiedSchemeId = `unified_${Date.now()}_${Math.random()}`;

            NGL.ColormakerRegistry.addScheme(function (this: any, params: any) {
                this.atomColor = function (atom: any) {
                    // A. PRIORITY: Custom Overrides (Map Lookup O(1))
                    if (atomColorMap.has(atom.index)) {
                        return atomColorMap.get(atom.index);
                    }

                    // B. FALLBACK: Base Coloring Modes
                    // We must replicate the logic for the supported modes since we are in a custom scheme

                    if (currentColoring === 'chainid') {
                        // High Contrast D3 palette
                        const colors = [
                            0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd,
                            0x8c564b, 0xe377c2, 0x7f7f7f, 0xbcbd22, 0x17becf
                        ];
                        return colors[atom.chainIndex % colors.length];
                    }

                    else if (currentColoring === 'sstruc') {
                        // Standard Secondary Structure Colors
                        const s = atom.sstruc;
                        if (s === 'h') return 0xFF0080; // Magenta (Helix)
                        if (s === 's') return 0xFFC800; // Yellow/Orange (Sheet)
                        if (s === 't') return 0x6080FF; // Turn (Light Blue - often nice to distinguish)
                        // ' ' (Coil) or others
                        return 0xFFFFFF; // White
                    }

                    else if (currentColoring === 'charge') {
                        const r = atom.resname;
                        if (['ARG', 'LYS', 'HIS'].includes(r)) return 0x0000FF; // Blue (+)
                        if (['ASP', 'GLU'].includes(r)) return 0xFF0000; // Red (-)
                        return 0xCCCCCC; // Grey (Neutral)
                    }

                    else if (currentColoring === 'hydrophobicity') {
                        const scale: Record<string, number> = {
                            ILE: 4.5, VAL: 4.2, LEU: 3.8, PHE: 2.8, CYS: 2.5,
                            MET: 1.9, ALA: 1.8, GLY: -0.4, THR: -0.7, SER: -0.8,
                            TRP: -0.9, TYR: -1.3, PRO: -1.6, HIS: -3.2, GLU: -3.5,
                            GLN: -3.5, ASP: -3.5, ASN: -3.5, LYS: -3.9, ARG: -4.5
                        };
                        const val = (scale[atom.resname] || 0) + 4.5; // Shift to 0..9
                        const norm = Math.max(0, Math.min(1, val / 9.0));
                        return new NGL.Color(getPaletteColor(norm, colorPalette)).getHex();
                    }

                    else if (currentColoring === 'bfactor') {
                        return new NGL.Color(getPaletteColor(Math.min(1, atom.bfactor / 100), colorPalette)).getHex();
                    }

                    else if (currentColoring === 'element') {
                        // Simple CPK-like fallback
                        const e = atom.element;
                        if (e === 'C') return 0x909090;
                        if (e === 'O') return 0xFF0000;
                        if (e === 'N') return 0x0000FF;
                        if (e === 'S') return 0xFFFF00;
                        return 0xDDDDDD;
                    }

                    else if (currentColoring === 'resname' || currentColoring === 'residue') {
                        const safeRes = atom.resname || 'UNK';
                        let hash = 0;
                        for (let i = 0; i < safeRes.length; i++) hash = safeRes.charCodeAt(i) + ((hash << 5) - hash);
                        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
                        return parseInt("00000".substring(0, 6 - c.length) + c, 16);
                    }

                    // Default Fallback
                    return 0xCCCCCC;
                };
            }, unifiedSchemeId);

            // 3. Apply Single Representation
            component.addRepresentation(repType, { color: unifiedSchemeId });

            // --- OVERLAYS ---
            const tryApply = (r: string, c: string, sele: string, params: any = {}) => {
                try { component.addRepresentation(r, { color: c, sele: sele, ...params }); } catch (e) { }
            };

            if (showSurface) tryApply('surface', 'white', "*", { opacity: 0.4, depthWrite: false, side: 'front' });
            if (showLigands) tryApply('ball+stick', 'element', 'ligand and not (water or ion)', { scale: 2.0 });

            if (stageRef.current?.viewer) {
                stageRef.current.viewer.requestRender();
            }

        } catch (e) {
            console.error("Critical error in updateRepresentation:", e);
        }
    };

    useEffect(() => {
        updateRepresentation();
    }, [representation, coloring, customColors, showSurface, showLigands, colorPalette]);

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
