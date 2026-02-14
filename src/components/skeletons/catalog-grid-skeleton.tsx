import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type CatalogGridSkeletonProps = {
    count?: number
}

export const CatalogGridSkeleton = ({ count = 6 }: CatalogGridSkeletonProps) => {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, index) => (
                <Card 
                    key={`catalog-skeleton-${index}`} 
                    className="overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <CardHeader className="space-y-3 pb-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-6 w-14 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/30 pt-4">
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
