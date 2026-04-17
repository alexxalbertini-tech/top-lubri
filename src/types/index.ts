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

export interface BudgetItem {
  description: string;
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
  services: { description: string; value: number }[];
  parts: BudgetItem[];
  totalLabor: number;
  totalParts: number;
  totalGeneral: number;
  date: string;
  status: 'draft' | 'sent' | 'approved';
}
