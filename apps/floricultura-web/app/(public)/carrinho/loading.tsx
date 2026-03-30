import { Skeleton } from '@flordoestudante/ui';

export default function CartLoading() {
  return (
    <div className="container space-y-6 px-4 py-8 sm:py-12">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg lg:col-span-1" />
      </div>
    </div>
  );
}
