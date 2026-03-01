/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  Download, 
  Moon, 
  Sun, 
  Loader2, 
  Image as ImageIcon,
  Settings2,
  ChevronDown,
  AlertCircle,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Extend window for AI Studio API
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type ImageSize = "4K";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError(null);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: imageSize
          }
        },
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newImage: GeneratedImage = {
          id: Math.random().toString(36).substring(7),
          url: imageUrl,
          prompt: prompt,
          timestamp: Date.now(),
        };
        setImages(prev => [newImage, ...prev]);
        setPrompt('');
      } else {
        throw new Error('No image data received from the model.');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError("API Key session expired or invalid. Please select your key again.");
      } else {
        setError(err.message || "Failed to generate image. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `snapgan-${prompt.slice(0, 20).replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 border-b ${isDarkMode ? 'border-white/10 bg-black/50' : 'border-black/5 bg-white/50'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
              <Sparkles size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tighter uppercase">snapGan AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {!hasApiKey && (
              <button 
                onClick={handleOpenKeySelector}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
              >
                <Key size={14} />
                Connect API Key
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Imagine. Generate. <span className="italic font-serif">Create.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`max-w-2xl text-lg ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
          >
            The next generation of AI image synthesis. Professional grade results with a minimalist touch.
          </motion.p>
        </div>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className={`relative p-2 rounded-2xl border transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/50 border-white/10 focus-within:border-white/30' : 'bg-zinc-50 border-black/5 focus-within:border-black/20'}`}>
            <div className="flex flex-col md:flex-row gap-2">
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateImage()}
                placeholder="Describe the image you want..."
                className="flex-1 bg-transparent px-4 py-3 outline-none text-lg placeholder:text-zinc-500"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-3 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                  title="Settings"
                >
                  <Settings2 size={20} className={showSettings ? 'text-emerald-500' : ''} />
                </button>
                <button 
                  onClick={generateImage}
                  disabled={isGenerating || !prompt.trim() || !hasApiKey}
                  className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
                >
                  {isGenerating ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Settings Dropdown */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`mt-2 p-4 rounded-xl border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium opacity-60">Resolution</span>
                      <div className="flex gap-2">
                        {(["4K"] as ImageSize[]).map((size) => (
                          <button
                            key={size}
                            onClick={() => setImageSize(size)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              imageSize === size 
                                ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                                : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300')
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3"
              >
                <AlertCircle size={20} />
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{error}</p>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] underline opacity-70 hover:opacity-100"
                  >
                    Check billing status
                  </a>
                </div>
                {!hasApiKey && (
                  <button 
                    onClick={handleOpenKeySelector}
                    className="ml-auto text-xs underline font-bold"
                  >
                    Select Key
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!hasApiKey && !error && (
            <div className="mt-4 text-center">
              <p className="text-sm opacity-50 flex items-center justify-center gap-2 mb-2">
                <Key size={14} />
                Please connect your Gemini API key to start generating.
              </p>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs opacity-40 hover:opacity-100 underline transition-opacity"
              >
                Learn about billing requirements
              </a>
            </div>
          )}
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`aspect-square rounded-3xl border border-dashed flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'border-white/20 bg-white/5' : 'border-black/10 bg-black/5'}`}
              >
                <Loader2 className="animate-spin opacity-40" size={40} />
                <p className="text-sm font-medium opacity-40">Generating magic...</p>
              </motion.div>
            )}
            
            {images.map((img) => (
              <motion.div 
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative aspect-square rounded-3xl overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}
              >
                <img 
                  src={img.url} 
                  alt={img.prompt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <p className="text-white text-sm font-medium line-clamp-2 mb-4">{img.prompt}</p>
                  <button 
                    onClick={() => downloadImage(img.url, img.prompt)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                  >
                    <Download size={18} />
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {images.length === 0 && !isGenerating && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20">
              <ImageIcon size={64} strokeWidth={1} />
              <p className="mt-4 text-xl font-medium">Your gallery is empty</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-10 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 opacity-40 text-sm">
          <p>© 2026 snapGan AI. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:underline">Billing Info</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
