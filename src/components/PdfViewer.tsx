
import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker source
// IMPORTANT: We need to use a CDN or local worker. 
// For Vite, usually we import the worker script. But to be safe and quick:
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
    file: File | { name: string; data: ArrayBuffer } | null;
    syncScroll?: { page: number; scale: number; scrollTop: number } | null;
    onScroll?: (page: number, scale: number, scrollTop: number) => void;
    onPdbClick?: (pdbId: string) => void;
    isHost: boolean;
}

export function PdfViewer({ file, syncScroll, onScroll, onPdbClick, isHost }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1.2);

    // Convert File/Buffer to URL
    useEffect(() => {
        if (!file) return;

        let url: string;
        if (file instanceof File) {
            url = URL.createObjectURL(file);
        } else {
            const blob = new Blob([file.data], { type: 'application/pdf' });
            url = URL.createObjectURL(blob);
        }

        setFileUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    // Handle Scroll Sync (Incoming)
    useEffect(() => {
        if (syncScroll && containerRef.current && !isHost) {
            // We only auto-scroll if we are NOT the host (host drives)
            // Or if we implemented "anyone can drive", we'd need an "active scroller" check.
            // For now: Host drives.
            const { scrollTop } = syncScroll;

            // Allow small deviation to prevent jitter
            if (Math.abs(containerRef.current.scrollTop - scrollTop) > 5) {
                containerRef.current.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth'
                });
            }
        }
    }, [syncScroll, isHost]);

    // Handle Scroll Emit (Outgoing)
    const handleScroll = () => {
        if (containerRef.current && onScroll && isHost) {
            onScroll(1, scale, containerRef.current.scrollTop);
        }
    };

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    // Custom Text Renderer for PDB Links
    // This is complex in react-pdf. Easier method: Global click listener on container
    const handleClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const text = target.innerText;

        // Simple PDB Regex: 4 chars, first is number
        // This is a heuristic.
        // Better: Check if the text matches PDB format strict.
        const pdbRegex = /\b[1-9][a-zA-Z0-9]{3}\b/;
        const match = text.match(pdbRegex);

        if (match && onPdbClick) {
            // Confirm with user or just loud? "Load 4HHB?"
            // For Journal Club, instant is best.
            // But we need to be careful of false positives.
            // Let's assume if the user CLICKED it, they want to try.
            onPdbClick(match[0]);
        }
    };

    if (!fileUrl) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-neutral-900 text-gray-500">
                <p>Waiting for PDF...</p>
            </div>
        );
    }

    return (
        <div
            className="h-full overflow-y-auto bg-gray-200 dark:bg-neutral-900 relative"
            ref={containerRef}
            onScroll={handleScroll}
            onClick={handleClick}
        >
            <div className="flex justify-center p-4 min-h-full">
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="shadow-xl"
                >
                    {Array.from(new Array(numPages), (_, index) => (
                        <div key={`page_${index + 1}`} className="mb-4">
                            <Page
                                pageNumber={index + 1}
                                scale={scale}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                            />
                        </div>
                    ))}
                </Document>
            </div>

            {/* Overlay Controls */}
            <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/90 p-2 rounded-lg shadow-lg flex gap-2">
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="px-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">-</button>
                <span className="text-xs self-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="px-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">+</button>
            </div>
        </div>
    );
}
