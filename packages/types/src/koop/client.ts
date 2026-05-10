export interface AssignedAdmin {
  id: string;
  name: string;
  email: string;
}

export interface KoopClient {
  id: string;
  name: string;
  email: string;
  documentNumber: string;
  documentType?: string;
  phone: string;
  birthDate?: string;
  address?: string;
  contactInfo?: string;
  assignedAdmin?: AssignedAdmin | null;
  active: boolean;
}
