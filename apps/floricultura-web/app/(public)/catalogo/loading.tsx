import { Skeleton } from '@flordoestudante/ui';

export default function CatalogLoading() {
  return (
    <div className="container space-y-8 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto h-4 w-full max-w-lg" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
