import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Minimize2 } from 'lucide-react';
import type { ChatMessage } from '../types';

interface SessionChatProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    myPeerId: string | null;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function SessionChat({ messages, onSendMessage, myPeerId, isOpen, setIsOpen }: SessionChatProps) {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        if (!isOpen) {
            // Simple unread logic: If closed, increment. 
            // Real logic requires tracking last read time, but this handles "new since closed".
            // Actually, we can't detect "new" easily without previous length.
            // Simplified: We'll just rely on the badge being cleared when opened.
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (!isOpen && messages.length > 0) {
            setUnreadCount(prev => prev + 1);
        } else {
            setUnreadCount(0);
        }
    }, [messages.length, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        onSendMessage(inputText);
        setInputText('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 md:left-[22rem] z-[50] p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95"
            >
                <div className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-black">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </button>
        );
    }

    return (
        <div className="fixed bottom-20 left-6 md:left-[22rem] z-[50] w-80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-[450px] max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-white/5">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-sm">Session Chat</span>
                    <span className="text-xs text-neutral-500 px-2 py-0.5 bg-neutral-200 dark:bg-white/10 rounded-full">
                        {messages.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-md transition-colors"
                    >
                        <Minimize2 className="w-4 h-4 text-neutral-500" />
                    </button>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-2">
                        <MessageSquare className="w-8 h-8 opacity-20" />
                        <p className="text-xs">No messages yet. Say hello!</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isSystem = msg.type === 'system';
                    const isMe = msg.senderId === myPeerId;

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-2">
                                <span className="text-[10px] font-mono bg-neutral-100 dark:bg-white/5 text-neutral-500 px-2 py-1 rounded-full border border-neutral-200 dark:border-white/5">
                                    {msg.content}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-[10px] font-bold text-neutral-500">
                                    {isMe ? 'You' : msg.senderName}
                                </span>
                                <span className="text-[9px] text-neutral-400">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className={`
                                max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                                ${isMe
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-none'
                                }
                            `}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-black/20">
                <div className="relative">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
