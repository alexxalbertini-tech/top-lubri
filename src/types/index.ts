export interface UserProfile {
  uid: string;
  email: string;
  companyName?: string;
  logoUrl?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  clientName: string;
  whatsapp: string;
  vehicle?: string;
  service: string;
  laborValue: number;
  partsValue: number;
  oilValue?: number;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface ServiceRecord {
  id: string;
  userId: string;
  clientName: string;
  whatsapp?: string;
  vehicle?: string;
  value: number;
  laborValue: number;
  partsValue: number;
  oilValue?: number;
  paymentMethod: 'Dinheiro' | 'Pix' | 'Cartão';
  date: string;
  description?: string;
}

export interface CashFlowEntry {
  id: string;
  userId: string;
  type: 'entry' | 'exit';
  value: number;
  description: string;
  paymentMethod: string;
  date: string;
}

export interface AppSettings {
  companyName: string;
  logoUrl?: string;
}

export interface LaborItem {
  descricao: string;
  valor: number;
}

export interface PartItem {
  nome: string;
  quantidade: number;
  valorUnitario: number;
  total: number;
}

export interface BudgetItem {
  id: string;
  description: string;
  type: 'Serviço' | 'Peça' | 'Óleo';
  quantity: number;
  unitValue: number;
  total: number;
}

export interface Budget {
  id: string;
  userId: string;
  clientName: string;
  whatsapp: string;
  vehicle: string;
  plate: string;
  items: BudgetItem[]; // Keep for compatibility
  lista_mao_obra?: LaborItem[];
  lista_pecas?: PartItem[];
  descriptionServico: string;
  paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão';
  discount: number;
  totalLabor: number;
  totalParts: number;
  totalOil: number;
  totalGeneral: number;
  date: string;
  status: 'draft' | 'sent' | 'approved';
}
