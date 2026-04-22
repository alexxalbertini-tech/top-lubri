import React, { useState } from 'react';
import { useFirebase } from '@/hooks/useFirebase';
import { PremiumCard, PremiumButton } from '@/components/ui/PremiumUI';
import { Plus, Minus, ArrowUpCircle, ArrowDownCircle, Wallet, Banknote, QrCode, CreditCard, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { cn, closeKeyboard } from '@/lib/utils';

export function CashFlow({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { cashFlow, addCashFlowEntry, deleteItem } = useFirebase();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [entryType, setEntryType] = useState<'entry' | 'exit'>('entry');

  const handleDelete = async (id: string) => {
    try {
      await deleteItem('caixa', id);
    } catch (error) {
      toast.error('Erro ao excluir movimentação');
    }
  };

  // Form state
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    const val = parseFloat(value);
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setIsSaving(true);
    closeKeyboard();
    try {
      // 1. Await database operation fully
      await addCashFlowEntry({
        type: entryType,
        value: val,
        description,
        paymentMethod,
        date: new Date().toISOString().split('T')[0]
      });

      // 2. Success Feedback
      toast.success(`${entryType === 'entry' ? 'Entrada' : 'Saída'} registrada com sucesso!`);

      // 3. Reset and Close flow
      resetForm();
      setIsAdding(false);
    } catch (error) {
      console.error('ERRO AO REGISTRAR CAIXA:', error);
      toast.error('Erro ao registrar fluxo de caixa. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setValue('');
    setDescription('');
  };

  const totalEntries = cashFlow.filter(e => e.type === 'entry').reduce((acc, curr) => acc + curr.value, 0);
  const totalExits = cashFlow.filter(e => e.type === 'exit').reduce((acc, curr) => acc + curr.value, 0);
  const balance = totalEntries - totalExits;

  const entriesByType = {
    Dinheiro: cashFlow.filter(e => e.paymentMethod === 'Dinheiro' && e.type === 'entry').reduce((acc, curr) => acc + curr.value, 0),
    Pix: cashFlow.filter(e => e.paymentMethod === 'Pix' && e.type === 'entry').reduce((acc, curr) => acc + curr.value, 0),
    Cartão: cashFlow.filter(e => e.paymentMethod === 'Cartão' && e.type === 'entry').reduce((acc, curr) => acc + curr.value, 0),
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Gestão Financeira</p>
        <h2 className="text-3xl font-black tracking-tighter">Fluxo de <span className="text-primary italic">Caixa</span></h2>
      </header>

      <PremiumCard className="p-6 bg-gradient-to-br from-zinc-900 to-black border-primary/20">
        <div className="flex justify-between items-center mb-6">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Saldo em Caixa</p>
            <h3 className={cn("text-3xl font-black tracking-tighter", balance >= 0 ? "text-white" : "text-red-400")}>
              R$ {balance.toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center space-x-2">
            <ArrowUpCircle className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Entradas</p>
              <p className="text-xs font-black text-white">R$ {totalEntries.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowDownCircle className="w-4 h-4 text-red-400" />
            <div>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Saídas</p>
              <p className="text-xs font-black text-white">R$ {totalExits.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </PremiumCard>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Dinheiro', value: entriesByType.Dinheiro, icon: Banknote, color: 'text-emerald-400' },
          { label: 'Pix', value: entriesByType.Pix, icon: QrCode, color: 'text-blue-400' },
          { label: 'Cartão', value: entriesByType.Cartão, icon: CreditCard, color: 'text-purple-400' },
        ].map((item, i) => (
          <div key={i}>
            <PremiumCard className="p-3 text-center">
              <item.icon className={cn("w-5 h-5 mx-auto mb-2", item.color)} />
              <p className="text-[11px] font-black tracking-tighter">R$ {item.value.toFixed(0)}</p>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">{item.label}</p>
            </PremiumCard>
          </div>
        ))}
      </div>

      <div className="flex space-x-4">
        <PremiumButton 
          onClick={() => { setEntryType('entry'); setIsAdding(true); }}
          className="flex-1 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black"
        >
          <Plus className="w-5 h-5 mr-2" /> Entrada
        </PremiumButton>
        <PremiumButton 
          onClick={() => { setEntryType('exit'); setIsAdding(true); }}
          className="flex-1 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
        >
          <Minus className="w-5 h-5 mr-2" /> Saída
        </PremiumButton>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <PremiumCard className="w-full max-w-sm relative pointer-events-auto" animate={false}>
              <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black uppercase italic mb-6">
                Nova {entryType === 'entry' ? 'Entrada' : 'Saída'}
              </h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Valor (R$)</Label>
                  <Input autoFocus type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} required className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Descrição</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} required className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Método</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <PremiumButton type="submit" disabled={isSaving} className={cn("w-full mt-4 h-14", entryType === 'exit' ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90")}>
                  {isSaving ? 'Registrando...' : `Confirmar ${entryType === 'entry' ? 'Recebimento' : 'Pagamento'}`}
                </PremiumButton>
              </form>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Últimas Movimentações</h3>
        {cashFlow.slice(0, 10).map((entry) => (
          <div key={entry.id}>
            <PremiumCard className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border",
                entry.type === 'entry' ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20"
              )}>
                {entry.type === 'entry' ? <ArrowUpCircle className="w-5 h-5 text-primary" /> : <ArrowDownCircle className="w-5 h-5 text-red-400" />}
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight">{entry.description}</h4>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest italic">{entry.paymentMethod} • {entry.date}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className={cn("text-sm font-black", entry.type === 'entry' ? "text-primary" : "text-red-400")}>
                  {entry.type === 'entry' ? '+' : '-'} R$ {entry.value.toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => handleDelete(entry.id)}
                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </PremiumCard>
        </div>
      ))}
    </div>
  </div>
);
}
