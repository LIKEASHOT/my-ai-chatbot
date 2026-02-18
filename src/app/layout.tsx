import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Using a more distinctive font
import { Space_Grotesk } from "next/font/google"; // Import Space Grotesk
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "AI Chatbot | Cyberpunk Edition",
  description: "Next-gen AI assistant with a futuristic interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={spaceGrotesk.className}>
      <body className="antialiased min-h-screen relative overflow-hidden bg-black text-white">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900/10 to-transparent"></div>
        <div className="absolute inset-0 z-0 bg-cyber-grid w-full h-full opacity-20 pointer-events-none animate-pulse-slow"></div>

        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
