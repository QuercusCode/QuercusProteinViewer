import { useRef, useCallback } from 'react';
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import type { StructureController } from './useStructureController';

interface DemoControllerProps {
    controller: StructureController;
    setOpenSections: (sections: any) => void;
    setIsPublicationMode: (mode: boolean) => void;
}

export const useDemoController = ({
    controller,
    setOpenSections,
    setIsPublicationMode
}: DemoControllerProps) => {

    const driverRef = useRef<any>(null);

    const startDemo = useCallback(() => {
        // 1. Reset State Implementation
        const prepareState = async () => {
            // Reset View
            controller.handleResetView();
            // Load Crambin (Small, good for demos)
            controller.setPdbId('1CRN');
            // Wait for load... (heuristic delay handled by driver steps or pre-fetch)
        };

        const steps: DriveStep[] = [
            // Step 1: Intro
            {
                element: '#protein-viewer-canvas',
                popover: {
                    title: 'Welcome to QuercusViewer',
                    description: 'Sit back! We are starting an interactive demo of the main features.',
                    side: 'bottom',
                    align: 'center'
                },
                onHighlightStarted: () => {
                    prepareState();
                }
            },
            // Step 2: Representation Change
            {
                element: '#visualization-controls',
                popover: {
                    title: 'Smart Visualization',
                    description: 'We automatically detect secondary structures. Let\'s switch to a Cartoon view to see the helices clearly.',
                    side: 'left'
                },
                onHighlightStarted: () => {
                    setOpenSections({ 'appearance': true });
                    setTimeout(() => controller.setRepresentation('cartoon'), 500);
                }
            },
            // Step 3: Coloring
            {
                element: '#visualization-controls',
                popover: {
                    title: 'Scientific Coloring',
                    description: 'Now, let\'s color by Hydrophobicity to identify potential binding sites.',
                    side: 'left'
                },
                onHighlightStarted: () => {
                    setTimeout(() => controller.setColoring('hydrophobicity'), 300);
                }
            },
            // Step 4: Surface View
            {
                element: '#protein-viewer-canvas',
                popover: {
                    title: 'Surface Analysis',
                    description: 'Switching to Surface representation allows you to see the protein\'s volume and pockets.',
                    side: 'bottom'
                },
                onHighlightStarted: () => {
                    controller.setRepresentation('surface');
                    controller.setShowSurface(true); // Ensure surface toggle is explicit if needed, or just rep
                    // Actually setRepresentation('surface') usually does it.
                }
            },
            // Step 5: Publication Mode
            {
                element: '#visualization-controls', // Point to tools area
                popover: {
                    title: 'Publication Ready',
                    description: 'Need a figure for your paper? One click enables Publication Mode: white background, high quality, and clean UI.',
                    side: 'left'
                },
                onHighlightStarted: () => {
                    setIsPublicationMode(true);
                },
                onDeselected: () => {
                    // Cleanup when moving away or finishing? 
                    // ideally we leave it or reset? Let's leave it for effect.
                    setIsPublicationMode(false);
                }
            },
            // Step 6: End
            {
                element: '#protein-viewer-canvas',
                popover: {
                    title: 'Ready to Explore?',
                    description: 'That was a quick tour! You can now upload your own structures or browse our library.',
                }
            }
        ];

        driverRef.current = driver({
            showProgress: true,
            animate: true,
            steps: steps,
            allowClose: true,
            onDestroyStarted: () => {
                // Optional cleanup
                driverRef.current?.destroy();
            },
            onNextClick: () => {
                driverRef.current?.moveNext();
            }
        });

        driverRef.current.drive();

    }, [controller, setOpenSections, setIsPublicationMode]);

    return { startDemo };
};
