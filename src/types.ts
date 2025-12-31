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

export interface ChainInfo {
    name: string;
    min: number;
    max: number;
    sequence: string;
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

export type RepresentationType = 'cartoon' | 'licorice' | 'backbone' | 'spacefill' | 'surface' | 'ribbon';
export type ColoringType = 'chainid' | 'element' | 'residue' | 'secondary' | 'hydrophobicity' | 'structure' | 'bfactor' | 'charge';
export type ColorPalette = 'standard' | 'viridis' | 'magma' | 'cividis' | 'plasma';
