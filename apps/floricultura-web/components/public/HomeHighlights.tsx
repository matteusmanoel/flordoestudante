import Link from 'next/link';
import { Button } from '@flordoestudante/ui';

export function HomeHighlights() {
  return (
    <section id="destaques" className="py-16 sm:py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
            Destaques
          </h2>
          <p className="mt-2 text-muted-foreground">
            Em breve: buquês, cestas e presentes para você escolher.
          </p>
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/#destaques">Catálogo em breve</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
