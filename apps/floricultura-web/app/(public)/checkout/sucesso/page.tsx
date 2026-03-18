import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<{ codigo?: string }>;
};

/** Compatibilidade: redireciona para a página única de pós-checkout/pagamento. */
export default async function CheckoutSuccessRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const codigo = params.codigo?.trim();
  if (codigo) {
    redirect(`/pedido/${encodeURIComponent(codigo)}/pagamento`);
  }
  redirect('/checkout');
}
