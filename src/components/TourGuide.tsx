import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startOnboardingTour = (onComplete?: () => void, onHighlight?: (elementId: string) => void) => {
    const driverObj = driver({
        showProgress: true,
        animate: true,
        steps: [
            {
                element: '#protein-viewer-canvas',
                popover: {
                    title: '3D Viewer Workspace',
                    description: 'This is your main workspace. Click and drag to rotate, right-click to pan, and scroll to zoom.'
                }
            },
            {
                element: '#upload-section',
                popover: {
                    title: 'Load Structures',
                    description: 'First select your database (PDB or PubChem), then fetch any protein or chemical structure you want. You can also drag and drop your files, upload a file, or choose from the offline library.'
                }
            },
            {
                element: '#metadata-box',
                popover: {
                    title: 'Structure Metadata',
                    description: 'View key information about your structure including method, resolution, source organism, and deposition date.'
                }
            },
            {
                element: '#visualization-controls',
                popover: {
                    title: 'Customize Appearance',
                    description: 'Change representations (Cartoon, Spacefill) and coloring schemes to highlight different features.'
                }
            },
            {
                element: '#analysis-tools',
                popover: {
                    title: 'Analysis Tools',
                    description: 'Measure distances, view contact maps, or inspect specific properties.'
                }
            },
            {
                element: '#sequence-track',
                popover: {
                    title: 'Sequence Track',
                    description: 'View and interact with the amino acid sequence on the right side. Click residues to focus them in 3D.',
                    side: 'left',
                    align: 'center'
                }
            },
            {
                element: '#motif-search',
                popover: {
                    title: 'Motif Search',
                    description: 'Search for specific amino acid patterns or motifs across the sequence (e.g., "RGD", "GxGxxG").'
                }
            },
            {
                element: '#export-tools',
                popover: {
                    title: 'Export & Share',
                    description: 'Take high-quality snapshots, record movies, or share your session.'
                }
            },
            {
                element: '#help-button',
                popover: {
                    title: 'Need Help?',
                    description: 'Click here to view keyboard shortcuts or restart this tour anytime.'
                }
            }
        ],
        onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("Are you sure you want to exit the tour?")) {
                driverObj.destroy();
                if (onComplete) onComplete();
            }
        },
        onHighlightStarted: (_element, step) => {
            if (onHighlight && step && typeof step.element === 'string') {
                onHighlight(step.element);
            }
        }
    });

    driverObj.drive();
};
