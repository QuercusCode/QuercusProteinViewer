import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import type { CustomColorRule, StructureInfo } from '../types';

// Define types manually since we aren't importing NGL types anymore
export type RepresentationType = 'cartoon' | 'ball+stick' | 'surface' | 'spacefill' | 'ribbon' | 'licorice';
export type ColoringType = 'chainid' | 'element' | 'resname' | 'structure';

// Declare global NGL
declare global {
    interface Window {
        NGL: any;
    }
}

interface ProteinViewerProps {
    pdbId?: string;
    file?: File | null;
    representation: RepresentationType;
    coloring: ColoringType;
    customColors: CustomColorRule[];
    onStructureLoaded?: (info: StructureInfo) => void;
    resetCamera?: number;
    className?: string;
    isMeasurementMode?: boolean;
}

export interface ProteinViewerRef {
    captureImage: () => Promise<void>;
}

export const ProteinViewer = React.forwardRef<ProteinViewerRef, ProteinViewerProps>(({
    pdbId,
    file,
    representation,
    coloring,
    customColors,
    onStructureLoaded,
    resetCamera,
    className,
    isMeasurementMode
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null); // NGL state is now 'any'
    const componentRef = useRef<any>(null);
    const isMounted = useRef(true); // Track mount state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset mount state on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Expose captureImage method to parent
    useImperativeHandle(ref, () => ({
        captureImage: async () => {
            if (!stageRef.current) return;
            try {
                // Generate snapshot blob
                const blob = await stageRef.current.makeImage({
                    factor: 2, // High resolution (2x scaling)
                    antialias: true,
                    transparent: true,
                    trim: false
                });

                // Create download link
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `protein_${pdbId || 'structure'}_snapshot.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Failed to capture image:', err);
            }
        }
    }));

    // Initialize NGL Stage
    useEffect(() => {
        if (!containerRef.current) return;

        // Wait for NGL to be available
        if (!window.NGL) {
            console.error("NGL not found on window object");
            setError("NGL library failed to load");
            return;
        }

        console.log("Initializing NGL Stage (CDN match)");
        try {
            const stage = new window.NGL.Stage(containerRef.current, {
                backgroundColor: '#171717', // neutral-900
            });
            stageRef.current = stage;

            const handleResize = () => stage.handleResize();
            window.addEventListener('resize', handleResize);

            return () => {
                console.log("Disposing NGL Stage");
                window.removeEventListener('resize', handleResize);
                try {
                    stage.dispose();
                } catch (e) {
                    console.warn("Failed to dispose NGL stage", e);
                }
                stageRef.current = null;
            };
        } catch (e) {
            console.error("Failed to initialize NGL Stage", e);
            setError("Failed to initialize 3D Viewer");
        }
    }, []);

    // Load Structure
    useEffect(() => {
        const loadStructure = async () => {
            if (!stageRef.current) return;
            const stage = stageRef.current;

            // Cleanup existing components
            try {
                if (stage.viewer) {
                    stage.eachComponent((comp: any) => stage.removeComponent(comp));
                }
            } catch (e) { /* ignore */ }

            componentRef.current = null;
            if (isMounted.current) setError(null);
            if (isMounted.current) setLoading(true);

            const currentPdbId = pdbId;
            const currentFile = file;
            console.log("Loading structure:", currentPdbId || currentFile?.name);

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

                    // Local Fallback Logic
                    const AVAILABLE_LOCAL_PDBS = ['1crn', '2b3p', '4hhb'];
                    let url = `rcsb://${cleanId}`;
                    if (AVAILABLE_LOCAL_PDBS.includes(cleanId)) {
                        url = `./${cleanId}.pdb`;
                        console.log(`Using local fallback for ${cleanId}`);
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

                    // Extract Chains (Simplified for safety)
                    if (component.structure && onStructureLoaded) {
                        try {
                            const chains: { name: string; min: number; max: number; sequence: string }[] = [];
                            const seenChains = new Set<string>();
                            component.structure.eachChain((c: any) => {
                                if (seenChains.has(c.chainname)) return;
                                seenChains.add(c.chainname);
                                let seq = "";
                                try {
                                    c.eachResidue((r: any) => {
                                        seq += r.getResname1 ? r.getResname1() : (r.resname ? r.resname[0] : 'X');
                                    });
                                } catch (e) { }
                                chains.push({ name: c.chainname, min: 0, max: 0, sequence: seq });
                            });
                            onStructureLoaded({ chains });
                        } catch (e) { console.warn("Chain parsing error", e); }
                    }

                    // Apply Representation
                    updateRepresentation();

                    // Camera positioning with delay to ensure geometry is ready
                    setTimeout(() => {
                        if (!isMounted.current) return;
                        try {
                            console.log("AutoView...");
                            component.autoView();
                            if (stage.viewer) stage.viewer.requestRender();
                        } catch (e) { console.warn("AutoView failed", e); }
                    }, 100);
                }
            } catch (err) {
                if (isMounted.current) {
                    console.error("Load Error:", err);
                    setError(`Failed to load: ${err instanceof Error ? err.message : String(err)}`);
                }
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        if (file || (pdbId && String(pdbId).length >= 3)) {
            loadStructure();
        } else {
            // Clear stage if no ID
            if (stageRef.current) stageRef.current.removeAllComponents();
            componentRef.current = null;
        }
    }, [pdbId, file]);

    // --- Distance Measurement Logic ---
    const selectedAtomsRef = useRef<any[]>([]);

    useEffect(() => {
        if (!stageRef.current) return;
        const stage = stageRef.current;

        const handleClick = (pickingProxy: any) => {
            if (!isMeasurementMode || !pickingProxy || !pickingProxy.atom) return;

            const atom = pickingProxy.atom;
            console.log("Atom clicked:", atom);


            // Access global NGL for Vector3
            const Vector3 = window.NGL.Vector3;

            // Use ref for atomic updates without re-renders
            selectedAtomsRef.current.push(atom);
            const currentSelection = selectedAtomsRef.current;

            // If we have 2 atoms, add measurement
            if (currentSelection.length === 2) {
                const atom1 = currentSelection[0];
                const atom2 = currentSelection[1];

                try {
                    // Calculate distance
                    const v1 = new Vector3(atom1.x, atom1.y, atom1.z);
                    const v2 = new Vector3(atom2.x, atom2.y, atom2.z);
                    const distance = v1.distanceTo(v2).toFixed(2);

                    console.log(`Measured distance: ${distance} A`);

                    // Add distance representation
                    const shape = new window.NGL.Shape("distance-shape");
                    shape.addCylinder(
                        [atom1.x, atom1.y, atom1.z],
                        [atom2.x, atom2.y, atom2.z],
                        [1, 0.8, 0], // Amber/Orange color
                        0.2 // Radius
                    );
                    shape.addText(
                        [(atom1.x + atom2.x) / 2, (atom1.y + atom2.y) / 2, (atom1.z + atom2.z) / 2],
                        [1, 1, 1], // White text
                        1.5, // Size
                        `${distance} A`
                    );

                    const shapeComp = stage.addComponentFromObject(shape);
                    shapeComp.addRepresentation("buffer");
                    shapeComp.autoView();

                    // Clear selection after drawing
                    selectedAtomsRef.current = [];
                    return;

                } catch (e) {
                    console.error("Distance error:", e);
                    selectedAtomsRef.current = [];
                    return;
                }
            }
        };

        // Attach/Detach Signal
        if (isMeasurementMode) {
            stage.signals.clicked.add(handleClick);
        } else {
            stage.signals.clicked.remove(handleClick);
            stage.signals.clicked.remove(handleClick);
            selectedAtomsRef.current = [];
        }

        return () => {
            stage.signals.clicked.remove(handleClick);
        };
    }, [isMeasurementMode]);
    // ----------------------------------

    const updateRepresentation = () => {
        if (!isMounted.current || !componentRef.current) return;
        const component = componentRef.current;
        const NGL = window.NGL;
        if (!component.structure) return;

        try {
            component.removeAllRepresentations();

            // Prepare custom colors
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
                    } catch (e) { /* ignore */ }
                });
            }

            const repType = representation || 'cartoon';

            const applySafeFallback = () => {
                console.warn("Applying safe fallback (Backbone/Licorice)");
                try { component.addRepresentation('licorice', { color: 'element' }); } catch (e) { }
            };

            if (customColors.length === 0) {
                // Native Scheme with Fallback
                try {
                    // Try preferred representation
                    component.addRepresentation(repType, { color: coloring });
                } catch (err) {
                    console.warn(`Primary rep '${repType}' failed. Trying fallback.`);
                    applySafeFallback();
                }
            } else {
                // Custom Scheme Logic
                try {
                    const registeredSchemeId = NGL.ColormakerRegistry.addScheme(function (this: any) {
                        this.atomColor = (atom: any) => {
                            if (colorMap.has(atom.index)) return colorMap.get(atom.index);
                            if (coloring === 'chainid') {
                                const colors = [0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd];
                                return colors[(atom.chainIndex || 0) % colors.length];
                            }
                            return 0xCCCCCC;
                        };
                    }, schemeId);

                    component.addRepresentation(repType, { color: registeredSchemeId, sele: "*" });
                } catch (e) {
                    applySafeFallback();
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

    // Handle Camera Reset
    useEffect(() => {
        if (stageRef.current && resetCamera) {
            try {
                stageRef.current.autoView();
            } catch (e) {
                console.error("AutoView error", e);
            }
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
