


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
    bFactors?: number[]; // Added: Per-residue B-factor for coloring sync
}

export interface StructureInfo {
    chains: ChainInfo[];
    ligands: string[];
}

export interface Snapshot {
    id: string;
    url: string;
    timestamp: number;
    description?: string;
    resolutionFactor?: number;
    transparent?: boolean;
    pdbId?: string;
}

export interface Movie {
    id: string;
    url: string; // Blob URL
    blob: Blob;
    timestamp: number;
    duration: number; // in seconds
    format: string; // 'webm' or 'mp4'
    pdbId?: string;
    description?: string;
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
