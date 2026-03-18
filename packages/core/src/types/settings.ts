/**
 * Tipos de configuração da loja.
 */

export interface Settings {
  id: string;
  store_name: string;
  brand_name?: string | null;
  support_phone?: string | null;
  support_email?: string | null;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  currency_code: string;
  logo_url?: string | null;
  theme_json?: Record<string, unknown> | null;
  checkout_message?: string | null;
  created_at: string;
  updated_at: string;
}
