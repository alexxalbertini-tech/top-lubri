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
  Trash,
  DollarSign
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
  const [descriptionServico, setDescriptionServico] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');
  const [discount, setDiscount] = useState('0');
  
  const [items, setItems] = useState<Omit<BudgetItem, 'id'>[]>([
    { description: '', type: 'Serviço', quantity: 1, unitValue: 0, total: 0 }
  ]);

  // Calculations
  const totalLabor = useMemo(() => 
    items.filter(i => i.type === 'Serviço').reduce((acc, i) => acc + (Number(i.quantity) * Number(i.unitValue) || 0), 0)
  , [items]);
  
  const totalParts = useMemo(() => 
    items.filter(i => i.type === 'Peça').reduce((acc, i) => acc + (Number(i.quantity) * Number(i.unitValue) || 0), 0)
  , [items]);

  const totalOil = useMemo(() => 
    items.filter(i => i.type === 'Óleo').reduce((acc, i) => acc + (Number(i.quantity) * Number(i.unitValue) || 0), 0)
  , [items]);

  const subtotal = totalLabor + totalParts + totalOil;
  const totalGeneral = subtotal - (parseFloat(discount) || 0);

  const resetForm = () => {
    setClientName('');
    setWhatsapp('');
    setVehicle('');
    setPlate('');
    setDescriptionServico('');
    setPaymentMethod('Pix');
    setDiscount('0');
    setItems([{ description: '', type: 'Serviço', quantity: 1, unitValue: 0, total: 0 }]);
  };

  const addItem = () => {
    setItems([...items, { description: '', type: 'Serviço', quantity: 1, unitValue: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: keyof Omit<BudgetItem, 'id'>, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto calculate total for item
    if (field === 'quantity' || field === 'unitValue') {
      const q = parseFloat(String(field === 'quantity' ? value : newItems[index].quantity)) || 0;
      const v = parseFloat(String(field === 'unitValue' ? value : newItems[index].unitValue)) || 0;
      newItems[index].total = q * v;
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
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
        descriptionServico,
        paymentMethod,
        discount: parseFloat(discount) || 0,
        items: items.filter(i => i.description).map(i => ({
          ...i,
          quantity: parseFloat(String(i.quantity)) || 0,
          unitValue: parseFloat(String(i.unitValue)) || 0,
          total: (parseFloat(String(i.quantity)) || 0) * (parseFloat(String(i.unitValue)) || 0)
        })),
        totalLabor,
        totalParts,
        totalOil,
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
    const doc = new jsPDF();
    const primaryColor = [0, 255, 136]; // #00ff88
    
    // Helper for formatting currency
    const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 1. CABEÇALHO PROFISSIONAL
    // Logo Placeholder (Circle with T)
    doc.setFillColor(0, 255, 136);
    doc.circle(25, 25, 12, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("T", 21, 33);

    // Company Name & Subtitle
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(24);
    doc.text("TOP LUBRI", 45, 28);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("SOLUÇÕES AUTOMOTIVAS & LUBRIFICAÇÃO", 45, 34);

    // Company Data (Right Aligned)
    doc.setFontSize(9);
    doc.text("Palmital - SP", 195, 22, { align: 'right' });
    doc.text("Telefone: (18) 99778-4303", 195, 27, { align: 'right' });
    doc.text("CNPJ: 00.000.000/0001-00", 195, 32, { align: 'right' });

    doc.setDrawColor(230, 230, 230);
    doc.line(15, 42, 195, 42);

    // 2. INFORMAÇÕES DO DOCUMENTO
    let y = 52;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("ORDEM DE SERVIÇO", 15, y);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const osNumber = dados.id || Date.now().toString().slice(-6);
    doc.text(`Nº: ${osNumber}`, 195, y, { align: 'right' });
    y += 6;
    doc.text(`Data/Hora: ${format(new Date(dados.date || new Date()), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 195, y, { align: 'right' });

    y += 12;

    // 3 & 4. DADOS DO CLIENTE E VEÍCULO
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y, 180, 22, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CLIENTE", 20, y + 8);
    doc.text("DADOS DO VEÍCULO", 110, y + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(`Nome: ${dados.clientName || '-'}`, 20, y + 14);
    doc.text(`WhatsApp: ${dados.whatsapp || '-'}`, 20, y + 19);
    
    doc.text(`Veículo: ${dados.vehicle || '-'}`, 110, y + 14);
    doc.text(`Placa: ${(dados.plate || '-').toUpperCase()}`, 110, y + 19);

    y += 32;

    // 5. TABELA PROFISSIONAL DE ITENS
    const tableItems = (dados.items || []).map((item: any, index: number) => [
      index + 1,
      item.description,
      item.type,
      item.quantity,
      `R$ ${fmt(item.unitValue)}`,
      `R$ ${fmt(item.total)}`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['ITEM', 'DESCRIÇÃO', 'TIPO', 'QTD', 'VALOR UNIT', 'TOTAL']],
      body: tableItems,
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 12 },
        2: { cellWidth: 20 },
        3: { cellWidth: 12 },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // 6. DETALHES DO SERVIÇO
    if (dados.descriptionServico) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("OBSERVAÇÕES / DETALHES DO SERVIÇO:", 15, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const splitDesc = doc.splitTextToSize(dados.descriptionServico, 180);
      doc.text(splitDesc, 15, y);
      y += (splitDesc.length * 5) + 10;
    }

    // 7. RESUMO FINANCEIRO
    const summaryX = 130;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    const drawRow = (label: string, value: number, isTotal = false) => {
      doc.setFont("helvetica", isTotal ? "bold" : "normal");
      doc.text(label, summaryX, y);
      doc.text(`R$ ${fmt(value)}`, 195, y, { align: 'right' });
      y += 6;
    };

    drawRow("Total em Serviços:", dados.totalLabor || 0);
    drawRow("Total em Peças:", dados.totalParts || 0);
    drawRow("Total em Óleo:", dados.totalOil || 0);
    if (dados.discount > 0) {
      doc.setTextColor(220, 0, 0);
      drawRow("Desconto:", -dados.discount);
      doc.setTextColor(100, 100, 100);
    }

    y += 2;
    // Highlight Total Box
    doc.setFillColor(0, 255, 136);
    doc.rect(summaryX - 5, y - 5, 70, 10, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL FINAL:", summaryX, y + 2);
    doc.text(`R$ ${fmt(dados.totalGeneral || 0)}`, 195, y + 2, { align: 'right' });

    y += 15;

    // 8. FORMA DE PAGAMENTO
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`FORMA DE PAGAMENTO: ${dados.paymentMethod || 'Não informado'}`, 15, y);

    y += 25;

    // 9. RODAPÉ PROFISSIONAL
    doc.setFontSize(8);
    doc.text("Obrigado pela preferência!", 105, y, { align: 'center' });
    y += 5;
    doc.text("TOP LUBRI - (18) 99778-4303", 105, y, { align: 'center' });
    
    y += 15;
    doc.setDrawColor(180, 180, 180);
    doc.line(65, y, 145, y);
    y += 5;
    doc.text("Assinatura do Cliente", 105, y, { align: 'center' });

    doc.save(`OS_${(dados.clientName || "Cliente").replace(/\s+/g, '_')}.pdf`);
  };

  const shareOnWhatsApp = (dados: any) => {
    const texto = 
`🛠️ *ORDEM DE SERVIÇO - TOP LUBRI* 🛠️

👤 *Cliente:* ${dados.clientName}
🚗 *Veículo:* ${dados.vehicle} (${dados.plate})
💰 *Valor Total:* R$ ${dados.totalGeneral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

✅ Seu orçamento/OS foi gerado com sucesso.
Obrigado pela preferência!

_Emitido via Top Lubri Palmital_`;

    const phone = (dados.whatsapp || '').replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(texto)}`;
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
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic leading-tight">
                          {budget.vehicle} • {budget.plate}<br/>
                          {format(new Date(budget.date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Mão de Obra</p>
                      <p className="text-xs font-black text-white">R$ {(budget.totalLabor || 0).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Peças</p>
                      <p className="text-xs font-black text-white">R$ {(budget.totalParts || 0).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Óleo</p>
                      <p className="text-xs font-black text-white">R$ {(budget.totalOil || 0).toLocaleString('pt-BR')}</p>
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
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Dados do Cliente e Veículo</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Nome do Cliente</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Ex: João Silva" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">WhatsApp</Label>
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Veículo</Label>
                  <Input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Ex: Honda Civic 2020" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Placa</Label>
                  <Input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="ABC-1234" className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" />
                </div>
              </div>
            </PremiumCard>

            {/* Itens da OS Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Itens da Ordem de Serviço</h4>
                </div>
                <button 
                  type="button" 
                  onClick={addItem}
                  className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest flex items-center"
                >
                  <Plus className="w-3 h-3 mr-2" /> Adicionar Item
                </button>
              </div>
              
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-zinc-500">Descrição do Item</Label>
                        <Input 
                          placeholder="Ex: Troca de Óleo 5W30" 
                          value={item.description} 
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700 rounded-xl h-10" 
                        />
                      </div>
                      <div className="w-24 space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-zinc-500">Tipo</Label>
                        <select 
                          value={item.type}
                          onChange={e => updateItem(idx, 'type', e.target.value as any)}
                          className="w-full h-10 bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="Serviço">Serviço</option>
                          <option value="Peça">Peça</option>
                          <option value="Óleo">Óleo</option>
                        </select>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(idx)}
                        className="mt-6 p-2 text-red-500 hover:bg-red-500/10 rounded-lg h-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-zinc-500">Quantidade</Label>
                        <Input 
                          type="number"
                          step="any"
                          value={item.quantity} 
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700 rounded-xl h-10" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-zinc-500">V. Unitário (R$)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={item.unitValue} 
                          onChange={e => updateItem(idx, 'unitValue', e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700 rounded-xl h-10" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-zinc-500">Subtotal</Label>
                        <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center px-4 font-black text-xs text-primary">
                          R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Detalhes Técnicos</h4>
                </div>
                <textarea 
                  value={descriptionServico}
                  onChange={e => setDescriptionServico(e.target.value)}
                  placeholder="Relatório técnico do serviço..."
                  className="w-full h-32 bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Pagamento e Desconto</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Forma de Pagamento</Label>
                    <select 
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-full h-12 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 text-sm text-white"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão">Cartão</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Desconto (R$)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={discount} 
                      onChange={e => setDiscount(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo e Botão Flutuante */}
            <div className="sticky bottom-4 left-0 right-0 z-40">
              <PremiumCard className="p-6 bg-zinc-900 border-primary/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Subtotal Bruto</p>
                    <p className="text-sm font-bold text-zinc-300">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Valor do Desconto</p>
                    <p className="text-sm font-bold text-red-400">- R$ {(parseFloat(discount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-6 py-4 border-y border-white/5">
                  <div className="text-white font-black uppercase tracking-tighter italic">Total OS</div>
                  <div className="text-3xl font-black text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">
                    R$ {totalGeneral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <PremiumButton type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isSaving} className="flex-1 h-14 rounded-2xl border-zinc-700 text-zinc-400 group">
                    <ChevronDown className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform" />
                    Sair
                  </PremiumButton>
                  <PremiumButton type="submit" disabled={isSaving} className="flex-[2] h-14 rounded-2xl shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {isSaving ? 'Gravando Dados...' : 'Gerar Ordem de Serviço'}
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
