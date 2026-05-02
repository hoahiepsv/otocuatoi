export interface MaintenanceRecord {
  id: number;
  licensePlate: string;
  date: string;
  category: string;
  params: string;
  odo: number;
  nextOdo: number;
  unitPrice: number;
  isDone: boolean;
}

export type TabType = 'info' | 'update' | 'report';

export interface User {
  username: string;
  isLoggedIn: boolean;
}
