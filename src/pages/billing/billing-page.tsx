import { useEffect, useMemo, useState } from "react"

import { createBillingApi, type Subscription } from "@/api/billing"
import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const formatDate = (value: string | null) => {
    if (!value) {
        return "—"
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }
    return date.toLocaleDateString()
}

const formatPrice = (priceCents: number, currency: string) => {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency
        }).format(priceCents / 100)
    } catch {
        return `${priceCents / 100} ${currency}`
    }
}

export const BillingPage = () => {
    const { accessToken, refresh } = useAuth()
    const { toast } = useToast()
    const billingApi = useMemo(
        () => createBillingApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)
    const [cancelingId, setCancelingId] = useState<string | null>(null)

    const loadSubscriptions = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await billingApi.listSubscriptions()
            setSubscriptions(response.items)
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            setError(apiError)
            setSubscriptions([])
            toast({
                title: apiError?.code ?? "Billing error",
                description: apiError?.message ?? "Unable to load subscriptions.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadSubscriptions()
    }, [billingApi])

    const handleCancel = async (subscriptionId: string) => {
        setCancelingId(subscriptionId)
        try {
            await billingApi.cancelSubscription(subscriptionId)
            toast({
                title: "Subscription canceled",
                description: "Cancel at period end has been set."
            })
            await loadSubscriptions()
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            toast({
                title: apiError?.code ?? "Cancel failed",
                description: apiError?.message ?? "Unable to cancel subscription.",
                variant: "destructive"
            })
        } finally {
            setCancelingId(null)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Billing</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your subscriptions and billing status.
                </p>
            </div>

            {error && !isLoading ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Subscriptions unavailable</CardTitle>
                        <CardDescription>
                            {error.message || "Unable to fetch subscriptions."}
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : null}

            {isLoading ? (
                <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={`billing-skeleton-${index}`} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 w-1/3 rounded bg-muted" />
                                <div className="h-3 w-1/2 rounded bg-muted" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-3 w-full rounded bg-muted" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : null}

            {!isLoading && subscriptions.length === 0 && !error ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No subscriptions yet</CardTitle>
                        <CardDescription>
                            Subscribe to a plan from a product page to see it here.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : null}

            {!isLoading && subscriptions.length > 0 ? (
                <div className="grid gap-4">
                    {subscriptions.map((subscription) => (
                        <SubscriptionCard
                            key={subscription.id}
                            subscription={subscription}
                            onCancel={handleCancel}
                            isCanceling={cancelingId === subscription.id}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    )
}

type SubscriptionCardProps = {
    subscription: Subscription
    onCancel: (id: string) => void
    isCanceling: boolean
}

const SubscriptionCard = ({ subscription, onCancel, isCanceling }: SubscriptionCardProps) => {
    const { plan, product } = subscription
    const isActive = subscription.status === "ACTIVE"
    const canCancel = isActive && !subscription.cancelAtPeriodEnd

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <CardTitle>{product.title}</CardTitle>
                        <CardDescription>{plan.name}</CardDescription>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {subscription.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <div>
                    <div className="text-xs uppercase">Billing period</div>
                    <div>
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase">Plan</div>
                    <div>
                        {formatPrice(plan.priceCents, plan.currency)} · {plan.quotaRequests} requests
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase">Cancel at period end</div>
                    <div>{subscription.cancelAtPeriodEnd ? "Yes" : "No"}</div>
                </div>
            </CardContent>
            <CardFooter className="justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!canCancel || isCanceling}
                    onClick={() => onCancel(subscription.id)}
                >
                    {subscription.cancelAtPeriodEnd
                        ? "Cancellation scheduled"
                        : isCanceling
                            ? "Canceling..."
                            : "Cancel"}
                </Button>
            </CardFooter>
        </Card>
    )
}
