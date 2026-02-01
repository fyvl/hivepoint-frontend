import { useEffect, useMemo, useState } from "react"

import { createBillingApi, type Subscription } from "@/api/billing"
import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { SubscriptionsSkeleton } from "@/components/skeletons/subscriptions-skeleton"
import { StatusBadge } from "@/components/status-badge"
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
import { EmptyBlock } from "@/components/ui-states/empty-block"
import { ErrorBlock } from "@/components/ui-states/error-block"
import { notifyError, notifySuccess } from "@/lib/notify"
import { formatDate } from "@/lib/format"

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
    const billingApi = useMemo(
        () => createBillingApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)
    const [cancelingId, setCancelingId] = useState<string | null>(null)
    const [retryKey, setRetryKey] = useState(0)

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
            notifyError(apiError ?? err, "Billing error")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadSubscriptions()
    }, [billingApi, retryKey])

    const handleCancel = async (subscriptionId: string) => {
        setCancelingId(subscriptionId)
        try {
            await billingApi.cancelSubscription(subscriptionId)
            notifySuccess("Subscription cancellation scheduled", "Cancel at period end has been set.")
            await loadSubscriptions()
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            notifyError(apiError ?? err, "Cancel failed")
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

            {isLoading ? <SubscriptionsSkeleton /> : null}

            {error && !isLoading ? (
                <ErrorBlock
                    title="Subscriptions unavailable"
                    description={error.message || "Unable to fetch subscriptions."}
                    code={error.code}
                    onRetry={() => setRetryKey((prev) => prev + 1)}
                />
            ) : null}

            {!isLoading && subscriptions.length === 0 && !error ? (
                <EmptyBlock
                    title="No subscriptions yet"
                    description="Subscribe to a plan from a product page to see it here."
                    actionLabel="Browse catalog"
                    actionTo="/catalog"
                />
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
                    <div className="flex items-center gap-2">
                        <StatusBadge kind="subscription" value={subscription.status} />
                        {subscription.cancelAtPeriodEnd ? (
                            <Badge variant="outline">Cancels at period end</Badge>
                        ) : null}
                    </div>
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

