import { cn } from "@/lib/utils"

type StatusIndicatorProps = {
    status: "online" | "offline" | "busy" | "away"
    size?: "sm" | "default" | "lg"
    pulse?: boolean
    className?: string
}

const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-amber-500"
}

const sizeClasses = {
    sm: "h-2 w-2",
    default: "h-2.5 w-2.5",
    lg: "h-3 w-3"
}

export const StatusIndicator = ({ 
    status, 
    size = "default", 
    pulse = false,
    className 
}: StatusIndicatorProps) => {
    return (
        <span className={cn("relative inline-flex", className)}>
            <span 
                className={cn(
                    "rounded-full",
                    statusColors[status],
                    sizeClasses[size]
                )}
            />
            {pulse && status === "online" && (
                <span 
                    className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                        statusColors[status]
                    )}
                />
            )}
        </span>
    )
}

type ConnectionStatusProps = {
    isConnected: boolean
    label?: string
    className?: string
}

export const ConnectionStatus = ({ 
    isConnected, 
    label,
    className 
}: ConnectionStatusProps) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <StatusIndicator 
                status={isConnected ? "online" : "offline"} 
                pulse={isConnected}
            />
            {label && (
                <span className="text-xs text-muted-foreground">
                    {label}
                </span>
            )}
        </div>
    )
}
