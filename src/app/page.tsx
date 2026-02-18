'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, Terminal } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import clsx, { ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            if (!response.ok) throw new Error(response.statusText);

            setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) return;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });

                setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1];
                    const update = { ...lastMsg, content: lastMsg.content + text };
                    return [...prev.slice(0, -1), update];
                });
            }
        } catch (error) {
            console.error('Error fetching chat:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'SYSTEM ERROR: Connection Interrupted.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
        setInput(target.value);
    }

    return (
        <div className="flex flex-col h-screen font-sans overflow-hidden">
            {/* Header */}
            <header className="px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500 blur-md opacity-40 rounded-lg group-hover:opacity-70 transition-opacity duration-300"></div>
                        <div className="relative bg-black/60 border border-cyan-500/30 p-2 rounded-lg group-hover:border-cyan-400 transition-colors">
                            <Sparkles className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse-slow" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                            NEURAL<span className="text-cyan-400">.CHAT</span>
                        </h1>
                        <div className="flex items-center gap-1.5 opacity-60 text-xs text-cyan-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span>SYSTEM ONLINE</span>
                        </div>
                    </div>
                </div>
                <div className="hidden sm:flex text-xs font-mono text-gray-500 gap-4">
                    <span>v2.0.45-beta</span>
                    <span className="text-cyan-900">|</span>
                    <span>LATENCY: 12ms</span>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scroll-smooth z-10 w-full max-w-5xl mx-auto">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in-up">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                            <div className="relative bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
                                <Bot className="w-20 h-20 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                                Hello, Human.
                            </h2>
                            <p className="text-gray-400 max-w-md mx-auto">
                                I am ready to process your queries. Ask me anything about code, the universe, or digital philosophy.
                            </p>
                        </div>

                        {/* Example Prompts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-8 text-sm">
                            {["写一段 Python 爬虫代码", "解释量子纠缠", "设计一个赛博朋克风格的按钮", "给我讲个冷笑话"].map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInput(prompt);
                                        // Optional: auto-submit logic could go here
                                    }}
                                    className="px-4 py-3 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 text-gray-300 rounded-xl transition-all text-left truncate group"
                                >
                                    <span className="text-cyan-500/50 mr-2 group-hover:text-cyan-400">&gt;</span>
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((m, index) => (
                        <div
                            key={index}
                            className={cn(
                                "group flex w-full gap-4 sm:gap-6 opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards]",
                                m.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-lg backdrop-blur-sm transition-all duration-300",
                                m.role === 'user'
                                    ? "bg-purple-900/20 border-purple-500/30 text-purple-200 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]"
                                    : "bg-cyan-900/20 border-cyan-500/30 text-cyan-200 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]"
                            )}>
                                {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>

                            {/* Message Bubble */}
                            <div className={cn(
                                "relative px-6 py-4 rounded-2xl max-w-[85%] sm:max-w-[75%] shadow-md backdrop-blur-md border text-sm sm:text-base leading-relaxed tracking-wide",
                                m.role === 'user'
                                    ? "bg-gradient-to-br from-purple-600/90 to-blue-600/90 border-transparent text-white rounded-tr-sm shadow-[0_4px_20px_rgba(147,51,234,0.3)]"
                                    : "bg-white/5 border-white/10 text-gray-100 rounded-tl-sm shadow-sm hover:border-white/20 transition-colors"
                            )}>
                                {/* Decorative Corner for AI */}
                                {m.role === 'assistant' && (
                                    <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-cyan-500/50 rounded-tl-xl opacity-50"></div>
                                )}

                                <p className="whitespace-pre-wrap break-words">{m.content}</p>

                                {/* Timestamp / Meta (static for now) */}
                                <div className={cn(
                                    "mt-2 text-[10px] uppercase tracking-widest opacity-40 font-mono flex justify-end",
                                    m.role === 'user' ? "text-purple-200" : "text-cyan-200"
                                )}>
                                    {m.role === 'user' ? 'USR_7X' : 'AI_CORE'}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* Loading Indicator */}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex w-full gap-4 sm:gap-6 mt-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-900/20 border border-cyan-500/30 text-cyan-200 flex items-center justify-center shrink-0 animate-pulse">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 rounded-tl-sm flex items-center gap-3 w-fit">
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-xs font-mono uppercase tracking-widest opacity-60">Computing</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
            </main>

            {/* Input Area */}
            <footer className="p-4 sm:p-6 bg-transparent sticky bottom-0 z-20">
                <div className="max-w-4xl mx-auto backdrop-blur-2xl bg-black/60 border border-white/10 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-2 relative group-focus-within:ring-1 group-focus-within:ring-cyan-500/50 transition-all duration-500">

                    {/* Glowing Border Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 opacity-0 group-focus-within:opacity-20 blur-md transition-opacity duration-500 pointer-events-none"></div>

                    <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-black/40 rounded-xl p-1">
                        <div className="pl-3 py-3 text-cyan-500/50 shrink-0">
                            <Terminal className="w-5 h-5" />
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter command..."
                            rows={1}
                            className="flex-1 max-h-[200px] py-3 px-2 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 resize-none font-sans text-base leading-relaxed scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
                        />

                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="mb-1 p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-30 disabled:hover:bg-cyan-600 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
                <div className="text-center mt-3 text-[10px] text-gray-600 font-mono tracking-widest uppercase">
                    Neural Interface v2.0 • Secure Connection
                </div>
            </footer>
        </div>
    );
}
