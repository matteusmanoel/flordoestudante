import { Skeleton } from '@flordoestudante/ui';

export default function CheckoutLoading() {
  return (
    <div className="container space-y-6 px-4 py-8 sm:py-12">
      <Skeleton className="h-9 w-44" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-12 w-full max-w-md" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
