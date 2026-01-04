import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode'; // Import QR Code
import { getInteractionType } from './interactionUtils';
import type { PDBMetadata } from '../types';

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
    filterFn: (type: string | null, l1?: any, l2?: any) => boolean,
    isLightMode: boolean
): string => {
    const canvas = document.createElement('canvas');
    const size = data.size;

    // Dynamic Scale for Performance
    // Cap max dimension at 3000px to prevent memory crashes during toDataURL or jsPDF addImage
    // For 3000 residues, P would be 1. For 6000, P would be 0.5.
    // We want high res (P=2) only if size is small (<1500).
    const MAX_DIMENSION = 3000;
    const padding = 50;
    let P = 2;

    if ((data.size * P) > MAX_DIMENSION) {
        P = MAX_DIMENSION / data.size;
    }

    canvas.width = (data.size * P) + padding;
    canvas.height = (data.size * P) + padding;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) return ''; // Should never happen

    // 1. Background
    ctx.fillStyle = isLightMode ? '#ffffff' : '#171717';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Grid & Axes
    const axisColor = isLightMode ? '#000000' : '#ffffff';
    const gridColor = isLightMode ? '#e5e5e5' : '#404040';

    // Draw Grid Lines (Every 50 residues)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= size; i += 50) {
        const pos = (i * P);
        // Horizontal
        ctx.moveTo(padding, pos);
        ctx.lineTo(padding + (size * P), pos);
        // Vertical
        ctx.moveTo(padding + pos, 0);
        ctx.lineTo(padding + pos, size * P);
    }
    ctx.stroke();

    // 3. Chain Bars & Labels
    const chainRanges: { chain: string, start: number, end: number }[] = [];
    if (data.labels.length > 0) {
        let currentChain = data.labels[0].chain;
        let startIndex = 0;
        for (let i = 1; i < data.labels.length; i++) {
            if (data.labels[i].chain !== currentChain) {
                chainRanges.push({ chain: currentChain, start: startIndex, end: i });
                currentChain = data.labels[i].chain;
                startIndex = i;
            }
        }
        chainRanges.push({ chain: currentChain, start: startIndex, end: data.labels.length });
    }

    // Draw Chain Bars
    const barSize = 10;
    const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#ef4444']; // Visual palette

    chainRanges.forEach((c, idx) => {
        const color = colors[idx % colors.length];
        const startPx = c.start * P;
        const lengthPx = (c.end - c.start) * P;

        // X-Axis Bar (Top) - mirroring UI (or Bottom?) - Let's put it top for X
        // Actually PDF has axes at Left (Y) and Bottom (X).
        // Let's put bars just outside the map.

        ctx.fillStyle = color;

        // Y-Axis Bar (Left)
        ctx.fillRect(padding - 15, startPx, barSize, lengthPx);

        // X-Axis Bar (Bottom)
        ctx.fillRect(padding + startPx, (size * P) + 5, lengthPx, barSize);

        // Label (Midpoint)
        ctx.fillStyle = axisColor;
        ctx.font = 'bold 10px Helvetica';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        // Y-Label
        ctx.fillText(c.chain, padding - 20, startPx + (lengthPx / 2));

        // X-Label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(c.chain, padding + startPx + (lengthPx / 2), (size * P) + 12);
    });

    // Draw Main Axes Lines
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, 0);
    ctx.lineTo(padding, size * P);
    ctx.lineTo(padding + (size * P), size * P);
    ctx.stroke();

    // Numeric Ticks (Simplied)
    ctx.fillStyle = axisColor;
    ctx.font = '10px Helvetica';
    ctx.textAlign = 'right';

    for (let i = 0; i <= size; i += 100) {
        if (i === 0) continue;
        const pos = i * P;
        // Y 
        ctx.fillText(i.toString(), padding - 35, pos); // Further out
        // X
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), padding + pos, (size * P) + 25);
        ctx.textAlign = 'right';
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

            if (filterFn(typeData ? typeData.type : null, l1, l2)) {
                if (typeData) {
                    ctx.fillStyle = typeData.hex || '#60a5fa'; // Fallback blue
                    ctx.fillRect(offsetX + (j * P), offsetY + (i * P), P, P);
                } else if (dist < 5.0 && filterFn('Close Contact', l1, l2)) {
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

const KYTE_DOOLITTLE: Record<string, number> = {
    'ILE': 4.5, 'VAL': 4.2, 'LEU': 3.8, 'PHE': 2.8, 'CYS': 2.5,
    'MET': 1.9, 'ALA': 1.8, 'GLY': -0.4, 'THR': -0.7, 'SER': -0.8,
    'TRP': -0.9, 'TYR': -1.3, 'PRO': -1.6, 'HIS': -3.2, 'GLU': -3.5,
    'GLN': -3.5, 'ASP': -3.5, 'ASN': -3.5, 'LYS': -3.9, 'ARG': -4.5
};

const getHydrophobicityColor = (resName3: string): number[] => {
    const val = KYTE_DOOLITTLE[resName3] || 0;
    // Scale -4.5 (Hydrophilic/Blue) to 4.5 (Hydrophobic/Orange)
    // Normalize to 0-1
    const t = (val + 4.5) / 9.0;

    // Simple Gradient: Blue (0, 0, 255) -> White (255, 255, 255) -> Orange (255, 165, 0)
    if (t < 0.5) {
        // Blue to White
        const localT = t * 2;
        return [
            Math.round(255 * localT),
            Math.round(255 * localT + 255 * (1 - localT)), // wait, blue is 0,0,255
            // Blue: 0, 100ish, 255 -> White: 255, 255, 255
            // Let's us Cyan-ish Blue: 0, 150, 255
            255
        ];
        // 0->0.5: R goes 0->255. G goes 100->255. B stays 255.
        // Actually let's use a simpler interpolator
        // t=0 (Hydrophilic): 59, 130, 246 (Blue-500)
        // t=0.5 (Neutral): 255, 255, 255
        // t=1 (Hydrophobic): 249, 115, 22 (Orange-500)

        const c1 = [59, 130, 246];
        const c2 = [255, 255, 255];
        return [
            Math.round(c1[0] + (c2[0] - c1[0]) * localT),
            Math.round(c1[1] + (c2[1] - c1[1]) * localT),
            Math.round(c1[2] + (c2[2] - c1[2]) * localT)
        ];
    } else {
        // White to Orange
        const localT = (t - 0.5) * 2;
        const c1 = [255, 255, 255];
        const c2 = [249, 115, 22]; // Orange
        return [
            Math.round(c1[0] + (c2[0] - c1[0]) * localT),
            Math.round(c1[1] + (c2[1] - c1[1]) * localT),
            Math.round(c1[2] + (c2[2] - c1[2]) * localT)
        ];
    }
};

const addSequenceView = (doc: jsPDF, labels: any[], startY: number) => {
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);

    let x = margin;
    let y = startY;
    const boxSize = 6;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Sequence & Secondary Structure", margin, y); // Removed -5
    y += 7; // Move down for legend

    // Legend Row (Below Header)
    const legendY = y;
    let legendX = margin;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // SS Legend
    doc.text("Secondary Structure:", legendX, legendY);
    legendX += 35;

    doc.setFillColor(239, 68, 68); doc.rect(legendX, legendY - 3, 4, 4, 'F');
    doc.text("Helix", legendX + 5, legendY); legendX += 20;

    doc.setFillColor(234, 179, 8); doc.rect(legendX, legendY - 3, 4, 4, 'F');
    doc.text("Sheet", legendX + 5, legendY); legendX += 20;

    doc.setFillColor(229, 231, 235); doc.rect(legendX, legendY - 3, 4, 4, 'F');
    doc.text("Coil", legendX + 5, legendY); legendX += 25;

    // Hydro Legend
    doc.text("Hydrophobicity:", legendX, legendY); legendX += 28;
    // Gradient
    doc.setFillColor(59, 130, 246); doc.rect(legendX, legendY - 3, 10, 4, 'F');
    doc.setFillColor(255, 255, 255); doc.rect(legendX + 10, legendY - 3, 10, 4, 'F');
    doc.setFillColor(249, 115, 22); doc.rect(legendX + 20, legendY - 3, 10, 4, 'F');
    // Labels
    doc.setFontSize(7);
    doc.text("Hydrophilic", legendX, legendY + 4);
    doc.text("Hydrophobic", legendX + 22, legendY + 4);

    y += 10; // Space after legend

    const fontSize = 8; // Increased from 4
    doc.setFont("courier", "bold");
    doc.setFontSize(fontSize);

    let currentChain = "";

    labels.forEach((l) => {
        // Chain Change Detection
        if (l.chain !== currentChain) {
            // If not first chain, add extra spacing
            if (currentChain !== "") {
                y += boxSize + 14; // Gap between chains (increased for profile)
                x = margin;
            } else {
                y += 5; // Initial gap after header
            }

            // Draw Chain Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.text(`Chain ${l.chain}`, margin, y - 2);
            doc.setFont("courier", "normal");
            doc.setFontSize(fontSize);
            doc.setTextColor(0);

            currentChain = l.chain;

            // Check page break for new chain block
            if (y > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
                doc.text(`Chain ${l.chain} (cont.)`, margin, y - 2);
            }
        }

        // Parse residue name
        const parts = l.label.split(' ');
        const resName3 = parts[0];
        const map: any = { 'ALA': 'A', 'ARG': 'R', 'ASN': 'N', 'ASP': 'D', 'CYS': 'C', 'GLU': 'E', 'GLN': 'Q', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I', 'LEU': 'L', 'LYS': 'K', 'MET': 'M', 'PHE': 'F', 'PRO': 'P', 'SER': 'S', 'THR': 'T', 'TRP': 'W', 'TYR': 'Y', 'VAL': 'V' };
        const letter = map[resName3] || '?';

        // 1. SS Box
        const ss = (l.ss || '').toLowerCase();
        if (ss === 'h') doc.setFillColor(239, 68, 68); // Red
        else if (ss === 's' || ss === 'e') doc.setFillColor(234, 179, 8); // Yellow
        else doc.setFillColor(243, 244, 246); // Gray-100 (Coil)

        // Check if next box fits
        if (x + boxSize > margin + maxWidth) {
            x = margin;
            y += boxSize + 4; // Add extra vertical space for the specific hydrophobic strip row

            // Check page break
            if (y > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
            }
        }

        doc.rect(x, y, boxSize, boxSize, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text(letter, x + 1.5, y + 4);

        // 2. Hydrophobicity Strip (Underneath)
        const hydroColor = getHydrophobicityColor(resName3);
        doc.setFillColor(hydroColor[0], hydroColor[1], hydroColor[2]);
        doc.rect(x, y + boxSize, boxSize, 2, 'F'); // 2px high strip

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
    labels: any[],
    qrCodeDataUrl: string | null = null,
    pdbMetadata: PDBMetadata | null = null,
    pdbAccession?: string
) => {
    const margin = 20;
    let y = 20;

    // 1. Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Protein Contact Analysis Report", margin, y);
    y += 10;

    // QR Code (Top Right of Page) - "Scan to Interact"
    if (qrCodeDataUrl) {
        const qrSize = 25;
        const pageW = doc.internal.pageSize.getWidth();
        const qrX = pageW - margin - qrSize;
        const qrY = 15; // Top alignment

        doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Scan to Interact", qrX + (qrSize / 2), qrY + qrSize + 4, { align: 'center' });
        doc.setTextColor(0); // Reset
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, y);
    y += 15;

    // 2. Main Layout: Left (Info) vs Right (Snapshot)
    const midX = 105;

    // -- Stats Box (Left) --
    // Calculate Height Dynamically
    const nameLines = doc.splitTextToSize(`Name: ${proteinName}`, 70);
    const nameHeight = nameLines.length * 5;
    // Base height breakdown (approx):
    // Top Pad (10) + Struct Header (8) + Name (nameHeight) + Res (5) + Chains (5) + 
    // Metadata block (approx 20 if present) + Int Header (8) + Stats (25) + Bottom Pad (5)

    // Metadata Height
    let metadataHeight = 0;
    if (pdbMetadata) {
        metadataHeight = 25; // Extra space for method, resolution, etc.
    }
    if (pdbAccession) {
        metadataHeight += 5;
    }

    const contentHeight = 10 + 8 + nameHeight + 5 + 5 + metadataHeight + 10 + 8 + 25 + 5;

    doc.setDrawColor(200);
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(margin, y, 80, contentHeight, 'FD'); // Dynamic Height box

    let innerY = y + 10;
    const leftPad = margin + 5;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Structure Overview", leftPad, innerY);
    innerY += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Wrap Name
    doc.text(nameLines, leftPad, innerY);
    innerY += nameHeight;

    if (pdbAccession) {
        doc.text(`PDB Code: ${pdbAccession}`, leftPad, innerY); innerY += 5;
    }

    doc.text(`Residues: ${metadata.residueCount}`, leftPad, innerY); innerY += 5;
    doc.text(`Chains: ${metadata.chains.join(', ')}`, leftPad, innerY); innerY += 5;

    // PDB Metadata (If available)
    if (pdbMetadata) {
        innerY += 3;
        doc.setFontSize(8);
        doc.setTextColor(100);

        doc.text(`Method: ${pdbMetadata.method}`, leftPad, innerY); innerY += 4;
        doc.text(`Resolution: ${pdbMetadata.resolution}`, leftPad, innerY); innerY += 4;

        if (pdbMetadata.organism && pdbMetadata.organism !== 'Unknown source') {
            doc.text(`Source: ${pdbMetadata.organism}`, leftPad, innerY); innerY += 4;
        }

        doc.text(`Date: ${pdbMetadata.depositionDate}`, leftPad, innerY); innerY += 6;

        doc.setFontSize(9);
        doc.setTextColor(0);
    } // end metadata block

    innerY += 5;

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
    printStat("Pi-Stacking & Cation-Pi", stats['Pi-Stacking'] + stats['Cation-Pi Interaction'], "#a855f7");

    // -- 3D Snapshot (Right) --
    if (snapshot) {
        // Fit within box roughly 80x80
        const boxSize = 75;

        doc.setDrawColor(200);

        try {
            const imgProps = doc.getImageProperties(snapshot);
            const ratio = imgProps.width / imgProps.height;

            let drawW = boxSize;
            let drawH = boxSize / ratio;

            if (drawH > boxSize) {
                drawH = boxSize;
                drawW = boxSize * ratio;
            }

            // Center it in the 75x75 area
            const offsetX = (boxSize - drawW) / 2;
            const offsetY = (boxSize - drawH) / 2;

            doc.addImage(snapshot, 'PNG', midX + offsetX, y + offsetY, drawW, drawH);

            // Caption - Closer & Prominent
            doc.setFont("helvetica", "bold"); // Bold
            doc.setFontSize(9);
            doc.setTextColor(50);
            // Move closer (Relative to actual image bottom)
            doc.text("Fig 1. 3D Structure Snapshot", midX, y + offsetY + drawH + 5);

        } catch (e) {
            // Fallback
            doc.addImage(snapshot, 'PNG', midX, y, boxSize, boxSize);
        }
    }



    // Dynamic Y increment to prevent overlap
    // Snapshot area is approx 80-90 high. Info box is contentHeight.
    // We take the max of both + padding.
    const neededHeight = Math.max(90, contentHeight + 15);
    y += neededHeight;

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

    return y + 10;
};

const addSection = (
    doc: jsPDF,
    title: string,
    data: InteractionData,
    filterFn: (type: string | null, l1?: any, l2?: any) => boolean,
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
            if (filterFn(type, l1, l2)) {
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

// Helper: Add Ligand Section
const addLigandSection = (doc: jsPDF, interactions: import('../types').LigandInteraction[]) => {
    if (interactions.length === 0) return;

    doc.addPage();
    let y = 20;
    const margin = 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Ligand Interactions", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text("Contacts within 5.0Å of non-polymer heteroatoms (ligands, cofactors).", margin, y);
    y += 15;

    // Track counts to handle duplicates (e.g. multiple CD ions on Chain A)
    const ligandCounts: Record<string, number> = {};

    interactions.forEach(ligand => {
        // Check space
        if (y > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            y = 20;
        }

        const key = `${ligand.ligandName}_${ligand.ligandChain}`;
        ligandCounts[key] = (ligandCounts[key] || 0) + 1;
        const count = ligandCounts[key];

        // Subheader - Simplified Format: "LigandName #N (Chain Identifier)"
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFillColor(243, 244, 246); // Gray-100
        doc.rect(margin, y - 5, 180, 8, 'F');

        // E.g. "CD #1 (Chain A)", "CD #2 (Chain A)"
        doc.text(`${ligand.ligandName} #${count} (Chain ${ligand.ligandChain})`, margin + 3, y + 1);
        y += 8;

        // Table
        const rows = ligand.contacts.map(c => {
            // User requested to match the 3D viewer's numbering (PDB Numbering)
            // So we revert back to using residueNumber (e.g. "LYS 127") instead of sequential index
            const resLabel = `${c.residueName} ${c.residueNumber}`;

            return [
                // `${c.residueChain}:${c.residueName} ${c.residueNumber}`, <-- Old
                `${c.residueChain}:${resLabel}`,
                `${c.distance.toFixed(2)} Å`,
                // Simple inference for type based on distance (can be refined later if we pass type)
                c.distance < 3.5 ? (c.residueName === 'CYS' ? 'Potential Bonding' : 'Hydrogen Bond (Est.)') : 'Hydrophobic/VdW'
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Contact Residue', 'Distance', 'Interaction Est.']],
            body: rows,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [75, 85, 99], textColor: 255 }, // Gray-600
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 30 },
                2: { cellWidth: 50 }
            },
            margin: { left: margin + 5 }
        });

        y = (doc as any).lastAutoTable.finalY + 15;
    });
};

// Helper: Add page numbers to all pages
const addPageNumbers = (doc: jsPDF) => {
    const pageCount = doc.internal.pages.length - 1; // First element is metadata
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
};

// Helper: Add Table of Contents
const addTableOfContents = (
    doc: jsPDF,
    sections: { title: string; page: number }[],
    startY: number = 30,
    renderNumbers: boolean = true
) => {
    const margin = 20;
    let y = startY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text("Table of Contents", margin, y);
    y += 10;

    // Underline
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, 190, y);
    y += 10;

    // List sections
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50);

    sections.forEach((section) => {
        const dotWidth = 140;
        const pageNumX = 180;

        // Section title with link
        // Link only works if we have valid page numbers (pass 2)
        if (renderNumbers && section.page > 0) {
            doc.textWithLink(section.title, margin, y, { pageNumber: section.page });
        } else {
            doc.text(section.title, margin, y);
        }

        // Dots
        const titleWidth = doc.getTextWidth(section.title);
        const dots = '.'.repeat(Math.floor((dotWidth - titleWidth) / 2));
        doc.setTextColor(150);
        doc.text(dots, margin + titleWidth + 2, y);

        // Page number
        if (renderNumbers) {
            doc.setTextColor(50);
            doc.text(section.page.toString(), pageNumX, y, { align: 'right' });
        }

        y += 7;
    });

    return y; // Return end Y position
};



export const generateProteinReport = async (
    proteinName: string,
    _canvasIgnored: HTMLCanvasElement,
    data: InteractionData,
    metadata: ProteinMetadata,
    snapshot: string | null = null,
    currentUrl: string | null = null,
    pdbMetadata: PDBMetadata | null = null,
    ligandInteractions: import('../types').LigandInteraction[] | null = null,
    pdbAccession?: string
) => {
    console.log("[pdfGenerator] Received ligand interactions:", ligandInteractions);
    const doc = new jsPDF();
    const isLightMode = false; // Force DARK MODE for Maps (User Request)

    // Track sections for TOC
    const sections: { title: string; page: number }[] = [];

    // Data Prep
    const stats = calculateStats(data);

    // Generate QR Code
    let qrCodeDataUrl: string | null = null;
    if (currentUrl) {
        try {
            qrCodeDataUrl = await QRCode.toDataURL(currentUrl, {
                margin: 2,
                width: 500,  // Higher resolution for crisp PDF render
                errorCorrectionLevel: 'M' // Balance between size and robustness
            });
        } catch (e) {
            console.error("Failed to generate QR Code", e);
        }
    }

    // PAGE 1: Enhanced Instruction & Overview
    // Note: addInstructionPage might span multiple pages internally.
    // We don't care about overviewEndY anymore because TOC forces a new page.
    addInstructionPage(doc, proteinName, metadata, stats, snapshot, data.labels, qrCodeDataUrl, pdbMetadata, pdbAccession);
    sections.push({ title: 'Overview & Summary', page: 1 });

    // Pre-fill sections with titles for TOC placeholder rendering
    // NOTE: Order must match generation order below
    sections.push({ title: 'All Significant Interactions', page: 0 });
    sections.push({ title: 'Salt Bridges (Ionic)', page: 0 });
    sections.push({ title: 'Disulfide Bonds (Covalent)', page: 0 });
    sections.push({ title: 'Hydrophobic Clusters', page: 0 });
    sections.push({ title: 'Pi-Stacking & Cation-Pi', page: 0 });
    if (metadata.chainCount > 1) {
        sections.push({ title: 'Interface Analysis', page: 0 });
    }
    // Ligand Section Placeholder
    if (ligandInteractions && ligandInteractions.length > 0) {
        sections.push({ title: 'Ligand Interactions', page: 0 });
    }

    // PAGE BREAK -> TOC
    doc.addPage();
    const tocStartPage = doc.internal.pages.length - 1;
    const tocStartY = 30; // Start fresh at top of page

    // Render TOC placeholders
    addTableOfContents(doc, sections, tocStartY, false);

    // PAGE BREAK -> All Significant Interactions
    doc.addPage();

    // Helper to get current page number
    const getCurPage = () => doc.internal.pages.length - 1;

    // PAGE 2+: Analysis Sections

    // Add all analysis sections and track their pages
    const allFilter = (t: string | null) => t !== null && t !== 'Close Contact';

    // Capture START page for "All Significant Interactions" (which starts on the current new page)
    sections[1].page = getCurPage();
    // Pass newPage=false because we just added the page manually above
    addSection(doc, "All Significant Interactions", data, allFilter, isLightMode, false, 20);

    // Subsequent sections use newPage=true (default) which does doc.addPage() internally
    sections[2].page = getCurPage() + 1;
    addSection(doc, "Salt Bridges (Ionic Interactions)", data, (t) => t === 'Salt Bridge', isLightMode, true);

    sections[3].page = getCurPage() + 1;
    addSection(doc, "Disulfide Bonds", data, (t) => t === 'Disulfide Bond', isLightMode, true);

    sections[4].page = getCurPage() + 1;
    addSection(doc, "Hydrophobic Contacts", data, (t) => t === 'Hydrophobic Contact', isLightMode, true);

    sections[5].page = getCurPage() + 1;
    addSection(doc, "Pi-Stacking & Cation-Pi", data, (t) => t === 'Pi-Stacking' || t === 'Cation-Pi Interaction', isLightMode, true);

    let nextSectionIdx = 6;
    if (metadata.chainCount > 1) {
        sections[nextSectionIdx].page = getCurPage() + 1;
        addSection(doc, "Interface Analysis (Chain Interactions)", data, (_t, l1, l2) => {
            if (l1 && l2 && l1.chain !== l2.chain) return true;
            return false;
        }, isLightMode, true);
        nextSectionIdx++;
    }

    // Ligand Interactions
    if (ligandInteractions && ligandInteractions.length > 0) {
        sections[nextSectionIdx].page = getCurPage() + 1;
        addLigandSection(doc, ligandInteractions);
        nextSectionIdx++;
    }

    // Go back to the TOC page to fill in page numbers
    doc.setPage(tocStartPage);
    addTableOfContents(doc, sections, tocStartY, true); // Render with page numbers

    // Add page numbers to all pages
    addPageNumbers(doc);

    const safeName = proteinName.replace(/[^a-z0-9]/yi, '_').toLowerCase();
    doc.save(`${safeName}_full_report.pdf`);
};
