import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getInteractionType } from './interactionUtils';

interface InteractionData {
    matrix: number[][];
    size: number;
    labels: { resNo: number; chain: string; label: string; ss: string }[];
}

// Helper: Draw map to an offscreen canvas
const drawMapToDataURL = (
    data: InteractionData,
    filterFn: (type: string | null) => boolean,
    isLightMode: boolean
): string => {
    const canvas = document.createElement('canvas');
    const P = 2; // Pixel scale for high res
    const size = data.size;
    canvas.width = size * P;
    canvas.height = size * P;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) return '';

    // Bg
    ctx.fillStyle = isLightMode ? '#ffffff' : '#171717';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Diagonals & Grid not strictly needed for print, but helpful context
    // Let's keep it simple: just the dots.

    const { matrix, labels } = data;

    for (let i = 0; i < size; i++) {
        for (let j = i; j < size; j++) {
            const dist = matrix[i][j];
            if (dist > 8.0) continue;

            const l1 = labels[i];
            const l2 = labels[j];

            // Filter
            const typeData = getInteractionType(l1.label, l2.label, dist);

            // Check if we should draw this
            // Special case: "All" -> Draw everything
            // types: 'Salt Bridge', 'Disulfide Bond', 'Hydrophobic Contact', 'Pi-Stacking', 'Cation-Pi Interaction', 'Close Contact'

            if (filterFn(typeData ? typeData.type : null)) {
                if (typeData) {
                    ctx.fillStyle = typeData.hex || '#60a5fa'; // Fallback blue
                    ctx.fillRect(j * P, i * P, P, P);
                    // Mirror for symmetry
                    ctx.fillRect(i * P, j * P, P, P);
                } else if (dist < 5.0 && filterFn('Close Contact')) {
                    // Blue heatmap for generic close contacts if allowd
                    ctx.fillStyle = isLightMode ? '#60a5fa' : '#3b82f6';
                    ctx.fillRect(j * P, i * P, P, P);
                    ctx.fillRect(i * P, j * P, P, P);
                }
            }
        }
    }

    return canvas.toDataURL("image/png");
};

const addSection = (
    doc: jsPDF,
    title: string,
    data: InteractionData,
    filterFn: (type: string | null) => boolean,
    isLightMode: boolean,
    isFirstPage = false
) => {
    const margin = 15;


    if (!isFirstPage) {
        doc.addPage();
    }

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, margin, 20);

    // 1. Generate Image
    const mapImg = drawMapToDataURL(data, filterFn, isLightMode);

    // 2. Add Image
    const desiredImgWidth = 100; // Fixed size
    const desiredImgHeight = 100;

    doc.addImage(mapImg, 'PNG', margin, 30, desiredImgWidth, desiredImgHeight);

    // 3. Generate Table Data
    const tableRows = [] as any[];
    const { matrix, labels } = data;

    // We can't list ALL hydrophobic contacts (thousands). We need a limit.
    const MAX_ROWS = 100;

    for (let i = 0; i < matrix.length; i++) {
        for (let j = i + 1; j < matrix.length; j++) {
            const dist = matrix[i][j];
            if (dist > 6.0) continue;

            const l1 = labels[i];
            const l2 = labels[j];
            const typeData = getInteractionType(l1.label, l2.label, dist);
            const type = typeData ? typeData.type : 'Close Contact';

            // Filter Row
            if (filterFn(type)) {
                // If generic "All" view, skip 'Close Contact' logs to save space for important stuff
                if (title === "All Interactions" && type === "Close Contact") continue;

                tableRows.push({
                    res1: `${l1.chain}:${l1.label}`,
                    res2: `${l2.chain}:${l2.label}`,
                    dist: dist.toFixed(2),
                    type: type
                });
            }
        }
    }

    // Sort by distance
    tableRows.sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist));

    // Slice
    const displayRows = tableRows.slice(0, MAX_ROWS);

    doc.setFontSize(10);
    doc.text(`Identified Interactions (${tableRows.length} total, top ${displayRows.length} shown)`, margin, 30 + desiredImgHeight + 10);

    autoTable(doc, {
        startY: 30 + desiredImgHeight + 15,
        head: [['Residue A', 'Residue B', 'Dist (Å)', 'Type']],
        body: displayRows.map(r => [r.res1, r.res2, r.dist, r.type]),
        theme: 'striped',
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin }
    });
};

export const generateProteinReport = (
    proteinName: string,
    _canvasIgnored: HTMLCanvasElement, // We draw our own now
    data: InteractionData
) => {
    const doc = new jsPDF();
    const isLightMode = true; // Force light mode for print readability? Or pass user pref? Let's assume white paper = light mode.

    // Page 1: Overview
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Protein Analysis Report", 15, 15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(proteinName || "Unknown Protein", 15, 22);

    // Section 1: All Interactions (Salt Bridges, Disulfides, Pi, Hydrophobic)
    // We allow everything except simple 'Close Contact' to declutter
    const allFilter = (t: string | null) => t !== null && t !== 'Close Contact';
    addSection(doc, "All Significant Interactions", data, allFilter, isLightMode, false);
    // Wait, first page logic is tricky with title. 
    // Let's make "All Interactions" start below the main title.

    // Let's redefine addSection usage slightly or just manually do Page 1.
    // Actually, let's just run addSection for everything and rely on auto-paging.

    // 1. Salt Bridge
    addSection(doc, "Salt Bridges (Ionic Interactions)", data, (t) => t === 'Salt Bridge', isLightMode, true); // true = don't add page first (but we have title)

    // 2. Disulfide
    addSection(doc, "Disulfide Bonds (Covalent)", data, (t) => t === 'Disulfide Bond', isLightMode, false);

    // 3. Hydrophobic
    addSection(doc, "Hydrophobic Clusters", data, (t) => t === 'Hydrophobic Contact', isLightMode, false);

    // 4. Pi-Stacking
    addSection(doc, "Pi-Stacking & Cation-Pi", data, (t) => t === 'Pi-Stacking' || t === 'Cation-Pi Interaction', isLightMode, false);

    // Save
    const safeName = proteinName.replace(/[^a-z0-9]/yi, '_').toLowerCase();
    doc.save(`${safeName}_full_report.pdf`);
};
