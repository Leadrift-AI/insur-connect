import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] rounded-md",
        className
      )}
      {...props}
    />
  );
}

// Specialized skeleton components for common use cases
function CardSkeleton() {
  return (
    <div className="animate-fade-in space-y-3 p-6 border rounded-lg">
      <Skeleton className="h-4 w-[60%]" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-[40%]" />
        <Skeleton className="h-3 w-[80%]" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 animate-fade-in">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[40%]" />
        <Skeleton className="h-3 w-[60%]" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <CardSkeleton />
  );
}

function ChartSkeleton() {
  return (
    <div className="animate-fade-in space-y-4 p-6 border rounded-lg">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[30%]" />
        <Skeleton className="h-3 w-[50%]" />
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

export { 
  Skeleton, 
  CardSkeleton, 
  TableRowSkeleton, 
  StatCardSkeleton, 
  ChartSkeleton 
};