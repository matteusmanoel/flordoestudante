'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Gift, HeartPlus } from 'lucide-react';
import { Price } from '@flordoestudante/ui';
import { Button } from '@flordoestudante/ui';
import { formatCurrency } from '@flordoestudante/utils';
import { cn } from '@flordoestudante/utils';
import { useCart } from '@/features/cart';
import type { ProductDetailViewModel } from '../types';

type FulfillmentType = 'delivery' | 'pickup';

type ProductSummaryProps = {
  product: ProductDetailViewModel;
  className?: string;
};

export function ProductSummary({ product, className }: ProductSummaryProps) {
  const { addItem, preferredFulfillment, setPreferredFulfillment } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [fulfillment, setFulfillment] = useState<FulfillmentType>(
    preferredFulfillment ?? 'delivery'
  );

  const handleFulfillmentChange = (v: FulfillmentType) => {
    setFulfillment(v);
    setPreferredFulfillment(v);
  };
  const MAX_GIFT_MESSAGE = 200;

  const handleAddToCart = () => {
    setAdding(true);
    window.setTimeout(() => {
      addItem(
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          categoryName: product.categoryName,
          coverImageUrl: product.coverImageUrl,
          price: product.price,
        },
        quantity,
        giftMessage.trim() || undefined
      );
      setAdding(false);
    }, 0);
  };

  return (
    <div className={className}>
      {/* Breadcrumb de categoria */}
      <Link
        href={`/catalogo?categoria=${product.categorySlug}`}
        className="editorial-label transition-colors hover:text-primary"
      >
        {product.categoryName || 'Catálogo'}
      </Link>

      {/* Título do produto */}
      <h1 className="mt-2 font-display text-2xl font-medium leading-tight text-foreground sm:text-3xl">
        {product.name}
      </h1>
      {product.shortDescription && (
        <p className="mt-2 text-muted-foreground">{product.shortDescription}</p>
      )}

      {/* Preço */}
      <div className="mt-4 space-y-1">
        <Price value={product.price} compareAt={product.compareAtPrice} size="lg" />
        <p className="text-sm text-muted-foreground">
          Subtotal ({quantity} {quantity === 1 ? 'item' : 'itens'}):{' '}
          <span className="font-medium text-foreground">
            {formatCurrency(product.price * quantity, { currency: 'BRL', locale: 'pt-BR' })}
          </span>
        </p>
      </div>

      {/* Descrição */}
      {product.description && (
        <div className="mt-6 border-t border-border pt-5">
          <h2 className="font-serif text-base font-medium text-foreground">Sobre este produto</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      {/* Tipo de entrega */}
      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-3 text-sm font-medium text-foreground">Como prefere receber?</p>
        <div className="grid grid-cols-2 gap-3">
          <FulfillmentOption
            selected={fulfillment === 'delivery'}
            onClick={() => handleFulfillmentChange('delivery')}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path d="M16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            }
            label="Entrega"
            detail="Enviamos até você"
          />
          <FulfillmentOption
            selected={fulfillment === 'pickup'}
            onClick={() => handleFulfillmentChange('pickup')}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
            }
            label="Retirada"
            detail="Na loja, você escolhe"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          A opção final será confirmada no checkout.
        </p>
      </div>

      {/* Mensagem de cartão */}
      <div className="mt-5 rounded-xl border border-accent/60 bg-accent/15 p-4">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-accent-foreground" />
          <label htmlFor="pdp-gift-message" className="text-sm font-medium text-foreground">
            Escreva uma mensagem no cartão
          </label>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Opcional — será incluída no pedido
        </p>
        <textarea
          id="pdp-gift-message"
          value={giftMessage}
          onChange={(e) => setGiftMessage(e.target.value.slice(0, MAX_GIFT_MESSAGE))}
          placeholder="Ex: Feliz aniversário! Com muito carinho..."
          className="mt-2.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
          maxLength={MAX_GIFT_MESSAGE}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {giftMessage.length}/{MAX_GIFT_MESSAGE}
        </p>
      </div>

      {/* Quantidade + CTA em grid-cols-2 */}
      <div className="mt-6 grid grid-cols-2 items-end gap-3">
        {/* Coluna 1: Quantidade */}
        <div>
          <label htmlFor="pdp-quantity" className="mb-1.5 block text-sm text-muted-foreground">
            Quantidade
          </label>
          <div className="flex items-center rounded-full border border-border">
            <button
              type="button"
              id="pdp-quantity-minus"
              aria-label="Diminuir quantidade"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-lg text-muted-foreground transition-colors hover:text-foreground"
            >
              −
            </button>
            <span className="flex-1 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="flex h-10 w-10 items-center justify-center text-lg text-muted-foreground transition-colors hover:text-foreground"
            >
              +
            </button>
          </div>
        </div>

        {/* Coluna 2: CTA */}
        <Button
          size="lg"
          className="group w-full rounded-full bg-primary/90 px-6 transition-all hover:bg-primary"
          disabled={adding}
          onClick={handleAddToCart}
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <>
              <HeartPlus className="h-4 w-4 transition-transform duration-200 group-hover:scale-125" aria-hidden />
              Adicionar Carinho
            </>
          )}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Você pode revisar e finalizar no carrinho.
      </p>
    </div>
  );
}

function FulfillmentOption({
  selected,
  onClick,
  icon,
  label,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all',
        selected
          ? 'border-primary bg-primary/5 text-primary shadow-sm'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
      <span className="text-[11px] leading-tight opacity-70">{detail}</span>
    </button>
  );
}
