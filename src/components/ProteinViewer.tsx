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
    className
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
                    component = await stage.loadFile(file, { defaultRepresentation: false });
                } else if (pdbId) {
                    const cleanId = pdbId.trim().toLowerCase();
                    if (cleanId.length < 3) {
                        console.warn("PDB ID too short, skipping load");
                        setLoading(false);
                        return;
                    }
                    // Explicit URL fetching for robustness
                    const url = `https://files.rcsb.org/download/${cleanId}.pdb`;
                    console.log(`Fetching from: ${url}`);
                    component = await stage.loadFile(url, { defaultRepresentation: false, ext: 'pdb' });
                }

                if (component) {
                    console.log("Component loaded. Structure type:", component.type);
                    if (component.structure) {
                        console.log("Atom count:", component.structure.atomCount);

                        // Extract Chain Info
                        const chains: { name: string; min: number; max: number; sequence: string }[] = [];
                        const seenChains = new Set<string>();

                        component.structure.eachChain((c: any) => {
                            if (seenChains.has(c.chainname)) return;
                            seenChains.add(c.chainname);

                            let min = Infinity;
                            let max = -Infinity;
                            let seq = "";
                            c.eachResidue((r: any) => {
                                if (r.resno < min) min = r.resno;
                                if (r.resno > max) max = r.resno;
                                // Use NGL's internal getResname1 if available, or simple logic
                                seq += r.getResname1 ? r.getResname1() : (r.resname[0] || 'X');
                            });
                            chains.push({
                                name: c.chainname,
                                min: min === Infinity ? 0 : min,
                                max: max === -Infinity ? 0 : max,
                                sequence: seq
                            });
                        });

                        console.log("Chains found with residue ranges:", chains);

                        if (onStructureLoaded) {
                            onStructureLoaded({ chains });
                        }
                    }

                    componentRef.current = component;
                    try {
                        component.autoView();
                        updateRepresentation();

                        // Force render
                        stage.handleResize();
                        // CDN version might handle requestRender differently, but usually safe
                        if (stage.viewer) stage.viewer.requestRender();
                    } catch (reprError) {
                        console.error("AutoView/Repr error:", reprError);
                    }
                }
            } catch (err) {
                console.error("Failed to load structure:", err);
                setError(`Failed to load structure: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        // Load if we have a file OR a valid PDB ID
        if (file || (pdbId && pdbId.length >= 3)) {
            loadStructure();
        } else {
            // If nothing to load, clear stage
            try {
                if (stageRef.current) {
                    stageRef.current.removeAllComponents();
                    if (stageRef.current.viewer) stageRef.current.viewer.requestRender();
                }
            } catch (e) { }
            componentRef.current = null;
        }
    }, [pdbId, file]);

    // Update Representation/Coloring
    const updateRepresentation = () => {
        if (!componentRef.current) return;

        try {
            const component = componentRef.current;
            component.removeAllRepresentations();

            let actualColor: string = coloring;
            if (coloring === 'chainid') actualColor = 'chainindex';
            if (coloring === 'structure') actualColor = 'sstruc';

            let repName = representation;
            if (representation === 'cartoon') repName = 'cartoon';
            if (representation === 'ball+stick') repName = 'ball+stick';
            if (representation === 'spacefill') repName = 'spacefill';
            if (representation === 'surface') repName = 'surface';
            if (representation === 'ribbon') repName = 'ribbon';

            // 1. Prepare Rules with Selections
            const activeRules = customColors.map(rule => {
                let sel = "";
                if (rule.type === 'chain') {
                    sel = `:${rule.target}`;
                } else if (rule.type === 'residue') {
                    sel = rule.target;
                }
                return { ...rule, selection: sel };
            }).filter(r => r.selection);

            // 2. Add Representations with Layer Subtraction
            // We iterate strictly; each rule rep includes its selection,
            // MINUS the selection of all *subsequent* rules (which sit "on top").
            activeRules.forEach((rule, index) => {
                // Gather selections of all rules that come AFTER this one
                const higherLayerSelections = activeRules.slice(index + 1).map(r => r.selection);

                let finalSelection = rule.selection;
                if (higherLayerSelections.length > 0) {
                    finalSelection = `(${rule.selection}) and not (${higherLayerSelections.join(' or ')})`;
                }

                console.log(`Layer ${index} (${rule.type}): ${finalSelection}`);

                if (finalSelection) {
                    const params: any = {
                        color: rule.color,
                        sele: finalSelection
                    };
                    if (representation === 'surface') params.opacity = 0.7;
                    component.addRepresentation(repName, params);
                }
            });

            // 3. Add Base Representation
            // Base excludes ALL custom rule selections
            const allCustomSelections = activeRules.map(r => r.selection);
            const baseParams: any = {
                color: actualColor
            };
            if (representation === 'surface') baseParams.opacity = 0.7;

            if (allCustomSelections.length > 0) {
                const exclusionString = `not (${allCustomSelections.join(' or ')})`;
                baseParams.sele = exclusionString;
                console.log(`Base Layer: ${exclusionString}`);
            } else {
                console.log(`Base Layer: All`);
            }

            component.addRepresentation(repName, baseParams);

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
