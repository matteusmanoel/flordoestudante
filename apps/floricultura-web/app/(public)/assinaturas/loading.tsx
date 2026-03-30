import { Skeleton } from '@flordoestudante/ui';

export default function AssinaturasLoading() {
  return (
    <div className="container max-w-5xl space-y-10 px-4 py-10 md:py-16">
      <div className="mx-auto space-y-3 text-center">
        <Skeleton className="mx-auto h-10 w-72 max-w-full" />
        <Skeleton className="mx-auto h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
