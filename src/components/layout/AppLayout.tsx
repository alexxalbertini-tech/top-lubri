import React, { useState, useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
}

export function AppLayout({ children, activeTab, setActiveTab, title }: AppLayoutProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBtn(false);
      }
    } else {
      // Instrução manual para iOS ou outros
      alert('Para instalar: Clique no ícone de compartilhar e selecione "Adicionar à Tela de Início"');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex flex-col pb-24 selection:bg-primary/30">
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#000000] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.2)] border border-primary/20 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-black" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[#00ff88]" />
            <span className="relative z-10 text-white font-black text-lg mix-blend-difference">TL</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">{title}</h1>
        </div>
        
        <AnimatePresence>
          {showInstallBtn && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={handleInstallClick}
              className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center border border-primary/20 transition-all"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Instalar App
            </motion.button>
          )}
        </AnimatePresence>

        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden ml-3">
          <img src="https://picsum.photos/seed/user/100/100" alt="User" className="w-full h-full object-cover" />
        </div>
      </header>
      
      <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        {children}
      </main>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Decorative Glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] pointer-events-none -z-10" />
    </div>
  );
}
