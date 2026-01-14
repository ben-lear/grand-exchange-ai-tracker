import { cn } from '../../utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'rect';
  count?: number;
}

export const LoadingSkeleton = ({ className, variant = 'rect', count = 1 }: LoadingSkeletonProps) => {
  const baseStyles = 'animate-pulse bg-gray-700 rounded';
  
  const variants = {
    text: 'h-4 w-full',
    card: 'h-48 w-full',
    circle: 'h-12 w-12 rounded-full',
    rect: 'h-32 w-full',
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} className={cn(baseStyles, variants[variant], className)} />
  ));

  return count > 1 ? (
    <div className="space-y-3">
      {skeletons}
    </div>
  ) : (
    <>{skeletons}</>
  );
};

export const ItemCardSkeleton = () => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <div className="flex items-start gap-3">
      <LoadingSkeleton variant="circle" className="w-16 h-16" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton variant="text" className="h-5 w-3/4" />
        <LoadingSkeleton variant="text" className="h-4 w-full" />
        <LoadingSkeleton variant="text" className="h-4 w-1/2" />
      </div>
    </div>
  </div>
);

export const ItemListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }, (_, i) => (
      <ItemCardSkeleton key={i} />
    ))}
  </div>
);
