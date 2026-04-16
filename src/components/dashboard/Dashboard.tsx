import React from 'react';
import { useFirebase } from '@/hooks/useFirebase';
import { PremiumCard } from '@/components/ui/PremiumUI';
import { TrendingUp, Calendar, CheckCircle2, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { services, appointments, cashFlow } = useFirebase();

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayServices = services.filter(s => s.date === today);
  const todayRevenue = todayServices.reduce((acc, curr) => acc + curr.value, 0);
  
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  
  const stats = [
    {
      title: 'Faturamento Hoje',
      value: `R$ ${todayRevenue.toLocaleString()}`,
      icon: Wallet,
      trend: '+12%',
      trendUp: true,
      color: 'text-primary'
    },
    {
      title: 'Serviços Hoje',
      value: todayServices.length.toString(),
      icon: CheckCircle2,
      trend: '+2',
      trendUp: true,
      color: 'text-emerald-400'
    },
    {
      title: 'Agenda Pendente',
      value: pendingAppointments.length.toString(),
      icon: Calendar,
      trend: '-5%',
      trendUp: false,
      color: 'text-amber-400'
    }
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Visão Geral</p>
        <h2 className="text-3xl font-black tracking-tighter">Performance <span className="text-primary italic">PRO</span></h2>
      </header>

      <PremiumCard className="p-6 bg-gradient-to-br from-zinc-900 to-black border-primary/20">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Faturamento Total</p>
            <h3 className="text-3xl font-black tracking-tighter text-white">
              R$ {cashFlow.filter(e => e.type === 'entry').reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs font-bold text-zinc-500">
          <span className="text-primary">+R$ 1.240</span>
          <span>nas últimas 24h</span>
        </div>
      </PremiumCard>

      <div className="grid grid-cols-2 gap-4">
        {stats.slice(1).map((stat, i) => (
          <div key={i}>
            <PremiumCard className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-xl bg-zinc-800 border border-white/5", stat.color.replace('text', 'bg').replace('400', '500/10'))}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
                {stat.trendUp !== null && (
                  <div className={cn("flex items-center text-[10px] font-black", stat.trendUp ? "text-primary" : "text-red-400")}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {stat.trend}
                  </div>
                )}
              </div>
              <h4 className="text-2xl font-black tracking-tighter">{stat.value}</h4>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1">{stat.title}</p>
            </PremiumCard>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Próximos Agendamentos</h3>
        {pendingAppointments.slice(0, 3).map((app) => (
          <div key={app.id}>
            <PremiumCard className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight">{app.clientName}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">{app.service}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-white">{app.time}</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Hoje</p>
              </div>
            </PremiumCard>
          </div>
        ))}
        {pendingAppointments.length === 0 && (
          <div className="text-center py-8 border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Sem agendamentos para hoje</p>
          </div>
        )}
      </div>
    </div>
  );
}
