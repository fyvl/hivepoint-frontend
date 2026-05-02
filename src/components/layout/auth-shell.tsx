import { Link } from "react-router-dom"

import { Logo } from "@/components/brand/logo"

type AuthMetric = {
    label: string
    value: string
}

type AuthHighlight = {
    title: string
    description: string
}

type AuthShellProps = {
    eyebrow: string
    title: string
    description: string
    panelBadge: string
    panelTitle: string
    panelDescription: string
    panelMetrics: AuthMetric[]
    panelHighlights: AuthHighlight[]
    children: React.ReactNode
}

export const AuthShell = ({
    eyebrow,
    title,
    description,
    panelBadge,
    panelTitle,
    panelDescription,
    panelMetrics,
    panelHighlights,
    children
}: AuthShellProps) => {
    return (
        <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 shadow-[0_32px_80px_-56px_rgba(15,23,42,0.26)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary/85 via-amber-400/70 to-transparent" />
            <div className="grid lg:grid-cols-[minmax(0,1fr)_0.92fr]">
                <section className="relative p-6 sm:p-10 lg:p-12">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <Logo size="md" />
                    </Link>

                    <div className="mt-8 max-w-lg">
                        <div className="section-kicker">{eyebrow}</div>
                        <h1 className="display-title mt-5 text-4xl text-foreground sm:text-5xl">
                            {title}
                        </h1>
                        <p className="mt-4 text-base leading-7 text-muted-foreground">
                            {description}
                        </p>

                        <div className="mt-8 rounded-[1.4rem] border border-border/80 bg-background/88 p-6 shadow-soft sm:p-8">
                            {children}
                        </div>
                    </div>
                </section>

                <aside className="relative overflow-hidden border-t border-border/80 bg-[linear-gradient(160deg,rgba(17,24,39,0.985),rgba(41,37,36,0.96))] p-6 text-white lg:border-l lg:border-t-0 lg:p-10">
                    <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_55%)]" />
                    <div className="absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_60%)]" />
                    <div className="relative z-10 flex h-full flex-col">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/78">
                            {panelBadge}
                        </div>

                        <div className="mt-6 space-y-4">
                            <h2 className="display-title text-3xl text-white sm:text-4xl">
                                {panelTitle}
                            </h2>
                            <p className="max-w-md text-sm leading-7 text-white/72 sm:text-base">
                                {panelDescription}
                            </p>
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
                            {panelMetrics.map((metric) => (
                                <div
                                    key={metric.label}
                                    className="rounded-[1.2rem] border border-white/12 bg-white/8 px-4 py-4"
                                >
                                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                                        {metric.label}
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold text-white">
                                        {metric.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 grid gap-3">
                            {panelHighlights.map((highlight, index) => (
                                <div
                                    key={highlight.title}
                                    className="rounded-[1.2rem] border border-white/12 bg-black/14 px-4 py-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/8 text-xs font-semibold text-white/80">
                                            {String(index + 1).padStart(2, "0")}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">
                                                {highlight.title}
                                            </div>
                                            <div className="mt-1 text-sm leading-6 text-white/68">
                                                {highlight.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
