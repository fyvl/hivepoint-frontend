import {
    Activity,
    ArrowRight,
    BarChart3,
    BriefcaseBusiness,
    CreditCard,
    Key,
    LayoutGrid,
    Loader2,
    Lock,
    Radar,
    Rocket,
    ShieldCheck,
    Waypoints
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";

import { updateMyRole as updateMyRoleApi } from "@/api/users";
import { useAuth } from "@/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/i18n";
import { notifyError, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/utils";

type DashboardCard = {
    title: string;
    eyebrow: string;
    description: string;
    to: string;
    icon: ComponentType<{ className?: string }>;
    accent: string;
    requiresAuth?: boolean;
};

type WorkspaceStat = {
    label: string;
    value: string;
    caption: string;
};

type WorkspaceNote = {
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
};

type HeroConfig = {
    badge: string;
    title: string;
    description: string;
    gradient: string;
    ctaLabel: string;
    ctaTo: string;
    secondaryCtaLabel: string;
    secondaryCtaTo: string;
    focusLabel: string;
    focusTitle: string;
    focusDescription: string;
    stats: WorkspaceStat[];
    notes: WorkspaceNote[];
};

const guestCards: DashboardCard[] = [
    {
        title: "Catalog",
        eyebrow: "Discover",
        description: "Public API products, versions, and plans in one marketplace.",
        to: "/catalog",
        icon: LayoutGrid,
        accent: "from-amber-500 via-orange-400 to-cyan-400"
    },
    {
        title: "Buyer ops",
        eyebrow: "Operate",
        description: "Subscriptions, keys, quota, and billing after sign-in.",
        to: "/billing",
        icon: CreditCard,
        accent: "from-emerald-500 via-teal-400 to-cyan-400",
        requiresAuth: true
    },
    {
        title: "Seller Studio",
        eyebrow: "Publish",
        description: "Package APIs into released products with commercial plans.",
        to: "/seller/studio",
        icon: BriefcaseBusiness,
        accent: "from-sky-500 via-blue-500 to-violet-500",
        requiresAuth: true
    }
];

const buyerCards: DashboardCard[] = [
    {
        title: "Catalog",
        eyebrow: "Discover",
        description: "Compare public products and decide what to integrate next.",
        to: "/catalog",
        icon: LayoutGrid,
        accent: "from-amber-500 via-orange-400 to-cyan-400"
    },
    {
        title: "Billing",
        eyebrow: "Commercial",
        description: "Review subscriptions, renewals, and active plan status.",
        to: "/billing",
        icon: CreditCard,
        accent: "from-emerald-500 via-teal-400 to-cyan-400"
    },
    {
        title: "API Keys",
        eyebrow: "Access",
        description: "Create and rotate credentials for gateway traffic.",
        to: "/keys",
        icon: Key,
        accent: "from-violet-500 via-indigo-500 to-blue-500"
    },
    {
        title: "Usage",
        eyebrow: "Observe",
        description: "Track request volume, quota, and rate-limit pressure.",
        to: "/usage",
        icon: BarChart3,
        accent: "from-cyan-500 via-sky-500 to-blue-500"
    }
];

const sellerCards: DashboardCard[] = [
    {
        title: "Seller Studio",
        eyebrow: "Publish",
        description: "Create products, attach schemas, and release plans.",
        to: "/seller/studio",
        icon: BriefcaseBusiness,
        accent: "from-sky-500 via-blue-500 to-violet-500"
    },
    {
        title: "Catalog",
        eyebrow: "Preview",
        description: "See the buyer-facing marketplace view of your APIs.",
        to: "/catalog",
        icon: LayoutGrid,
        accent: "from-amber-500 via-orange-400 to-cyan-400"
    },
    {
        title: "Billing",
        eyebrow: "Plans",
        description: "Check subscription context while packaging products.",
        to: "/billing",
        icon: CreditCard,
        accent: "from-emerald-500 via-teal-400 to-cyan-400"
    },
    {
        title: "Usage",
        eyebrow: "Signals",
        description: "Watch demand before it becomes a release decision.",
        to: "/usage",
        icon: BarChart3,
        accent: "from-cyan-500 via-sky-500 to-blue-500"
    }
];

const adminCards: DashboardCard[] = [
    {
        title: "Admin Ops",
        eyebrow: "Govern",
        description: "Operational alerts, audit activity, and moderation health.",
        to: "/admin/ops",
        icon: ShieldCheck,
        accent: "from-indigo-500 via-violet-500 to-fuchsia-500"
    },
    {
        title: "Catalog",
        eyebrow: "Marketplace",
        description: "Review the same public surface buyers and sellers use.",
        to: "/catalog",
        icon: LayoutGrid,
        accent: "from-amber-500 via-orange-400 to-cyan-400"
    },
    {
        title: "Billing",
        eyebrow: "Revenue",
        description: "Keep subscription operations close to incident context.",
        to: "/billing",
        icon: CreditCard,
        accent: "from-emerald-500 via-teal-400 to-cyan-400"
    },
    {
        title: "Usage",
        eyebrow: "Traffic",
        description: "Spot gateway pressure and quota signals quickly.",
        to: "/usage",
        icon: BarChart3,
        accent: "from-cyan-500 via-sky-500 to-blue-500"
    }
];

const guestFlow: WorkspaceNote[] = [
    {
        title: "Evaluate first",
        description: "Catalog pages stay public so API discovery starts immediately.",
        icon: LayoutGrid
    },
    {
        title: "Activate workspace",
        description: "Sign in when subscriptions, keys, and usage become relevant.",
        icon: Key
    },
    {
        title: "Publish when ready",
        description: "Seller tools are available without leaving the same product.",
        icon: Rocket
    }
];

const buyerFlow: WorkspaceNote[] = [
    {
        title: "Subscribe",
        description: "Plans and renewal state remain visible next to access control.",
        icon: CreditCard
    },
    {
        title: "Connect",
        description: "Raw keys route traffic through HivePoint gateway checks.",
        icon: Key
    },
    {
        title: "Monitor",
        description: "Usage and quota signals stay close to billing context.",
        icon: Radar
    }
];

const sellerFlow: WorkspaceNote[] = [
    {
        title: "Draft product",
        description: "Start with a product surface buyers can evaluate clearly.",
        icon: BriefcaseBusiness
    },
    {
        title: "Attach schema",
        description: "OpenAPI-backed versions keep docs and releases aligned.",
        icon: Waypoints
    },
    {
        title: "Launch plan",
        description: "Plans, quotas, and pricing define how buyers experience access.",
        icon: CreditCard
    }
];

const adminFlow: WorkspaceNote[] = [
    {
        title: "Watch alerts",
        description: "Operational issues surface from billing, gateway, and catalog flows.",
        icon: ShieldCheck
    },
    {
        title: "Trace activity",
        description: "Audit context stays attached to marketplace operations.",
        icon: Activity
    },
    {
        title: "Act quickly",
        description: "Moderation and operational actions live in one admin route.",
        icon: Radar
    }
];

export const DashboardPage = () => {
    const { accessToken, role, refresh } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [isUpgradingRole, setIsUpgradingRole] = useState(false);

    const handleBecomeSeller = useCallback(async () => {
        if (!accessToken) {
            return;
        }

        setIsUpgradingRole(true);
        try {
            await updateMyRoleApi(accessToken, refresh, { role: "SELLER" });

            const updatedToken = await refresh();
            if (!updatedToken) {
                throw new Error("Could not refresh session after role update.");
            }

            notifySuccess("Role updated", "Seller mode is now available.");
            navigate("/seller/studio");
        } catch (error) {
            notifyError(error, "Could not switch to seller mode");
        } finally {
            setIsUpgradingRole(false);
        }
    }, [accessToken, navigate, refresh]);

    const hero = useMemo<HeroConfig>(() => {
        if (!accessToken) {
            return {
                badge: "API marketplace",
                title: "A clean control plane for discovering, buying, and publishing APIs.",
                description:
                    "HivePoint keeps the marketplace, billing, gateway keys, and usage signals in one focused workspace.",
                gradient: "from-amber-500 via-cyan-500 to-blue-500",
                ctaLabel: "Create account",
                ctaTo: "/register",
                secondaryCtaLabel: "Explore catalog",
                secondaryCtaTo: "/catalog",
                focusLabel: "Public view",
                focusTitle: "Start with discovery",
                focusDescription:
                    "The dashboard now gives guests a direct path into evaluation without surrounding it with extra panels.",
                stats: [
                    {
                        label: "Surface",
                        value: "Catalog",
                        caption: "Public product discovery"
                    },
                    {
                        label: "Gateway",
                        value: "Keys",
                        caption: "Access after sign-in"
                    },
                    {
                        label: "Signal",
                        value: "Usage",
                        caption: "Traffic and quota context"
                    }
                ],
                notes: guestFlow
            };
        }

        if (role === "SELLER") {
            return {
                badge: "Seller workspace",
                title: "Ship API products with clean releases, plans, and buyer context.",
                description:
                    "Move from draft product to versioned schema and pricing plan without losing the marketplace view.",
                gradient: "from-cyan-500 via-blue-500 to-violet-500",
                ctaLabel: "Open Studio",
                ctaTo: "/seller/studio",
                secondaryCtaLabel: "Preview catalog",
                secondaryCtaTo: "/catalog",
                focusLabel: "Release flow",
                focusTitle: "From schema to plan",
                focusDescription:
                    "Seller mode is focused on the actions that move an API from internal asset to commercial product.",
                stats: [
                    {
                        label: "Workspace",
                        value: "Seller",
                        caption: "Publishing and packaging"
                    },
                    {
                        label: "Core jobs",
                        value: "3",
                        caption: "Product, version, plan"
                    },
                    {
                        label: "Target",
                        value: "Conversion",
                        caption: "Marketplace traction"
                    }
                ],
                notes: sellerFlow
            };
        }

        if (role === "ADMIN") {
            return {
                badge: "Admin workspace",
                title: "Operate the marketplace with alerts, audit context, and governance.",
                description:
                    "Admin tools stay close to buyer, seller, billing, and gateway activity so incidents are easier to understand.",
                gradient: "from-indigo-500 via-violet-500 to-fuchsia-500",
                ctaLabel: "Open Admin Ops",
                ctaTo: "/admin/ops",
                secondaryCtaLabel: "Review catalog",
                secondaryCtaTo: "/catalog",
                focusLabel: "Operational layer",
                focusTitle: "Govern without context loss",
                focusDescription:
                    "The admin dashboard emphasizes visibility and fast routing instead of duplicating every product surface.",
                stats: [
                    {
                        label: "Mode",
                        value: "Admin",
                        caption: "Ops and moderation"
                    },
                    {
                        label: "Coverage",
                        value: "Full",
                        caption: "Buyer, seller, billing"
                    },
                    {
                        label: "Priority",
                        value: "Safety",
                        caption: "Alerts before drift"
                    }
                ],
                notes: adminFlow
            };
        }

        return {
            badge: "Buyer workspace",
            title: "Run subscriptions, keys, and usage without switching context.",
            description:
                "Buyer mode keeps commercial decisions and technical access side by side, from the first plan to live traffic.",
            gradient: "from-emerald-500 via-teal-500 to-cyan-500",
            ctaLabel: "Open Billing",
            ctaTo: "/billing",
            secondaryCtaLabel: "Browse catalog",
            secondaryCtaTo: "/catalog",
            focusLabel: "Buyer flow",
            focusTitle: "Subscribe, connect, monitor",
            focusDescription:
                "The workspace gives buyers the few routes they need most often, with quota and access signals nearby.",
            stats: [
                {
                    label: "Workspace",
                    value: "Buyer",
                    caption: "Plans and access"
                },
                {
                    label: "Keys",
                    value: "Managed",
                    caption: "Gateway credentials"
                },
                {
                    label: "Signal",
                    value: "Quota",
                    caption: "Usage pressure"
                }
            ],
            notes: buyerFlow
        };
    }, [accessToken, role]);

    const cards = useMemo(() => {
        if (!accessToken) {
            return guestCards;
        }
        if (role === "SELLER") {
            return sellerCards;
        }
        if (role === "ADMIN") {
            return adminCards;
        }
        return buyerCards;
    }, [accessToken, role]);

    const workspaceName = accessToken
        ? role === "ADMIN"
            ? "Admin"
            : role === "SELLER"
              ? "Seller"
              : "Buyer"
        : "Public";
    const workspaceRouteSummary = t(
        `Showing the most useful routes for ${workspaceName.toLowerCase()} mode.`
    );

    return (
        <div className="space-y-8">
            <section className="dashboard-hero">
                <div
                    className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", hero.gradient)}
                />
                <div className="relative z-10 grid gap-7 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:p-8">
                    <div className="min-w-0">
                        <div className="section-kicker">{hero.badge}</div>
                        <h1 className="display-title mt-4 max-w-4xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                            {hero.title}
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                            {hero.description}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button asChild size="lg">
                                <Link to={hero.ctaTo}>
                                    {hero.ctaLabel}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link to={hero.secondaryCtaTo}>{hero.secondaryCtaLabel}</Link>
                            </Button>
                            {accessToken && role === "BUYER" ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleBecomeSeller}
                                    disabled={isUpgradingRole}
                                >
                                    {isUpgradingRole ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Switching...
                                        </>
                                    ) : (
                                        "Become seller"
                                    )}
                                </Button>
                            ) : null}
                        </div>

                        <div className="mt-7 grid max-w-4xl gap-4 border-y border-border/70 py-4 sm:grid-cols-3 sm:divide-x sm:divide-border/70">
                            {hero.stats.map((stat) => (
                                <div key={stat.label} className="sm:px-4 first:sm:pl-0">
                                    <div className="text-xs font-medium uppercase text-muted-foreground">
                                        {stat.label}
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold text-foreground">
                                        {stat.value}
                                    </div>
                                    <div className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {stat.caption}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="rounded-lg border border-border/80 bg-background/90 p-5 shadow-sm backdrop-blur">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">
                                    {hero.focusLabel}
                                </p>
                                <h2 className="mt-1 text-lg font-semibold text-foreground">
                                    {hero.focusTitle}
                                </h2>
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            {hero.focusDescription}
                        </p>

                        <div className="mt-5 divide-y divide-border/70 border-y border-border/70">
                            {hero.notes.map((note) => (
                                <div key={note.title} className="flex gap-3 py-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                                        <note.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">
                                            {note.title}
                                        </div>
                                        <div className="mt-1 text-sm leading-6 text-muted-foreground">
                                            {note.description}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="section-kicker">Workspace</div>
                        <h2 className="mt-2 text-2xl font-semibold text-foreground">
                            Primary actions
                        </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {workspaceRouteSummary}
                    </p>
                </div>

                <div
                    className={cn(
                        "grid gap-3 sm:grid-cols-2",
                        cards.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4"
                    )}
                >
                    {cards.map((card) => (
                        <WorkspaceTile
                            key={`${card.title}-${card.to}`}
                            card={card}
                            isAuthenticated={Boolean(accessToken)}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};

const WorkspaceTile = ({
    card,
    isAuthenticated
}: {
    card: DashboardCard;
    isAuthenticated: boolean;
}) => {
    const isLocked = card.requiresAuth && !isAuthenticated;
    const actionTo = isLocked ? "/login" : card.to;
    const Icon = card.icon;

    return (
        <Link to={actionTo} className="group min-w-0">
            <Card className="relative flex h-full min-h-[210px] flex-col overflow-hidden bg-card/95 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
                <div
                    className={cn(
                        "pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b",
                        card.accent
                    )}
                    aria-hidden="true"
                />
                <div
                    className={cn(
                        "pointer-events-none absolute -left-16 -top-20 h-52 w-64 rounded-full bg-gradient-to-br opacity-[0.14] blur-3xl transition-opacity group-hover:opacity-[0.22]",
                        card.accent
                    )}
                    aria-hidden="true"
                />
                <CardHeader className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <Badge variant="secondary" className="bg-muted/80 text-muted-foreground">
                            {card.eyebrow}
                        </Badge>
                        {isLocked ? (
                            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                <Lock className="h-4 w-4" />
                                Sign in
                            </div>
                        ) : null}
                    </div>
                    <div className="mt-5 flex items-start gap-4">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/80 bg-background text-foreground">
                            <div
                                className={cn(
                                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-[0.14]",
                                    card.accent
                                )}
                                aria-hidden="true"
                            />
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-2">
                            <CardTitle className="text-lg">{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="mt-auto p-5 pt-0">
                    <div className="flex items-center justify-between border-t border-border/70 pt-4 text-sm font-medium text-foreground">
                        <span>{isLocked ? "Unlock" : "Open"}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};
