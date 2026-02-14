import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-lg bg-muted",
                "before:absolute before:inset-0",
                "before:-translate-x-full before:animate-shimmer",
                "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                className
            )}
            {...props}
        />
    )
}

function SkeletonText({ className, lines = 3, ...props }: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
    return (
        <div className={cn("space-y-2", className)} {...props}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton 
                    key={i} 
                    className={cn(
                        "h-4",
                        i === lines - 1 && "w-3/4"
                    )} 
                />
            ))}
        </div>
    )
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Skeleton 
            className={cn("h-10 w-10 rounded-full", className)} 
            {...props}
        />
    )
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("rounded-xl border bg-card p-6 shadow-soft", className)} {...props}>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <SkeletonText lines={2} />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    )
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard }
