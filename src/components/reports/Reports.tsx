import React from 'react';
import { useFirebase } from '@/hooks/useFirebase';
import { PremiumCard } from '@/components/ui/PremiumUI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, DollarSign, Activity, PieChart } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function Reports() {
  const { cashFlow } = useFirebase();

  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const chartData = last7Days.map(day => {
    const dayEntries = cashFlow.filter(e => isSameDay(new Date(e.date + 'T12:00:00'), day));
    const revenue = dayEntries.filter(e => e.type === 'entry').reduce((acc, curr) => acc + curr.value, 0);
    const expenses = dayEntries.filter(e => e.type === 'exit').reduce((acc, curr) => acc + curr.value, 0);
    
    return {
      name: format(day, 'EEE', { locale: ptBR }),
      revenue,
      expenses,
      profit: revenue - expenses
    };
  });

  const totalRevenue = cashFlow.filter(e => e.type === 'entry').reduce((acc, curr) => acc + curr.value, 0);
  const totalExpenses = cashFlow.filter(e => e.type === 'exit').reduce((acc, curr) => acc + curr.value, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Análise de Performance</p>
        <h2 className="text-3xl font-black tracking-tighter">Relatórios <span className="text-primary italic">Analíticos</span></h2>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <PremiumCard className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Fluxo Semanal</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-[9px] font-black uppercase text-zinc-500">Receita</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                <span className="text-[9px] font-black uppercase text-zinc-500">Despesa</span>
              </div>
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151515', border: '1px solid #333', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' }}
                  cursor={{ stroke: '#00ff88', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#00ff88" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PremiumCard className="p-5">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl w-fit mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Receita</p>
          <h4 className="text-xl font-black tracking-tighter text-emerald-400">R$ {totalRevenue.toLocaleString()}</h4>
        </PremiumCard>
        
        <PremiumCard className="p-5">
          <div className="p-2.5 bg-red-500/10 rounded-xl w-fit mb-4">
            <Activity className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Despesas</p>
          <h4 className="text-xl font-black tracking-tighter text-red-400">R$ {totalExpenses.toLocaleString()}</h4>
        </PremiumCard>
      </div>

      <PremiumCard className="p-6 bg-zinc-900/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-black tracking-tighter">Lucro Líquido</h4>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest italic">Acumulado Total</p>
            </div>
          </div>
          <div className={cn(
            "text-2xl font-black tracking-tighter",
            totalProfit >= 0 ? "text-primary" : "text-red-400"
          )}>
            R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (totalProfit / (totalRevenue || 1)) * 100)}%` }}
            className="h-full bg-primary shadow-[0_0_10px_rgba(0,255,136,0.5)]"
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Margem de Lucro</span>
          <span className="text-[8px] font-black text-primary uppercase tracking-widest">
            {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </PremiumCard>
    </div>
  );
}
