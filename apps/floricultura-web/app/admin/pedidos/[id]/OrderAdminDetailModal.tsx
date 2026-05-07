'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@flordoestudante/ui';
import { OrderAdminDetail } from '@/features/admin/OrderAdminDetail';

type Item = {
  id: string;
  product_name_snapshot: string;
  unit_price_snapshot: string;
  quantity: number;
  line_total: string;
};

type ProductOpt = { id: string; name: string; price: string };

type Props = {
  orderId: string;
  publicCode: string;
  initialStatus: string;
  estimatedText: string | null;
  adminNote: string | null;
  customerName: string | null;
  customerPhone: string | null;
  items: Item[];
  products: ProductOpt[];
};

export function OrderAdminDetailModal(props: Props) {
  const router = useRouter();

  function handleClose() {
    router.push('/admin/pedidos');
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Pedido {props.publicCode}</DialogTitle>
        </DialogHeader>
        <OrderAdminDetail {...props} />
      </DialogContent>
    </Dialog>
  );
}
