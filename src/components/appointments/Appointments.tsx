import React, { useState } from 'react';
import { useFirebase } from '@/hooks/useFirebase';
import { PremiumCard, PremiumButton } from '@/components/ui/PremiumUI';
import { Plus, MessageCircle, Calendar as CalendarIcon, Clock, User, Trash2, CheckCircle, X, Wrench, Package, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types';

export function Appointments({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { appointments, addAppointment, updateAppointment, completeAppointment, deleteItem } = useFirebase();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [service, setService] = useState('');
  const [laborValue, setLaborValue] = useState('');
  const [partsValue, setPartsValue] = useState('');
  const [oilValue, setOilValue] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const labor = parseFloat(laborValue) || 0;
      const parts = parseFloat(partsValue) || 0;
      const oil = parseFloat(oilValue) || 0;

      // 1. Await database operation fully
      await addAppointment({
        clientName,
        whatsapp,
        vehicle,
        service,
        laborValue: labor,
        partsValue: parts,
        oilValue: oil,
        date,
        time,
        status: 'pending',
      });

      // 2. Success Feedback
      alert('Agendamento confirmado com sucesso!');
      
      // 3. Reset and Close flow (PROFESSIONAL)
      resetForm();
      setIsAdding(false);
      
      // 4. Update Tab (State based navigation)
      if (setActiveTab) setActiveTab('dashboard');

      // 5. Final fallback: Forced reload/navigation as requested (HARD TEST)
      setTimeout(() => {
        window.location.href = "/";
      }, 500);

    } catch (error) {
      console.error('ERRO AO AGENDAR:', error);
      toast.error('Erro ao realizar agendamento. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentTotal = (parseFloat(laborValue) || 0) + (parseFloat(partsValue) || 0) + (parseFloat(oilValue) || 0);

  const resetForm = () => {
    setClientName('');
    setWhatsapp('');
    setVehicle('');
    setService('');
    setLaborValue('');
    setPartsValue('');
    setOilValue('');
    setTime('');
  };

  const handleStatus = async (app: Appointment, status: 'completed' | 'cancelled') => {
    if (status === 'completed') {
      await completeAppointment(app);
      toast.success('Agendamento concluído e lançado no financeiro!');
    } else {
      await updateAppointment(app.id, { status });
      toast.success('Agendamento cancelado');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem('agendamentos', id);
    } catch (error) {
      toast.error('Erro ao excluir agendamento');
    }
  };

  const openWhatsApp = (app: Appointment) => {
    const cleanPhone = app.whatsapp.replace(/\D/g, '');
    const dateFormatted = format(new Date(app.date + 'T00:00:00'), 'dd/MM/yyyy');
    
    const text = `🛠️ *AGENDAMENTO - TOP LUBRI* 🛠️\n\n` +
                 `👤 *Cliente:* ${app.clientName}\n` +
                 `🚗 *Veículo:* ${app.vehicle || 'Não informado'}\n` +
                 `📅 *Data:* ${dateFormatted}\n` +
                 `⏰ *Hora:* ${app.time}\n\n` +
                 `✅ *Status:* Reserva Confirmada!\n` +
                 `Nos vemos em breve!`;
    
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Gestão de Horários</p>
          <h2 className="text-3xl font-black tracking-tighter">Agenda <span className="text-primary italic">Ativa</span></h2>
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
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black uppercase italic mb-6">Novo Agendamento</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Cliente</Label>
                  <Input autoFocus value={clientName} onChange={e => setClientName(e.target.value)} required className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">WhatsApp</Label>
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="11999999999" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Veículo</Label>
                  <Input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Modelo/Placa" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Serviço</Label>
                  <Input value={service} onChange={e => setService(e.target.value)} required className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Data</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Hora</Label>
                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} required className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Total Previsto</span>
                  <span className="text-xl font-black text-primary tracking-tighter">R$ {currentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <PremiumButton type="submit" disabled={isSaving} className={cn("w-full mt-4 h-14", isSaving && "opacity-50 cursor-not-allowed")}>
                  {isSaving ? 'Processando...' : 'Confirmar Reserva'}
                </PremiumButton>
              </form>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-900/10">
            <CalendarIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-xs text-zinc-600 font-black uppercase tracking-widest">Sua agenda está vazia</p>
          </div>
        ) : (
          appointments.map((app) => (
            <div key={app.id}>
              <PremiumCard className="p-0 overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-white/5">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg tracking-tight">{app.clientName}</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic">{app.service}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      app.status === 'completed' ? "bg-primary/10 text-primary border border-primary/20" :
                      app.status === 'cancelled' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                      "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    )}>
                      {app.status === 'pending' ? 'Pendente' : app.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                      <p className="text-[7px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">Mão de Obra</p>
                      <p className="text-[10px] font-black text-white">R$ {app.laborValue}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                      <p className="text-[7px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">Peças/Materiais</p>
                      <p className="text-[10px] font-black text-white">R$ {app.partsValue}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-[11px] font-bold text-zinc-400 mb-6 px-1">
                    <div className="flex items-center">
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      {format(new Date(app.date + 'T00:00:00'), 'dd/MM/yy')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      {app.time}
                    </div>
                    <div className="flex items-center text-primary font-black">
                      Total: R$ {(app.laborValue || 0) + (app.partsValue || 0) + (app.oilValue || 0)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <PremiumButton 
                      variant="outline" 
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900/50"
                      onClick={() => openWhatsApp(app)}
                    >
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </PremiumButton>
                    <PremiumButton 
                      variant="outline" 
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900/50"
                      onClick={() => handleStatus(app, 'completed')}
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </PremiumButton>
                    <PremiumButton 
                      variant="outline" 
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900/50"
                      onClick={() => handleDelete(app.id)}
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </PremiumButton>
                  </div>
                </div>
              </PremiumCard>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
