import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type KeysTableSkeletonProps = {
    count?: number
}

export const KeysTableSkeleton = ({ count = 3 }: KeysTableSkeletonProps) => {
    return (
        <Card>
            <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={`keys-row-skeleton-${index}`}
                        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-9 w-20 rounded-lg" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
