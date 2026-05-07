import Link from 'next/link';

const OCCASIONS = [
  { label: 'Para a Mãe', emoji: '💐', slug: 'arranjos', color: 'bg-pink-50 hover:bg-pink-100 text-pink-800 border-pink-200' },
  { label: 'Aniversário', emoji: '🎂', slug: 'buques', color: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200' },
  { label: 'Romântico', emoji: '🌹', slug: 'rosas', color: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200' },
  { label: 'Para Amigos', emoji: '🌻', slug: 'girassois', color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200' },
  { label: 'Formatura', emoji: '🎓', slug: 'cestas', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' },
  { label: 'Obrigado', emoji: '🤍', slug: 'orquideas', color: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' },
];

export function HomeOccasionTiles() {
  return (
    <section className="section-divider py-10 sm:py-14">
      <div className="container px-4">
        <div className="mb-6 text-center">
          <p className="editorial-label">Descubra por ocasião</p>
          <h2 className="mt-1.5 font-display text-xl font-medium text-foreground sm:text-2xl">
            Para quem vai o seu carinho?
          </h2>
        </div>
        <ul className="flex flex-wrap justify-center gap-3">
          {OCCASIONS.map((occasion) => (
            <li key={occasion.slug}>
              <Link
                href={`/catalogo?categoria=${occasion.slug}`}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${occasion.color}`}
              >
                <span role="img" aria-hidden>{occasion.emoji}</span>
                {occasion.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
