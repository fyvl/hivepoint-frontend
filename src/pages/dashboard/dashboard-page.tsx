import {
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
} from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { updateMyRole as updateMyRoleApi } from "@/api/users"
import { useAuth } from "@/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { notifyError, notifySuccess } from "@/lib/notify"
import { cn } from "@/lib/utils"

type DashboardCard = {
    title: string
    eyebrow: string
    description: string
    to: string
    icon: React.ComponentType<{ className?: string }>
    requiresAuth?: boolean
    accent: string
}

type WorkspaceStat = {
    label: string
    value: string
    caption: string
}

type WorkspaceNote = {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}

type HeroConfig = {
    badge: string
    title: string
    description: string
    gradient: string
    ctaLabel: string
    ctaTo: string
    secondaryCtaLabel: string
    secondaryCtaTo: string
    railTitle: string
    railDescription: string
    stats: WorkspaceStat[]
    notes: WorkspaceNote[]
}

const guestCards: DashboardCard[] = [
    {
        title: "Explore the API Catalog",
        eyebrow: "Public marketplace",
        description: "Compare products, inspect versions, and open quickstarts before you commit.",
        to: "/catalog",
        icon: LayoutGrid,
        accent: "from-amber-500 via-orange-400 to-yellow-300"
    },
    {
        title: "Run buyer operations",
        eyebrow: "Buyer workspace",
        description: "Manage subscriptions, keys, and request quotas after sign-in.",
        to: "/billing",
        icon: CreditCard,
        requiresAuth: true,
        accent: "from-emerald-500 via-teal-400 to-cyan-400"
    },
    {
        title: "Ship through Seller Studio",
        eyebrow: "Seller workflow",
        description: "Publish products, release versions, and turn APIs into plans.",
        to: "/seller/studio",
        icon: BriefcaseBusiness,
        requiresAuth: true,
        accent: "from-sky-500 via-cyan-400 to-blue-500"
    }
]

const buyerCards: DashboardCard[] = [
    {
        title: "Catalog",
        eyebrow: "Discover",
        description: "Browse public products and compare what to integrate next.",
        to: "/catalog",
        icon: LayoutGrid,
        accent: "from-amber-500 via-orange-400 to-yellow-300"
    },
    {
        title: "Billing",
        eyebrow: "Operate",
        description: "Track subscriptions, renewals, and anything that needs attention.",
        to: "/billing",
        icon: CreditCard,
        accent: "from-emerald-500 via-teal-400 to-cyan-400"
    },
    {
        title: "API Keys",
        eyebrow: "Access",
        description: "Generate raw keys and keep your gateway credentials under control.",
        to: "/keys",
        icon: Key,
        accent: "from-violet-500 via-fuchsia-400 to-indigo-400"
    },
    {
        title: "Usage",
        eyebrow: "Observe",
        description: "Watch volume, remaining quota, and rate-limit pressure in one view.",
        to: "/usage",
        icon: BarChart3,
        accent: "from-sky-500 via-cyan-400 to-teal-400"
    }
]

const sellerCards: DashboardCard[] = [
    {
        title: "Seller Studio",
        eyebrow: "Publish",
        description: "Create products, connect schemas, and release versions with plans.",
        to: "/seller/studio",
        icon: BriefcaseBusiness,
        accent: "from-cyan-500 via-sky-400 to-blue-500"
    },
    {
        title: "Catalog",
        eyebrow: "Preview",
        description: "See how your APIs appear to buyers in the public marketplace.",
        to: "/catalog",
        icon: LayoutGrid,
        accent: "from-amber-500 via-orange-400 to-yellow-300"
    }
]

const adminCards: DashboardCard[] = [
    {
        title: "Admin Ops",
        eyebrow: "Governance",
        description: "Monitor alerts, audit activity, and moderation from one control room.",
        to: "/admin/ops",
        icon: ShieldCheck,
        accent: "from-indigo-500 via-violet-400 to-fuchsia-400"
    }
]

const guestFlow: WorkspaceNote[] = [
    {
        title: "Discover APIs before sign-in",
        description: "Catalog pages stay public so evaluation starts without operational friction.",
        icon: LayoutGrid
    },
    {
        title: "Switch into buyer mode",
        description: "Subscriptions, keys, and usage unlock once an account is active.",
        icon: CreditCard
    },
    {
        title: "Scale into seller mode",
        description: "Move from consumer to publisher when you are ready to monetize.",
        icon: Rocket
    }
]

