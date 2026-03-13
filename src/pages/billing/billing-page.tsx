import { useCallback, useEffect, useMemo, useState } from "react"

import {
    createBillingApi,
    type BillingConfigResponse,
    type Subscription
} from "@/api/billing"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { EmptyBlock } from "@/components/ui-states/empty-block"
import { ErrorBlock } from "@/components/ui-states/error-block"
import { notifyError, notifySuccess } from "@/lib/notify"
import { formatCurrency, formatDate, formatNumber } from "@/lib/format"

type SubscriptionNotice = {
    title: string
    description: string
    tone: "default" | "warning" | "danger"
}

const hasRecoverablePortalAction = (subscription: Subscription) => {
    return subscription.paymentProvider === "STRIPE" && Boolean(subscription.hasExternalSubscription)
}

const getSubscriptionNotice = (subscription: Subscription): SubscriptionNotice | null => {
    if (subscription.status === "PAST_DUE") {
        if (hasRecoverablePortalAction(subscription)) {
            return {
                title: "Payment action required",
                description:
                    "A renewal payment failed. Update the payment method in the customer portal to restore normal billing.",
                tone: "danger"
            }
        }

        return {
            title: "Checkout needs to be restarted",
            description:
                "This failed billing record did not create a recoverable Stripe subscription. Start a new checkout from the product page.",
            tone: "warning"
        }
    }

    if (subscription.cancelAtPeriodEnd) {
        return {
            title: "Cancellation scheduled",
            description: subscription.currentPeriodEnd
                ? `Access remains active through ${formatDate(subscription.currentPeriodEnd)}.`
                : "Access remains active until the current billing period ends.",
            tone: "warning"
        }
    }

    if (subscription.status === "PENDING") {
        return {
            title: "Payment pending",
            description:
                "Complete checkout or wait for the payment confirmation webhook before using the subscription.",
            tone: "default"
        }
    }

    return null
}

const noticeStyles: Record<SubscriptionNotice["tone"], string> = {
    default: "border-border/60 bg-muted/10",
    warning: "border-amber-500/30 bg-amber-500/10",
    danger: "border-destructive/30 bg-destructive/10"
}

export const BillingPage = () => {
    const { accessToken, refresh } = useAuth()
    const billingApi = useMemo(
        () => createBillingApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [billingConfig, setBillingConfig] = useState<BillingConfigResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)
    const [cancelingId, setCancelingId] = useState<string | null>(null)
    const [isOpeningPortal, setIsOpeningPortal] = useState(false)
    const [retryKey, setRetryKey] = useState(0)
    const [pendingCancel, setPendingCancel] = useState<Subscription | null>(null)
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const subscriptionStats = useMemo(() => {
        return {
            active: subscriptions.filter((item) => item.status === "ACTIVE").length,
            pastDue: subscriptions.filter((item) => item.status === "PAST_DUE").length,
            canceling: subscriptions.filter((item) => item.cancelAtPeriodEnd).length
        }
    }, [subscriptions])

    const loadSubscriptions = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const [subscriptionsResponse, configResponse] = await Promise.all([
                billingApi.listSubscriptions(),
                billingApi.getConfig()
            ])
            setSubscriptions(subscriptionsResponse.items)
            setBillingConfig(configResponse)
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            setError(apiError)
            setSubscriptions([])
            setBillingConfig(null)
            notifyError(apiError ?? err, "Billing error")
        } finally {
            setIsLoading(false)
        }
    }, [billingApi])

    useEffect(() => {
        void loadSubscriptions()
    }, [loadSubscriptions, retryKey])

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

    const handleOpenCancel = (subscription: Subscription) => {
        setPendingCancel(subscription)
        setIsCancelDialogOpen(true)
    }

    const handleOpenPortal = async () => {
        setIsOpeningPortal(true)
        try {
            const response = await billingApi.createPortalSession()
            window.location.assign(response.url)
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            notifyError(apiError ?? err, "Portal unavailable")
        } finally {
            setIsOpeningPortal(false)
        }
    }

    const handleCancelDialogChange = (open: boolean) => {
        setIsCancelDialogOpen(open)
        if (!open) {
            setPendingCancel(null)
        }
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
                    <p className="text-muted-foreground">
                        Manage your subscriptions and billing status
                    </p>
                </div>
                {billingConfig?.customerPortalAvailable ? (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isOpeningPortal}
                        onClick={handleOpenPortal}
                    >
                        {isOpeningPortal ? "Opening..." : "Open customer portal"}
                    </Button>
                ) : null}
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
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Active</CardDescription>
                                <CardTitle>{subscriptionStats.active}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Past due</CardDescription>
                                <CardTitle>{subscriptionStats.pastDue}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Canceling at period end</CardDescription>
                                <CardTitle>{subscriptionStats.canceling}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <div className="grid gap-4">
                        {subscriptions.map((subscription) => (
                            <SubscriptionCard
                                key={subscription.id}
                                subscription={subscription}
                                onCancel={handleOpenCancel}
                                onOpenPortal={handleOpenPortal}
                                canOpenPortal={Boolean(billingConfig?.customerPortalAvailable)}
                                isCanceling={cancelingId === subscription.id}
                                isOpeningPortal={isOpeningPortal}
                            />
                        ))}
                    </div>
                </>
            ) : null}

            <Dialog open={isCancelDialogOpen} onOpenChange={handleCancelDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel subscription</DialogTitle>
                        <DialogDescription>
                            This will mark the subscription to cancel at period end.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            {pendingCancel
                                ? `${pendingCancel.product.title} / ${pendingCancel.plan.name}`
                                : "Select a subscription to cancel."}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCancelDialogOpen(false)}
                            >
                                Keep subscription
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={!pendingCancel || cancelingId === pendingCancel?.id}
                                onClick={() => {
                                    if (!pendingCancel) {
                                        return
                                    }
                                    void handleCancel(pendingCancel.id)
                                    setIsCancelDialogOpen(false)
                                }}
                            >
                                Confirm cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

