export interface MotifEntry {
    name: string;
    pattern: string;
    description: string;
}

export const MOTIF_LIBRARY: MotifEntry[] = [
    {
        name: "Custom Pattern",
        pattern: "",
        description: "Enter your own regex pattern"
    },
    {
        name: "Zinc Finger (C2H2)",
        pattern: "C.{2,4}C.{12}H.{3,5}H",
        description: "DNA-binding domain (C-x(2,4)-C-x(12)-H-x(3,5)-H)"
    },
    {
        name: "Integrin Binding (RGD)",
        pattern: "RGD",
        description: "Cell adhesion motif"
    },
    {
        name: "N-glycosylation Site",
        pattern: "N[^P][ST][^P]",
        description: "Attachment site for N-linked sugars (N-{P}-[ST]-{P})"
    },
    {
        name: "Leucine Zipper",
        pattern: "L.{6}L.{6}L.{6}L",
        description: "Dimerization domain (L-x(6)-L-x(6)-L-x(6)-L)"
    },
    {
        name: "P-loop (Kinase)",
        pattern: "[AG].{4}GK[ST]",
        description: "Phosphate binding loop in ATP/GTP-binding proteins"
    },
    {
        name: "Nuclear Localization Signal",
        pattern: "K[K R]x[K R]",
        description: "Tags protein for import into nucleus (K-[KR]-x-[KR])"
    },
    {
        name: "EF-Hand (Calcium Binding)",
        pattern: "D.{1}D[DNS].{1}[GT].{1}[E].{2}[E]",
        description: "Calcium binding motif (Simplified)"
    },
    {
        name: "DEAD Box (RNA Helicase)",
        pattern: "DEAD",
        description: "ATP-dependent RNA helicase core (Asp-Glu-Ala-Asp)"
    },
    {
        name: "CaaX Box (Membrane Anchor)",
        pattern: "C.{2}[LIMV]",
        description: "Prenylation site (Cys-any-any-Leu/Ile/Met/Val)"
    },
    {
        name: "Walker B (ATP Hydrolysis)",
        pattern: "[LIVM]{4}D",
        description: "Hydrophobic core + Aspartate (hhhhD)"
    },
    {
        name: "Collagen Repeat",
        pattern: "G.P",
        description: "Triple helix structural motif (Gly-any-Pro)"
    },
    {
        name: "Destruction Box (APC/C)",
        pattern: "R..L.{4}N",
        description: "Target for ubiquitination (R-x-x-L-x(4)-N)"
    }
];
