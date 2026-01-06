export interface CustomColorRule {
    id: string;
    type: 'chain' | 'residue';
    target: string; // "A" or "10-20"
    color: string;
}


export interface UniProtFeature {
    type: string;
    description: string;
    start: number;
    end: number;
    chain?: string;
}

export interface AtomInfo {
    serial: number;
    name: string;
    element: string;
    resNo: number; // In case we have a few residues
    chain: string;
}

export interface ChainInfo {
    name: string;
    min: number;
    max: number;
    sequence: string;
    residueMap?: number[]; // Added: Maps sequence index to actual PDB residue number
    type?: 'protein' | 'nucleic' | 'unknown'; // Added: To distinguish polymer type
    atoms?: AtomInfo[]; // Added: For small chemicals, list atoms directly
}

export interface StructureInfo {
    chains: ChainInfo[];
    ligands: string[];
}

export interface Snapshot {
    id: string;
    url: string;
    timestamp: number;
}

export interface Movie {
    id: string;
    url: string; // Blob URL
    blob: Blob;
    timestamp: number;
    duration: number; // in seconds
    format: string; // 'webm' or 'mp4'
}

export interface Annotation {
    id: string;
    chain: string;
    resNo: number;
    text: string;
    position: { x: number; y: number; z: number };
}

export interface ResidueInfo {
    chain: string;
    resNo: number;
    resName: string;
    atomIndex?: number;
    atomName?: string;   // Added
    atomSerial?: number; // Added
    element?: string;    // Added
    position?: { x: number; y: number; z: number };
}

export type RepresentationType = 'cartoon' | 'licorice' | 'backbone' | 'spacefill' | 'surface' | 'ribbon' | 'ball+stick' | 'line';
export type ColoringType = 'chainid' | 'residue' | 'secondary' | 'hydrophobicity' | 'structure' | 'bfactor' | 'charge' | 'residueindex';
export type ColorPalette = 'standard' | 'viridis' | 'magma' | 'cividis' | 'plasma';
export type MeasurementTextColor = 'auto' | string;
export type FunctionalGroup = 'aromatic' | 'polar' | 'rings' | 'halogens' | 'sulfur' | 'metals';


export interface PDBMetadata {
    method: string;
    resolution: string;
    organism: string;
    depositionDate: string;
    title?: string;
    formula?: string; // Chemical Formula
    molecularWeight?: number; // Molecular Weight
    cid?: string; // PubChem CID for 2D Image
}

export interface LigandInteraction {
    ligandName: string;
    ligandChain: string;
    ligandResNo: number;
    contacts: {
        residueChain: string;
        residueNumber: number;
        residueSeq?: number; // 1-based sequential index
        residueName: string;
        distance: number;
        type?: string;
    }[];
}

export interface Measurement {
    id: string;
    name: string;
    distance: number;
    color: string;
    atom1: ResidueInfo;
    atom2: ResidueInfo;
}
