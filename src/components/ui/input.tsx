import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "motion-field flex h-10 w-full rounded-lg border border-border/75 bg-background px-3 py-2 text-base shadow-[inset_0_1px_2px_hsl(var(--shadow-color)/0.07)]",
                    "dark:border-input/90 dark:bg-background/55 dark:shadow-[inset_0_1px_0_hsl(var(--foreground)/0.035)]",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                    "placeholder:text-muted-foreground dark:placeholder:text-muted-foreground/75",
                    "focus-visible:border-primary/50 focus-visible:bg-card focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 dark:focus-visible:border-primary/55 dark:focus-visible:bg-card dark:focus-visible:ring-primary/[0.18] dark:focus-visible:shadow-[0_0_0_1px_hsl(var(--primary)/0.14),0_14px_34px_-24px_hsl(var(--shadow-color)/0.88),inset_0_1px_0_hsl(var(--foreground)/0.06)]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "md:text-sm",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
