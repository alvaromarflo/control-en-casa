export interface Service {
  name: string;
  rate: number;
}

export interface Attendance {
  id: string;
  date: string; // YYYY-MM-DD
  present: boolean;
  paid: boolean;
  hours?: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  relatedMonth: string; // YYYY-MM
  note: string;
}

export type GastoSubcategoria = 'Salud' | 'Facturas' | 'Movilidad' | 'Colegio' | 'Otro';

export interface Gasto {
  id: string;
  nombre: string;
  cantidad: number;
  fecha: string; // YYYY-MM-DD
  esRecurrente: boolean;
  recurrenciaNumero: number;
  recurrenciaTipo: string;
  categoria: 'casa' | 'peques';
  subcategoria?: GastoSubcategoria;
}

export interface AppSettings {
  familyName: string;
  theme: 'auto' | 'light' | 'dark';
}

export interface AppStore {
  attendances: Attendance[];
  payments: Payment[];
  gastos: Gasto[];
  service: Service;
  settings: AppSettings;
}

export interface AttendanceDay {
  date: string; // YYYY-MM-DD
  attendance?: Attendance;
}
