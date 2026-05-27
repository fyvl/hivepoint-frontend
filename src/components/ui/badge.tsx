import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-[background-color,border-color,color] duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-ring/20 focus:ring-offset-0",
    {
        variants: {
            variant: {
                default:
                    "border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20 dark:border-primary/[0.18] dark:bg-primary/[0.08] dark:text-amber-300 dark:hover:bg-primary/[0.12]",
                secondary:
                    "border-border/60 bg-secondary/70 text-secondary-foreground hover:bg-secondary dark:border-border/80 dark:bg-secondary/85",
                destructive:
                    "border-destructive/20 bg-destructive/10 text-destructive shadow-sm hover:bg-destructive/20 dark:border-destructive/30 dark:bg-destructive/10",
                outline: "border-border/75 bg-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground dark:border-border/80",
                success:
                    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/[0.08] dark:text-emerald-300",
                warning:
                    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/[0.08] dark:text-amber-300"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
