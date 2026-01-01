import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, X } from 'lucide-react';
import clsx from 'clsx';
import type { ResidueInfo } from '../types';

interface AISidebarProps {
    isOpen: boolean;
    onClose: () => void;
    pdbId: string | null;
    proteinTitle: string | null;
    highlightedResidue: ResidueInfo | null;
}

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

// --- KNOWLEDGE BASE V2 ---

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

const FAMOUS_PROTEINS: Record<string, string> = {
    '4HHB': "This is **Hemoglobin**, the oxygen-transport protein. It's a tetramer (2 alpha, 2 beta chains). The Heme groups bind iron, which binds oxygen.",
    '1CRN': "This is **Crambin**, a small seed storage protein. It's famous for being extremely well-resolved in crystallography (atomic resolution)!",
    '1TIM': "This is **Triosephosphate Isomerase**, the classic example of the 'TIM Barrel' fold (8-stranded beta barrel surrounded by alpha helices).",
    '1GFL': "This is **Green Fluorescent Protein (GFP)**. The beta-barrel protects the central chromophore, which glows green under UV light!",
    '6VXX': "This looks like a **SARS-CoV-2 Spike Protein** structure. It's the key target for vaccines.",
    '1UBQ': "This is **Ubiquitin**, a small regulatory protein found in almost all tissues (ubiquitous!). It tags other proteins for degradation.",
    '2B3P': "This is a designed protein structure (often used as a demo). Notice the secondary structure elements packing together."
};

// --- LOGIC ENGINE ---

export const AISidebar: React.FC<AISidebarProps> = ({
    isOpen,
    onClose,
    pdbId,
    proteinTitle,
    highlightedResidue
}) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'ai',
            text: "🎓 **Dr. AI (V2)** here. My heuristics have been upgraded.\n\nI now have deep knowledge of amino acid chemistry and famous structures. Click a residue or ask away!",
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const generateResponse = (query: string, ctxPdb: string | null, ctxTitle: string | null, ctxRes: ResidueInfo | null): string => {
        const q = query.toLowerCase();

        // 1. DIRECT RESIDUE QUERY (Explicit click)
        if (ctxRes && (q.includes('this') || q.includes('selected') || q.includes('residue') || q.includes('what is'))) {
            const info = AMINO_ACID_DATA[ctxRes.resName] || { full: ctxRes.resName, type: 'Unknown', desc: '', fact: '' };
            return `**🔬 Identification**: You selected **${info.full} (${ctxRes.resName})**.\n` +
                `**📍 Position**: Chain ${ctxRes.chain}, Residue ${ctxRes.resNo}.\n\n` +
                `**🧪 Chemistry**: ${info.type}. ${info.desc}\n` +
                `**💡 Insight**: ${info.fact}`;
        }

        // 2. FAMOUS PROTEIN MATCH?
        if (ctxPdb && (q.includes('protein') || q.includes('structure') || q.includes('what is this'))) {
            const famousFact = FAMOUS_PROTEINS[ctxPdb.toUpperCase()];
            if (famousFact) return `**📚 Famous Structure Detected**:\n\n${famousFact}`;

            // Fallback for unknown protein
            return `This is **${ctxPdb.toUpperCase()}**: "${ctxTitle || 'Unknown Title'}".\n\n` +
                `I don't have a specific dossier on this one, but I can analyze its components. Try selecting a residue!`;
        }

        // 3. GENERAL KNOWLEDGE (Regex Match)
        if (q.match(/alpha|helix/)) return "**🧬 Alpha Helix**: A right-handed coil where the backbone N-H hydrogen bonds to the C=O of the amino acid 4 residues (i+4) earlier. It's the most common secondary structure.";
        if (q.match(/beta|sheet|strand/)) return "**🧬 Beta Sheet**: Consists of beta strands connected laterally by at least two or three backbone hydrogen bonds, forming a twisted, pleated sheet.";
        if (q.match(/hydropho/)) return "**💧 Hydrophobic Effect**: The tendency of non-polar substances to aggregate in aqueous solution and exclude water molecules. It is the main driving force of protein folding!";
        if (q.match(/disulfide|bridge/)) return "**🔗 Disulfide Bond**: A covalent bond between the sulfur atoms of two Cysteine residues. It acts like a molecular 'staple' to stabilize the fold (common in secreted proteins).";

        // 4. CHITCHAT
        if (q.match(/hello|hi|hey/)) return "Hello! I am ready to analyze. Load a PDB or click an atom.";
        if (q.match(/joke|funny/)) return "Why did the Biochemist cross the road? \n\nTo get to the other *site*! (Active site... get it? 🧪)";
        if (q.match(/thank/)) return "You are welcome. Science never sleeps! 🧬";

        // 5. DEFAULT
        return "Refine your query. You can ask about:\n- The **selected residue**\n- The **protein function**\n- Structural concepts (helices, sheets)\n- Or load a famous PDB like **1CRN** or **4HHB**.";
    };

    const handleSend = () => {
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

        setTimeout(() => {
            const responseText = generateResponse(userMsg.text, pdbId, proteinTitle, highlightedResidue);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: responseText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 600 + Math.random() * 400); // Faster response for V2
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
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-emerald-900/50 to-blue-900/50"> {/* Changed Color for V2 */}
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg leading-none">Dr. AI Analyst</h2>
                        <span className="text-xs text-emerald-200">Heuristics V2.0 (Active)</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {messages.map(msg => (
                    <div key={msg.id} className={clsx("flex gap-3", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-emerald-600/80 flex items-center justify-center shrink-0 border border-white/10">
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
                        <div className="w-8 h-8 rounded-full bg-emerald-600/50 shrink-0" />
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
                        placeholder="Ask expert question..."
                        className="w-full bg-black/40 border border-white/20 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-white/20"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
