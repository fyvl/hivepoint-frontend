import { Link } from "react-router-dom";

import { Logo } from "@/components/brand/logo";

type AuthMetric = {
    label: string;
    value: string;
};

type AuthHighlight = {
    title: string;
    description: string;
};

type AuthShellProps = {
    eyebrow: string;
    title: string;
    description?: string;
    panelBadge: string;
    panelTitle: string;
    panelDescription: string;
    panelMetrics: AuthMetric[];
    panelHighlights: AuthHighlight[];
    children: React.ReactNode;
};

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
        <div className="relative overflow-hidden rounded-lg border border-border/80 bg-card/95 shadow-[0_32px_80px_-56px_rgba(15,23,42,0.26)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
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
                        {description ? (
                            <p className="mt-4 text-base leading-7 text-muted-foreground">
                                {description}
                            </p>
                        ) : null}

                        <div className="mt-8 rounded-lg border border-border/80 bg-background/90 p-6 shadow-soft sm:p-8">
                            {children}
                        </div>
                    </div>
                </section>

                <aside className="relative overflow-hidden border-t border-border/80 bg-background/50 p-6 lg:border-l lg:border-t-0 lg:p-10">
                    <div className="auth-shell-accent" />
                    <div className="relative z-10 flex h-full flex-col">
                        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-border/70 bg-card/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {panelBadge}
                        </div>

                        <div className="mt-6 space-y-4">
                            <h2 className="display-title text-3xl text-foreground sm:text-4xl">
                                {panelTitle}
                            </h2>
                            <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
                                {panelDescription}
                            </p>
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
                            {panelMetrics.map((metric) => (
                                <div
                                    key={metric.label}
                                    className="rounded-lg border border-border/80 bg-card/70 px-4 py-4"
                                >
                                    <div className="text-xs font-medium text-muted-foreground">
                                        {metric.label}
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold text-foreground">
                                        {metric.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 grid gap-3">
                            {panelHighlights.map((highlight, index) => (
                                <div
                                    key={highlight.title}
                                    className="rounded-lg border border-border/80 bg-card/70 px-4 py-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted text-xs font-semibold text-muted-foreground">
                                            {String(index + 1).padStart(2, "0")}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">
                                                {highlight.title}
                                            </div>
                                            <div className="mt-1 text-sm leading-6 text-muted-foreground">
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
    );
};
