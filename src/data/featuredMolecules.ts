export interface FeaturedMolecule {
    id: string;
    title: string;
    description: string;
    details: string; // The "Did you know?" or deep dive context
    category: string;
}

export const FEATURED_MOLECULES: FeaturedMolecule[] = [
    {
        id: '4HHB',
        title: 'Hemoglobin',
        description: 'The oxygen carrier in your blood.',
        details: 'Hemoglobin is the protein in red blood cells that carries oxygen from the lungs to the rest of the body. It consists of four subunits, each protecting a heme group with an iron atom at its center.',
        category: 'Transport'
    },
    {
        id: '1BNA',
        title: 'B-DNA Double Helix',
        description: 'The blueprint of life.',
        details: 'This is the classic structure of the DNA double helix. Two strands of nucleotides spiral around each other, held together by hydrogen bonds between A-T and G-C base pairs.',
        category: 'Genetic Material'
    },
    {
        id: '6VXX',
        title: 'SARS-CoV-2 Spike Protein',
        description: 'The key to coronavirus entry.',
        details: 'The Spike protein allows the virus to penetrate host cells by binding to the ACE2 receptor. It is the primary target for COVID-19 vaccines and neutralizing antibodies.',
        category: 'Viral'
    },
    {
        id: '1GFL',
        title: 'Green Fluorescent Protein (GFP)',
        description: 'Nature\'s flashlight.',
        details: 'Originally found in jellyfish, GFP glows bright green under blue light. Scientists attach it to other proteins to track where they go inside living cells.',
        category: 'Tool'
    },
    {
        id: '3I40',
        title: 'Human Insulin',
        description: 'The blood sugar regulator.',
        details: 'Insulin is a hormone produced by the pancreas. It acts like a key, unlocking cells to allow sugar (glucose) to enter and be used for energy. Its structure helped launch the biotech industry.',
        category: 'Hormone'
    },
    {
        id: '1IGT',
        title: 'Antibody (IgG2a)',
        description: 'The immune system\'s defender.',
        details: 'Antibodies are Y-shaped proteins that identify and neutralize invaders like bacteria and viruses. The tips of the "Y" are hyper-variable to recognize billions of different antigens.',
        category: 'Immune'
    },
    {
        id: '1TIM',
        title: 'Triose Phosphate Isomerase',
        description: 'A "perfect" enzyme.',
        details: 'This enzyme is so efficient that the reaction happens as fast as the molecules can bump into each other (diffusion limit). It features the beautiful "TIM Barrel" fold.',
        category: 'Enzyme'
    },
    {
        id: '4V6X',
        title: '70S Ribosome',
        description: 'The protein factory.',
        details: 'The ribosome is a massive molecular machine that reads RNA instructions to build proteins. It is composed of both RNA and proteins and is the target of many antibiotics.',
        category: 'Macromolecular Complex'
    },
    {
        id: '1MBN',
        title: 'Myoglobin',
        description: 'The first protein structure solved.',
        details: 'Myoglobin stores oxygen in muscle cells. In 1958, John Kendrew solved its structure using X-ray crystallography, revealing the complex 3D folding of proteins for the first time.',
        category: 'Transport'
    },
    {
        id: '1VIS',
        title: 'Cholera Toxin',
        description: 'A deadly molecular machine.',
        details: 'The toxin produced by Vibrio cholerae. It has an AB5 structure: a ring of 5 binding subunits (B) delivers the toxic enzyme (A) into the cell, causing massive dehydration.',
        category: 'Toxin'
    },
    {
        id: '3J7L',
        title: 'Zika Virus',
        description: 'A mosquito-borne pathogen.',
        details: 'The cryo-EM structure of the mature Zika virus. Similar to Dengue, it has a smooth, golf-ball-like surface composed of Envelope proteins arranged in icosahedral symmetry.',
        category: 'Viral'
    },
    {
        id: '1D66',
        title: 'Gal4 Transcription Factor',
        description: 'Reading the genome.',
        details: 'This protein binds to specific DNA sequences to turn genes on. It uses zinc ions (zinc fingers) to stabilize the loops that read the DNA letters.',
        category: 'Regulation'
    }
];
