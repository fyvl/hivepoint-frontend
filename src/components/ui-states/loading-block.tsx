import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type LoadingBlockProps = {
    title?: string
    count?: number
    variant?: "cards" | "lines"
}

export const LoadingBlock = ({
    title = "Loading...",
    count = 3,
    variant = "cards"
}: LoadingBlockProps) => {
    if (variant === "lines") {
        return (
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{title}</p>
                <div className="space-y-2">
                    {Array.from({ length: count }).map((_, index) => (
                        <Skeleton key={`loading-line-${index}`} className="h-4 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="grid gap-4">
                {Array.from({ length: count }).map((_, index) => (
                    <Card key={`loading-card-${index}`} className="animate-pulse">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
