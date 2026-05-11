export type DashboardImportRow = {
  file_name: string;
  status: string;
  imported_rows: number;
  failed_rows: number;
  finished_at: string | null;
  created_at: string;
};

export type DashboardAttentionOrder = {
  id: string;
  public_code: string;
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
};

export type DashboardPeriodMoney = {
  mercadoPagoPaidTotal: number;
  payOnFulfillmentCommitmentTotal: number;
  completedCount: number;
  completedTotal: number;
};

export type DashboardData = {
  kpis: {
    awaitingApproval: number;
    pendingPayment: number;
    inProgress: number;
    openPipeline: number;
  };
  attentionQueue: DashboardAttentionOrder[];
  finance: {
    last7Days: DashboardPeriodMoney;
    last30Days: DashboardPeriodMoney;
  };
  catalog: {
    productsActive: number;
    productsInactive: number;
  };
  lastImport: DashboardImportRow | null;
};
