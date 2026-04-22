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
import { closeKeyboard } from '@/lib/utils';
import { BudgetItem, Budget, LaborItem, PartItem } from '@/types';
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
  
  // Split state for new requirements
  const [laborItems, setLaborItems] = useState<LaborItem[]>([{ descricao: '', valor: 0 }]);
  const [partsItems, setPartsItems] = useState<PartItem[]>([{ nome: '', quantidade: 1, valorUnitario: 0, total: 0 }]);

  // Calculations
  const totalLabor = useMemo(() => 
    laborItems.reduce((acc, i) => acc + (Number(i.valor) || 0), 0)
  , [laborItems]);
  
  const totalParts = useMemo(() => 
    partsItems.reduce((acc, i) => acc + (Number(i.total) || 0), 0)
  , [partsItems]);

  const subtotal = totalLabor + totalParts;
  const totalGeneral = subtotal - (parseFloat(discount) || 0);

  const resetForm = () => {
    setClientName('');
    setWhatsapp('');
    setVehicle('');
    setPlate('');
    setDescriptionServico('');
    setPaymentMethod('Pix');
    setDiscount('0');
    setLaborItems([{ descricao: '', valor: 0 }]);
    setPartsItems([{ nome: '', quantidade: 1, valorUnitario: 0, total: 0 }]);
  };

  const addLaborItem = () => {
    setLaborItems([...laborItems, { descricao: '', valor: 0 }]);
  };

  const updateLaborItem = (index: number, field: keyof LaborItem, value: any) => {
    const newList = [...laborItems];
    (newList[index] as any)[field] = value;
    setLaborItems(newList);
  };

  const removeLaborItem = (index: number) => {
    setLaborItems(laborItems.filter((_, i) => i !== index));
  };

  const addPartItem = () => {
    setPartsItems([...partsItems, { nome: '', quantidade: 1, valorUnitario: 0, total: 0 }]);
  };

  const updatePartItem = (index: number, field: keyof PartItem, value: any) => {
    const newList = [...partsItems];
    (newList[index] as any)[field] = value;
    
    if (field === 'quantidade' || field === 'valorUnitario') {
      const q = parseFloat(String(field === 'quantidade' ? value : newList[index].quantidade)) || 0;
      const v = parseFloat(String(field === 'valorUnitario' ? value : newList[index].valorUnitario)) || 0;
      newList[index].total = q * v;
    }
    
    setPartsItems(newList);
  };

  const removePartItem = (index: number) => {
    setPartsItems(partsItems.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!clientName) {
      toast.error('Informe o nome do cliente');
      return;
    }

    setIsSaving(true);
    closeKeyboard();
    try {
      const budgetData = {
        clientName,
        whatsapp,
        vehicle,
        plate,
        descriptionServico,
        paymentMethod,
        discount: parseFloat(discount) || 0,
        // New structure requested
        lista_mao_obra: laborItems.filter(i => i.descricao),
        lista_pecas: partsItems.filter(i => i.nome),
        // For compatibility with cards while existing
        items: [
          ...laborItems.filter(i => i.descricao).map(i => ({ description: i.descricao, type: 'Serviço' as const, quantity: 1, unitValue: i.valor, total: i.valor })),
          ...partsItems.filter(i => i.nome).map(i => ({ description: i.nome, type: 'Peça' as const, quantity: i.quantidade, unitValue: i.valorUnitario, total: i.total }))
        ],
        totalLabor,
        totalParts,
        totalOil: 0,
        totalGeneral,
        date: new Date().toISOString(),
        status: 'draft' as const
      };

      await addBudget(budgetData);
      toast.success('Orçamento salvo com sucesso!');
      resetForm();
      setIsAdding(false);
      // Mantém na tela atual (Central de Orçamentos) sem recarregar a página inteira
    } catch (error) {
      console.error('ERRO AO SALVAR ORÇAMENTO:', error);
      toast.error('Erro ao salvar orçamento.');
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
    const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 1. CABEÇALHO PROFISSIONAL
    doc.setFillColor(0, 255, 136); // #00ff88
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("TOP LUBRI", 15, 25);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("SOLUÇÕES AUTOMOTIVAS & LUBRIFICAÇÃO", 15, 32);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text("Palmital - SP | CNPJ: 48.806.264/0001-63", 195, 25, { align: 'right' });
    doc.text("Tel: (18) 99680-2877", 195, 32, { align: 'right' });

    // 2. INFORMAÇÕES DO DOCUMENTO
    let y = 50;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ORDEM DE SERVIÇO / ORÇAMENTO", 15, y);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Nº: ${dados.id?.slice(-6) || Date.now().toString().slice(-6)}`, 195, y, { align: 'right' });
    y += 6;
    doc.text(`Data: ${format(new Date(dados.date || new Date()), "dd/MM/yyyy HH:mm")}`, 195, y, { align: 'right' });

    y += 15;

    // 3. DADOS DO CLIENTE E VEÍCULO (2 COLUNAS)
    doc.setDrawColor(240, 240, 240);
    doc.setFillColor(250, 250, 250);
    doc.rect(15, y, 180, 25, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CLIENTE", 20, y + 8);
    doc.text("DADOS DO VEÍCULO", 110, y + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(`Nome: ${dados.clientName || '-'}`, 20, y + 15);
    doc.text(`WhatsApp: ${dados.whatsapp || '-'}`, 20, y + 20);
    
    doc.text(`Veículo: ${dados.vehicle || '-'}`, 110, y + 15);
    doc.text(`Placa: ${(dados.plate || '-').toUpperCase()}`, 110, y + 20);

    y += 35;

    // 4. TABELA DE MÃO DE OBRA
    const maoObra = dados.lista_mao_obra || (dados.items || []).filter((i: any) => i.type === 'Serviço').map((i: any) => ({ descricao: i.description, valor: i.unitValue }));
    
    if (maoObra.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("MÃO DE OBRA / SERVIÇOS", 15, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['DESCRIÇÃO DO SERVIÇO', 'VALOR (R$)']],
        body: maoObra.map((i: any) => [i.descricao, fmt(i.valor)]),
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 1: { halign: 'right', cellWidth: 40 } }
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // 5. TABELA DE PEÇAS
    const pecas = dados.lista_pecas || (dados.items || []).filter((i: any) => i.type === 'Peça' || i.type === 'Óleo').map((i: any) => ({ nome: i.description, quantidade: i.quantity, valorUnitario: i.unitValue, total: i.total }));

    if (pecas.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("PEÇAS E MATERIAIS", 15, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['PEÇA / PRODUTO', 'QTD', 'VALOR UN.', 'TOTAL (R$)']],
        body: pecas.map((i: any) => [i.nome, i.quantidade, fmt(i.valorUnitario), fmt(i.total)]),
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 
          1: { halign: 'center', cellWidth: 20 }, 
          2: { halign: 'right', cellWidth: 35 }, 
          3: { halign: 'right', cellWidth: 35 } 
        }
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // 6. RESUMO FINANCEIRO
    const summaryX = 130;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    doc.text("Subtotal Mão de Obra:", summaryX, y);
    doc.text(`R$ ${fmt(dados.totalLabor || 0)}`, 195, y, { align: 'right' });
    y += 6;

    doc.text("Subtotal Peças:", summaryX, y);
    doc.text(`R$ ${fmt(dados.totalParts || 0)}`, 195, y, { align: 'right' });
    y += 6;

    if (dados.discount > 0) {
      doc.setTextColor(200, 0, 0);
      doc.text("Desconto:", summaryX, y);
      doc.text(`- R$ ${fmt(dados.discount)}`, 195, y, { align: 'right' });
      y += 6;
    }

    y += 2;
    doc.setFillColor(0, 255, 136);
    doc.rect(summaryX - 5, y - 5, 70, 12, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL GERAL:", summaryX, y + 3);
    doc.text(`R$ ${fmt(dados.totalGeneral || 0)}`, 195, y + 3, { align: 'right' });

    y += 20;

    // 7. RODAPÉ
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text("Top Lubri - Oficina Automotiva", 105, y, { align: 'center' });
    y += 5;
    doc.text("CNPJ: 48.806.264/0001-63 | Tel: (18) 99680-2877", 105, y, { align: 'center' });
    y += 5;
    doc.text("Palmital - SP | Obrigado pela preferência!", 105, y, { align: 'center' });

    doc.save(`OS_TOPLUBRI_${dados.clientName?.replace(/\s+/g, '_')}.pdf`);
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
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Mão de Obra</p>
                      <p className="text-xs font-black text-white">R$ {(budget.totalLabor || 0).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Peças e Materiais</p>
                      <p className="text-xs font-black text-white">R$ {((budget.totalParts || 0) + (budget.totalOil || 0)).toLocaleString('pt-BR')}</p>
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

            {/* 1. PEÇAS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">1. Peças e Materiais</h4>
                </div>
                <button 
                  type="button" 
                  onClick={addPartItem}
                  className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest flex items-center"
                >
                  <Plus className="w-3 h-3 mr-2" /> Adicionar Peça
                </button>
              </div>
              
              <div className="space-y-3">
                {partsItems.map((item, idx) => (
                  <div key={idx} className="p-4 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-zinc-500">Nome da Peça</Label>
                        <Input 
                          placeholder="Ex: Amortecedor Dianteiro" 
                          value={item.nome} 
                          onChange={e => updatePartItem(idx, 'nome', e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removePartItem(idx)}
                        className="mt-6 p-3 text-red-500 hover:bg-red-500/10 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-zinc-500">Qtd</Label>
                        <Input 
                          type="number"
                          step="any"
                          value={item.quantidade} 
                          onChange={e => updatePartItem(idx, 'quantidade', e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12 text-center" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-zinc-500">V. Unitário</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={item.valorUnitario} 
                          onChange={e => updatePartItem(idx, 'valorUnitario', e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12 text-right" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-zinc-500">Total Peça</Label>
                        <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-end px-4 font-black text-xs text-primary">
                          R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. MÃO DE OBRA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">2. Mão de Obra / Serviços</h4>
                </div>
                <button 
                  type="button" 
                  onClick={addLaborItem}
                  className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest flex items-center"
                >
                  <Plus className="w-3 h-3 mr-2" /> Adicionar Mão de Obra
                </button>
              </div>
              
              <div className="space-y-3">
                {laborItems.map((item, idx) => (
                  <div key={idx} className="p-4 bg-zinc-900/30 rounded-2xl border border-white/5 flex items-end gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[8px] uppercase font-bold text-zinc-500">Descrição do Serviço</Label>
                      <Input 
                        placeholder="Ex: Troca de Buchas" 
                        value={item.descricao} 
                        onChange={e => updateLaborItem(idx, 'descricao', e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" 
                      />
                    </div>
                    <div className="w-32 space-y-1.5">
                      <Label className="text-[8px] uppercase font-bold text-zinc-500">Valor (R$)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={item.valor} 
                        onChange={e => updateLaborItem(idx, 'valor', e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeLaborItem(idx)}
                      className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

            {/* Resumo e Botão de Ação no Final */}
            <div className="pt-6">
              <PremiumCard className="p-6 bg-zinc-900 border-primary/30 mb-10">
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
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <PremiumButton type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isSaving} className="h-14 rounded-2xl border-zinc-700 text-zinc-400 group order-2 sm:order-1">
                    <ChevronDown className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform" />
                    Sair
                  </PremiumButton>
                  <PremiumButton type="submit" disabled={isSaving} className="h-14 rounded-2xl shadow-[0_0_20px_rgba(0,255,136,0.2)] flex-[2] order-1 sm:order-2">
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
