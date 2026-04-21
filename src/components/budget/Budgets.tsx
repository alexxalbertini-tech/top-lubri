import React, { useState, useMemo } from 'react';
import { useFirebase } from '@/hooks/useFirebase';
import { useAuth } from '@/hooks/useAuth';
import { PremiumCard, PremiumButton } from '../ui/PremiumUI';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Download, 
  Share2, 
  User, 
  Car, 
  Hash, 
  Wrench, 
  Package, 
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { BudgetItem, Budget } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Budgets({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { budgets, addBudget, deleteItem } = useFirebase();
  const { profile } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [clientName, setClientName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  
  const [services, setServices] = useState<{ description: string; value: string }[]>([{ description: '', value: '' }]);
  const [parts, setParts] = useState<{ description: string; quantity: string; unitValue: string }[]>([{ description: '', quantity: '', unitValue: '' }]);

  // Calculations
  const totalLabor = useMemo(() => services.reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0), [services]);
  
  const totalParts = useMemo(() => parts.reduce((acc, p) => {
    const q = parseFloat(p.quantity) || 0;
    const v = parseFloat(p.unitValue) || 0;
    return acc + (q * v);
  }, 0), [parts]);

  const totalGeneral = totalLabor + totalParts;

  const resetForm = () => {
    setClientName('');
    setWhatsapp('');
    setVehicle('');
    setPlate('');
    setServices([{ description: '', value: '' }]);
    setParts([{ description: '', quantity: '', unitValue: '' }]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!clientName) {
      toast.error('Informe o nome do cliente');
      return;
    }

    setIsSaving(true);
    try {
      const budgetData = {
        clientName,
        whatsapp,
        vehicle,
        plate,
        services: services.filter(s => s.description).map(s => ({ description: s.description, value: parseFloat(s.value) || 0 })),
        parts: parts.filter(p => p.description).map(p => ({
          description: p.description,
          quantity: parseFloat(p.quantity) || 0,
          unitValue: parseFloat(p.unitValue) || 0,
          total: (parseFloat(p.quantity) || 0) * (parseFloat(p.unitValue) || 0)
        })),
        totalLabor,
        totalParts,
        totalGeneral,
        date: new Date().toISOString(),
        status: 'draft' as const
      };

      // 1. Await database operation fully
      await addBudget(budgetData);

      // 2. Success Feedback
      alert('Orçamento salvo com sucesso!');
      
      // 3. Reset and Close flow (PROFESSIONAL)
      resetForm();
      setIsAdding(false);
      
      // 4. Update Tab
      if (setActiveTab) setActiveTab('dashboard');

      // 5. Final fallback: Forced reload/navigation as requested (HARD TEST)
      setTimeout(() => {
        window.location.href = "/";
      }, 500);

    } catch (error) {
      console.error('ERRO AO SALVAR ORÇAMENTO:', error);
      toast.error('Erro ao salvar orçamento. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem('orcamentos', id);
    } catch (error) {
      toast.error('Erro ao excluir orçamento');
    }
  };

  const generatePDF = (dados: any) => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();

    const total =
      (Number(dados.maoDeObra) || 0) +
      (Number(dados.pecas) || 0) +
      (Number(dados.oleo) || 0);

    // 🔥 Brand Header
    doc.setFontSize(22);
    doc.setTextColor(0, 255, 136); // Primary Brand Color
    doc.text("TOP LUBRI", 105, 25, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("SOLUÇÕES AUTOMOTIVAS & LUBRIFICAÇÃO", 105, 32, { align: "center" });

    doc.setDrawColor(200);
    doc.line(15, 40, 195, 40);

    // Professional Header Information
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("ORÇAMENTO DE SERVIÇOS", 20, 55);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Data: " + format(new Date(), 'dd/MM/yyyy HH:mm'), 150, 55);

    doc.setDrawColor(240);
    doc.setFillColor(250);
    doc.rect(15, 60, 180, 30, "F");

    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text("CLIENTE: " + (dados.cliente || dados.clientName || "-").toUpperCase(), 22, 72);
    doc.text("WHATSAPP: " + (dados.whatsapp || "-"), 22, 82);
    doc.text("VEÍCULO: " + (dados.veiculo || dados.vehicle || "-").toUpperCase(), 120, 72);
    doc.text("PLACA: " + (dados.plate || "-").toUpperCase(), 120, 82);

    // Service Description Table Header
    doc.setFillColor(30, 30, 30);
    doc.rect(15, 100, 180, 8, "F");
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("DESCRIÇÃO DO SERVIÇO / ITENS", 22, 106);

    doc.setTextColor(0);
    doc.setFontSize(11);
    const serviceText = dados.servico || dados.service || "-";
    const splitService = doc.splitTextToSize(serviceText, 170);
    doc.text(splitService, 22, 118);

    // Summary of Values
    let currentY = 160;
    doc.setDrawColor(0, 255, 136);
    doc.setLineWidth(0.5);
    doc.line(120, currentY, 195, currentY);

    currentY += 10;
    doc.setFontSize(11);
    doc.text("MÃO DE OBRA:", 120, currentY);
    doc.text("R$ " + (Number(dados.maoDeObra) || 0).toFixed(2), 195, currentY, { align: "right" });

    currentY += 8;
    doc.text("PEÇAS / MATERIAIS:", 120, currentY);
    doc.text("R$ " + (Number(dados.pecas) || 0).toFixed(2), 195, currentY, { align: "right" });

    currentY += 8;
    doc.text("ÓLEO / LUBRIFICANTES:", 120, currentY);
    doc.text("R$ " + (Number(dados.oleo) || 0).toFixed(2), 195, currentY, { align: "right" });

    currentY += 15;
    doc.setFillColor(0, 255, 136);
    doc.rect(120, currentY - 7, 75, 10, "F");
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("TOTAL: R$ " + total.toFixed(2), 195, currentY, { align: "right" });

    // Footer
    currentY = 275;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Top Lubri - Palmital/SP - Telefone: (18) 99778-4303", 105, currentY, { align: "center" });

    doc.save(`orcamento_${(dados.cliente || "top_lubri").replace(/\s+/g, '_')}.pdf`);
  };

  const shareOnWhatsApp = (dados: any) => {
    const total =
      (Number(dados.maoDeObra) || 0) +
      (Number(dados.pecas) || 0) +
      (Number(dados.oleo) || 0);

    const texto = 
`🛠️ *ORÇAMENTO TOP LUBRI* 🛠️

👤 *Cliente:* ${dados.cliente || dados.clientName}
🔧 *Serviço:* ${dados.servico || dados.service}
💰 *Total:* R$ ${total.toFixed(2)}

_Emitido via Top Lubri Palmital_`;

    const phone = (dados.whatsapp || '').replace(/\D/g, '');
    const url = "https://wa.me/55" + phone + "?text=" + encodeURIComponent(texto);
    window.open(url, "_blank");
  };

  const filteredBudgets = budgets.filter(b => 
    b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24">
      <header className="space-y-1">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Gestão Comercial</p>
        <h2 className="text-3xl font-black tracking-tighter">Central de <span className="text-primary italic">Orçamentos</span></h2>
      </header>

      {!isAdding ? (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou veículo..."
              className="bg-zinc-900/50 border-zinc-800 rounded-2xl h-14 pl-12"
            />
          </div>

          <PremiumButton onClick={() => setIsAdding(true)} className="w-full h-16 rounded-2xl shadow-[0_0_20px_rgba(0,255,136,0.2)]">
            <Plus className="w-6 h-6 mr-2" /> Novo Orçamento
          </PremiumButton>

          <div className="space-y-4">
            {filteredBudgets.map((budget) => (
              <div key={budget.id}>
                <PremiumCard className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                        <ClipboardList className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black tracking-tighter">{budget.clientName}</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">{budget.vehicle} • {budget.plate}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Mão de Obra</p>
                      <p className="text-sm font-black text-white">R$ {budget.totalLabor.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Peças e Materiais</p>
                      <p className="text-sm font-black text-white">R$ {budget.totalParts.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-primary tracking-tighter">
                      R$ {budget.totalGeneral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => generatePDF(budget)}
                        className="p-3 bg-zinc-800 rounded-xl text-white hover:bg-zinc-700 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => shareOnWhatsApp(budget)}
                        className="p-3 bg-[#25D366]/10 rounded-xl text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </PremiumCard>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setIsAdding(false)} className="text-zinc-500 text-xs font-black uppercase tracking-widest">Voltar</button>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Montando Orçamento</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Cliente Section */}
            <PremiumCard className="p-6 space-y-4 border-primary/20 bg-zinc-900/50">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-primary" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Dados do Cliente</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Nome</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} required className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">WhatsApp</Label>
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Veículo</Label>
                  <Input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Ex: Golf 2.0" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Placa</Label>
                  <Input value={plate} onChange={e => setPlate(e.target.value)} placeholder="000-0000" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
              </div>
            </PremiumCard>

            {/* Mão de Obra Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Mão de Obra</h4>
                </div>
                <button 
                  type="button" 
                  onClick={() => setServices([...services, { description: '', value: '' }])}
                  className="p-2 bg-primary/10 rounded-lg"
                >
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              </div>
              {services.map((s, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-[2] space-y-1.5">
                    <Input 
                      placeholder="Descrição do serviço" 
                      value={s.description} 
                      onChange={e => {
                        const newS = [...services];
                        newS[idx].description = e.target.value;
                        setServices(newS);
                      }}
                      className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" 
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Input 
                      type="number"
                      placeholder="R$" 
                      value={s.value} 
                      onChange={e => {
                        const newS = [...services];
                        newS[idx].value = e.target.value;
                        setServices(newS);
                      }}
                      className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setServices(services.filter((_, i) => i !== idx))}
                    className="p-3 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Peças Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Peças</h4>
                </div>
                <button 
                  type="button" 
                  onClick={() => setParts([...parts, { description: '', quantity: '', unitValue: '' }])}
                  className="p-2 bg-primary/10 rounded-lg"
                >
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              </div>
              {parts.map((p, idx) => (
                <div key={idx} className="space-y-2 p-4 bg-zinc-900/30 rounded-2xl border border-white/5">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nome da peça" 
                      value={p.description} 
                      onChange={e => {
                        const newP = [...parts];
                        newP[idx].description = e.target.value;
                        setParts(newP);
                      }}
                      className="bg-zinc-800/50 border-zinc-700 rounded-xl h-10" 
                    />
                    <button 
                      type="button"
                      onClick={() => setParts(parts.filter((_, i) => i !== idx))}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="number"
                      placeholder="Qtd" 
                      value={p.quantity} 
                      onChange={e => {
                        const newP = [...parts];
                        newP[idx].quantity = e.target.value;
                        setParts(newP);
                      }}
                      className="bg-zinc-800/50 border-zinc-700 rounded-xl h-10" 
                    />
                    <Input 
                      type="number"
                      placeholder="V. Unit R$" 
                      value={p.unitValue} 
                      onChange={e => {
                        const newP = [...parts];
                        newP[idx].unitValue = e.target.value;
                        setParts(newP);
                      }}
                      className="bg-zinc-800/50 border-zinc-700 rounded-xl h-10" 
                    />
                  </div>
                  <div className="text-right text-[10px] font-black text-zinc-500">
                    Subtotal: R$ {((parseFloat(p.quantity) || 0) * (parseFloat(p.unitValue) || 0)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Geral Footer */}
            <div className="sticky bottom-4 left-0 right-0 z-40">
              <PremiumCard className="p-6 bg-primary shadow-[0_-10px_40px_rgba(0,255,136,0.3)] border-none">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-black font-black uppercase tracking-tighter italic">Total Geral</div>
                  <div className="text-3xl font-black text-black tracking-tighter">
                    R$ {totalGeneral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <PremiumButton type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isSaving} className="flex-1 bg-black text-white border-black h-12">Cancelar</PremiumButton>
                  <PremiumButton type="submit" disabled={isSaving} className="flex-[2] bg-black text-primary border-black h-12">
                    {isSaving ? 'Salvando...' : 'Salvar Orçamento'}
                  </PremiumButton>
                </div>
              </PremiumCard>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
