'use client';

import Link from 'next/link';
import { EmptyState } from '@flordoestudante/ui';
import { Button } from '@flordoestudante/ui';

type CatalogEmptyStateProps = {
  title?: string;
  description?: string;
  showHomeLink?: boolean;
};

export function CatalogEmptyState({
  title = 'Nenhum produto no momento',
  description = 'Em breve teremos novidades. Volte para a página inicial ou tente outra categoria.',
  showHomeLink = true,
}: CatalogEmptyStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        showHomeLink ? (
          <Button asChild variant="outline">
            <Link href="/">Ir para a página inicial</Link>
          </Button>
        ) : undefined
      }
    />
  );
}
