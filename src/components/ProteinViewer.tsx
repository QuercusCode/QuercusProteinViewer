import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import type { CustomColorRule, StructureInfo } from '../types';

// Define types manually since we aren't importing NGL types anymore
export type RepresentationType = 'cartoon' | 'ball+stick' | 'surface' | 'spacefill' | 'ribbon';
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            try {
                if (!stage.viewer) throw new Error("Stage viewer is null");
                // Safe component removal
                stage.eachComponent((comp: any) => stage.removeComponent(comp));
            } catch (e) {
                console.warn("Stage cleanup error:", e);
                return;
            }

            componentRef.current = null;
            setError(null);
            setLoading(true);

            console.log("Loading structure:", pdbId || file?.name);

            try {
                let component;
                if (file) {
                    console.log("Loading from file:", file.name);
                    component = await stage.loadFile(file, { defaultRepresentation: false });
                } else if (pdbId) {
                    console.log("Processing PDB ID:", pdbId);
                    const cleanId = String(pdbId).trim().toLowerCase();
                    console.log("Clean ID:", cleanId);
                    if (cleanId.length < 3) {
                        console.warn("PDB ID too short, skipping load");
                        setLoading(false);
                        return;
                    }
                    // Explicit URL fetching for robustness
                    const url = `https://files.rcsb.org/download/${cleanId}.pdb`;
                    console.log(`Fetching from: ${url}`);
                    component = await stage.loadFile(url, { defaultRepresentation: false, ext: 'pdb' });
                } else {
                    console.log("No file or pdbId provided.");
                    setLoading(false);
                    return;
                }

                if (component) {
                    console.log("Component loaded. Structure type:", component.type);
                    // ... (keep chains logic logging) ...
                    if (component.structure) {
                        try {
                            // Extract Chain Info
                            const chains: { name: string; min: number; max: number; sequence: string }[] = [];
                            const seenChains = new Set<string>();

                            console.log("Iterating chains...");
                            component.structure.eachChain((c: any) => {
                                if (!c || !c.chainname) return;
                                if (seenChains.has(c.chainname)) return;
                                seenChains.add(c.chainname);

                                let min = Infinity;
                                let max = -Infinity;
                                let seq = "";
                                try {
                                    c.eachResidue((r: any) => {
                                        if (r.resno < min) min = r.resno;
                                        if (r.resno > max) max = r.resno;
                                        seq += r.getResname1 ? r.getResname1() : (r.resname ? r.resname[0] : 'X');
                                    });
                                } catch (chainErr) {
                                    console.error("Error parsing chain residues:", chainErr);
                                }
                                chains.push({
                                    name: c.chainname,
                                    min: min === Infinity ? 0 : min,
                                    max: max === -Infinity ? 0 : max,
                                    sequence: seq
                                });
                            });

                            console.log("Chains found:", chains.length);

                            if (onStructureLoaded) {
                                onStructureLoaded({ chains });
                            }
                        } catch (chainLoopErr) {
                            console.warn("Error iterating chains (non-fatal):", chainLoopErr);
                        }
                    }

                    // Safe component assignment
                    componentRef.current = component;
                    try {
                        console.log("AutoView...");
                        try {
                            component.autoView();
                        } catch (avErr) {
                            console.warn("AutoView failed:", avErr);
                        }

                        console.log("Calling updateRepresentation...");
                        updateRepresentation();

                        // Force render
                        stage.handleResize();
                        if (stage.viewer) stage.viewer.requestRender();
                    } catch (reprError) {
                        console.error("AutoView/Repr error:", reprError);
                    }
                }
            } catch (err) {
                console.error("Failed to load structure (Detailed):", err);
                setError(`Failed to load structure: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        // Load if we have a file OR a valid PDB ID
        if (file || (pdbId && String(pdbId).length >= 3)) {
            loadStructure();
        } else {
            // ... existing clear stage logic ...
            try {
                if (stageRef.current) {
                    stageRef.current.removeAllComponents();
                    if (stageRef.current.viewer) stageRef.current.viewer.requestRender();
                }
            } catch (e) { }
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
        if (!componentRef.current) return;
        const component = componentRef.current;

        // Extra safety check for NGL structure
        if (!component.structure) {
            console.warn("updateRepresentation: Component has no structure yet.");
            return;
        }

        try {
            component.removeAllRepresentations();

            // Generate a unique scheme ID
            const schemeId = `custom-scheme-${Date.now()}`;

            // Register the custom scheme
            const NGL = window.NGL;

            // Prepare data for the scheme closure
            const colorMap = new Map<number, number>();

            if (customColors && customColors.length > 0) {
                console.log(`Preparing ${customColors.length} custom color rules...`);
                customColors.forEach(rule => {
                    if (!rule.color || !rule.target) return;
                    try {
                        const colorHex = new NGL.Color(rule.color).getHex();
                        // NGL Selection might be slow if created repeatedly, but fine here
                        // Pre-calculate which atoms match
                        const selection = new NGL.Selection(rule.target);
                        component.structure.eachAtom((atom: any) => {
                            colorMap.set(atom.index, colorHex);
                        }, selection);
                    } catch (e) {
                        console.error("Rule prep error:", e);
                    }
                });
            }

            // Register scheme
            NGL.ColormakerRegistry.addScheme(function (this: any, _params: any) {
                this.atomColor = (atom: any) => {
                    // Check custom map first
                    if (colorMap.has(atom.index)) {
                        return colorMap.get(atom.index);
                    }

                    // Fallback to base scheme
                    // We can't easily instantiate the base scheme inside here without access to the registry types
                    // But we can approximate common standard schemes if needed, or use NGL helpers

                    // ACTUALLY: We can just return the numeric value if we knew it.
                    // But we can try to use standard logic:
                    if (coloring === 'element') {
                        return atom.elementColor();
                    } else if (coloring === 'resname') {
                        return atom.resnameColor();
                    } else if (coloring === 'structure') {
                        return atom.structureColor();
                    } else if (coloring === 'chainid') {
                        // NGL doesn't expose a direct atom.chainidColor(), so we manually map
                        // Standard NGL chain colors
                        // Hash or cycle? NGL usually cycles via chainIndex
                        return NGL.ChainColors[atom.chainIndex % NGL.ChainColors.length];
                    }

                    return 0xCCCCCC; // Default grey
                };
            }, schemeId);

            console.log(`Applying single representation with custom scheme: ${schemeId}`);

            // Apply ONE representation to the WHOLE structure ("*")
            // This ensures seamless mesh interpolation
            component.addRepresentation(representation, {
                color: schemeId,
                sele: "*"
            });

        } catch (e) {
            console.error("Error updating representation:", e);
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
