import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type KeysTableSkeletonProps = {
    count?: number
}

export const KeysTableSkeleton = ({ count = 3 }: KeysTableSkeletonProps) => {
    return (
        <Card className="animate-pulse">
            <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={`keys-row-skeleton-${index}`}
                        className="flex items-center justify-between rounded-lg border p-4"
                    >
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
