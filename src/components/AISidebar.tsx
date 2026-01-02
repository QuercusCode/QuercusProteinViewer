import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, X, Settings } from 'lucide-react';
import clsx from 'clsx';
import type { ResidueInfo, ColoringType, RepresentationType } from '../types';
import { calculateMW, calculateIsoelectricPoint, getAminoAcidComposition } from '../utils/chemistry';
import { fetchUniProtData, type UniProtData } from '../services/uniprot';
import { generateAIResponse } from '../services/llm';

export type AIAction =
    | { type: 'SET_COLORING', value: ColoringType }
    | { type: 'SET_REPRESENTATION', value: RepresentationType }
    | { type: 'TOGGLE_SURFACE', value: boolean }
    | { type: 'RESET_VIEW' }
    | { type: 'HIGHLIGHT_REGION', selection: string, label: string }; // New Action

interface AISidebarProps {
    isOpen: boolean;
    onClose: () => void;
    pdbId: string | null;
    proteinTitle: string | null;
    highlightedResidue: ResidueInfo | null;
    stats?: {
        chainCount: number;
        residueCount: number;
        ligandCount: number;
    };
    chains?: { name: string; sequence: string }[];
    onAction: (action: AIAction) => void;
}

// ... (KEEP CONSTANTS - abbreviated for Replace)
// I cannot easily replace the middle without touching constants if I use start/end lines crossing them.
// Strategy: Insert the LOGIC inside the component using a targeted replacement of the component body.

// Let's replace the Start of the component to add state.


interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

// --- KNOWLEDGE BASE V5 ---

const AMINO_ACID_DATA: Record<string, { full: string; type: string; desc: string; fact: string }> = {
    'ALA': { full: 'Alanine', type: 'Hydrophobic', desc: 'Small and non-polar.', fact: 'Often found in alpha-helices; it’s one of the most common residues.' },
    'ARG': { full: 'Arginine', type: 'Positive Charge', desc: 'Large, basic, and polar.', fact: 'Its guanidinium group is often involved in salt bridges and binding nucleic acids.' },
    'ASN': { full: 'Asparagine', type: 'Polar (Neutral)', desc: 'Carboxamide side chain.', fact: 'A common site for N-linked glycosylation.' },
    'ASP': { full: 'Aspartic Acid', type: 'Negative Charge', desc: 'Acidic and polar.', fact: 'Often found in active sites; interacts with metal ions.' },
    'CYS': { full: 'Cysteine', type: 'Polar / Special', desc: 'Contains a thiol (-SH) group.', fact: 'Can form **disulfide bridges** that stabilize the protein structure.' },
    'GLN': { full: 'Glutamine', type: 'Polar (Neutral)', desc: 'Like Asparagine but longer.', fact: 'Often involved in hydrogen bonding networks.' },
    'GLU': { full: 'Glutamic Acid', type: 'Negative Charge', desc: 'Acidic and polar.', fact: 'A major neurotransmitter precursor and common on protein surfaces.' },
    'GLY': { full: 'Glycine', type: 'Special / Flexible', desc: 'The smallest residue (just H).', fact: 'Its flexibility allows distinct turns and tight packing.' },
    'HIS': { full: 'Histidine', type: 'Positive (pH dependant)', desc: 'Contains an imidazole ring.', fact: 'Crucial for enzyme catalysis (acid-base buffering).' },
    'ILE': { full: 'Isoleucine', type: 'Hydrophobic', desc: 'Branched-chain aliphatic.', fact: 'Prefers the buried core of proteins.' },
    'LEU': { full: 'Leucine', type: 'Hydrophobic', desc: 'Branched-chain aliphatic.', fact: 'One of the strongest stabilizers of alpha-helices (Leucine Zippers).' },
    'LYS': { full: 'Lysine', type: 'Positive Charge', desc: 'Long aliphatic chain with amine.', fact: 'Often found on the surface; target for ubiquitination.' },
    'MET': { full: 'Methionine', type: 'Hydrophobic', desc: 'Contains sulfur (thioether).', fact: 'Usually the "start" residue (AUG codon).' },
    'PHE': { full: 'Phenylalanine', type: 'Hydrophobic (Aromatic)', desc: 'Benzyl side chain.', fact: 'Plays a key role in stacking interactions.' },
    'PRO': { full: 'Proline', type: 'Special / Rigid', desc: 'Cyclic imino acid.', fact: 'A "helix breaker" due to its rigid ring structure.' },
    'SER': { full: 'Serine', type: 'Polar (Neutral)', desc: 'Hydroxyl (-OH) group.', fact: 'Common site for phosphorylation (regulation).' },
    'THR': { full: 'Threonine', type: 'Polar (Neutral)', desc: 'Hydroxyl with methyl group.', fact: 'Also a phosphorylation site.' },
    'TRP': { full: 'Tryptophan', type: 'Hydrophobic (Aromatic)', desc: 'Largest side chain (Indole).', fact: 'Fluorescent! Used to track protein folding experimentally.' },
    'TYR': { full: 'Tyrosine', type: 'Polar (Aromatic)', desc: 'Phenol group.', fact: 'Can be phosphorylated; critical in signal transduction.' },
    'VAL': { full: 'Valine', type: 'Hydrophobic', desc: 'Branched-chain (V-shaped).', fact: 'Assists in hydrophobic core packing.' }
};

