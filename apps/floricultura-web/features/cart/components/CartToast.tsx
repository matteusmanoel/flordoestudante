'use client';

import { useCart } from '../store';

export function CartToast() {
  const { toastMessage } = useCart();
  if (!toastMessage) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
      role="status"
      aria-live="polite"
    >
      {toastMessage}
    </div>
  );
}
