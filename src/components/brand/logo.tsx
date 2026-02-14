import { cn } from "@/lib/utils"

type LogoProps = {
    size?: "sm" | "md" | "lg"
    showText?: boolean
    className?: string
}

export const Logo = ({ size = "md", showText = true, className }: LogoProps) => {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-12 w-12"
    }

    const textSizeClasses = {
        sm: "text-base",
        md: "text-xl",
        lg: "text-2xl"
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("relative", sizeClasses[size])}>
                {/* Hexagon SVG with gradient */}
                <svg
                    viewBox="0 0 100 100"
                    className="h-full w-full drop-shadow-lg"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="honeyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="50%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="honeyGradientDark" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#b45309" />
                            <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                    </defs>
                    {/* Outer hexagon */}
                    <path
                        d="M50 5 L93.3 27.5 L93.3 72.5 L50 95 L6.7 72.5 L6.7 27.5 Z"
                        fill="url(#honeyGradient)"
                        className="dark:fill-[url(#honeyGradientDark)]"
                    />
                    {/* Inner hexagon pattern */}
                    <path
                        d="M50 20 L77.3 35 L77.3 65 L50 80 L22.7 65 L22.7 35 Z"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="2"
                    />
                    {/* Center dot */}
                    <circle cx="50" cy="50" r="8" fill="rgba(255,255,255,0.4)" />
                    {/* Connection lines */}
                    <path
                        d="M50 42 L50 20 M58 46 L77.3 35 M58 54 L77.3 65 M50 58 L50 80 M42 54 L22.7 65 M42 46 L22.7 35"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            {showText && (
                <span className={cn(
                    "font-bold tracking-tight",
                    textSizeClasses[size]
                )}>
                    <span className="text-foreground">Hive</span>
                    <span className="text-primary">Point</span>
                </span>
            )}
        </div>
    )
}

export const LogoMark = ({ size = "md", className }: Omit<LogoProps, "showText">) => {
    return <Logo size={size} showText={false} className={className} />
}
