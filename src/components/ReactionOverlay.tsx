import React, { useEffect, useState, useRef } from 'react';

interface FlyingEmoji {
    id: number;
    emoji: string;
    x: number; // Percentage 0-100
}

interface ReactionOverlayProps {
    lastReaction: { emoji: string; senderId: string; timestamp: number } | null;
}

export const ReactionOverlay: React.FC<ReactionOverlayProps> = ({ lastReaction }) => {
    const [emojis, setEmojis] = useState<FlyingEmoji[]>([]);
    const lastTimestampRef = useRef<number>(0);

    useEffect(() => {
        if (!lastReaction) return;
        if (lastReaction.timestamp <= lastTimestampRef.current) return;

        lastTimestampRef.current = lastReaction.timestamp;

        // Add new flying emoji
        const id = Date.now() + Math.random();
        // Randomize start X position between 20% and 80%
        const x = 20 + Math.random() * 60;

        const newEmoji: FlyingEmoji = { id, emoji: lastReaction.emoji, x };

        setEmojis(prev => [...prev, newEmoji]);

        // Cleanup after animation
        setTimeout(() => {
            setEmojis(prev => prev.filter(e => e.id !== id));
        }, 2000);

    }, [lastReaction]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[60]">
            {emojis.map(emoji => (
                <div
                    key={emoji.id}
                    className="absolute bottom-20 text-4xl animate-float-up opacity-0"
                    style={{
                        left: `${emoji.x}%`,
                        animationDuration: '2s',
                        animationTimingFunction: 'ease-out'
                    }}
                >
                    {emoji.emoji}
                </div>
            ))}

            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(0) scale(0.5); opacity: 0; }
                    10% { opacity: 1; transform: translateY(-20px) scale(1.2); }
                    100% { transform: translateY(-200px) scale(1); opacity: 0; }
                }
                .animate-float-up {
                    animation-name: float-up;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    );
};
