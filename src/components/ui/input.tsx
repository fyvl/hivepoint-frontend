import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "motion-field flex h-10 w-full rounded-lg border border-border/75 bg-card/70 px-3 py-2 text-base shadow-[0_10px_24px_-22px_hsl(var(--shadow-color)/0.45)]",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus-visible:border-primary/50 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
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
