import { ArrowRight, BarChart3, CreditCard, Key, LayoutGrid, Lock, Zap } from "lucide-react"
import { Link } from "react-router-dom"

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

const cards: DashboardCard[] = [
    {
        title: "API Catalog",
        description: "Discover and explore our collection of powerful API products.",
        to: "/catalog",
        icon: LayoutGrid,
        gradient: "from-amber-500/20 via-orange-500/10 to-transparent"
    },
    {
        title: "Billing",
        description: "Manage subscriptions, view invoices and payment methods.",
        to: "/billing",
        icon: CreditCard,
        requiresAuth: true,
        gradient: "from-emerald-500/20 via-teal-500/10 to-transparent"
    },
    {
        title: "API Keys",
        description: "Generate, manage and revoke API keys for your applications.",
        to: "/keys",
        icon: Key,
        requiresAuth: true,
        gradient: "from-violet-500/20 via-purple-500/10 to-transparent"
    },
    {
        title: "Usage Analytics",
        description: "Monitor API calls, track usage patterns and optimize performance.",
        to: "/usage",
        icon: BarChart3,
        requiresAuth: true,
        gradient: "from-blue-500/20 via-cyan-500/10 to-transparent"
    }
]

const features = [
    { icon: Zap, text: "Lightning Fast APIs" },
    { icon: Lock, text: "Enterprise Security" },
    { icon: BarChart3, text: "Real-time Analytics" }
]

export const DashboardPage = () => {
    const { accessToken } = useAuth()

    return (
        <div className="flex flex-col gap-12">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-8 text-white shadow-2xl md:p-12">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="hexagon-pattern h-full w-full" />
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-2xl space-y-4">
                            <Badge className="bg-white/20 text-white hover:bg-white/30">
                                API Platform
                            </Badge>
                            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                                Welcome to <span className="text-amber-200">HivePoint</span>
                            </h1>
                            <p className="text-lg text-white/90 md:text-xl">
                                Connect, integrate, and scale with our powerful API ecosystem. 
                                Build amazing applications with enterprise-grade infrastructure.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                {!accessToken ? (
                                    <>
                                        <Button 
                                            asChild 
                                            size="lg" 
                                            className="bg-white text-amber-600 shadow-lg hover:bg-amber-50"
                                        >
                                            <Link to="/register">
                                                Get Started Free
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button 
                                            asChild 
                                            size="lg" 
                                            variant="outline"
                                            className="border-white/30 bg-transparent text-white hover:bg-white/10"
                                        >
                                            <Link to="/catalog">Explore APIs</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <Button 
                                        asChild 
                                        size="lg" 
                                        className="bg-white text-amber-600 shadow-lg hover:bg-amber-50"
                                    >
                                        <Link to="/catalog">
                                            Browse Catalog
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        {/* Feature Pills */}
                        <div className="hidden flex-col gap-3 lg:flex">
                            {features.map((feature, i) => (
                                <div 
                                    key={i}
                                    className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm"
                                >
                                    <feature.icon className="h-5 w-5" />
                                    <span className="text-sm font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Access Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Quick Access</h2>
                        <p className="text-muted-foreground">
                            Everything you need to manage your API integrations
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card) => {
                        const isLocked = card.requiresAuth && !accessToken
                        const actionTo = isLocked ? "/login" : card.to
                        const Icon = card.icon

                        return (
                            <Link 
                                key={card.title} 
                                to={actionTo}
                                className="group"
                            >
                                <Card className={cn(
                                    "relative h-full overflow-hidden transition-all duration-300",
                                    "hover:shadow-lg hover:shadow-primary/5",
                                    "hover:-translate-y-1",
                                    isLocked && "opacity-75"
                                )}>
                                    {/* Gradient Background */}
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
                                            {isLocked && (
                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                            )}
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

            {/* Stats Section (for logged in users) */}
            {accessToken && (
                <section className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Active Subscriptions" value="—" />
                    <StatCard label="API Keys" value="—" />
                    <StatCard label="This Month's Calls" value="—" />
                </section>
            )}
        </div>
    )
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
    <Card className="bg-muted/30">
        <CardHeader className="pb-2">
            <CardDescription>{label}</CardDescription>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
        </CardHeader>
    </Card>
)