type SubscriptionCardProps = {
    subscription: Subscription
    onCancel: (subscription: Subscription) => void
    onOpenPortal: () => void
    canOpenPortal: boolean
    isCanceling: boolean
    isOpeningPortal: boolean
}

const SubscriptionCard = ({
    subscription,
    onCancel,
    onOpenPortal,
    canOpenPortal,
    isCanceling,
    isOpeningPortal
}: SubscriptionCardProps) => {
    const { plan, product } = subscription
    const isActive = subscription.status === "ACTIVE"
    const canCancel = isActive && !subscription.cancelAtPeriodEnd
    const latestInvoice = subscription.latestInvoice ?? null
    const invoices = subscription.invoices ?? (latestInvoice ? [latestInvoice] : [])
    const notice = getSubscriptionNotice(subscription)
    const showPortalAction = canOpenPortal && hasRecoverablePortalAction(subscription)

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
                {notice ? (
                    <div className={`rounded-lg border p-4 sm:col-span-2 ${noticeStyles[notice.tone]}`}>
                        <div className="font-medium text-foreground">{notice.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{notice.description}</div>
                    </div>
                ) : null}
                <div>
                    <div className="text-xs uppercase">Billing period</div>
                    <div>
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase">Plan</div>
                    <div>
                        {formatCurrency(plan.priceCents, plan.currency)} / {formatNumber(plan.quotaRequests)} requests
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase">Cancel at period end</div>
                    <div>{subscription.cancelAtPeriodEnd ? "Yes" : "No"}</div>
                </div>
                <div>
                    <div className="text-xs uppercase">Provider</div>
                    <div>{subscription.paymentProvider ?? "Unknown"}</div>
                </div>
                <div>
                    <div className="text-xs uppercase">Latest invoice</div>
                    <div>
                        {latestInvoice
                            ? `${latestInvoice.status} / ${formatCurrency(
                                  latestInvoice.amountCents,
                                  latestInvoice.currency
                              )}`
                            : "No invoice"}
                    </div>
                </div>
                <div className="sm:col-span-2">
                    <div className="text-xs uppercase">Invoice history</div>
                    {invoices.length > 0 ? (
                        <div className="mt-2 grid gap-2">
                            {invoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2"
                                >
                                    <span className="font-medium text-foreground">
                                        {formatDate(invoice.createdAt)}
                                    </span>
                                    <span>
                                        {invoice.status} / {formatCurrency(invoice.amountCents, invoice.currency)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>No invoices yet</div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-2">
                <div>
                    {showPortalAction ? (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isOpeningPortal}
                            onClick={onOpenPortal}
                        >
                            {isOpeningPortal
                                ? "Opening..."
                                : subscription.status === "PAST_DUE"
                                    ? "Fix payment in portal"
                                    : "Open customer portal"}
                        </Button>
                    ) : null}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!canCancel || isCanceling}
                    onClick={() => onCancel(subscription)}
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
