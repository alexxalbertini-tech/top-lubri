/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './components/dashboard/Dashboard';
import { Appointments } from './components/appointments/Appointments';
import { Services } from './components/services/Services';
import { CashFlow } from './components/cashflow/CashFlow';
import { Reports } from './components/reports/Reports';
import { Settings } from './components/settings/Settings';
import { Receipts } from './components/receipts/Receipts';
import { Budgets } from './components/budget/Budgets';
import { Toaster } from './components/ui/sonner';
import { AnimatePresence, motion } from 'motion/react';
import { handleEnterToNext } from './lib/utils';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const root = document.getElementById("root");
      if (root) {
        root.style.height = window.innerHeight + "px";
      }
    };
    
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial call
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleEnterToNext);
    
    // Auto-scroll para campos quando focados no mobile
    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) {
        setTimeout(() => {
          (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };
    window.addEventListener("focusin", handleFocusIn);

    return () => {
      window.removeEventListener("keydown", handleEnterToNext);
      window.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  useEffect(() => {
    // Splash screen stays for 1.5s or until loading completes, whichever is longer
    if (!loading) {
      const timer = setTimeout(() => setIsInitialLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (isInitialLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,255,136,0.4)] animate-pulse">
            <span className="text-black font-black text-4xl italic">T</span>
          </div>
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full -z-10" />
        </motion.div>
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-2xl font-black tracking-tighter uppercase italic text-primary"
        >
          Top Lubri <span className="text-white">Palmital</span>
        </motion.h1>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <Toaster position="top-center" theme="dark" />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'appointments': return <Appointments setActiveTab={setActiveTab} />;
      case 'services': return <Services setActiveTab={setActiveTab} />;
      case 'budgets': return <Budgets setActiveTab={setActiveTab} />;
      case 'cashflow': return <CashFlow setActiveTab={setActiveTab} />;
      case 'reports': return <Reports />;
      case 'receipts': return <Receipts />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab} title={profile?.companyName || 'Top Lubri Palmital'}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.02, y: -10 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
      <Toaster position="top-center" theme="dark" />
    </AppLayout>
  );
}

