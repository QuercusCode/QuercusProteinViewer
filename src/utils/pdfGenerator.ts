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

const calculateStats = (data: InteractionData) => {
    const stats: Record<string, number> = {
        'Salt Bridge': 0,
        'Disulfide Bond': 0,
        'Hydrophobic Contact': 0,
        'Pi-Stacking': 0,
        'Cation-Pi Interaction': 0,
        'Close Contact': 0
    };

    const { matrix, labels } = data;
    const size = data.size;

    for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
            const dist = matrix[i][j];
            if (dist > 8.0) continue;

            const l1 = labels[i];
            const l2 = labels[j];
            const typeData = getInteractionType(l1.label, l2.label, dist);

            if (typeData) {
                if (stats[typeData.type] !== undefined) {
                    stats[typeData.type]++;
                }
            } else if (dist < 5.0) {
                stats['Close Contact']++;
            }
        }
    }
    return stats;
};

const addSequenceView = (doc: jsPDF, labels: any[], startY: number) => {
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);

    let x = margin;
    let y = startY;
    const boxSize = 6;
    const fontSize = 4;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Sequence & Secondary Structure", margin, y - 5);

    doc.setFont("courier", "normal");
    doc.setFontSize(fontSize);

    // Legend
    const legendY = y - 5;
    const legendX = margin + 80;
    doc.setFontSize(8);
    // Helix
    doc.setFillColor(239, 68, 68); // Red-500
    doc.rect(legendX, legendY - 3, 4, 4, 'F');
    doc.text("Helix", legendX + 5, legendY);
    // Sheet
    doc.setFillColor(234, 179, 8); // Yellow-500
    doc.rect(legendX + 20, legendY - 3, 4, 4, 'F');
    doc.text("Sheet", legendX + 25, legendY);
    // Coil
    doc.setFillColor(229, 231, 235); // Gray-200
    doc.rect(legendX + 40, legendY - 3, 4, 4, 'F');
    doc.text("Coil", legendX + 45, legendY);


    labels.forEach((l) => {
        // Parse residue name (e.g. "ALA") to 1-letter code if possible, or just keep 3
        const parts = l.label.split(' ');
        const resName3 = parts[0];
        // Simple map (incomplete, just illustrative)
        const map: any = { 'ALA': 'A', 'ARG': 'R', 'ASN': 'N', 'ASP': 'D', 'CYS': 'C', 'GLU': 'E', 'GLN': 'Q', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I', 'LEU': 'L', 'LYS': 'K', 'MET': 'M', 'PHE': 'F', 'PRO': 'P', 'SER': 'S', 'THR': 'T', 'TRP': 'W', 'TYR': 'Y', 'VAL': 'V' };
        const letter = map[resName3] || '?';

        // Color
        const ss = (l.ss || '').toLowerCase();
        if (ss === 'h') doc.setFillColor(239, 68, 68); // Red
        else if (ss === 's' || ss === 'e') doc.setFillColor(234, 179, 8); // Yellow
        else doc.setFillColor(243, 244, 246); // Gray-100 (Coil)

        // Check if next box fits
        if (x + boxSize > margin + maxWidth) {
            x = margin;
            y += boxSize + 1;

            // Check page break
            if (y > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
            }
        }

        doc.rect(x, y, boxSize, boxSize, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text(letter, x + 1.5, y + 4);

        x += boxSize + 0.5;
    });

    return y + boxSize + 10;
};

const addInstructionPage = (
    doc: jsPDF,
    proteinName: string,
    metadata: ProteinMetadata,
    stats: Record<string, number>,
    snapshot: string | null,
    labels: any[]
) => {
    const margin = 20;
    let y = 20;

    // 1. Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Protein Contact Analysis Report", margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, y);
    y += 15;

    // 2. Main Layout: Left (Info) vs Right (Snapshot)
    const midX = 105;

    // -- Stats Box (Left) --
    doc.setDrawColor(200);
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(margin, y, 80, 75, 'FD'); // Background box

    let innerY = y + 10;
    const leftPad = margin + 5;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Structure Overview", leftPad, innerY);
    innerY += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${proteinName}`, leftPad, innerY); innerY += 5;
    doc.text(`Residues: ${metadata.residueCount}`, leftPad, innerY); innerY += 5;
    doc.text(`Chains: ${metadata.chains.join(', ')}`, leftPad, innerY); innerY += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Interaction Counts", leftPad, innerY);
    innerY += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const printStat = (label: string, count: number, color: string) => {
        doc.setFillColor(color);
        doc.circle(leftPad + 2, innerY - 1, 1.5, 'F');
        doc.text(`${label}: ${count}`, leftPad + 8, innerY);
        innerY += 5;
    };

    printStat("Salt Bridges", stats['Salt Bridge'], "#ef4444");
    printStat("Disulfide Bonds", stats['Disulfide Bond'], "#eab308");
    printStat("Hydrophobic Clusters", stats['Hydrophobic Contact'], "#22c55e");
    printStat("Pi-Stacking", stats['Pi-Stacking'] + stats['Cation-Pi Interaction'], "#a855f7");

    // -- 3D Snapshot (Right) --
    if (snapshot) {
        // Fit within box roughly 80x80
        const imgSize = 75;
        // Draw border
        doc.setDrawColor(200);
        doc.rect(midX, y, imgSize, imgSize);
        doc.addImage(snapshot, 'PNG', midX, y, imgSize, imgSize);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Fig 1. 3D Structure Snapshot", midX, y + imgSize + 5);
    }

    y += 90;

    // 3. Sequence View
    y = addSequenceView(doc, labels, y);

    y += 10;

    // 4. Interaction Legend (Bottom)
    // Check space
    if (y > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Guide to Analysis", margin, y);
    y += 10;

    const addLegendItem = (color: string, title: string, desc: string) => {
        doc.setFillColor(color);
        doc.rect(margin, y, 4, 4, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(title, margin + 8, y + 3);
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(desc, 150);
        doc.text(splitDesc, margin + 8, y + 8);
        y += 8 + (splitDesc.length * 4);
    };

    addLegendItem("#ef4444", "Salt Bridge (Ionic)", "< 4.0Å. Strong electrostatic attraction. Critical for stability.");
    addLegendItem("#eab308", "Disulfide Bond", "~2.0Å. Covalent bond between Cysteines. Provides rigidity.");
    addLegendItem("#22c55e", "Hydrophobic Cluster", "Non-polar residue packing. Primary driving force of folding.");
    addLegendItem("#a855f7", "Pi-Stacking", "Aromatic ring interactions. Stabilizes core and interfaces.");

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
    metadata: ProteinMetadata,
    snapshot: string | null = null
) => {
    const doc = new jsPDF();
    const isLightMode = false; // Force DARK MODE for Maps (User Request)

    // Data Prep
    const stats = calculateStats(data);

    // PAGE 1: Enhanced Instruction & Overview
    addInstructionPage(doc, proteinName, metadata, stats, snapshot, data.labels);

    // SECTIONS

    const allFilter = (t: string | null) => t !== null && t !== 'Close Contact';
    addSection(doc, "All Significant Interactions", data, allFilter, isLightMode, false, 20);

    addSection(doc, "Salt Bridges (Ionic Interactions)", data, (t) => t === 'Salt Bridge', isLightMode, true);
    addSection(doc, "Disulfide Bonds (Covalent)", data, (t) => t === 'Disulfide Bond', isLightMode, true);
    addSection(doc, "Hydrophobic Clusters", data, (t) => t === 'Hydrophobic Contact', isLightMode, true);
    addSection(doc, "Pi-Stacking & Cation-Pi", data, (t) => t === 'Pi-Stacking' || t === 'Cation-Pi Interaction', isLightMode, true);

    const safeName = proteinName.replace(/[^a-z0-9]/yi, '_').toLowerCase();
    doc.save(`${safeName}_full_report.pdf`);
};
