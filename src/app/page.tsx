'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import clsx, { ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Progress steps
const STEPS = [
    "正在分析面部特征...",
    "正在联系乐邦占士...",
    "乐邦占士正在赶来...",
    "正在寻找拍摄角度...",
    "快门即将按下...",
];

// Image compression utility
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1536;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error("Canvas error")); return; }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// Load the athlete reference image as base64
const loadReferenceImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.crossOrigin = "anonymous";
        img.src = "/lebron_reference.jpg";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Compress reference image too
            let width = img.width;
            let height = img.height;
            const maxDim = 1536;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error("Canvas error")); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = (err) => reject(err);
    });
};

export default function Home() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stepText, setStepText] = useState(STEPS[0]);
    const [debugUrl, setDebugUrl] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pre-load the reference image on mount
    useEffect(() => {
        loadReferenceImage()
            .then(setReferenceImage)
            .catch((err) => console.error("Failed to load reference image:", err));
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setSelectedImage(compressed);
            setGeneratedImage(null);
            setDebugUrl("");
        } catch (error) {
            console.error("Image compression failed:", error);
            alert("图片处理失败，请重试");
        }
    };

    const simulateProgress = () => {
        let currentStep = 0;
        setProgress(0);
        const interval = setInterval(() => {
            currentStep++;
            setProgress((prev) => Math.min(prev + 10, 90));
            setStepText(STEPS[currentStep % STEPS.length]);
        }, 800);
        return interval;
    };

    const handleGenerate = async () => {
        if (!selectedImage || !referenceImage) return;

        setIsLoading(true);
        setDebugUrl("");
        setGeneratedImage(null);
        const progressInterval = simulateProgress();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageA: selectedImage,     // User's selfie
                    imageB: referenceImage,    // Athlete reference
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const rawText = await response.text();
            const cleanText = rawText.trim();

            let data: any;
            try {
                data = JSON.parse(cleanText);
                console.log("Parsed API Response:", data);
            } catch (e) {
                console.error("JSON Parse Error:", e, cleanText);
                throw new Error("Invalid JSON response");
            }

            const imageUrl = data.imageUrl || "";

            if (imageUrl) {
                setGeneratedImage(imageUrl);
                setDebugUrl(data.originalUrl || imageUrl);
            } else {
                console.error("No image URL found. Data:", data);
                alert("未能识别返回的图片格式，请查看控制台日志");
            }

        } catch (error: any) {
            console.error(error);
            alert(`生成失败: ${error.message}`);
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
                        乐邦占士<span className="text-white block text-2xl md:text-3xl mt-2 font-light tracking-widest opacity-80">AI 合影工坊</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                        上传你的自拍，AI 将为你与乐邦占士生成一张真实感十足的合影。
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
                                        <p className="font-medium text-gray-300">点击上传你的照片</p>
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
                            disabled={!selectedImage || !referenceImage || isLoading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold tracking-wide shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    正在为你与乐邦占士合影...
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
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-4">
                                    <a
                                        href={generatedImage}
                                        download="lebron-ai-photo.png"
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
                                    <span className="text-4xl opacity-20">🏀</span>
                                </div>
                                <p>生成的合影将显示在这里</p>
                            </div>
                        )}

                    </div>

                </main>

                {/* Debug Info */}
                {debugUrl && (
                    <div className="mt-8 p-4 bg-gray-900 rounded-lg max-w-2xl w-full border border-gray-800 break-all">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" /> Debug Info: Image URL
                        </p>
                        <div className="text-[10px] sm:text-xs text-purple-400 font-mono bg-black p-2 rounded select-all cursor-text">
                            {debugUrl}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}
