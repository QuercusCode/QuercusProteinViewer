import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InteractionData {
    matrix: number[][];
    size: number;
    labels: { resNo: number; chain: string; label: string; ss: string }[];
}

export const generateProteinReport = (
    proteinName: string,
    contactMapCanvas: HTMLCanvasElement,
    data: InteractionData
) => {
    // 1. Initialize PDF
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 15;

    // --- HEADER ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Protein Analysis Report", margin, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Protein: ${proteinName || "Unknown Structure"}`, margin, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 36);
    doc.text(`Residues: ${data.size}`, width - margin - 40, 30);

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(margin, 42, width - margin, 42);


    // --- CONTACT MAP IMAGE ---
    // Capture the canvas as an image
    const mapImg = contactMapCanvas.toDataURL("image/png");

    // Calculate aspect ratio to fit page width
    const imgProps = doc.getImageProperties(mapImg);
    const pdfImgWidth = width - (margin * 2);
    const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Contact Map", margin, 55);

    doc.addImage(mapImg, 'PNG', margin, 60, pdfImgWidth, pdfImgHeight);


    // --- INTERACTIONS TABLE ---
    // Extract "Key Interactions" (Salt Bridges, etc - purely distance based for now < 4A)
    // We want to avoid listing 10,000 hydrophobic contacts.
    // Let's filter for:
    // 1. Inter-chain contacts (Interface) < 5A
    // 2. Strong Salt Bridges (Arg/Lys <-> Asp/Glu) < 4A

    const relevantInteractions = [] as any[];
    const { matrix, labels } = data;

    // Helper to detect residue type
    const getResType = (l: string) => l.trim().split(' ')[0].toUpperCase();
    const POSITIVE = ['ARG', 'LYS', 'HIS'];
    const NEGATIVE = ['ASP', 'GLU'];

    for (let i = 0; i < matrix.length; i++) {
        for (let j = i + 1; j < matrix.length; j++) {
            const dist = matrix[i][j];
            if (dist > 5.0) continue; // Skip far stuff

            const l1 = labels[i];
            const l2 = labels[j];

            const r1 = getResType(l1.label);
            const r2 = getResType(l2.label);

            let type = "Contact";
            let score = 0;

            // Rule 1: Salt Bridge
            const isSaltBridge = (POSITIVE.includes(r1) && NEGATIVE.includes(r2)) || (POSITIVE.includes(r2) && NEGATIVE.includes(r1));

            if (isSaltBridge && dist < 4.0) {
                type = "Salt Bridge";
                score = 10;
            } else if (l1.chain !== l2.chain) {
                type = "Interface";
                score = 5;
            } else if (dist < 3.5) {
                type = "Close Contact";
                score = 1;
            } else {
                continue; // Skip generic proximal contacts to save space
            }

            relevantInteractions.push({
                res1: `${l1.chain}:${l1.label}`,
                res2: `${l2.chain}:${l2.label}`,
                dist: dist.toFixed(2) + " Å",
                type: type,
                score: score
            });
        }
    }

    // Sort by score (Salt bridges first) then distance
    relevantInteractions.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return parseFloat(a.dist) - parseFloat(b.dist);
    });

    // Top 50 only
    const topInteractions = relevantInteractions.slice(0, 50);

    // Add Table
    let tableStartY = 60 + pdfImgHeight + 20;

    // Check if table fits on page, else new page
    if (tableStartY > height - 50) {
        doc.addPage();
        tableStartY = 20;
    }

    doc.text("Top Significant Interactions", margin, tableStartY - 5);

    autoTable(doc, {
        startY: tableStartY,
        head: [['Residue A', 'Residue B', 'Distance', 'Type']],
        body: topInteractions.map(row => [row.res1, row.res2, row.dist, row.type]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // Blue-500
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
    });

    // Save
    const safeName = proteinName.replace(/[^a-z0-9]/yi, '_').toLowerCase();
    doc.save(`${safeName}_report.pdf`);
};
