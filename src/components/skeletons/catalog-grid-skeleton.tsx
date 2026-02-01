import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type CatalogGridSkeletonProps = {
    count?: number
}

export const CatalogGridSkeleton = ({ count = 6 }: CatalogGridSkeletonProps) => {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, index) => (
                <Card key={`catalog-skeleton-${index}`} className="animate-pulse">
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-12" />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-8 w-20" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
