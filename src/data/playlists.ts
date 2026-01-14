export interface PlaylistTrack {
    id: string; // PDB ID or CID
    source: 'pdb' | 'pubchem';
    title: string;
    description: string; // Text to be spoken
    duration?: number; // Override default duration (e.g. 10s)
    cameraAngle?: { position: [number, number, number], rotation: [number, number, number] }; // Optional
}

export interface Playlist {
    id: string;
    title: string;
    description: string;
    coverColor: string; // Tailwind class
    icon?: string; // Optional lucide icon name (handled in UI)
    tracks: PlaylistTrack[];
}

export const PLAYLISTS: Playlist[] = [
    {
        id: 'vitamins',
        title: 'Essential Vitamins',
        description: 'The organic compounds your body needs to thrive.',
        coverColor: 'bg-orange-500',
        tracks: [
            {
                id: 'CID:54670067',
                source: 'pubchem',
                title: 'Vitamin C (Ascorbic Acid)',
                description: 'Vitamin C is essential for tissue repair and immune function. It is a potent antioxidant found in citrus fruits.'
            },
            {
                id: 'CID:784',
                source: 'pubchem',
                title: 'Vitamin B12 (Cobalamin)',
                description: 'Vitamin B12 is crucial for nerve tissue health, brain function, and the production of red blood cells. It contains a rare Cobalt atom at its core.'
            },
            {
                id: 'CID:5280343',
                source: 'pubchem',
                title: 'Vitamin A (Retinol)',
                description: 'Vitamin A is vital for maintaining good vision, a healthy immune system, and cell growth.'
            },
            {
                id: 'CID:5288352',
                source: 'pubchem',
                title: 'Vitamin D3 (Cholecalciferol)',
                description: 'Vitamin D helps regulate the amount of calcium and phosphate in the body, keeping bones, teeth and muscles healthy.'
            }
        ]
    },
    {
        id: 'toxins',
        title: 'Deadliest Toxins',
        description: 'Nature\'s most dangerous molecular machines.',
        coverColor: 'bg-purple-600',
        tracks: [
            {
                id: '3BTA',
                source: 'pdb',
                title: 'Botulinum Neurotoxin',
                description: 'Botulinum toxin is one of the most lethal substances known. It blocks nerve signals to muscles, causing paralysis. Paradoxically, it is used safely in medicine as Botox.'
            },
            {
                id: '1AA5',
                source: 'pdb',
                title: 'Ricin',
                description: 'Ricin is a highly potent toxin produced in the seeds of the castor oil plant. It works by inactivating ribosomes, effectively shutting down protein production in cells.'
            },
            {
                id: '1XTC',
                source: 'pdb',
                title: 'Cholera Toxin',
                description: 'Cholera toxin is responsible for the massive watery diarrhea characteristic of cholera infection. It disrupts the signaling pathways in intestinal cells.'
            }

        ]

    }
];
