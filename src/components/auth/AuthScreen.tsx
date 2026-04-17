import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { PremiumButton, PremiumCard } from '../ui/PremiumUI';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { motion } from 'motion/react';
import { LogIn, Loader2, ShieldCheck, UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function AuthScreen() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const ensureProfile = async (uid: string, userEmail: string | null) => {
    const userRef = doc(db, 'usuarios', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: uid,
        email: userEmail,
        companyName: 'Top Lubri-Palmital',
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || !email || !password) return;
    
    setIsLoggingIn(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await ensureProfile(result.user.uid, result.user.email);
      toast.success('Bem-vindo de volta!');
    } catch (error: any) {
      console.error('ERRO LOGIN:', error.code);
      let msg = 'Erro ao entrar';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'E-mail inválido.';
      }
      toast.error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async () => {
    if (isLoggingIn || !email || !password) return;
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await ensureProfile(result.user.uid, result.user.email);
      toast.success('Conta criada com sucesso!');
    } catch (error: any) {
      console.error('ERRO CADASTRO:', error.code);
      let msg = 'Erro ao cadastrar';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Senha muito fraca.';
      }
      toast.error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Informe seu e-mail para recuperar a senha');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error('Erro ao enviar e-mail de recuperação.');
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
          Top Lubri <span className="text-primary italic">Palmital</span>
        </h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">
          Gestão de Alta Performance
        </p>
      </motion.div>

      <PremiumCard className="w-full max-w-sm p-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <h2 className="text-xl font-black uppercase italic mb-2 text-center">Acesso ao Sistema</h2>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8 text-center">
          Informe suas credenciais para continuar
        </p>
        
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500 flex items-center">
              <Mail className="w-3 h-3 mr-1" /> E-mail
            </Label>
            <Input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="seu@email.com"
              className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12 focus:border-primary/50" 
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500 flex items-center">
              <Lock className="w-3 h-3 mr-1" /> Senha
            </Label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12 focus:border-primary/50 pr-10" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-[9px] uppercase font-black tracking-widest text-zinc-500 hover:text-primary transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>

          <div className="pt-4 space-y-3">
            <PremiumButton 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full h-14 rounded-2xl flex items-center justify-center space-x-3 shadow-[0_0_20px_rgba(0,255,136,0.2)]"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              <span>{isLoggingIn ? 'Autenticando...' : 'Entrar'}</span>
            </PremiumButton>

            <PremiumButton 
              type="button" 
              variant="outline"
              onClick={handleRegister}
              disabled={isLoggingIn}
              className="w-full h-14 rounded-2xl flex items-center justify-center space-x-3 border-zinc-700 text-zinc-400 hover:text-white"
            >
              <UserPlus className="w-5 h-5" />
              <span>Criar Conta</span>
            </PremiumButton>
          </div>
        </form>
        
        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-relaxed text-center">
            Protegido com criptografia end-to-end.
          </p>
        </div>
      </PremiumCard>
      
      <div className="mt-12 text-center max-w-xs">
        <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.4em] mb-2">
          v3.1.0 PALMITAL EDITION
        </p>
      </div>
    </div>
  );
}
