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
    const padding = 50; // Space for axes

    canvas.width = (size * P) + padding;
    canvas.height = (size * P) + padding;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) return ''; // Should never happen

    // 1. Background
    ctx.fillStyle = isLightMode ? '#ffffff' : '#171717';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Axes Lines
    const axisColor = isLightMode ? '#000000' : '#ffffff';
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Y Axis
    ctx.moveTo(padding - 5, 0);
    ctx.lineTo(padding - 5, size * P);
    // X Axis
    ctx.moveTo(padding, size * P + 5);
    ctx.lineTo(canvas.width, size * P + 5);
    ctx.stroke();

    // 3. Axes Labels (Simplified: 0, 50, 100...)
    ctx.fillStyle = axisColor;
    ctx.font = '24px Arial'; // Large font for scaled down image
    ctx.textAlign = 'right';

    // Y Labels
    for (let i = 0; i < size; i += 50) {
        ctx.fillText(i.toString(), padding - 15, (i * P) + 10);
    }
    // X Labels
    ctx.textAlign = 'center';
    for (let i = 0; i < size; i += 50) {
        ctx.fillText(i.toString(), padding + (i * P), (size * P) + 40);
    }


    // 4. Draw Pixels (Upper Diagonal Only)
    // Offset everything by padding
    const offsetX = padding;
    const offsetY = 0;

    const { matrix, labels } = data;

    for (let i = 0; i < size; i++) {
        for (let j = i; j < size; j++) {
            const dist = matrix[i][j];
            if (dist > 8.0) continue;

            const l1 = labels[i];
            const l2 = labels[j];

            // Filter
            const typeData = getInteractionType(l1.label, l2.label, dist);

            if (filterFn(typeData ? typeData.type : null)) {
                if (typeData) {
                    ctx.fillStyle = typeData.hex || '#60a5fa'; // Fallback blue
                    ctx.fillRect(offsetX + (j * P), offsetY + (i * P), P, P);
                    // NO MIRRORING (User Request: Upper Diagonal Only)
                } else if (dist < 5.0 && filterFn('Close Contact')) {
                    // Blue heatmap for generic close contacts
                    ctx.fillStyle = isLightMode ? '#60a5fa' : '#3b82f6';
                    ctx.fillRect(offsetX + (j * P), offsetY + (i * P), P, P);
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
    newPage: boolean = true,
    startY: number = 20
) => {
    const margin = 15;

    if (newPage) {
        doc.addPage();
    }

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, margin, startY);

    // 1. Generate Image
    const mapImg = drawMapToDataURL(data, filterFn, isLightMode);

    // 2. Add Image
    const desiredImgWidth = 120; // Slightly larger to accommodate axes
    const desiredImgHeight = 120;
    const imgY = startY + 10;

    doc.addImage(mapImg, 'PNG', margin, imgY, desiredImgWidth, desiredImgHeight);

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
                if (title.includes("All") && type === "Close Contact") continue;

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
    const summaryY = imgY + desiredImgHeight + 10;
    doc.text(`Identified Interactions (${tableRows.length} total, top ${displayRows.length} shown)`, margin, summaryY);

    autoTable(doc, {
        startY: summaryY + 5,
        head: [['Residue A', 'Residue B', 'Dist (Å)', 'Type']],
        body: displayRows.map(r => [r.res1, r.res2, r.dist, r.type]),
        theme: 'striped',
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin }
    });
};

export const generateProteinReport = (
    proteinName: string,
    _canvasIgnored: HTMLCanvasElement,
    data: InteractionData
) => {
    const doc = new jsPDF();
    const isLightMode = false; // Force DARK MODE for Maps (User Request)

    // Page 1: Overview
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Protein Analysis Report", 15, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(proteinName || "Unknown Protein", 15, 28);

    doc.line(15, 32, 195, 32);

    // Section 1: All Interactions (Page 1, below header)
    const allFilter = (t: string | null) => t !== null && t !== 'Close Contact';
    addSection(doc, "All Significant Interactions", data, allFilter, isLightMode, false, 45);

    // 2. Salt Bridge
    addSection(doc, "Salt Bridges (Ionic Interactions)", data, (t) => t === 'Salt Bridge', isLightMode, true);

    // 3. Disulfide
    addSection(doc, "Disulfide Bonds (Covalent)", data, (t) => t === 'Disulfide Bond', isLightMode, true);

    // 4. Hydrophobic
    addSection(doc, "Hydrophobic Clusters", data, (t) => t === 'Hydrophobic Contact', isLightMode, true);

    // 5. Pi-Stacking
    addSection(doc, "Pi-Stacking & Cation-Pi", data, (t) => t === 'Pi-Stacking' || t === 'Cation-Pi Interaction', isLightMode, true);

    // Save
    const safeName = proteinName.replace(/[^a-z0-9]/yi, '_').toLowerCase();
    doc.save(`${safeName}_full_report.pdf`);
};