const NUCLEOTIDE_DATA: Record<string, { full: string; type: string; desc: string; fact: string }> = {
    'DA': { full: 'Deoxyadenosine (DNA)', type: 'Purine Base', desc: 'Pairs with Thymine (T).', fact: 'Forms 2 hydrogen bonds with T.' },
    'DT': { full: 'Deoxythymidine (DNA)', type: 'Pyrimidine Base', desc: 'Pairs with Adenine (A).', fact: 'Unique to DNA (replaced by Uracil in RNA).' },
    'DG': { full: 'Deoxyguanosine (DNA)', type: 'Purine Base', desc: 'Pairs with Cytosine (C).', fact: 'Forms 3 hydrogen bonds with C (stronger).' },
    'DC': { full: 'Deoxycytidine (DNA)', type: 'Pyrimidine Base', desc: 'Pairs with Guanine (G).', fact: 'Susceptible to methylation (epigenetics).' },
    'A': { full: 'Adenosine (RNA)', type: 'Purine Base', desc: 'Pairs with Uracil (U).', fact: 'Key component of ATP (energy).' },
    'U': { full: 'Uridine (RNA)', type: 'Pyrimidine Base', desc: 'Pairs with Adenine (A).', fact: 'Replaces Thymine in RNA.' },
    'G': { full: 'Guanosine (RNA)', type: 'Purine Base', desc: 'Pairs with Cytosine (C).', fact: 'Can form G-quadruplex structures.' },
    'C': { full: 'Cytidine (RNA)', type: 'Pyrimidine Base', desc: 'Pairs with Guanine (G).', fact: 'Can undergo deamination.' }
};

const GLOSSARY_TERMS: Record<string, string> = {
    'domain': "**Domain**: A distinct functional and/or structural unit in a protein. Usually, they are responsible for a particular function or interaction, contributing to the overall role of a protein.",
    'loop': "**Loop**: A flexible region connecting secondary structures (alpha helices and beta sheets). Loops are often found at the protein surface and can be involved in binding or catalysis.",
    'motif': "**Motif**: A supersecondary structure or fold which appears in a variety of molecules (e.g., Helix-Turn-Helix, Zinc Finger).",
    'ligand': "**Ligand**: A substance that forms a complex with a biomolecule to serve a biological purpose. In protein viewers, this usually refers to small molecules bound to the protein.",
    'active site': "**Active Site**: The specific region of an enzyme where substrate molecules bind and undergo a chemical reaction.",
    'n-terminus': "**N-terminus**: The start of a protein or polypeptide chain (amino group end). Interaction often starts here!",
    'c-terminus': "**C-terminus**: The end of an amino acid chain (carboxyl group end), terminated by a free carboxyl group.",
    'dna': "**DNA**: Deoxyribonucleic acid. The molecule that carries genetic instructions. It's a double helix formed by base pairs (A-T, G-C).",
    'rna': "**RNA**: Ribonucleic acid. Essential for coding, decoding, regulation and expression of genes. Usually single-stranded (A-U, G-C).",
    'resolution': "**Resolution**: In structure (X-ray/Cryo-EM), it measures the detail of the image. Lower values (e.g., 1.5Å) mean higher detail!"
};

