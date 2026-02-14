import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type SubscriptionsSkeletonProps = {
    count?: number
}

export const SubscriptionsSkeleton = ({ count = 2 }: SubscriptionsSkeletonProps) => {
    return (
        <div className="grid gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <Card 
                    key={`subscription-skeleton-${index}`}
                    style={{ animationDelay: `${index * 150}ms` }}
                >
                    <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-28 rounded-full" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Skeleton className="h-9 w-24 rounded-lg" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
