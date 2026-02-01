import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const ProductDetailsSkeleton = () => {
    return (
        <div className="grid gap-6">
            <Card className="animate-pulse">
                <CardHeader className="space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </CardContent>
            </Card>

            <Card className="animate-pulse">
                <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <Card key={`plan-skeleton-${index}`} className="border-none shadow-none">
                            <CardHeader className="space-y-2">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-2/3" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-8 w-24" />
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Card className="animate-pulse">
                <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div
                            key={`version-skeleton-${index}`}
                            className="flex items-center justify-between rounded-lg border p-4"
                        >
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
