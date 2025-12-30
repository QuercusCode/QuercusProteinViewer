import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getInteractionType } from './interactionUtils';

interface InteractionData {
    matrix: number[][];
    size: number;
    labels: { resNo: number; chain: string; label: string; ss: string }[];
}

export interface ProteinMetadata {
    residueCount: number;
    chainCount: number;
    chains: string[];
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

    // 3. Axes Labels
    ctx.fillStyle = axisColor;
    ctx.font = '14px Arial'; // Smaller font for cleaner look
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Y Labels
    for (let i = 0; i < size; i += 50) {
        ctx.fillText(i.toString(), padding - 10, (i * P));
    }
    // X Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < size; i += 50) {
        ctx.fillText(i.toString(), padding + (i * P), (size * P) + 10);
    }


    // 4. Draw Pixels (Upper Diagonal Only)
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

const addInstructionPage = (doc: jsPDF, proteinName: string, metadata: ProteinMetadata) => {
    const margin = 20;
    let y = 30;

    // 1. Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Protein Contact Map Report", margin, y);
    y += 15;

    // 2. Protein Overview Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 247, 250); // Light gray/blue bg
    doc.rect(margin, y, 170, 45, 'FD');

    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text(`Structure: ${proteinName}`, margin + 10, y + 15);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Residues: ${metadata.residueCount}`, margin + 10, y + 25);
    doc.text(`Chains: ${metadata.chains.join(', ')} (${metadata.chainCount} total)`, margin + 10, y + 32);

    // Add Placeholder for Function/Ligands since we don't have it, but user asked for structure info
    // If it's a PDB code (4 chars), we can suggest checking RCSB
    if (proteinName.length === 4) {
        doc.text(`Source: RCSB PDB (ID: ${proteinName})`, margin + 10, y + 39);
    }

    y += 60;

    // 3. Interaction Types Guide
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Understanding Interactions", margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("This report utilizes a distance-based algorithm to identify non-covalent and covalent interactions critical for protein stability and folding. Below is a guide to the interaction types mapped in this analysis:", margin, y, { maxWidth: 170 });
    y += 20;

    // Legend Items
    const addLegendItem = (color: string, title: string, desc: string) => {
        // Color Box
        doc.setFillColor(color);
        doc.rect(margin, y, 5, 5, 'F');

        // Title
        doc.setFont("helvetica", "bold");
        doc.text(title, margin + 10, y + 4);

        // Desc
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(desc, 150);
        doc.text(splitDesc, margin + 10, y + 10);

        y += 10 + (splitDesc.length * 5);
    };

    addLegendItem("#ef4444", "Salt Bridge (Ionic)", "Strong electrostatic attraction between oppositely charged residues (Asp/Glu vs Arg/Lys/His) within 4.0 Å. Key for thermal stability.");
    addLegendItem("#eab308", "Disulfide Bond", "Covalent bond between the sulfur atoms of two Cysteine residues (~2.05 Å). Provides significant structural rigidity.");
    addLegendItem("#22c55e", "Hydrophobic Cluster", "Association of non-polar residues (Leu, Val, Ile, Phe, Met) driven by the exclusion of water. The primary driving force of protein folding.");
    addLegendItem("#a855f7", "Pi-Stacking / Cation-Pi", "Interactions involving aromatic rings (Phe, Tyr, Trp). Includes Parallel/T-shaped stacking and cation-pi interactions with positive residues.");
    addLegendItem("#3b82f6", "Close Contact (Van der Waals)", "Generic close packing of atoms (< 5.0 Å) not classified above. Represents general steric packing and complementarity.");

    // New Page for content
    doc.addPage();
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

    // Calculate Center X
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = (pageWidth - desiredImgWidth) / 2;

    const imgY = startY + 10;

    doc.addImage(mapImg, 'PNG', centerX, imgY, desiredImgWidth, desiredImgHeight);

    // 3. Generate Table Data
    const tableRows = [] as any[];
    const { matrix, labels } = data;

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

    // Show ALL rows
    const displayRows = tableRows;

    doc.setFontSize(10);
    const summaryY = imgY + desiredImgHeight + 10;
    doc.text(`Identified Interactions (${tableRows.length} total)`, margin, summaryY);

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
    data: InteractionData,
    metadata: ProteinMetadata
) => {
    const doc = new jsPDF();
    const isLightMode = false; // Force DARK MODE for Maps (User Request)

    // PAGE 1: Instruction & Overview
    addInstructionPage(doc, proteinName, metadata);

    // Section 1: All Interactions
    // Note: We might be on Page 2 now automatically, or not. addInstructionPage added a page at the end.
    // So we are currently on a blank Page 2.
    // We can start render at top of this new page.

    const allFilter = (t: string | null) => t !== null && t !== 'Close Contact';
    addSection(doc, "All Significant Interactions", data, allFilter, isLightMode, false, 20);

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
