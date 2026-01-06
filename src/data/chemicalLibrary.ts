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
    {
        id: '14985',
        title: 'Vitamin E (Alpha-Tocopherol)',
        category: 'Vitamins',
        description: 'Antioxidant protecting cell membranes from damage.',
        formula: 'C29H50O2',
        molecularWeight: '430.7 g/mol'
    },
    {
        id: '5280483',
        title: 'Vitamin K1 (Phylloquinone)',
        category: 'Vitamins',
        description: 'Essential for blood clotting and bone metabolism.',
        formula: 'C31H46O2',
        molecularWeight: '450.7 g/mol'
    },
    {
        id: '1132',
        title: 'Vitamin B1 (Thiamine)',
        category: 'Vitamins',
        description: 'Enables body to use carbohydrates as energy.',
        formula: 'C12H17ClN4OS',
        molecularWeight: '300.8 g/mol'
    },
    {
        id: '493570',
        title: 'Vitamin B2 (Riboflavin)',
        category: 'Vitamins',
        description: 'Key component of cofactors FAD and FMN.',
        formula: 'C17H20N4O6',
        molecularWeight: '376.36 g/mol'
    },
    {
        id: '938',
        title: 'Vitamin B3 (Niacin)',
        category: 'Vitamins',
        description: 'Precursor to NAD and NADP, carrying metabolic energy.',
        formula: 'C6H5NO2',
        molecularWeight: '123.11 g/mol'
    },
    {
        id: '988',
        title: 'Vitamin B5 (Pantothenic Acid)',
        category: 'Vitamins',
        description: 'Precursor to Coenzyme A.',
        formula: 'C9H17NO5',
        molecularWeight: '219.23 g/mol'
    },
    {
        id: '1054',
        title: 'Vitamin B6 (Pyridoxine)',
        category: 'Vitamins',
        description: 'Coenzyme in amino acid metabolism.',
        formula: 'C8H11NO3',
        molecularWeight: '169.18 g/mol'
    },
    {
        id: '171546',
        title: 'Vitamin B7 (Biotin)',
        category: 'Vitamins',
        description: 'Cofactor for carboxylase enzymes.',
        formula: 'C10H16N2O3S',
        molecularWeight: '244.31 g/mol'
    },
    {
        id: '135398658',
        title: 'Vitamin B9 (Folic Acid)',
        category: 'Vitamins',
        description: 'Crucial for DNA synthesis and repair.',
        formula: 'C19H19N7O6',
        molecularWeight: '441.4 g/mol'
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
    {
        id: '4091',
        title: 'Metformin',
        category: 'Drugs',
        description: 'First-line medication for type 2 diabetes.',
        formula: 'C4H11N5',
        molecularWeight: '129.16 g/mol'
    },
    {
        id: '60823',
        title: 'Atorvastatin',
        category: 'Drugs',
        description: 'Statin medication used to prevent cardiovascular disease.',
        formula: 'C33H35FN2O5',
        molecularWeight: '558.6 g/mol'
    },
    {
        id: '4875',
        title: 'Omeprazole',
        category: 'Drugs',
        description: 'Proton pump inhibitor used to treat GERD.',
        formula: 'C17H19N3O3S',
        molecularWeight: '345.4 g/mol'
    },
    {
        id: '3958',
        title: 'Losartan',
        category: 'Drugs',
        description: 'Angiotensin II receptor antagonist for high blood pressure.',
        formula: 'C22H23ClN6O',
        molecularWeight: '422.9 g/mol'
    },
    {
        id: '3676',
        title: 'Lidocaine',
        category: 'Drugs',
        description: 'Local anesthetic and antiarrhythmic drug.',
        formula: 'C14H22N2O',
        molecularWeight: '234.34 g/mol'
    },
    {
        id: '5288826',
        title: 'Morphine',
        category: 'Drugs',
        description: 'Potent opiate pain medication isolated from poppy.',
        formula: 'C17H19NO3',
        molecularWeight: '285.34 g/mol'
    },
    {
        id: '3016',
        title: 'Diazepam (Valium)',
        category: 'Drugs',
        description: 'Benzodiazepine used for anxiety and seizures.',
        formula: 'C16H13ClN2O',
        molecularWeight: '284.7 g/mol'
    },
    {
        id: '3386',
        title: 'Fluoxetine (Prozac)',
        category: 'Drugs',
        description: 'SSRI antidepressant.',
        formula: 'C17H18F3NO',
        molecularWeight: '309.33 g/mol'
    },
    {
        id: '33613',
        title: 'Amoxicillin',
        category: 'Drugs',
        description: 'Beta-lactam antibiotic derived from penicillin.',
        formula: 'C16H19N3O5S',
        molecularWeight: '365.4 g/mol'
    },
    {
        id: '2764',
        title: 'Ciprofloxacin',
        category: 'Drugs',
        description: 'Broad-spectrum fluoroquinolone antibiotic.',
        formula: 'C17H18FN3O3',
        molecularWeight: '331.34 g/mol'
    },
    {
        id: '31703',
        title: 'Doxorubicin',
        category: 'Drugs',
        description: 'Anthracycline chemotherapy agent.',
        formula: 'C27H29NO11',
        molecularWeight: '543.5 g/mol'
    },
    {
        id: '135398735',
        title: 'Sildenafil (Viagra)',
        category: 'Drugs',
        description: 'Inhibitor of PDE5, used for erectile dysfunction.',
        formula: 'C22H30N6O4S',
        molecularWeight: '474.6 g/mol'
    },
    {
        id: '36314',
        title: 'Paclitaxel (Taxol)',
        category: 'Drugs',
        description: 'Chemotherapy medication originally from Pacific yew.',
        formula: 'C47H51NO14',
        molecularWeight: '853.9 g/mol'
    },
    {
        id: '5584',
        title: 'Warfarin',
        category: 'Drugs',
        description: 'Anticoagulant medication used to prevent blood clots.',
        formula: 'C19H16O4',
        molecularWeight: '308.33 g/mol'
    },
    {
        id: '5090',
        title: 'Ranitidine',
        category: 'Drugs',
        description: 'H2 blocker used to reduce stomach acid.',
        formula: 'C13H22N4O3S',
        molecularWeight: '314.40 g/mol'
    },
    {
        id: '4112',
        title: 'Methotrexate',
        category: 'Drugs',
        description: 'Chemotherapy and immune system suppressant.',
        formula: 'C20H22N8O5',
        molecularWeight: '454.44 g/mol'
    },
    {
        id: '5479',
        title: 'Salbutamol (Albuterol)',
        category: 'Drugs',
        description: 'Bronchodilator for asthma relief.',
        formula: 'C13H21NO3',
        molecularWeight: '239.31 g/mol'
    },
    {
        id: '3345',
        title: 'Fentanyl',
        category: 'Drugs',
        description: 'Potent synthetic opioid pain medication.',
        formula: 'C22H28N2O',
        molecularWeight: '336.5 g/mol'
    },
    {
        id: '2708',
        title: 'Chloroquine',
        category: 'Drugs',
        description: 'Medication used to prevent and treat malaria.',
        formula: 'C18H26ClN3',
        molecularWeight: '319.87 g/mol'
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
        title: 'GABA',
        category: 'Neurotransmitters',
        description: 'Primary inhibitory neurotransmitter in mammalian CNS.',
        formula: 'C4H9NO2',
        molecularWeight: '103.12 g/mol'
    },
    {
        id: '187',
        title: 'Acetylcholine',
        category: 'Neurotransmitters',
        description: 'Activates muscles and plays a role in attention.',
        formula: 'C7H16NO2+',
        molecularWeight: '146.21 g/mol'
    },
    {
        id: '778',
        title: 'Histamine',
        category: 'Neurotransmitters',
        description: 'Involved in immune response and sleep-wake regulation.',
        formula: 'C5H9N3',
        molecularWeight: '111.15 g/mol'
    },
    {
        id: '896',
        title: 'Melatonin',
        category: 'Neurotransmitters',
        description: 'Regulates the sleep-wake cycle.',
        formula: 'C13H16N2O2',
        molecularWeight: '232.28 g/mol'
    },
    {
        id: '5994',
        title: 'Adenosine',
        category: 'Neurotransmitters',
        description: 'Accumulates during wakefulness causing drowsiness.',
        formula: 'C10H13N5O4',
        molecularWeight: '267.24 g/mol'
    },
    {
        id: '137',
        title: 'Aspartate',
        category: 'Neurotransmitters',
        description: 'Excitatory neurotransmitter.',
        formula: 'C4H7NO4',
        molecularWeight: '133.10 g/mol'
    },
    {
        id: '611',
        title: 'Glycine',
        category: 'Neurotransmitters',
        description: 'Inhibitory neurotransmitter in the spinal cord.',
        formula: 'C2H5NO2',
        molecularWeight: '75.07 g/mol'
    },

    // --- PSYCHOACTIVES ---
    {
        id: '2519',
        title: 'Caffeine',
        category: 'Natural Products',
        description: 'Adenosine antagonist and CNS stimulant.',
        formula: 'C8H10N4O2',
        molecularWeight: '194.19 g/mol'
    },
    {
        id: '89594',
        title: 'Nicotine',
        category: 'Natural Products',
        description: 'Stimulant alkaloid found in nightshade plants.',
        formula: 'C10H14N2',
        molecularWeight: '162.23 g/mol'
    },
    {
        id: '16078',
        title: 'THC (Tetrahydrocannabinol)',
        category: 'Natural Products',
        description: 'Principal psychoactive constituent of cannabis.',
        formula: 'C21H30O2',
        molecularWeight: '314.5 g/mol'
    },
    {
        id: '5761',
        title: 'LSD',
        category: 'Neurotransmitters',
        description: 'Potent psychedelic drug.',
        formula: 'C20H25N3O',
        molecularWeight: '323.4 g/mol'
    },
    {
        id: '10624',
        title: 'Psilocybin',
        category: 'Natural Products',
        description: 'Psychedelic pro-drug produced by fungi.',
        formula: 'C12H17N2O4P',
        molecularWeight: '284.25 g/mol'
    },
    {
        id: '3033890',
        title: 'MDMA (Ecstasy)',
        category: 'Drugs',
        description: 'Empathogen-entactogen psychoactive drug.',
        formula: 'C11H15NO2',
        molecularWeight: '193.25 g/mol'
    },
    {
        id: '4485',
        title: 'Methamphetamine',
        category: 'Drugs',
        description: 'Potent central nervous system stimulant.',
        formula: 'C10H15N',
        molecularWeight: '149.23 g/mol'
    },
    {
        id: '2160',
        title: 'Amphetamine',
        category: 'Drugs',
        description: 'CNS stimulant used to treat ADHD.',
        formula: 'C9H13N',
        molecularWeight: '135.21 g/mol'
    },

    // --- METABOLITES / ENERGY ---
    {
        id: '5957',
        title: 'ATP (Adenosine Triphosphate)',
        category: 'Metabolites',
        description: 'The "molecular unit of currency" of intracellular energy.',
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
        description: 'Essential structural component of animal cell membranes.',
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
    {
        id: '1060',
        title: 'Pyruvate',
        category: 'Metabolites',
        description: 'End product of glycolysis.',
        formula: 'C3H4O3',
        molecularWeight: '88.06 g/mol'
    },
    {
        id: '612',
        title: 'Lactate (Lactic Acid)',
        category: 'Metabolites',
        description: 'Produced in muscle during exertion.',
        formula: 'C3H6O3',
        molecularWeight: '90.08 g/mol'
    },
    {
        id: '311',
        title: 'Citrate (Citric Acid)',
        category: 'Metabolites',
        description: 'Intermediate in the Krebs cycle.',
        formula: 'C6H8O7',
        molecularWeight: '192.12 g/mol'
    },
    {
        id: '586',
        title: 'Creatine',
        category: 'Metabolites',
        description: 'Recycles ATP in brain and muscle tissue.',
        formula: 'C4H9N3O2',
        molecularWeight: '131.13 g/mol'
    },
    {
        id: '1176',
        title: 'Urea',
        category: 'Metabolites',
        description: 'Main nitrogen-containing substance in mammal urine.',
        formula: 'CH4N2O',
        molecularWeight: '60.06 g/mol'
    },

    // --- AMINO ACIDS (Standard 20) ---
    {
        id: '5960',
        title: 'Glycine',
        category: 'Metabolites',
        description: 'Smallest amino acid, inhibitory neurotransmitter.',
        formula: 'C2H5NO2',
        molecularWeight: '75.07 g/mol'
    },
    {
        id: '5950',
        title: 'Alanine',
        category: 'Metabolites',
        description: 'Used in the biosynthesis of proteins.',
        formula: 'C3H7NO2',
        molecularWeight: '89.09 g/mol'
    },
    {
        id: '6287',
        title: 'Valine',
        category: 'Metabolites',
        description: 'Branched-chain amino acid.',
        formula: 'C5H11NO2',
        molecularWeight: '117.15 g/mol'
    },
    {
        id: '6106',
        title: 'Leucine',
        category: 'Metabolites',
        description: 'Essential branched-chain amino acid.',
        formula: 'C6H13NO2',
        molecularWeight: '131.17 g/mol'
    },
    {
        id: '6306',
        title: 'Isoleucine',
        category: 'Metabolites',
        description: 'Isomer of leucine.',
        formula: 'C6H13NO2',
        molecularWeight: '131.17 g/mol'
    },
    {
        id: '6274',
        title: 'Proline',
        category: 'Metabolites',
        description: 'Cyclic amino acid influencing protein structure.',
        formula: 'C5H9NO2',
        molecularWeight: '115.13 g/mol'
    },
    {
        id: '994',
        title: 'Phenylalanine',
        category: 'Metabolites',
        description: 'Precursor for tyrosine and neurotransmitters.',
        formula: 'C9H11NO2',
        molecularWeight: '165.19 g/mol'
    },
    {
        id: '6057',
        title: 'Tyrosine',
        category: 'Metabolites',
        description: 'Precursor for dopamine and epinephrine.',
        formula: 'C9H11NO3',
        molecularWeight: '181.19 g/mol'
    },
    {
        id: '6305',
        title: 'Tryptophan',
        category: 'Metabolites',
        description: 'Precursor for serotonin and melatonin.',
        formula: 'C11H12N2O2',
        molecularWeight: '204.23 g/mol'
    },
    {
        id: '5951',
        title: 'Serine',
        category: 'Metabolites',
        description: 'Key role in metabolism and signaling.',
        formula: 'C3H7NO3',
        molecularWeight: '105.09 g/mol'
    },
    {
        id: '6288',
        title: 'Threonine',
        category: 'Metabolites',
        description: 'Polar amino acid with a hydroxyl group.',
        formula: 'C4H9NO3',
        molecularWeight: '119.12 g/mol'
    },
    {
        id: '5862',
        title: 'Cysteine',
        category: 'Metabolites',
        description: 'Contains thiol group, forms disulfide bonds.',
        formula: 'C3H7NO2S',
        molecularWeight: '121.16 g/mol'
    },
    {
        id: '6137',
        title: 'Methionine',
        category: 'Metabolites',
        description: 'Initiator amino acid in protein synthesis.',
        formula: 'C5H11NO2S',
        molecularWeight: '149.21 g/mol'
    },
    {
        id: '5961',
        title: 'Histidine',
        category: 'Metabolites',
        description: 'Precursor to histamine.',
        formula: 'C6H9N3O2',
        molecularWeight: '155.15 g/mol'
    },
    {
        id: '5962',
        title: 'Lysine',
        category: 'Metabolites',
        description: 'Essential for growth and tissue repair.',
        formula: 'C6H14N2O2',
        molecularWeight: '146.19 g/mol'
    },
    {
        id: '6267',
        title: 'Arginine',
        category: 'Metabolites',
        description: 'Precursor for nitric oxide.',
        formula: 'C6H14N4O2',
        molecularWeight: '174.20 g/mol'
    },
    {
        id: '5904',
        title: 'Aspartic Acid',
        category: 'Metabolites',
        description: 'Carries excitatory signals.',
        formula: 'C4H7NO4',
        molecularWeight: '133.10 g/mol'
    },
    {
        id: '33032',
        title: 'Glutamic Acid',
        category: 'Metabolites',
        description: 'Key neurotransmitter and metabolic fuel.',
        formula: 'C5H9NO4',
        molecularWeight: '147.13 g/mol'
    },
    {
        id: '5960',
        title: 'Asparagine',
        category: 'Metabolites',
        description: 'First amino acid isolated.',
        formula: 'C4H8N2O3',
        molecularWeight: '132.12 g/mol'
    },
    {
        id: '5961',
        title: 'Glutamine',
        category: 'Metabolites',
        description: 'Most abundant amino acid in blood.',
        formula: 'C5H10N2O3',
        molecularWeight: '146.14 g/mol'
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
    {
        id: '5311053',
        title: 'Batrachotoxin',
        category: 'Toxins',
        description: 'Potent cardiotoxic and neurotoxic alkaloid from poison dart frogs.',
        formula: 'C31H42N2O6',
        molecularWeight: '538.7 g/mol'
    },
    {
        id: '768',
        title: 'Cyanide (Hydrogen Cyanide)',
        category: 'Toxins',
        description: 'Fast-acting poison interfering with cellular respiration.',
        formula: 'HCN',
        molecularWeight: '27.03 g/mol'
    },
    {
        id: '34755',
        title: 'VX Nerve Agent',
        category: 'Toxins',
        description: 'Extremely toxic synthetic chemical weapon.',
        formula: 'C11H26NO2PS',
        molecularWeight: '267.37 g/mol'
    },
    {
        id: '6220',
        title: 'Solanine',
        category: 'Toxins',
        description: 'Poison found in nightshades like potatoes.',
        formula: 'C45H73NO15',
        molecularWeight: '868.0 g/mol'
    },
    {
        id: '5353986',
        title: 'Ricin',
        category: 'Toxins',
        description: 'Highly toxic protein produced in seeds of castor oil plant.',
        formula: 'Protein',
        molecularWeight: '~65 kDa'
    },
    {
        id: '1049',
        title: 'Paraquat',
        category: 'Toxins',
        description: 'Toxic herbicide.',
        formula: 'C12H14N2',
        molecularWeight: '186.25 g/mol'
    },
    {
        id: '3039',
        title: 'DDT',
        category: 'Toxins',
        description: 'Infamous organochlorine insecticide.',
        formula: 'C14H9Cl5',
        molecularWeight: '354.49 g/mol'
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
    {
        id: '5997',
        title: 'Progesterone',
        category: 'Hormones',
        description: 'Endogenous steroid and progestogen sex hormone.',
        formula: 'C21H30O2',
        molecularWeight: '314.46 g/mol'
    },
    {
        id: '5833',
        title: 'Aldosterone',
        category: 'Hormones',
        description: 'Regulates blood pressure and electrolyte balance.',
        formula: 'C21H28O5',
        molecularWeight: '360.44 g/mol'
    },
    {
        id: '5819',
        title: 'Thyroxine (T4)',
        category: 'Hormones',
        description: 'Thyroid hormone responsible for metabolism regulation.',
        formula: 'C15H11I4NO4',
        molecularWeight: '776.87 g/mol'
    },
    {
        id: '5743',
        title: 'Dexamethasone',
        category: 'Hormones',
        description: 'Corticosteroid medication.',
        formula: 'C22H29FO5',
        molecularWeight: '392.46 g/mol'
    },
    {
        id: '5753',
        title: 'Prednisone',
        category: 'Hormones',
        description: 'Synthetic corticosteroid drug.',
        formula: 'C21H26O5',
        molecularWeight: '358.43 g/mol'
    },

    // --- NATURAL PRODUCTS ---
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
    {
        id: '689043',
        title: 'Artemisinin',
        category: 'Natural Products',
        description: 'Antimalarial isolated from sweet wormwood.',
        formula: 'C15H22O5',
        molecularWeight: '282.33 g/mol'
    },
    {
        id: '445090',
        title: 'Resveratrol',
        category: 'Natural Products',
        description: 'Phenol produced by grapes and berries.',
        formula: 'C14H12O3',
        molecularWeight: '228.25 g/mol'
    },
    {
        id: '65064',
        title: 'EGCG (Epigallocatechin gallate)',
        category: 'Natural Products',
        description: 'Major catechin in green tea.',
        formula: 'C22H18O11',
        molecularWeight: '458.37 g/mol'
    },
    {
        id: '5284373',
        title: 'Lycopene',
        category: 'Natural Products',
        description: 'Bright red carotene pigment in tomatoes.',
        formula: 'C40H56',
        molecularWeight: '536.87 g/mol'
    },
    {
        id: '5281233',
        title: 'Beta-Carotene',
        category: 'Natural Products',
        description: 'Red-orange pigment in plants and fruits.',
        formula: 'C40H56',
        molecularWeight: '536.87 g/mol'
    },
    {
        id: '992',
        title: 'Limonene',
        category: 'Natural Products',
        description: 'Major component of the oil of citrus fruit peels.',
        formula: 'C10H16',
        molecularWeight: '136.23 g/mol'
    },
    {
        id: '6549',
        title: 'Menthol',
        category: 'Natural Products',
        description: 'Waxy, crystalline substance from mint.',
        formula: 'C10H20O',
        molecularWeight: '156.27 g/mol'
    },
    {
        id: '702',
        title: 'Ethanol',
        category: 'Natural Products',
        description: 'Simple alcohol and psychoactive substance.',
        formula: 'C2H6O',
        molecularWeight: '46.07 g/mol'
    }
];
