import { Link } from "react-router-dom"

import { useAuth } from "@/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type DashboardCard = {
    title: string
    description: string
    to: string
    requiresAuth?: boolean
}

const cards: DashboardCard[] = [
    {
        title: "Catalog",
        description: "Browse published API products and versions.",
        to: "/catalog"
    },
    {
        title: "Billing",
        description: "Manage your subscriptions and billing status.",
        to: "/billing",
        requiresAuth: true
    },
    {
        title: "Keys",
        description: "Create and revoke API keys for your subscriptions.",
        to: "/keys",
        requiresAuth: true
    },
    {
        title: "Usage",
        description: "Track current usage across your active subscriptions.",
        to: "/usage",
        requiresAuth: true
    }
]

export const DashboardPage = () => {
    const { accessToken } = useAuth()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Quick links to manage your HivePoint account.
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {cards.map((card) => {
                    const isLocked = card.requiresAuth && !accessToken
                    const actionLabel = isLocked ? "Login required" : "Open"
                    const actionTo = isLocked ? "/login" : card.to

                    return (
                        <Card key={card.title} className="flex h-full flex-col">
                            <CardHeader className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle>{card.title}</CardTitle>
                                    {isLocked ? (
                                        <Badge variant="secondary">Login required</Badge>
                                    ) : null}
                                </div>
                                <CardDescription>{card.description}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button asChild variant={isLocked ? "outline" : "default"}>
                                    <Link to={actionTo}>{actionLabel}</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
