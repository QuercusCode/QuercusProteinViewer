import type { ChainInfo } from '../types';

export interface MotifMatch {
    chain: string;
    startIndex: number; // 0-based sequence index
    endIndex: number;   // 0-based sequence index, inclusive
    startResNo: number; // Actual PDB residue number
    endResNo: number;   // Actual PDB residue number
    sequence: string;   // The matched sub-sequence
    residues: number[]; // Array of actual residue numbers involved
}

/**
 * Maps standard 1-letter amino acid codes to their full names (optional helper)
 */
export const AMINO_ACID_MAP: { [key: string]: string } = {
    'A': 'ALA', 'R': 'ARG', 'N': 'ASN', 'D': 'ASP', 'C': 'CYS',
    'Q': 'GLN', 'E': 'GLU', 'G': 'GLY', 'H': 'HIS', 'I': 'ILE',
    'L': 'LEU', 'K': 'LYS', 'M': 'MET', 'F': 'PHE', 'P': 'PRO',
    'S': 'SER', 'T': 'THR', 'W': 'TRP', 'Y': 'TYR', 'V': 'VAL',
    'X': 'UNK'
};

/**
 * Searches for a motif pattern within the provided chains.
 * Supported syntax:
 * - Standard 1-letter codes (e.g. "A", "R")
 * - Wildcards: "x" or "?" matches any amino acid
 * - Separators: "-" or spaces are ignored (e.g. "R-G-D" -> "RGD")
 * - Case insensitive
 */
export const findMotifs = (chains: ChainInfo[], pattern: string): MotifMatch[] => {
    if (!pattern || pattern.trim().length === 0) return [];

    // 1. Clean and normalize the pattern
    // Remove dashes and spaces, convert to upper case
    // Replace '?' with 'X' for internal wildcard handling if needed, 
    // but ultimately valid AA codes are A-Z. 
    // We treat 'X' as the wildcard char for matching logic.
    let cleanPattern = pattern.replace(/[\-\s]/g, '').toUpperCase();

    // Replace '?' with 'X'
    cleanPattern = cleanPattern.replace(/\?/g, 'X');
    cleanPattern = cleanPattern.replace(/\./g, 'X'); // Allow dot as wildcard too regex style

    // Validate characters (only Allow A-Z)
    if (!/^[A-Z]+$/.test(cleanPattern)) {
        console.warn("Invalid characters in search pattern");
        return [];
    }

    // Convert to Regex
    // 'X' becomes '.', everything else is literal
    const regexString = cleanPattern.split('').map(char => {
        return (char === 'X') ? '.' : char;
    }).join('');

    // Use positive lookahead if we want overlapping? usually not for motifs.
    // Standard regex
    const regex = new RegExp(regexString, 'g');

    const matches: MotifMatch[] = [];

    chains.forEach(chain => {
        if (!chain.sequence) return;

        // Reset regex state for each chain
        regex.lastIndex = 0;

        let match;
        while ((match = regex.exec(chain.sequence)) !== null) {
            const seqIndex = match.index;
            const matchedSeq = match[0];
            const endIndex = seqIndex + matchedSeq.length - 1;

            // Resolve actual residue numbers
            // If residueMap exists, use it. Otherwise fallback to min + index (approx)
            let startResNo = 0;
            let endResNo = 0;
            const residueList: number[] = [];

            if (chain.residueMap) {
                startResNo = chain.residueMap[seqIndex];
                endResNo = chain.residueMap[endIndex];

                // Collect all residue numbers in the match
                for (let i = 0; i < matchedSeq.length; i++) {
                    residueList.push(chain.residueMap[seqIndex + i]);
                }
            } else {
                // Fallback (unsafe but better than crash)
                startResNo = chain.min + seqIndex;
                endResNo = chain.min + endIndex;
                for (let i = 0; i < matchedSeq.length; i++) {
                    residueList.push(startResNo + i);
                }
            }

            matches.push({
                chain: chain.name,
                startIndex: seqIndex,
                endIndex: endIndex,
                startResNo,
                endResNo,
                sequence: matchedSeq,
                residues: residueList
            });
        }
    });

    return matches;
};