const buyerFlow: WorkspaceNote[] = [
    {
        title: "Keys route through HivePoint",
        description: "Every request can be checked for entitlements, quota, and rate limits.",
        icon: Key
    },
    {
        title: "Usage stays visible",
        description: "Request pressure and remaining capacity stay close to billing context.",
        icon: Radar
    },
    {
        title: "Seller mode is a click away",
        description: "Upgrade when you want to start publishing instead of only consuming.",
        icon: BriefcaseBusiness
    }
]

const sellerFlow: WorkspaceNote[] = [
    {
        title: "Publish with OpenAPI-backed versions",
        description: "Ship buyer-facing quickstarts from versioned schema snapshots.",
        icon: Waypoints
    },
    {
        title: "Package pricing cleanly",
        description: "Plans, quotas, and rate limits define how buyers experience your product.",
        icon: CreditCard
    },
    {
        title: "Watch marketplace performance",
        description: "Views, conversion, and active clients feed back into release decisions.",
        icon: BarChart3
    }
]

const adminFlow: WorkspaceNote[] = [
    {
        title: "Ops is role-aware",
        description: "Admin tools sit above buyer and seller workflows without duplicating them.",
        icon: ShieldCheck
    },
    {
        title: "Alerting stays central",
        description: "Billing, retries, and moderation issues surface in one operational layer.",
        icon: Radar
    },
    {
        title: "Catalog remains the front door",
        description: "Governance stays connected to the same marketplace buyers and sellers use.",
        icon: LayoutGrid
    }
]

const platformLanes = [
    {
        title: "Discover",
        description: "Catalog visibility, version snapshots, and product detail pages lead the first contact.",
        icon: LayoutGrid
    },
    {
        title: "Control",
        description: "Subscriptions, keys, and pricing plans convert API access into an operable product.",
        icon: Key
    },
    {
        title: "Observe",
        description: "Usage analytics, billing alerts, and seller metrics close the loop after launch.",
        icon: BarChart3
    }
]

