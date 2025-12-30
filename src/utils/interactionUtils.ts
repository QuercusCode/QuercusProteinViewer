export const getInteractionType = (label1: string, label2: string, dist: number) => {
    if (dist > 8.0) return null;

    // Extract residue name (assumes "ALA 123" format or similar, takes first word)
    const getResName = (l: string) => l.trim().split(' ')[0].toUpperCase();
    const r1 = getResName(label1);
    const r2 = getResName(label2);

    const POSITIVE = ['ARG', 'LYS', 'HIS'];
    const NEGATIVE = ['ASP', 'GLU'];
    const AROMATIC = ['PHE', 'TYR', 'TRP', 'HIS'];
    const HYDROPHOBIC = ['ALA', 'VAL', 'ILE', 'LEU', 'MET', 'PHE', 'TYR', 'TRP', 'CYS', 'PRO'];

    // 1. Disulfide (Specific)
    if (r1 === 'CYS' && r2 === 'CYS' && dist < 3.0) return { type: 'Disulfide Bond', color: 'text-yellow-500', bg: 'bg-yellow-500/10', hex: '#eab308' };

    // 2. Salt Bridge (Strong Electrostatic)
    const isP1 = POSITIVE.includes(r1);
    const isN1 = NEGATIVE.includes(r1);
    const isP2 = POSITIVE.includes(r2);
    const isN2 = NEGATIVE.includes(r2);

    if ((isP1 && isN2) || (isN1 && isP2)) return { type: 'Salt Bridge', color: 'text-red-500', bg: 'bg-red-500/10', hex: '#ef4444' };

    // 3. Cation-Pi
    const isA1 = AROMATIC.includes(r1);
    const isA2 = AROMATIC.includes(r2);
    if ((isP1 && isA2) || (isA1 && isP2)) return { type: 'Cation-Pi Interaction', color: 'text-indigo-500', bg: 'bg-indigo-500/10', hex: '#6366f1' };

    // 4. Pi-Stacking
    if (isA1 && isA2) return { type: 'Pi-Stacking', color: 'text-purple-500', bg: 'bg-purple-500/10', hex: '#a855f7' };

    // 5. Hydrophobic (Generic, check dist < 5.0 for meaningful core packing vs just 8.0 contact)
    const isH1 = HYDROPHOBIC.includes(r1);
    const isH2 = HYDROPHOBIC.includes(r2);
    if (isH1 && isH2 && dist < 5.0) return { type: 'Hydrophobic Contact', color: 'text-green-500', bg: 'bg-green-500/10', hex: '#22c55e' };

    // Fallback for close contacts
    if (dist < 4.0) return { type: 'Close Contact', color: 'text-neutral-500', bg: 'bg-neutral-500/10', hex: '#737373' };

    return null;
};
