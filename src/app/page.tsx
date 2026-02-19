'use client';

import { useState, useRef } from 'react';
import { Upload, ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import clsx, { ClassValue } from 'clsx';
import Image from 'next/image';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Simple progress steps
const STEPS = [
    "正在分析面部特征...",
    "正在联系詹姆斯...",
    "詹姆斯正在赶来...",
    "正在寻找拍摄角度...",
    "快门即将按下...",
];

export default function Home() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stepText, setStepText] = useState(STEPS[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setSelectedImage(e.target?.result as string);
            setGeneratedImage(null); // Reset previous result
        };
        reader.readAsDataURL(file);
    };

    const simulateProgress = () => {
        let currentStep = 0;
        setProgress(0);

        const interval = setInterval(() => {
            currentStep++;
            setProgress((prev) => Math.min(prev + 10, 90)); // Cap at 90 until done
            setStepText(STEPS[currentStep % STEPS.length]);
        }, 800);

        return interval;
    };

    const handleGenerate = async () => {
        if (!selectedImage) return;

        setIsLoading(true);
        const progressInterval = simulateProgress();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: selectedImage }),
            });

            if (!response.ok) throw new Error("Failed to generate");

            const data = await response.json();

            // Try to find the image URL in common OpenAI response structures
            // Sometimes it's in content, sometimes it's text.
            // Assuming standard chat completion structure first:
            const content = data.choices?.[0]?.message?.content;

            // If the model returns a direct URL in content text (common for some img models wrapped as chat)
            // Or if it returns markdown image syntax
            // We will naively look for a URL in the content if it's not JSON

            if (content) {
                // Simple heuristic: check if content looks like a URL or contains one
                // For now, let's assume the content itself MIGHT be the image URL or description
                // But usually image generation models return a specific url field or attachment.
                // Since user specified gpt-4o-image via chat completion, it's likely returning text DESCRIPTION or maybe a URL if it's a tool call.
                // BUT, user's prompt is a description.
                // Wait, if "gpt-4o-image" is actually an image generator, it might return a URL.

                // Let's look for http links in the content
                const urlMatch = content.match(/https?:\/\/[^\s)]+/);
                if (urlMatch) {
                    setGeneratedImage(urlMatch[0]);
                } else {
                    // If no URL found, maybe the proxy returns the image directly or base64?
                    // Or maybe it just described the image?
                    // Fallback: Display the content as text if it's not a URL, might be an error or description
                    console.log("No URL found in content:", content);
                    // For demo purposes if this fails we might need to adjust based on actual API behavior
                }
            }

            // If the proxy returns standard image generation response format (dall-e style)
            if (data.data && data.data[0]?.url) {
                setGeneratedImage(data.data[0].url);
            }

        } catch (error) {
            console.error(error);
            alert("生成失败，请重试");
        } finally {
            clearInterval(progressInterval);
            setProgress(100);
            setStepText("生成完成！");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none"></div>
            <div className="fixed inset-0 z-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col items-center min-h-screen justify-center">

                {/* Header */}
                <header className="text-center mb-12 space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-yellow-400 via-purple-500 to-indigo-600 animate-fade-in-up">
                        詹姆斯<span className="text-white block text-2xl md:text-3xl mt-2 font-light tracking-widest opacity-80">AI 合影工坊</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                        上传你的自拍，AI 将带你穿越到湖人主场，捕捉那个混乱而真实的瞬间。
                    </p>
                </header>

                {/* Main Interface */}
                <main className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                    {/* Upload Section */}
                    <div className="space-y-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "group relative aspect-[3/4] rounded-3xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden",
                                selectedImage ? "border-solid border-purple-500/30" : ""
                            )}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />

                            {selectedImage ? (
                                <img src={selectedImage} alt="User Upload" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center space-y-4 p-6">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-gray-300">点击上传照片</p>
                                        <p className="text-xs text-gray-500">支持 JPG, PNG (最大 5MB)</p>
                                    </div>
                                </div>
                            )}

                            {/* Hover Overlay for Change */}
                            {selectedImage && !isLoading && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <p className="text-white font-medium flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> 更换图片
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!selectedImage || isLoading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold tracking-wide shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    生成中...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    生成 AI 合影
                                </>
                            )}
                        </button>
                    </div>

                    {/* Result Section */}
                    <div className={cn(
                        "relative aspect-[3/4] rounded-3xl bg-black/40 border border-white/10 flex flex-col items-center justify-center overflow-hidden transition-all duration-500",
                        isLoading ? "border-purple-500/30 ring-1 ring-purple-500/20" : ""
                    )}>

                        {isLoading ? (
                            <div className="text-center space-y-6 p-8 w-full max-w-sm">
                                {/* Progress Bar */}
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-yellow-400 to-purple-600 transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-medium text-purple-200 animate-pulse">
                                        {stepText}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">
                                        PROCESSING_REQUEST... {progress}%
                                    </p>
                                </div>
                            </div>
                        ) : generatedImage ? (
                            <div className="relative w-full h-full group">
                                <img src={generatedImage} alt="AI Generated" className="w-full h-full object-cover animate-fade-in" />
                                {/* Actions */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-4">

                                    <a
                                        href={generatedImage}
                                        download="james-ai-photo.png"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        下载原图
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 px-6">
                                <div className="w-20 h-20 border-2 border-dashed border-white/5 rounded-2xl mx-auto mb-4 flex items-center justify-center rotate-3">
                                    <span className="text-4xl opacity-20">?</span>
                                </div>
                                <p>生成的合影将显示在这里</p>
                            </div>
                        )}

                    </div>

                </main>
            </div>
        </div>
    );
}

// Icon Components to avoid extra deps if needed, but using lucide is fine
function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}
