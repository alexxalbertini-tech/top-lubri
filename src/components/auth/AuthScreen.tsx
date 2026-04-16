import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, browserPopupRedirectResolver } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { PremiumButton, PremiumCard } from '../ui/PremiumUI';
import { motion } from 'motion/react';
import { LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function AuthScreen() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    
    // Melhora a experiência forçando a seleção de conta
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      // O browserPopupRedirectResolver é CRUCIAL para evitar erros de popup em iframes/mobile
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const user = result.user;
      
      console.log("LOGIN SUCESSO:", user.uid);

      // Garante que o perfil do usuário existe no Firestore
      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          companyName: 'Top Lubri PRO',
          createdAt: new Date().toISOString(),
        });
      }
      
      toast.success('Acesso autorizado!');
    } catch (error: any) {
      console.error('ERRO AUTENTICAÇÃO:', error.code, error.message);
      
      let msg = 'Erro ao entrar com Google';
      
      if (error.code === 'auth/popup-blocked') {
        msg = 'O navegador bloqueou o popup. Por favor, ative os popups.';
      } else if (error.code === 'auth/unauthorized-domain') {
        msg = 'Domínio não autorizado no Firebase Console.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        msg = 'Login cancelado pelo usuário.';
      }

      toast.error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-12 text-center"
      >
        <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(0,255,136,0.5)] mx-auto mb-6">
          <span className="text-black font-black text-5xl italic">T</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">
          Top Lubri <span className="text-primary">PRO</span>
        </h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">
          Gestão de Alta Performance
        </p>
      </motion.div>

      <PremiumCard className="w-full max-w-sm p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <h2 className="text-xl font-black uppercase italic mb-2">Acesso Seguro</h2>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">
          Utilize sua conta Google para sincronizar seus dados na nuvem
        </p>
        
        <PremiumButton 
          onClick={handleGoogleLogin} 
          disabled={isLoggingIn}
          className="w-full h-16 rounded-2xl flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          {isLoggingIn ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <LogIn className="w-6 h-6" />
          )}
          <span>{isLoggingIn ? 'Conectando...' : 'Entrar com Google'}</span>
        </PremiumButton>
        
        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-relaxed">
            Ao entrar, você concorda com o armazenamento seguro de seus dados no Google Cloud.
          </p>
        </div>
      </PremiumCard>
      
      <div className="mt-12 text-center max-w-xs">
        <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.4em] mb-4">
          v3.0.0 PRO EDITION
        </p>
        <p className="text-[8px] text-zinc-800 font-bold uppercase tracking-widest">
          Certifique-se de que o domínio atual está autorizado no seu Firebase Console.
        </p>
      </div>
    </div>
  );
}
