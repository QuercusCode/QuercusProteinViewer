import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, X, ChevronRight, LayoutList } from 'lucide-react';
import clsx from 'clsx';
import { ResidueInfo } from '../types';

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
            text: "Hello! I'm Dr. AI. I can help you analyze this structure. Ask me about the protein, or click a residue and ask 'What is this?'",
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Context-Aware Response Logic (Simulated AI)
    const generateResponse = (query: string, ctxPdb: string | null, ctxTitle: string | null, ctxRes: ResidueInfo | null): string => {
        const q = query.toLowerCase();

        // 1. Selection Context
        if (q.includes('this') || q.includes('selected') || q.includes('residue')) {
            if (!ctxRes) return "You haven't selected anything yet! Click on an atom in the viewer first.";

            const resNameMap: Record<string, string> = {
                'ALA': 'Alanine (Hydrophobic)', 'ARG': 'Arginine (Positive)', 'ASN': 'Asparagine (Polar)',
                'ASP': 'Aspartic Acid (Negative)', 'CYS': 'Cysteine (Can form disulfides)', 'GLN': 'Glutamine (Polar)',
                'GLU': 'Glutamic Acid (Negative)', 'GLY': 'Glycine (Flexible)', 'HIS': 'Histidine (Positive/Neutral)',
                'ILE': 'Isoleucine (Hydrophobic)', 'LEU': 'Leucine (Hydrophobic)', 'LYS': 'Lysine (Positive)',
                'MET': 'Methionine (Start/Hydrophobic)', 'PHE': 'Phenylalanine (Aromatic)', 'PRO': 'Proline (Rigid)',
                'SER': 'Serine (Polar)', 'THR': 'Threonine (Polar)', 'TRP': 'Tryptophan (Aromatic)',
                'TYR': 'Tyrosine (Aromatic)', 'VAL': 'Valine (Hydrophobic)'
            };

            const desc = resNameMap[ctxRes.resName] || ctxRes.resName;
            return `You have selected **${desc}** at position ${ctxRes.resNo} on Chain ${ctxRes.chain}. \n\n${getEvolutionaryContext(ctxRes.resName)}`;
        }

        // 2. Protein Context
        if (q.includes('what is') || q.includes('function') || q.includes('summary')) {
            if (!ctxPdb) return "No protein is currently loaded. Load a PDB first!";
            if (ctxPdb.toLowerCase() === '4hhb') {
                return "This is **Hemoglobin**, the iron-containing oxygen-transport metalloprotein in red blood cells. It consists of four subunits (2 alpha, 2 beta).";
            }
            if (ctxTitle) {
                return `This structure is titled: **"${ctxTitle}"**. \n\nI can analyze its sequence properties if you ask about specific regions!`;
            }
            return `You are looking at PDB entry **${ctxPdb.toUpperCase()}**. I don't have a pre-trained summary for this specific entry in my demo database, but I can analyze its geometry!`;
        }

        // 3. General Biology
        if (q.includes('alpha') || q.includes('helix')) return "Alpha helices are right-handed coiled secondary structures, stabilized by hydrogen bonds between the backbone N-H and C=O groups.";
        if (q.includes('beta') || q.includes('sheet')) return "Beta sheets consist of beta strands connected laterally by at least two or three backbone hydrogen bonds, forming a generally twisted, pleated sheet.";

        // 4. Default
        return "I'm not sure about that yet. Try selecting a residue and asking 'What is this?', or ask 'What is this protein?'";
    };

    const getEvolutionaryContext = (resName: string) => {
        if (['GLY', 'PRO'].includes(resName)) return "💡 **Analyst Note**: This residue often breaks helices or introduces distinct turns in the structure.";
        if (['CYS'].includes(resName)) return "💡 **Analyst Note**: Look for other Cysteines nearby; they might form a stabilizing disulfide bridge.";
        if (['TRP', 'TYR', 'PHE'].includes(resName)) return "💡 **Analyst Note**: These aromatic rings are often found in the hydrophobic core, stabilizing the fold.";
        return "";
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

        // Simulate network delay
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
        }, 800 + Math.random() * 500);
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
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg leading-none">Dr. AI Analyst</h2>
                        <span className="text-xs text-blue-200">HoloLanguage v1.0</span>
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
                            <div className="w-8 h-8 rounded-full bg-blue-600/80 flex items-center justify-center shrink-0 border border-white/10">
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
                        <div className="w-8 h-8 rounded-full bg-blue-600/50 shrink-0" />
                        <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/5 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions (Quick Actions) */}
            <div className="p-3 border-t border-white/5 bg-black/20 overflow-x-auto whitespace-nowrap scrollbar-none">
                <div className="flex gap-2">
                    {[
                        "What is this protein?",
                        "Analyze selection",
                        "Explain helix",
                        "Show active site"
                    ].map(q => (
                        <button
                            key={q}
                            onClick={() => { setInput(q); handleSend(); }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-xs text-blue-200 transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-gray-900">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Dr. AI..."
                        className="w-full bg-black/40 border border-white/20 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-white/20"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-white/30">AI can hallucinate. Check important facts.</span>
                </div>
            </div>
        </div>
    );
};
