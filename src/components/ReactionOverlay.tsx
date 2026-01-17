import React, { useEffect, useState, useRef } from 'react';

interface FlyingEmoji {
    id: number;
    emoji: string;
    senderName: string;
    x: number; // Percentage 0-100
    isMe: boolean;
}

interface ReactionOverlayProps {
    lastReaction: { emoji: string; senderId: string; timestamp: number } | null;
    peerNames: Record<string, string>;
    myPeerId?: string;
}

export const ReactionOverlay: React.FC<ReactionOverlayProps> = ({ lastReaction, peerNames, myPeerId }) => {
    const [emojis, setEmojis] = useState<FlyingEmoji[]>([]);
    const lastTimestampRef = useRef<number>(0);

    useEffect(() => {
        if (!lastReaction) return;
        if (lastReaction.timestamp <= lastTimestampRef.current) return;

        lastTimestampRef.current = lastReaction.timestamp;

        // Determine Name
        const isMe = lastReaction.senderId === myPeerId;
        const senderName = isMe ? 'You' : (peerNames[lastReaction.senderId] || 'Guest');

        // Add new flying emoji
        const id = Date.now() + Math.random();
        // Randomize start X position between 20% and 80%
        const x = 20 + Math.random() * 60;

        const newEmoji: FlyingEmoji = { id, emoji: lastReaction.emoji, senderName, x, isMe };

        setEmojis(prev => [...prev, newEmoji]);

        // Cleanup after animation
        setTimeout(() => {
            setEmojis(prev => prev.filter(e => e.id !== id));
        }, 2500); // Slightly longer for reading

    }, [lastReaction, peerNames, myPeerId]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[60]">
            {emojis.map(emoji => (
                <div
                    key={emoji.id}
                    className="absolute bottom-20 flex flex-col items-center animate-float-up opacity-0"
                    style={{
                        left: `${emoji.x}%`,
                        animationDuration: '2.5s',
                        animationTimingFunction: 'ease-out'
                    }}
                >
                    <div className="text-4xl filter drop-shadow-lg">{emoji.emoji}</div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 backdrop-blur-sm shadow-sm whitespace-nowrap ${emoji.isMe
                            ? 'bg-blue-500/80 text-white'
                            : 'bg-white/80 text-neutral-800'
                        }`}>
                        {emoji.senderName}
                    </div>
                </div>
            ))}

            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(0) scale(0.5); opacity: 0; }
                    10% { opacity: 1; transform: translateY(-30px) scale(1.1); }
                    80% { opacity: 1; transform: translateY(-200px) scale(1); }
                    100% { transform: translateY(-250px) scale(0.8); opacity: 0; }
                }
                .animate-float-up {
                    animation-name: float-up;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    );
};
