'use client';

import { cn } from '@flordoestudante/utils';

type CatalogSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function CatalogSection({ title, description, children, className }: CatalogSectionProps) {
  return (
    <section className={cn('py-10 sm:py-16', className)}>
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