export const DashboardPage = () => {
    const { accessToken, role, refresh } = useAuth()
    const navigate = useNavigate()
    const [isUpgradingRole, setIsUpgradingRole] = useState(false)

    const handleBecomeSeller = useCallback(async () => {
        if (!accessToken) {
            return
        }

        setIsUpgradingRole(true)
        try {
            await updateMyRoleApi(accessToken, refresh, { role: "SELLER" })

            const updatedToken = await refresh()
            if (!updatedToken) {
                throw new Error("Could not refresh session after role update.")
            }

            notifySuccess("Role updated", "You are now in Dev mode.")
            navigate("/seller/studio")
        } catch (error) {
            notifyError(error, "Could not switch to Dev role")
        } finally {
            setIsUpgradingRole(false)
        }
    }, [accessToken, navigate, refresh])

    const hero = useMemo<HeroConfig>(() => {
        if (!accessToken) {
            return {
                badge: "API marketplace + gateway",
                title: "Turn APIs into products, not one-off integration docs.",
                description:
                    "HivePoint gives buyers a clean operational workspace and gives sellers a clear route from schema to monetization.",
                gradient: "from-amber-500 via-orange-400 to-yellow-300",
                ctaLabel: "Create account",
                ctaTo: "/register",
                secondaryCtaLabel: "Explore catalog",
                secondaryCtaTo: "/catalog",
                railTitle: "Everything starts from one shared marketplace.",
                railDescription:
                    "Browse public APIs first, then move into buyer operations or seller publishing without switching products.",
                stats: [
                    {
                        label: "Workspaces",
                        value: "2",
                        caption: "Buyer and seller flows share one shell."
                    },
                    {
                        label: "Quickstart",
                        value: "OpenAPI",
                        caption: "Schemas feed product detail pages and testing."
                    },
                    {
                        label: "Control plane",
                        value: "1",
                        caption: "Billing, keys, usage, and ops stay together."
                    }
                ],
                notes: guestFlow
            }
        }

        if (role === "SELLER") {
            return {
                badge: "Seller workspace",
                title: "Publish APIs with a sharper commercial surface.",
                description:
                    "Go from draft products to released versions and plans without losing sight of how buyers evaluate your APIs.",
                gradient: "from-cyan-500 via-sky-400 to-blue-500",
                ctaLabel: "Open Seller Studio",
                ctaTo: "/seller/studio",
                secondaryCtaLabel: "Preview catalog",
                secondaryCtaTo: "/catalog",
                railTitle: "Seller mode keeps release, pricing, and traction in the same loop.",
                railDescription:
                    "Product creation, OpenAPI URLs, plan setup, and analytics all stay in one workflow.",
                stats: [
                    {
                        label: "Workspace",
                        value: "Seller",
                        caption: "Publishing and packaging live side by side."
                    },
                    {
                        label: "Core jobs",
                        value: "3",
                        caption: "Create products, ship versions, define plans."
                    },
                    {
                        label: "North star",
                        value: "Conversion",
                        caption: "Traffic and subscriptions drive your next release."
                    }
                ],
                notes: sellerFlow
            }
        }

        if (role === "ADMIN") {
            return {
                badge: "Admin workspace",
                title: "See buyer and seller operations from the governance layer.",
                description:
                    "Operational alerts, moderation, and audit visibility stay anchored to the same catalog and billing surfaces everyone else uses.",
                gradient: "from-indigo-500 via-violet-400 to-fuchsia-400",
                ctaLabel: "Open Admin Ops",
                ctaTo: "/admin/ops",
                secondaryCtaLabel: "Review catalog",
                secondaryCtaTo: "/catalog",
                railTitle: "Admin mode stays broad without becoming disconnected.",
                railDescription:
                    "Ops sits above marketplace activity, subscription health, and seller release hygiene.",
                stats: [
                    {
                        label: "Visibility",
                        value: "Ops-first",
                        caption: "Alerts, audit trail, and moderation in one console."
                    },
                    {
                        label: "Coverage",
                        value: "Full stack",
                        caption: "Buyer, seller, and admin actions stay correlated."
                    },
                    {
                        label: "Focus",
                        value: "Safety",
                        caption: "Operational issues become visible before they spread."
                    }
                ],
                notes: adminFlow
            }
        }

        return {
            badge: "Buyer workspace",
            title: "Operate subscriptions, keys, and usage from one place.",
            description:
                "HivePoint keeps the commercial side of API consumption close to the technical side, so buyers do not lose context between billing and traffic.",
            gradient: "from-emerald-500 via-teal-400 to-cyan-400",
            ctaLabel: "Open Billing",
            ctaTo: "/billing",
            secondaryCtaLabel: "Browse catalog",
            secondaryCtaTo: "/catalog",
            railTitle: "Buyer mode is built around operational confidence.",
            railDescription:
                "Subscriptions, raw keys, request pressure, and renewal status stay one click apart.",
            stats: [
                {
                    label: "Workspace",
                    value: "Buyer",
                    caption: "Subscriptions and traffic share the same context."
                },
                {
                    label: "Keys",
                    value: "Raw + managed",
                    caption: "Access stays explicit from creation through usage."
                },
                {
                    label: "Signals",
                    value: "Quota",
                    caption: "Usage and billing warnings stay visible before they hurt."
                }
            ],
            notes: buyerFlow
        }
    }, [accessToken, role])

    const cards = useMemo(() => {
        if (!accessToken) {
            return guestCards
        }
        if (role === "SELLER") {
            return sellerCards
        }
        if (role === "ADMIN") {
            return [...adminCards, ...sellerCards, ...buyerCards]
        }
        return buyerCards
    }, [accessToken, role])

    return (
        <div className="flex flex-col gap-10">
            <section
                className="surface-panel-strong relative overflow-hidden px-6 py-6 md:px-8 md:py-8"
            >
                <div
                    className={cn(
                        "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                        hero.gradient
                    )}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] bg-[linear-gradient(180deg,rgba(15,23,42,0.035),transparent)] xl:block" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.09),_transparent_56%)]" />

                <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_360px]">
                    <div>
                        <div className="section-kicker">{hero.badge}</div>
                        <h1 className="display-title mt-5 max-w-4xl text-4xl text-foreground sm:text-5xl lg:text-6xl">
                            {hero.title}
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                            {hero.description}
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild size="lg" className="min-w-[11rem]">
                                <Link to={hero.ctaTo}>
                                    {hero.ctaLabel}
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="min-w-[11rem]"
                            >
                                <Link to={hero.secondaryCtaTo}>{hero.secondaryCtaLabel}</Link>
                            </Button>
                            {accessToken && role === "BUYER" ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="min-w-[11rem]"
                                    onClick={handleBecomeSeller}
                                    disabled={isUpgradingRole}
                                >
                                    {isUpgradingRole ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Switching...
                                        </>
                                    ) : (
                                        "Become Dev"
                                    )}
                                </Button>
                            ) : null}
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            {hero.stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-[1.2rem] border border-border/70 bg-background/72 px-4 py-4"
                                >
                                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                        {stat.label}
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold text-foreground">
                                        {stat.value}
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-muted-foreground">
                                        {stat.caption}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-foreground/10 bg-foreground p-5 text-background shadow-[0_24px_56px_-42px_rgba(15,23,42,0.8)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/52">
                            Workspace pulse
                        </p>
                        <div className="mt-4 rounded-[1.25rem] border border-white/12 bg-white/5 p-4">
                            <div className="text-sm font-semibold text-white">
                                {accessToken ? "Authenticated session" : "Guest session"}
                            </div>
                            <div className="mt-1 text-sm leading-6 text-white/68">
                                {hero.railDescription}
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="text-lg font-semibold text-white">
                                {hero.railTitle}
                            </div>
                            <div className="mt-4 grid gap-3">
                                {hero.notes.map((note, index) => (
                                    <div
                                        key={note.title}
                                        className="rounded-[1.2rem] border border-white/12 bg-white/6 px-4 py-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/8 text-xs font-semibold text-white/78">
                                                {String(index + 1).padStart(2, "0")}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">
                                                    {note.title}
                                                </div>
                                                <div className="mt-1 text-sm leading-6 text-white/68">
                                                    {note.description}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_0.75fr]">
                <div className="space-y-4">
                    <div>
                        <div className="section-kicker">Quick access</div>
                        <h2 className="display-title mt-4 text-3xl text-foreground">
                            Enter the right workspace without digging for routes.
                        </h2>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                            The dashboard should feel like a launch surface, not a menu dump.
                            These entry points keep the next high-value actions obvious.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {cards.map((card) => (
                            <WorkspaceTile
                                key={`${card.title}-${card.to}`}
                                card={card}
                                isAuthenticated={Boolean(accessToken)}
                            />
                        ))}
                    </div>
                </div>

                <Card className="surface-panel">
                    <CardHeader>
                        <div className="section-kicker">Platform rhythm</div>
                        <CardTitle className="mt-4">
                            HivePoint works best when discovery and operations stay adjacent.
                        </CardTitle>
                        <CardDescription>
                            Catalog visibility, gateway control, and operational signals are not
                            separate products here. The UI should make that obvious.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {platformLanes.map((lane) => (
                            <div
                                key={lane.title}
                                className="rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-4"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <lane.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">
                                            {lane.title}
                                        </div>
                                        <div className="mt-1 text-sm leading-6 text-muted-foreground">
                                            {lane.description}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

const WorkspaceTile = ({
    card,
    isAuthenticated
}: {
    card: DashboardCard
    isAuthenticated: boolean
}) => {
    const isLocked = card.requiresAuth && !isAuthenticated
    const actionTo = isLocked ? "/login" : card.to
    const Icon = card.icon

    return (
        <Link to={actionTo} className="group">
            <Card className="group relative flex h-full flex-col overflow-hidden border-border/80 bg-card">
                <div
                    className={cn(
                        "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                        card.accent
                    )}
                />
                <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-3">
                        <Badge variant="secondary" className="bg-background/70 text-foreground">
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-border/70 bg-background text-foreground">
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle>{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative mt-auto pt-0">
                    <div className="flex items-center justify-between border-t border-border/70 pt-4 text-sm font-medium text-foreground">
                        <span>{isLocked ? "Unlock workspace" : "Open workspace"}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
