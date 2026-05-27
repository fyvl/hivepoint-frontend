import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold motion-interactive focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-out",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-[0_10px_26px_-18px_hsl(var(--primary)/0.7)] hover:bg-primary/90 hover:shadow-[0_16px_34px_-22px_hsl(var(--primary)/0.84)] dark:shadow-[0_10px_26px_-20px_hsl(var(--primary)/0.48)] dark:hover:bg-primary/85 dark:hover:shadow-[0_14px_30px_-24px_hsl(var(--primary)/0.6)]",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-[0_10px_26px_-18px_hsl(var(--destructive)/0.7)] hover:bg-destructive/90 hover:shadow-[0_16px_34px_-22px_hsl(var(--destructive)/0.8)]",
                outline:
                    "border border-border/75 bg-card/70 text-foreground shadow-[0_10px_24px_-22px_hsl(var(--shadow-color)/0.44)] hover:border-foreground/20 hover:bg-background hover:shadow-[0_16px_34px_-26px_hsl(var(--shadow-color)/0.54)] dark:border-border/85 dark:bg-card/90 dark:shadow-[0_14px_34px_-28px_hsl(var(--shadow-color)/0.86),inset_0_1px_0_hsl(var(--foreground)/0.04)] dark:hover:border-border dark:hover:bg-accent/70 dark:hover:shadow-[0_18px_40px_-30px_hsl(var(--shadow-color)/0.94)]",
                secondary:
                    "bg-secondary/90 text-secondary-foreground shadow-[0_10px_24px_-22px_hsl(var(--shadow-color)/0.36)] hover:bg-secondary dark:bg-secondary/95 dark:shadow-[0_12px_28px_-26px_hsl(var(--shadow-color)/0.76)] dark:hover:bg-accent/85",
                ghost: "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-accent/70",
                link: "rounded-sm px-0 text-primary underline-offset-4 hover:text-primary/80 hover:underline"
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-11 rounded-lg px-6 text-sm",
                icon: "h-10 w-10"
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default"
        }
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
