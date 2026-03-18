/**
 * Tipos de importação (XLSX / imports_log).
 */

import type { ImportStatus } from '../constants/domain';

export interface ImportLog {
  id: string;
  file_name: string;
  import_type: string;
  status: ImportStatus;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  error_report_json?: Record<string, unknown> | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
}

export interface ImportErrorRow {
  row: number;
  message: string;
  field?: string;
}
