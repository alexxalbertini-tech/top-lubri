import React from 'react';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
}

export function AppLayout({ children, activeTab, setActiveTab, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex flex-col pb-24 selection:bg-primary/30">
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.4)]">
            <span className="text-black font-black text-lg">T</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">{title}</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
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
