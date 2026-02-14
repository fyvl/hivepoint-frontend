import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface SpinnerProps {
    size?: "sm" | "default" | "lg"
    className?: string
}

const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
}

export const Spinner = ({ size = "default", className }: SpinnerProps) => {
    return (
        <Loader2 
            className={cn(
                "animate-spin text-primary",
                sizeClasses[size],
                className
            )} 
        />
    )
}

interface LoadingOverlayProps {
    message?: string
    className?: string
}

export const LoadingOverlay = ({ message = "Loading...", className }: LoadingOverlayProps) => {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center gap-3 py-12",
            className
        )}>
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    )
}

interface FullPageLoaderProps {
    message?: string
}

export const FullPageLoader = ({ message = "Loading..." }: FullPageLoaderProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{message}</p>
            </div>
        </div>
    )
}
