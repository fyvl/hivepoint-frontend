import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
    title: string
    description: string
    eyebrow?: string
    icon?: ReactNode
    actions?: ReactNode
    children?: ReactNode
    className?: string
}

export const PageHeader = ({
    title,
    description,
    eyebrow,
    icon,
    actions,
    children,
    className
}: PageHeaderProps) => {
    return (
        <section className={cn("motion-section surface-panel-strong relative overflow-hidden px-5 py-5 sm:px-6", className)}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-amber-400 to-stone-700 dark:from-primary/70 dark:via-amber-400/45 dark:to-stone-700/55" />
            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 gap-4">
                    {icon ? (
                        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background/80 text-primary shadow-sm dark:border-border/90 dark:bg-background/60 dark:text-amber-300">
                            {icon}
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        {eyebrow ? <div className="section-kicker">{eyebrow}</div> : null}
                        <h1 className="display-title mt-2 max-w-3xl text-3xl text-foreground sm:text-4xl">
                            {title}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                            {description}
                        </p>
                    </div>
                </div>

                {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
            </div>

            {children ? (
                <div className="relative z-10 mt-5 border-t border-border/70 pt-4 dark:border-border/85">{children}</div>
            ) : null}
        </section>
    )
}
