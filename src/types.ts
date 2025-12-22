export interface CustomColorRule {
    id: string;
    type: 'chain' | 'residue';
    target: string; // "A" or "10-20"
    color: string;
}


export interface ChainInfo {
    name: string;
    min: number;
    max: number;
    sequence: string;
}

export interface StructureInfo {
    chains: ChainInfo[];
}
