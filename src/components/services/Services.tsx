import React, { useState } from 'react';
import { useFirebase } from '@/hooks/useFirebase';
import { PremiumCard, PremiumButton } from '@/components/ui/PremiumUI';
import { Plus, TrendingUp, User, CreditCard, Banknote, QrCode, ChevronRight, Wrench, Package, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'motion/react';

export function Services() {
  const { services, addService } = useFirebase();
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [laborValue, setLaborValue] = useState('');
  const [partsValue, setPartsValue] = useState('');
  const [oilValue, setOilValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Pix' | 'Cartão'>('Pix');
  const [description, setDescription] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const labor = parseFloat(laborValue) || 0;
    const parts = parseFloat(partsValue) || 0;
    const oil = parseFloat(oilValue) || 0;
    const total = labor + parts + oil;

    if (total <= 0) {
      toast.error('O valor total deve ser maior que zero');
      return;
    }

    await addService({
      clientName,
      value: total,
      laborValue: labor,
      partsValue: parts,
      oilValue: oil,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      description
    });

    toast.success('Serviço registrado com sucesso!', {
      className: "bg-zinc-900 border-primary/50 text-white",
    });
    setIsAdding(false);
    resetForm();
  };

  const currentTotal = (parseFloat(laborValue) || 0) + (parseFloat(partsValue) || 0) + (parseFloat(oilValue) || 0);

  const resetForm = () => {
    setClientName('');
    setLaborValue('');
    setPartsValue('');
    setOilValue('');
    setDescription('');
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Histórico de Atendimentos</p>
          <h2 className="text-3xl font-black tracking-tighter">Serviços <span className="text-primary italic">Realizados</span></h2>
        </div>
        <PremiumButton 
          size="sm" 
          onClick={() => setIsAdding(true)}
          className="rounded-full h-12 w-12 p-0"
        >
          <Plus className="w-6 h-6" />
        </PremiumButton>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <PremiumCard className="w-full max-w-sm relative max-h-[90vh] overflow-y-auto pointer-events-auto" animate={false}>
              <h3 className="text-xl font-black uppercase italic mb-6">Novo Serviço</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Cliente</Label>
                  <Input autoFocus value={clientName} onChange={e => setClientName(e.target.value)} required className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center">
                      <Wrench className="w-3 h-3 mr-1 text-primary" /> Mão de Obra
                    </Label>
                    <Input type="number" value={laborValue} onChange={e => setLaborValue(e.target.value)} placeholder="0" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center">
                      <Package className="w-3 h-3 mr-1 text-primary" /> Peças
                    </Label>
                    <Input type="number" value={partsValue} onChange={e => setPartsValue(e.target.value)} placeholder="0" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center">
                      <Droplets className="w-3 h-3 mr-1 text-primary" /> Óleo
                    </Label>
                    <Input type="number" value={oilValue} onChange={e => setOilValue(e.target.value)} placeholder="0" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
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
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Descrição</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Troca de óleo e filtro" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Total do Serviço</span>
                  <span className="text-xl font-black text-primary tracking-tighter">R$ {currentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex space-x-3 pt-4">
                  <PremiumButton type="button" variant="outline" onClick={() => setIsAdding(false)} className="flex-1 h-14">Cancelar</PremiumButton>
                  <PremiumButton type="submit" className="flex-[2] h-14">Salvar Serviço</PremiumButton>
                </div>
              </form>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {services.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-900/10">
            <TrendingUp className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-xs text-zinc-600 font-black uppercase tracking-widest">Nenhum serviço registrado</p>
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id}>
              <PremiumCard className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight">{service.clientName}</h3>
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest italic">{service.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tracking-tighter text-primary">R$ {service.value.toLocaleString()}</p>
                  <div className="flex items-center justify-end space-x-1 mt-0.5">
                    {service.paymentMethod === 'Pix' ? <QrCode className="w-3 h-3 text-blue-400" /> : 
                     service.paymentMethod === 'Cartão' ? <CreditCard className="w-3 h-3 text-purple-400" /> : 
                     <Banknote className="w-3 h-3 text-emerald-400" />}
                    <span className="text-[8px] font-black uppercase text-zinc-500">{service.paymentMethod}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 mb-3">
                <div className="text-center">
                  <p className="text-[7px] text-zinc-500 font-black uppercase mb-0.5">Mão de Obra</p>
                  <p className="text-[10px] font-black">R$ {service.laborValue || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] text-zinc-500 font-black uppercase mb-0.5">Peças</p>
                  <p className="text-[10px] font-black">R$ {service.partsValue || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] text-zinc-500 font-black uppercase mb-0.5">Óleo</p>
                  <p className="text-[10px] font-black">R$ {service.oilValue || 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-zinc-400 font-medium italic truncate max-w-[200px]">
                  {service.description || 'Sem descrição'}
                </p>
                <ChevronRight className="w-4 h-4 text-zinc-700" />
              </div>
            </PremiumCard>
          </div>
        ))
      )}
    </div>
  </div>
);
}
