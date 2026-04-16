import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { PremiumCard, PremiumButton } from '@/components/ui/PremiumUI';
import { Camera, Building2, Smartphone, ShieldCheck, LogOut, Info, ChevronRight, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Settings() {
  const { user, profile } = useAuth();
  const [companyName, setCompanyName] = useState(profile?.companyName || '');

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), {
        companyName
      });
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleLogout = () => {
    auth.signOut();
    toast.info('Sessão encerrada');
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Preferências do App</p>
        <h2 className="text-3xl font-black tracking-tighter">Ajustes <span className="text-primary italic">Gerais</span></h2>
      </header>

      <PremiumCard className="p-0 overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-zinc-900 to-black border-b border-white/5">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="w-20 h-20 bg-zinc-800 rounded-[2rem] flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                {profile?.logoUrl ? (
                  <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Building2 className="w-8 h-8 text-zinc-600" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-xl shadow-lg transform group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4 text-black" />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tighter">{profile?.companyName || 'Sua Oficina'}</h3>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Nome da Empresa</Label>
            <Input 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)} 
              className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" 
            />
          </div>
          <PremiumButton onClick={handleSave} className="w-full h-14">Salvar Alterações</PremiumButton>
        </div>
      </PremiumCard>

      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-2">Segurança e Sistema</h3>
        
        <PremiumCard className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-black tracking-tight">Privacidade e Dados</span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
        </PremiumCard>

        <PremiumCard className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm font-black tracking-tight">Notificações</span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
        </PremiumCard>

        <PremiumCard className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-zinc-800 rounded-xl">
              <Info className="w-5 h-5 text-zinc-400" />
            </div>
            <span className="text-sm font-black tracking-tight">Sobre o App</span>
          </div>
          <span className="text-[10px] font-black text-zinc-600">v3.0.0 PRO</span>
        </PremiumCard>

        <PremiumButton 
          variant="outline" 
          onClick={handleLogout}
          className="w-full h-14 rounded-2xl border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white mt-4"
        >
          <LogOut className="w-5 h-5 mr-2" /> Sair da Conta
        </PremiumButton>
      </div>
    </div>
  );
}
