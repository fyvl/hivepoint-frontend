import { ArrowRight, BarChart3, BriefcaseBusiness, CreditCard, Key, LayoutGrid, Lock, Rocket, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"
import { useMemo } from "react"

import { useAuth } from "@/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type DashboardCard = {
    title: string
    description: string
    to: string
    icon: React.ComponentType<{ className?: string }>
    requiresAuth?: boolean
    gradient?: string
}

type HeroConfig = {
    badge: string
    title: string
    description: string
    gradient: string
    ctaLabel: string
    ctaTo: string
}

const guestCards: DashboardCard[] = [
    {
        title: "API Catalog",
        description: "Browse public APIs and compare products.",
        to: "/catalog",
        icon: LayoutGrid,
        gradient: "from-amber-500/20 via-orange-500/10 to-transparent"
    },
    {
        title: "Buyer Workspace",
        description: "Subscriptions, keys, and usage analytics after sign-in.",
        to: "/billing",
        icon: CreditCard,
        requiresAuth: true,
        gradient: "from-emerald-500/20 via-teal-500/10 to-transparent"
    },
    {
        title: "Seller Studio",
        description: "Publish APIs, manage versions, and create plans.",
        to: "/seller/studio",
        icon: BriefcaseBusiness,
        requiresAuth: true,
        gradient: "from-cyan-500/20 via-blue-500/10 to-transparent"
    }
]

const buyerCards: DashboardCard[] = [
    {
        title: "API Catalog",
        description: "Discover and subscribe to API products.",
        to: "/catalog",
        icon: LayoutGrid,
        gradient: "from-amber-500/20 via-orange-500/10 to-transparent"
    },
    {
        title: "Billing",
        description: "Manage subscriptions and invoices.",
        to: "/billing",
        icon: CreditCard,
        gradient: "from-emerald-500/20 via-teal-500/10 to-transparent"
    },
    {
        title: "API Keys",
        description: "Generate and revoke access keys.",
        to: "/keys",
        icon: Key,
        gradient: "from-violet-500/20 via-fuchsia-500/10 to-transparent"
    },
    {
        title: "Usage Analytics",
        description: "Track request volume against quotas.",
        to: "/usage",
        icon: BarChart3,
        gradient: "from-sky-500/20 via-cyan-500/10 to-transparent"
    }
]

const sellerCards: DashboardCard[] = [
    {
        title: "Seller Studio",
        description: "Create products, release versions, and set pricing plans.",
        to: "/seller/studio",
        icon: BriefcaseBusiness,
        gradient: "from-cyan-500/20 via-blue-500/10 to-transparent"
    },
    {
        title: "Public Catalog",
        description: "Review how your APIs appear to buyers.",
        to: "/catalog",
        icon: LayoutGrid,
        gradient: "from-amber-500/20 via-orange-500/10 to-transparent"
    }
]

export const DashboardPage = () => {
    const { accessToken, role } = useAuth()

    const hero = useMemo<HeroConfig>(() => {
        if (!accessToken) {
            return {
                badge: "API Platform",
                title: "Build and scale on HivePoint",
                description: "Choose your workspace after sign in: buyer operations or seller publishing.",
                gradient: "from-amber-500 via-orange-500 to-amber-600",
                ctaLabel: "Create account",
                ctaTo: "/register"
            }
        }

        if (role === "SELLER") {
            return {
                badge: "Seller Workspace",
                title: "Ship and monetize API products",
                description: "Manage releases and pricing from Seller Studio.",
                gradient: "from-cyan-600 via-blue-700 to-slate-900",
                ctaLabel: "Open Seller Studio",
                ctaTo: "/seller/studio"
            }
        }

        if (role === "ADMIN") {
            return {
                badge: "Admin Workspace",
                title: "Oversee buyer and seller flows",
                description: "Access operational buyer tools and seller publishing surfaces.",
                gradient: "from-indigo-600 via-violet-700 to-slate-900",
                ctaLabel: "Open Seller Studio",
                ctaTo: "/seller/studio"
            }
        }

        return {
            badge: "Buyer Workspace",
            title: "Integrate APIs with confidence",
            description: "Handle subscriptions, API keys, and usage in one place.",
            gradient: "from-emerald-500 via-teal-600 to-cyan-700",
            ctaLabel: "Go to Billing",
            ctaTo: "/billing"
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
            return [...sellerCards, ...buyerCards]
        }
        return buyerCards
    }, [accessToken, role])

    return (
        <div className="flex flex-col gap-12">
            <section className={cn(
                "relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-2xl md:p-12",
                hero.gradient
            )}>
                <div className="absolute inset-0 opacity-10">
                    <div className="hexagon-pattern h-full w-full" />
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <Badge className="bg-white/20 text-white hover:bg-white/30">
                            {hero.badge}
                        </Badge>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                            {hero.title}
                        </h1>
                        <p className="text-lg text-white/90 md:text-xl">
                            {hero.description}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                                <Link to={hero.ctaTo}>
                                    {hero.ctaLabel}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            {!accessToken ? (
                                <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                                    <Link to="/catalog">Explore APIs</Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    <div className="hidden flex-col gap-3 lg:flex">
                        <FeaturePill icon={Rocket} text="Fast onboarding" />
                        <FeaturePill icon={ShieldCheck} text="Role-aware workspace" />
                        <FeaturePill icon={BarChart3} text="Operational visibility" />
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Quick Access</h2>
                    <p className="text-muted-foreground">
                        {role === "SELLER" ? "Seller-first tools" : role === "BUYER" ? "Buyer operations" : "Choose your path"}
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card) => {
                        const isLocked = card.requiresAuth && !accessToken
                        const actionTo = isLocked ? "/login" : card.to
                        const Icon = card.icon

                        return (
                            <Link key={`${card.title}-${card.to}`} to={actionTo} className="group">
                                <Card className={cn(
                                    "relative h-full overflow-hidden transition-all duration-300",
                                    "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5",
                                    isLocked && "opacity-75"
                                )}>
                                    <div className={cn(
                                        "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100",
                                        card.gradient
                                    )} />

                                    <CardHeader className="relative">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-lg">{card.title}</CardTitle>
                                            {isLocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : null}
                                        </div>
                                        <CardDescription className="line-clamp-2">
                                            {card.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="relative pt-0">
                                        <span className={cn(
                                            "flex items-center text-sm font-medium",
                                            isLocked ? "text-muted-foreground" : "text-primary"
                                        )}>
                                            {isLocked ? "Sign in required" : "Open"}
                                            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </CardFooter>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}

const FeaturePill = ({
    icon: Icon,
    text
}: {
    icon: React.ComponentType<{ className?: string }>
    text: string
}) => {
    return (
        <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium">{text}</span>
        </div>
    )
}

