import Link from 'next/link';
import { Button } from '@flordoestudante/ui';

export default function AdminDashboardPlaceholderPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="font-serif text-2xl font-medium text-foreground">
        Painel administrativo
      </h1>
      <p className="text-muted-foreground">
        Área restrita. O dashboard e os CRUDs serão implementados nas próximas etapas.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Voltar ao site</Link>
      </Button>
    </div>
  );
}
