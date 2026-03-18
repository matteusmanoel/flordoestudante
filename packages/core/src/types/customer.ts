/**
 * Tipos de cliente e endereço.
 */

export interface Customer {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  label?: string | null;
  recipient_name: string;
  phone: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  reference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddressSnapshot {
  recipient_name: string;
  phone: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  reference?: string | null;
}
