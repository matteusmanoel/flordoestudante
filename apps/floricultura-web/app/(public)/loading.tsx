import { Skeleton } from '@flordoestudante/ui';

export default function PublicLoading() {
  return (
    <div className="container space-y-8 px-4 py-12">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <Skeleton className="mx-auto h-[min(50vh,420px)] w-full max-w-4xl rounded-2xl" />
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
