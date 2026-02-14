import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
    "relative w-full overflow-hidden rounded-full",
    {
        variants: {
            size: {
                sm: "h-1.5",
                default: "h-2.5",
                lg: "h-4"
            },
            variant: {
                default: "bg-primary/20",
                success: "bg-emerald-500/20",
                warning: "bg-amber-500/20",
                danger: "bg-destructive/20"
            }
        },
        defaultVariants: {
            size: "default",
            variant: "default"
        }
    }
)

const indicatorVariants = cva(
    "h-full w-full flex-1 transition-all duration-500 ease-out",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-r from-primary via-primary to-amber-400",
                success: "bg-gradient-to-r from-emerald-500 to-emerald-400",
                warning: "bg-gradient-to-r from-amber-500 to-yellow-400",
                danger: "bg-gradient-to-r from-destructive to-red-400"
            },
            animated: {
                true: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
                false: ""
            }
        },
        defaultVariants: {
            variant: "default",
            animated: false
        }
    }
)

interface ProgressProps 
    extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
        VariantProps<typeof progressVariants> {
    showValue?: boolean
    animated?: boolean
}

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    ProgressProps
>(({ className, value, size, variant, showValue, animated, ...props }, ref) => (
    <div className="w-full">
        {showValue && (
            <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(value || 0)}%</span>
            </div>
        )}
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(progressVariants({ size, variant }), className)}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className={cn(indicatorVariants({ variant, animated }))}
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </ProgressPrimitive.Root>
    </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
