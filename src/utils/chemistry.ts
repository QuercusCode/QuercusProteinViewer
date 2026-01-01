
// Basic amino acid masses (average isotopic mass)
const AA_MASS: Record<string, number> = {
    A: 71.0788, R: 156.1875, N: 114.1038, D: 115.0886, C: 103.1388,
    E: 129.1155, Q: 128.1307, G: 57.0519, H: 137.1411, I: 113.1594,
    L: 113.1594, K: 128.1741, M: 131.1926, F: 147.1766, P: 97.1167,
    S: 87.0782, T: 101.1051, W: 186.2132, Y: 163.1760, V: 99.1326
};

// pKa values for pI calculation (EMBOSS scale)
const PKA: Record<string, number> = {
    'N_TERM': 8.6,
    'K': 10.8,
    'R': 12.5,
    'H': 6.5, // Histidine is complex, often ~6.0-6.5
    'D': 3.9,
    'E': 4.1,
    'C': 8.5,
    'Y': 10.1,
    'C_TERM': 3.6
};

export const calculateMW = (sequence: string): number => {
    let mw = 0;
    // Add N-term H (1.008) and C-term OH (17.007) roughly = 18.015 for water weight added back
    // But AA_MASS tables usually account for residue mass (amino acid - water).
    // Total MW = Sum(ResidueMasses) + 18.0153 (Water for termini)
    const seq = sequence.toUpperCase();
    for (let i = 0; i < seq.length; i++) {
        mw += AA_MASS[seq[i]] || 0;
    }
    return mw + 18.0153;
};

export const calculateIsoelectricPoint = (sequence: string): number => {
    const seq = sequence.toUpperCase();

    // Count charged groups
    const counts: Record<string, number> = {
        'D': 0, 'E': 0, 'C': 0, 'Y': 0, 'H': 0, 'K': 0, 'R': 0
    };

    for (const char of seq) {
        if (counts[char] !== undefined) counts[char]++;
    }

    // Iterative algorithm to find pH where Net Charge = 0
    let min = 0;
    let max = 14;
    let pH = 7;
    let charge = 0;

    for (let i = 0; i < 20; i++) { // 20 iterations is plenty for precision
        pH = (min + max) / 2;

        // Positive Charges (N-term + K + R + H)
        // Q = 1 / (1 + 10^(pH - pKa))
        let pos = 0;
        pos += 1 / (1 + Math.pow(10, pH - PKA['N_TERM']));
        pos += counts['K'] / (1 + Math.pow(10, pH - PKA['K']));
        pos += counts['R'] / (1 + Math.pow(10, pH - PKA['R']));
        pos += counts['H'] / (1 + Math.pow(10, pH - PKA['H']));

        // Negative Charges (C-term + D + E + C + Y)
        // Q = -1 / (1 + 10^(pKa - pH))
        let neg = 0;
        neg += -1 / (1 + Math.pow(10, PKA['C_TERM'] - pH));
        neg += -counts['D'] / (1 + Math.pow(10, PKA['D'] - pH));
        neg += -counts['E'] / (1 + Math.pow(10, PKA['E'] - pH));
        neg += -counts['C'] / (1 + Math.pow(10, PKA['C'] - pH));
        neg += -counts['Y'] / (1 + Math.pow(10, PKA['Y'] - pH));

        charge = pos + neg;

        if (charge > 0) {
            min = pH;
        } else {
            max = pH;
        }
    }

    return Math.round(pH * 100) / 100;
};

export const getAminoAcidComposition = (sequence: string) => {
    const counts: Record<string, number> = {};
    const categories = {
        hydrophobic: 0,
        polar: 0,
        charged_pos: 0,
        charged_neg: 0
    };

    const types: Record<string, string> = {
        A: 'hydrophobic', V: 'hydrophobic', L: 'hydrophobic', I: 'hydrophobic', M: 'hydrophobic', F: 'hydrophobic', W: 'hydrophobic', P: 'hydrophobic',
        G: 'polar', S: 'polar', T: 'polar', C: 'polar', Y: 'polar', N: 'polar', Q: 'polar',
        K: 'charged_pos', R: 'charged_pos', H: 'charged_pos',
        D: 'charged_neg', E: 'charged_neg'
    };

    for (const char of sequence.toUpperCase()) {
        counts[char] = (counts[char] || 0) + 1;
        const cat = types[char];
        if (cat === 'hydrophobic') categories.hydrophobic++;
        else if (cat === 'polar') categories.polar++;
        else if (cat === 'charged_pos') categories.charged_pos++;
        else if (cat === 'charged_neg') categories.charged_neg++;
    }

    return { counts, categories, length: sequence.length };
};