const FAMOUS_PROTEINS: Record<string, string> = {
    '4HHB': "This is **Hemoglobin**, the oxygen-transport protein. It's a tetramer (2 alpha, 2 beta chains). The Heme groups bind iron, which binds oxygen.",
    '1CRN': "This is **Crambin**, a small seed storage protein. It's famous for being extremely well-resolved in crystallography (atomic resolution)!",
    '1TIM': "This is **Triosephosphate Isomerase**, the classic example of the 'TIM Barrel' fold (8-stranded beta barrel surrounded by alpha helices).",
    '1GFL': "This is **Green Fluorescent Protein (GFP)**. The beta-barrel protects the central chromophore, which glows green under UV light!",
    '6VXX': "This looks like a **SARS-CoV-2 Spike Protein** structure. It's the key target for vaccines.",
    '1UBQ': "This is **Ubiquitin**, a small regulatory protein found in almost all tissues (ubiquitous!). It tags other proteins for degradation.",
    '2B3P': "This is a designed protein structure (often used as a demo). Notice the secondary structure elements packing together."
};

// --- LOGIC ENGINE V5 (Actionable) ---

export const AISidebar: React.FC<AISidebarProps> = ({
    isOpen,
    onClose,
    pdbId,
    proteinTitle,
    highlightedResidue,
    stats,
    chains,
    onAction
}) => {
    const [input, setInput] = useState('');
    const [uniprot, setUniprot] = useState<UniProtData | null>(null);
    const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || ''); // V7
    const [showSettings, setShowSettings] = useState(false); // V7
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'ai',
            text: "🤖 **Dr. AI (V7.0)**.\n\nI am analyzing this structure...",
            timestamp: new Date()
        }
    ]);

    // V6: Fetch UniProt Data
    useEffect(() => {
        setUniprot(null); // Reset on PDB change
        if (pdbId) {
            fetchUniProtData(pdbId).then(data => {
                if (data) {
                    setUniprot(data);
                    setMessages(prev => [...prev, {
                        id: `uniprot-found-${Date.now()}`,
                        sender: 'ai',
                        text: `✅ **Connected to UniProt**.\n\nIdentified: **${data.proteinName}** (${data.geneName}).\nI have data for **${data.features.length} features** (active sites, etc).\n\nTry: 'What is the function?', 'Show active sites'.`,
                        timestamp: new Date()
                    }]);
                } else {
                    // No UniProt data found
                    setMessages(prev => [...prev, {
                        id: `uniprot-404-${Date.now()}`,
                        sender: 'ai',
                        text: `⚠️ **UniProt Data Not Found**.\n\nThis PDB (${pdbId}) might be a synthetic structure or not indexed yet. I will use chemical analysis instead.`,
                        timestamp: new Date()
                    }]);
                }
            });
        }
    }, [pdbId]);

    const [isTyping, setIsTyping] = useState(false); // Restored

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const generateResponse = (
        q: string,
        ctxPdb: string | null,
        ctxTitle: string | null,
        ctxRes: ResidueInfo | null,
        ctxStats: any,
        ctxChains?: { name: string, sequence: string }[],
        uniprot?: UniProtData | null
    ): { text: string, action?: AIAction } => {
        q = q.toLowerCase();

        // 0. UNIPROT INTELLIGENCE (Priority)
        if (uniprot) {
            if (q.includes('function') || q.includes('what does this do') || q.includes('biology')) {
                return { text: `**🧬 Biological Function (${uniprot.geneName})**:\n\n${uniprot.function}\n\n(Source: UniProt ${uniprot.id})` };
            }
            if (q.includes('active site') || q.includes('binding') || q.includes('show features')) {
                const sites = uniprot.features.filter(f => f.type === 'ACT_SITE' || f.type === 'BINDING' || f.type === 'SITE');
                if (sites.length > 0) {
                    const ranges = sites.map(s => s.begin === s.end ? s.begin : `${s.begin}-${s.end}`).join(' or ');
                    return {
                        text: `**🎯 Active/Binding Sites Found**:\n\nI have highlighted **${sites.length} regions** corresponding to functional sites.\n\n${sites.map(s => `- ${s.type}: Residues ${s.begin}-${s.end} (${s.description})`).join('\n')}`,
                        action: { type: 'HIGHLIGHT_REGION', selection: ranges, label: 'Active Sites' }
                    };
                }
                return { text: "No active sites reported in UniProt for this protein." };
            }
        } else if (q.includes('function') || q.includes('biology') || q.includes('active site')) {
            // Fallback: Check if we have a manual entry for this protein (e.g. 2B3P)
            if (ctxPdb) {
                const famousFact = FAMOUS_PROTEINS[ctxPdb.toUpperCase()];
                if (famousFact) return { text: `**📚 Known Structure Detected**:\n\n${famousFact}\n\n(Note: Live UniProt data was not found, so this is a simplified summary.)` };
            }
            return { text: "⚠️ I cannot provide biological function or active sites because **UniProt data was not found** for this PDB ID.\n\nIt might be a synthetic design or a new structure." };
        }

        // ... (rest of function relies on ctxStats)


        // --- V5: CHEMICAL INTELLIGENCE ---

        // 1. Isoelectric Point (pI)
        if (q.includes('isoelectric') || q.includes('pi ') || q.includes('charge')) {
            if (ctxChains && ctxChains.length > 0) {
                const chain = ctxChains[0]; // Analyze first chain for now
                const pi = calculateIsoelectricPoint(chain.sequence);
                return { text: `**🧪 Chemical Analysis (Chain ${chain.name})**:\n\nThe estimated **Isoelectric Point (pI)** is **${pi}**.\n(Calculated using EMBOSS pKa values).` };
            }
            return { text: "I need sequence data to calculate that. (No chains found)." };
        }

        // 2. Molecular Weight
        if (q.includes('weight') || q.includes('mass') || q.includes('mw') || q.includes('dalton')) {
            if (ctxChains && ctxChains.length > 0) {
                let totalMw = 0;
                let details = "";
                ctxChains.forEach(c => {
                    const mw = calculateMW(c.sequence);
                    totalMw += mw;
                    details += `- **Chain ${c.name}**: ${(mw / 1000).toFixed(1)} kDa\n`;
                });
                return { text: `**⚖️ Molecular Weight**:\n\nTotal Mass: **${(totalMw / 1000).toFixed(1)} kDa** (${Math.round(totalMw).toLocaleString()} Da).\n\n${details}` };
            }
        }

        // 3. Composition / Hydrophobicity
        if (q.includes('composition') || q.includes('hydrophobic') && q.includes('how many')) {
            if (ctxChains && ctxChains.length > 0) {
                const c = ctxChains[0];
                const comp = getAminoAcidComposition(c.sequence);
                const hydroPercent = ((comp.categories.hydrophobic / comp.length) * 100).toFixed(1);
                return { text: `**🧬 Composition Analysis (Chain ${c.name})**:\n\n- **Length**: ${comp.length} residues\n- **Hydrophobic**: ${comp.categories.hydrophobic} (${hydroPercent}%)\n- **Polar**: ${comp.categories.polar}\n- **Charged**: ${comp.categories.charged_pos + comp.categories.charged_neg} (Pos: ${comp.categories.charged_pos}, Neg: ${comp.categories.charged_neg})\n\nThis protein is **${parseFloat(hydroPercent) > 40 ? 'highly hydrophobic' : 'soluble'}**.` };
            }
        }

        // --- ACTIVATION INTENTS (V3 & V4) ---
        // ... (Keep existing logic)


        // V4: Expanded View Controls
        if (/ball.*stick|bonds/i.test(q)) {
            return { text: "🎨 Switching to **Ball & Stick** mode.", action: { type: 'SET_REPRESENTATION', value: 'ball+stick' } };
        }
        if (/wireframe|lines/i.test(q)) {
            return { text: "🎨 Switching to **Wireframe** (lines) mode.", action: { type: 'SET_REPRESENTATION', value: 'line' } };
        }
        if (/backbone/i.test(q)) {
            return { text: "🎨 Showing **Backbone** trace.", action: { type: 'SET_REPRESENTATION', value: 'backbone' } };
        }
        if (/cartoon|ribbon/i.test(q)) {
            return { text: "🎨 Switching to **Cartoon** representation.", action: { type: 'SET_REPRESENTATION', value: 'cartoon' } };
        }

        // V4: Expanded Coloring
        if (/color.*(element|atom|cpk)/i.test(q)) {
            return { text: "🎨 Coloring by **Element** (CPK).", action: { type: 'SET_COLORING', value: 'element' } };
        }
        if (/color.*(rainbow|spectrum|residue)/i.test(q)) {
            return { text: "🎨 Coloring by **Rainbow** (N-term to C-term).", action: { type: 'SET_COLORING', value: 'residueindex' } };
        }

        // Coloring
        if (/color.*hydrophob/i.test(q)) {
            return { text: "🎨 Coloring structure by **Hydrophobicity**. (Red = Hydrophobic, White = Hydrophilic)", action: { type: 'SET_COLORING', value: 'hydrophobicity' } };
        }
        if (/color.*chain/i.test(q)) {
            return { text: "🎨 Coloring structure by **Chain** ID.", action: { type: 'SET_COLORING', value: 'chainid' } };
        }
        if (/color.*(structure|secondary)/i.test(q)) {
            return { text: "🎨 Coloring by **Secondary Structure** (Helices vs Sheets).", action: { type: 'SET_COLORING', value: 'structure' } };
        }
        if (/color.*(b-factor|flexibility|heat)/i.test(q)) {
            return { text: "🎨 Coloring by **B-Factor** (Thermal Motion). Warmer colors = more flexible regions.", action: { type: 'SET_COLORING', value: 'bfactor' } };
        }

        // Representation
        if (/surface/i.test(q)) {
            if (/color/.test(q)) {
                // Fallthrough
            }
            if (/(show|enable|on|add)/i.test(q)) {
                return { text: "✨ Enabling **Molecular Surface** representation.", action: { type: 'TOGGLE_SURFACE', value: true } };
            }
            if (/(hide|disable|off|remove)/i.test(q)) {
                return { text: "👻 Hiding **Molecular Surface**.", action: { type: 'TOGGLE_SURFACE', value: false } };
            }
        }

        // View Control
        if (/reset|center/i.test(q)) {
            return { text: "🔄 **Resetting View** to default orientation.", action: { type: 'RESET_VIEW' } };
        }


        // --- V4: STATS & HELP ---

        if (/(how large|how big|size|count|stats)/i.test(q) && ctxStats) {
            return { text: `**📊 Structure Statistics**:\n\n- **Chains**: ${ctxStats.chainCount}\n- **Residues**: ${ctxStats.residueCount}\n- **Ligands**: ${ctxStats.ligandCount}\n\nThis is a fairly detailed structure!` };
        }

        // UI Help
        if (/(how.*(spin|rotate)|spinning)/i.test(q)) {
            return { text: "🔄 **Spinning**: You can toggle auto-rotation by pressing the **'Spin'** button in the controls panel at the bottom right." };
        }
        if (/(how.*(picture|screenshot|image|save))/i.test(q)) {
            return { text: "📸 **Snapshot**: Click the **Camera Icon** in the bottom panel to save a high-res image of the current view." };
        }
        if (/(how.*(export|download|file))/i.test(q)) {
            return { text: "💾 **Export**: You can download the current PDB file or a PyMOL session relative to this view from the 'File' menu (if implemented) or use the 'Snapshot' feature." };
        }


        // --- MUTATION ANALYSIS (V3) ---
        if (ctxRes && (q.includes('mutate') || q.includes('swap') || q.includes('replace') || q.includes('change to'))) {
            // Extract target amino acid
            const targetMatch = q.match(/(?:to|with)\s+([a-zA-Z]{3,})/i);
            if (targetMatch) {
                const targetName = targetMatch[1].toUpperCase().substring(0, 3);
                const sourceInfo = AMINO_ACID_DATA[ctxRes.resName] || NUCLEOTIDE_DATA[ctxRes.resName];
                const targetInfo = AMINO_ACID_DATA[targetName]; // Can only mutate to AA for now

                if (targetInfo && sourceInfo) {
                    let analysis = `**🧬 Mutation Simulation**: ${sourceInfo.full} (${ctxRes.resName}) ➝ ${targetInfo.full} (${targetName}).\n\n`;

                    // Heuristic Checks
                    if (sourceInfo.type.includes('Hydrophobic') && targetInfo.type.includes('Charge')) {
                        analysis += "⚠️ **Stability Warning**: You are replacing a buried hydrophobic residue with a charged one. This could destabilize the core!";
                    } else if (sourceInfo.full === 'Glycine' && targetName !== 'GLY') {
                        analysis += "⚠️ **Flexibility Warning**: Replacing Glycine with a larger residue might cause steric clashes in tight turns.";
                    } else if (sourceInfo.type === targetInfo.type) {
                        analysis += "✅ **Conservative Mutation**: Both residues have similar properties. This change is likely neutral.";
                    } else {
                        analysis += `ℹ️ **Property Shift**: Changing from ${sourceInfo.type} to ${targetInfo.type}. Check local interactions.`;
                    }
                    return { text: analysis };
                }
            }
        }


        // --- KNOWLEDGE BASE (V2/V4 Logic) ---

        // 1. DIRECT RESIDUE QUERY (Explicit click)
        if (ctxRes && (q.includes('this') || q.includes('selected') || q.includes('residue') || q.includes('what is'))) {
            const info = AMINO_ACID_DATA[ctxRes.resName] || NUCLEOTIDE_DATA[ctxRes.resName] || { full: ctxRes.resName, type: 'Unknown', desc: '', fact: '' };
            return {
                text: `**🔬 Identification**: You selected **${info.full} (${ctxRes.resName})**.\n` +
                    `**📍 Position**: Chain ${ctxRes.chain}, Residue ${ctxRes.resNo}.\n\n` +
                    `**🧪 Chemistry**: ${info.type}. ${info.desc}\n` +
                    `**💡 Insight**: ${info.fact}`
            };
        }

        // 2. GLOSSARY LOOKUP (V4)
        for (const [term, def] of Object.entries(GLOSSARY_TERMS)) {
            if (q.toLowerCase().includes(term)) {
                return { text: def };
            }
        }

        // 3. FAMOUS PROTEIN MATCH?
        if (ctxPdb && (q.includes('protein') || q.includes('structure') || q.includes('what is this'))) {
            const famousFact = FAMOUS_PROTEINS[ctxPdb.toUpperCase()];
            if (famousFact) return { text: `**📚 Famous Structure Detected**:\n\n${famousFact}` };

            // Fallback for unknown protein
            return {
                text: `This is **${ctxPdb.toUpperCase()}**: "${ctxTitle || 'Unknown Title'}".\n\n` +
                    `I don't have a specific dossier on this one, but I can analyze its components. Try selecting a residue!`
            };
        }

        // 3. GENERAL KNOWLEDGE (Regex Match)
        if (q.match(/alpha|helix/)) return { text: "**🧬 Alpha Helix**: A right-handed coil where the backbone N-H hydrogen bonds to the C=O of the amino acid 4 residues (i+4) earlier. It's the most common secondary structure." };
        if (q.match(/beta|sheet|strand/)) return { text: "**🧬 Beta Sheet**: Consists of beta strands connected laterally by at least two or three backbone hydrogen bonds, forming a twisted, pleated sheet." };
        if (q.match(/hydropho/)) return { text: "**💧 Hydrophobic Effect**: The tendency of non-polar substances to aggregate in aqueous solution and exclude water molecules. It is the main driving force of protein folding!" };
        if (q.match(/disulfide|bridge/)) return { text: "**🔗 Disulfide Bond**: A covalent bond between the sulfur atoms of two Cysteine residues. It acts like a molecular 'staple' to stabilize the fold (common in secreted proteins)." };

        // 4. CHITCHAT
        if (q.match(/hello|hi|hey/)) return { text: "Hello! I am Dr. AI V4. I can now **control the viewer**. Try 'Color by hydrophobicity'!" };
        if (q.match(/joke|funny/)) return { text: "Why did the Biochemist cross the road? \n\nTo get to the other *site*! (Active site... get it? 🧪)" };
        if (q.match(/thank/)) return { text: "You are welcome. Science never sleeps! 🧬" };

        // 5. DEFAULT
        return { text: "Refine your query. You can ask me to:\n- **Control View**: 'Color by hydrophobicity', 'Reset view'\n- **Mutate**: Select a residue and ask 'Change to Arg'\n- **Analyze**: 'What is this helix?'" };
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: input,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // V7: LLM Logic with V6 Fallback
        if (apiKey) {
            try {
                // Construct History (Corrected for Gemini: Must start with User)
                let recentMessages = messages.slice(-10);
                // Remove leading AI messages until we find a user message
                while (recentMessages.length > 0 && recentMessages[0].sender === 'ai') {
                    recentMessages.shift();
                }

                const history = recentMessages.map(m => ({
                    role: (m.sender === 'user' ? 'user' : 'model') as "user" | "model",
                    parts: m.text
                }));

                const context = {
                    pdbId,
                    title: proteinTitle,
                    highlightedResidue,
                    uniprot,
                    chains,
                    stats
                };

                const response = await generateAIResponse(apiKey, history, userMsg.text, context);

                // Execute Actions
                if (response.actions) {
                    response.actions.forEach(action => {
                        console.log("Dr. AI Action:", action);
                        onAction(action);
                    });
                }

                setIsTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'ai',
                    text: response.text,
                    timestamp: new Date()
                }]);

            } catch (e) {
                console.error("LLM Error", e);
                setIsTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'ai',
                    text: "⚠️ **Connection Error**: I couldn't reach the AI brain. Please check your API Key or try again.",
                    timestamp: new Date()
                }]);
            }
        } else {
            // V6: Heuristic Fallback
            setTimeout(() => {
                const result = generateResponse(userMsg.text, pdbId, proteinTitle, highlightedResidue, stats, chains, uniprot);

                if (result.action) {
                    onAction(result.action);
                }

                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'ai',
                    text: result.text,
                    timestamp: new Date()
                }]);
                setIsTyping(false);
            }, 500);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={clsx(
            "fixed inset-y-0 right-0 w-80 sm:w-96 bg-gray-900/95 backdrop-blur-md border-l border-white/10 shadow-2xl transition-transform duration-300 z-50 flex flex-col font-sans",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/50 to-blue-900/50"> {/* Changed Color for V3 */}
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500 rounded-lg shadow-lg shadow-purple-500/20">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg leading-none">Dr. AI Analyst</h2>
                        <span className="text-xs text-purple-200">Active Agent V7.0 (Gemini)</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        title="AI Settings"
                    >
                        <Settings size={18} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Header */}

            {/* Settings Overlay */}
            {showSettings && (
                <div className="absolute inset-0 top-[70px] bg-gray-900/95 z-20 p-6 backdrop-blur-md flex flex-col gap-4">
                    <h3 className="text-white font-bold text-lg">🤖 Dr. AI Settings</h3>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Google Gemini API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                localStorage.setItem('gemini_api_key', e.target.value);
                            }}
                            placeholder="AIzaSy..."
                            className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500">
                            Your key is stored locally in your browser.
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline ml-1">
                                Get a free key here.
                            </a>
                        </p>
                    </div>

                    <div className="mt-auto">
                        <button
                            onClick={() => setShowSettings(false)}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Save & Close
                        </button>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {messages.map(msg => (
                    <div key={msg.id} className={clsx("flex gap-3", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-purple-600/80 flex items-center justify-center shrink-0 border border-white/10">
                                <Sparkles size={14} className="text-white" />
                            </div>
                        )}
                        <div className={clsx(
                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                            msg.sender === 'user'
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white/10 text-gray-100 rounded-bl-none border border-white/5"
                        )}>
                            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                            <span className="text-[10px] opacity-40 mt-1 block text-right">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        {msg.sender === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-white/10">
                                <User size={14} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 justify-start animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-purple-600/50 shrink-0" />
                        <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/5 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-gray-900">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask 'Color by hydrophobicity'..."
                        className="w-full bg-black/40 border border-white/20 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-white/20"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
