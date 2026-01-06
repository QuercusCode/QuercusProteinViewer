export interface ChemicalLibraryEntry {
    id: string; // PubChem CID
    title: string;
    category: 'Vitamins' | 'Drugs' | 'Neurotransmitters' | 'Toxins' | 'Metabolites' | 'Hormones' | 'Nutrients' | 'Natural Products';
    description: string;
    formula: string;
    molecularWeight: string;
}

export const CHEMICAL_LIBRARY: ChemicalLibraryEntry[] = [
    // --- VITAMINS ---
    {
        id: '54670067',
        title: 'Vitamin C (Ascorbic Acid)',
        category: 'Vitamins',
        description: 'Essential nutrient for tissue repair and enzyme function.',
        formula: 'C6H8O6',
        molecularWeight: '176.12 g/mol'
    },
    {
        id: '5280453',
        title: 'Vitamin D3 (Cholecalciferol)',
        category: 'Vitamins',
        description: 'Crucial for calcium absorption and bone health.',
        formula: 'C27H44O',
        molecularWeight: '384.6 g/mol'
    },
    {
        id: '5311498',
        title: 'Vitamin B12 (Cobalamin)',
        category: 'Vitamins',
        description: 'Complex coordination complex with Cobalt, vital for nerve function.',
        formula: 'C63H88CoN14O14P',
        molecularWeight: '1355.4 g/mol'
    },
    {
        id: '445354',
        title: 'Vitamin A (Retinol)',
        category: 'Vitamins',
        description: 'Essential for vision, immune system, and reproduction.',
        formula: 'C20H30O',
        molecularWeight: '286.5 g/mol'
    },

    // --- DRUGS ---
    {
        id: '2244',
        title: 'Aspirin (Acetylsalicylic Acid)',
        category: 'Drugs',
        description: 'Common pain reliever and anti-inflammatory.',
        formula: 'C9H8O4',
        molecularWeight: '180.16 g/mol'
    },
    {
        id: '3672',
        title: 'Ibuprofen',
        category: 'Drugs',
        description: 'Nonsteroidal anti-inflammatory drug (NSAID).',
        formula: 'C13H18O2',
        molecularWeight: '206.28 g/mol'
    },
    {
        id: '5959',
        title: 'Penicillin G',
        category: 'Drugs',
        description: 'First antibiotic discovered by Alexander Fleming.',
        formula: 'C16H18N2O4S',
        molecularWeight: '334.4 g/mol'
    },
    {
        id: '4946',
        title: 'Propranolol',
        category: 'Drugs',
        description: 'Beta-blocker used to treat high blood pressure and anxiety.',
        formula: 'C16H21NO2',
        molecularWeight: '259.34 g/mol'
    },
    {
        id: '1983',
        title: 'Acetaminophen (Paracetamol)',
        category: 'Drugs',
        description: 'Pain reliever and fever reducer.',
        formula: 'C8H9NO2',
        molecularWeight: '151.16 g/mol'
    },

    // --- NEUROTRANSMITTERS ---
    {
        id: '681',
        title: 'Dopamine',
        category: 'Neurotransmitters',
        description: 'Plays a major role in reward-motivated behavior.',
        formula: 'C8H11NO2',
        molecularWeight: '153.18 g/mol'
    },
    {
        id: '5202',
        title: 'Serotonin',
        category: 'Neurotransmitters',
        description: 'Regulates mood, appetite, and sleep.',
        formula: 'C10H12N2O',
        molecularWeight: '176.21 g/mol'
    },
    {
        id: '5816',
        title: 'Epinephrine (Adrenaline)',
        category: 'Neurotransmitters',
        description: 'Trigger of the "fight-or-flight" response.',
        formula: 'C9H13NO3',
        molecularWeight: '183.20 g/mol'
    },
    {
        id: '119',
        title: 'GABA (Gamma-Aminobutyric Acid)',
        category: 'Neurotransmitters',
        description: 'Primary inhibitory neurotransmitter in the mammalian central nervous system.',
        formula: 'C4H9NO2',
        molecularWeight: '103.12 g/mol'
    },

    // --- METABOLITES / ENERGY ---
    {
        id: '5957',
        title: 'ATP (Adenosine Triphosphate)',
        category: 'Metabolites',
        description: 'The "molecular unit of currency" of intracellular energy transfer.',
        formula: 'C10H16N5O13P3',
        molecularWeight: '507.18 g/mol'
    },
    {
        id: '5793',
        title: 'Glucose (D-Glucose)',
        category: 'Metabolites',
        description: 'Primary source of energy for living organisms.',
        formula: 'C6H12O6',
        molecularWeight: '180.16 g/mol'
    },
    {
        id: '5991',
        title: 'Cholesterol',
        category: 'Metabolites',
        description: 'Essential structural component of all animal cell membranes.',
        formula: 'C27H46O',
        molecularWeight: '386.6 g/mol'
    },
    {
        id: '784',
        title: 'Heme B',
        category: 'Metabolites',
        description: 'Iron-containing cofactor in hemoglobin.',
        formula: 'C34H32FeN4O4',
        molecularWeight: '616.5 g/mol'
    },

    // --- TOXINS ---
    {
        id: '6324668',
        title: 'Tetrodotoxin',
        category: 'Toxins',
        description: 'Potent neurotoxin found in pufferfish.',
        formula: 'C11H17N3O8',
        molecularWeight: '319.27 g/mol'
    },
    {
        id: '2907',
        title: 'Aflatoxin B1',
        category: 'Toxins',
        description: 'Carcinogenic toxin produced by Aspergillus molds.',
        formula: 'C17H12O6',
        molecularWeight: '312.27 g/mol'
    },
    {
        id: '4768',
        title: 'Strychnine',
        category: 'Toxins',
        description: 'Highly toxic alkaloid used as a pesticide.',
        formula: 'C21H22N2O2',
        molecularWeight: '334.4 g/mol'
    },

    // --- HORMONES ---
    {
        id: '6013',
        title: 'Testosterone',
        category: 'Hormones',
        description: 'Primary male sex hormone and anabolic steroid.',
        formula: 'C19H28O2',
        molecularWeight: '288.4 g/mol'
    },
    {
        id: '5757',
        title: 'Estradiol',
        category: 'Hormones',
        description: 'Major female sex hormone.',
        formula: 'C18H24O2',
        molecularWeight: '272.38 g/mol'
    },
    {
        id: '5754',
        title: 'Cortisol',
        category: 'Hormones',
        description: 'Steroid hormone produced in response to stress.',
        formula: 'C21H30O5',
        molecularWeight: '362.46 g/mol'
    },

    // --- NATURAL PRODUCTS ---
    {
        id: '2519',
        title: 'Caffeine',
        category: 'Natural Products',
        description: 'Central nervous system stimulant.',
        formula: 'C8H10N4O2',
        molecularWeight: '194.19 g/mol'
    },
    {
        id: '44259',
        title: 'Theobromine',
        category: 'Natural Products',
        description: 'Bitter alkaloid of the cacao plant (chocolate).',
        formula: 'C7H8N4O2',
        molecularWeight: '180.16 g/mol'
    },
    {
        id: '5280343',
        title: 'Quercetin',
        category: 'Natural Products',
        description: 'Plant flavonol from the oak family.',
        formula: 'C15H10O7',
        molecularWeight: '302.24 g/mol'
    },
    {
        id: '1548943',
        title: 'Capsaicin',
        category: 'Natural Products',
        description: 'Active component of chili peppers.',
        formula: 'C18H27NO3',
        molecularWeight: '305.41 g/mol'
    },
    {
        id: '969516',
        title: 'Curcumin',
        category: 'Natural Products',
        description: 'Bright yellow chemical produced by turmeric.',
        formula: 'C21H20O6',
        molecularWeight: '368.38 g/mol'
    },
];
