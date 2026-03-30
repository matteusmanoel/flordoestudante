import { Skeleton } from '@flordoestudante/ui';

export default function ProductLoading() {
  return (
    <div className="container px-4 py-8 sm:py-12">
      <Skeleton className="mb-6 h-9 w-40" />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-4/5 max-w-md" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-12 w-full max-w-xs" />
        </div>
      </div>
    </div>
  );
}
