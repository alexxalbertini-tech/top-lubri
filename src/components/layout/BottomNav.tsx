import React from 'react';
import { LayoutDashboard, Calendar, Wrench, Wallet, BarChart3, Settings, FileText, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { id: 'appointments', label: 'Agenda', icon: Calendar },
  { id: 'services', label: 'Serviços', icon: Wrench },
  { id: 'budgets', label: 'Orçamento', icon: ClipboardList },
  { id: 'cashflow', label: 'Caixa', icon: Wallet },
  { id: 'receipts', label: 'Nota', icon: FileText },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/5 pb-safe pt-3 px-6 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-500",
                isActive ? "text-primary scale-110" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className={cn("w-6 h-6 mb-1 transition-transform duration-500", isActive && "drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]")} />
              <span className={cn("text-[9px] font-black uppercase tracking-widest transition-opacity duration-500", isActive ? "opacity-100" : "opacity-0")}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,136,0.8)]" 
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
