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
                    description: 'Enter a PDB ID, upload a file, or choose from the library.'
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
                element: '#sequence-viewer',
                popover: {
                    title: 'Sequence Viewer',
                    description: 'View the amino acid sequence, click residues to highlight them in 3D, and download FASTA files.'
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
        onHighlightStarted: (element) => {
            if (onHighlight && element) {
                const id = element.id ? `#${element.id}` : '';
                if (id) onHighlight(id);
            }
        }
    });

    driverObj.drive();
};
