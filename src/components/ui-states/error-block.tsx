import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"

type ErrorBlockProps = {
    title?: string
    description?: string
    code?: string | null
    retryLabel?: string
    onRetry?: () => void
    variant?: "default" | "network"
}

export const ErrorBlock = ({
    title = "Something went wrong",
    description = "We could not load this data.",
    code,
    retryLabel = "Try again",
    onRetry,
    variant = "default"
}: ErrorBlockProps) => {
    const Icon = variant === "network" ? WifiOff : AlertTriangle
    
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center dark:border-destructive/35 dark:bg-destructive/10">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/15 dark:ring-1 dark:ring-destructive/25">
                <Icon className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">{title}</h3>
            <p className="mb-2 max-w-sm text-sm text-muted-foreground">
                {description}
            </p>
            {code && (
                <code className="mb-6 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {code}
                </code>
            )}
            {onRetry && (
                <Button variant="outline" onClick={onRetry} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {retryLabel}
                </Button>
            )}
        </div>
    )
}
