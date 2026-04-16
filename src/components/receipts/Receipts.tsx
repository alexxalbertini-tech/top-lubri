import React, { useState } from 'react';
import { PremiumCard, PremiumButton } from '../ui/PremiumUI';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FileText, Download, User, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function Receipts() {
  const [clientName, setClientName] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  const handleGenerate = () => {
    if (!clientName || !value) {
      toast.error('Preencha o cliente e o valor');
      return;
    }

    const date = new Date().toLocaleDateString('pt-BR');
    const content = `
========================================
           TOP LUBRI PRO
========================================
DATA: ${date}
CLIENTE: ${clientName}
VALOR: R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
----------------------------------------
DESCRIÇÃO:
${description || 'Serviços de manutenção automotiva'}
----------------------------------------
Obrigado pela preferência!
========================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nota_${clientName.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Nota gerada com sucesso!', {
      className: "bg-zinc-900 border-primary/50 text-white",
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Emissão de Comprovantes</p>
        <h2 className="text-3xl font-black tracking-tighter">Gerar <span className="text-primary italic">Nota</span></h2>
      </header>

      <PremiumCard className="p-8 pointer-events-auto">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-black tracking-tighter uppercase italic">Comprovante Rápido</h3>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Gere um arquivo de texto para o cliente</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center">
              <User className="w-3 h-3 mr-2 text-primary" /> Cliente
            </Label>
            <Input 
              autoFocus
              value={clientName} 
              onChange={e => setClientName(e.target.value)} 
              placeholder="Nome do cliente"
              className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center">
              <DollarSign className="w-3 h-3 mr-2 text-primary" /> Valor Total (R$)
            </Label>
            <Input 
              type="number"
              step="0.01"
              value={value} 
              onChange={e => setValue(e.target.value)} 
              placeholder="0,00"
              className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Descrição Opcional</Label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalhes do serviço..."
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
            />
          </div>

          <PremiumButton 
            type="button" 
            onClick={handleGenerate}
            className="w-full h-16 rounded-2xl flex items-center justify-center space-x-3"
          >
            <Download className="w-6 h-6" />
            <span>Baixar Nota (.txt)</span>
          </PremiumButton>
        </form>
      </PremiumCard>

      <div className="p-6 bg-zinc-900/30 rounded-3xl border border-white/5">
        <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">
          <span className="text-primary font-black">DICA:</span> Você pode enviar este arquivo diretamente pelo WhatsApp para o seu cliente como um comprovante profissional.
        </p>
      </div>
    </div>
  );
}
