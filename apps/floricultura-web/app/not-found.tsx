import Link from 'next/link';
import { Button } from '@flordoestudante/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-serif text-2xl font-medium text-foreground">Página não encontrada</h1>
      <p className="mt-2 text-muted-foreground">
        O endereço pode estar incorreto ou a página foi removida.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
