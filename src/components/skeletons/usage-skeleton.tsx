import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type UsageSkeletonProps = {
    count?: number
}

export const UsageSkeleton = ({ count = 2 }: UsageSkeletonProps) => {
    return (
        <div className="grid gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <Card key={`usage-skeleton-${index}`} className="animate-pulse">
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-2 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
