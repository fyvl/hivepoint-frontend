import { CheckCircle2, Clock3, CreditCard, LayoutDashboard } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"

import {
    createBillingApi,
    type BillingCheckoutStatusResponse
} from "@/api/billing"
import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { notifyError } from "@/lib/notify"

export const BillingSuccessPage = () => {
    const [searchParams] = useSearchParams()
    const rawSessionId = searchParams.get("session_id")
    const hasPlaceholderSessionId = rawSessionId === "{CHECKOUT_SESSION_ID}"
    const sessionId = hasPlaceholderSessionId ? null : rawSessionId
    const { accessToken, refresh } = useAuth()
    const billingApi = useMemo(
        () => createBillingApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [status, setStatus] = useState<BillingCheckoutStatusResponse | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(sessionId))
    const [error, setError] = useState<ApiError | null>(null)

    useEffect(() => {
        if (hasPlaceholderSessionId) {
            setStatus(null)
            setIsLoading(false)
            setError(
                new ApiError(
                    400,
                    "Stripe did not return a real checkout session id. Start a new checkout session.",
                    "CHECKOUT_SESSION_NOT_FOUND"
                )
            )
            return
        }

        if (!sessionId) {
            setIsLoading(false)
            return
        }

        let isActive = true
        let intervalId: ReturnType<typeof setInterval> | null = null

        const load = async () => {
            try {
                const response = await billingApi.getCheckoutStatus(sessionId)
                if (!isActive) {
                    return
                }
                setStatus(response)
                setError(null)

                const isSettled =
                    response.invoiceStatus === "PAID" &&
                    response.subscriptionStatus === "ACTIVE"

                if (isSettled && intervalId) {
                    clearInterval(intervalId)
                    intervalId = null
                }
            } catch (err) {
                if (!isActive) {
                    return
                }
                const apiError = err instanceof ApiError ? err : null
                setError(apiError)
                if (apiError?.code === "CHECKOUT_SESSION_NOT_FOUND" && intervalId) {
                    clearInterval(intervalId)
                    intervalId = null
                }
                notifyError(apiError ?? err, "Could not verify checkout status")
            } finally {
                if (isActive) {
                    setIsLoading(false)
                }
            }
        }

        void load()
        intervalId = setInterval(() => {
            void load()
        }, 2500)

        return () => {
            isActive = false
            if (intervalId) {
                clearInterval(intervalId)
            }
        }
    }, [billingApi, hasPlaceholderSessionId, sessionId])

    const isSettled =
        status?.invoiceStatus === "PAID" && status?.subscriptionStatus === "ACTIVE"

    return (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center">
            <Card className="w-full border-emerald-500/20 shadow-soft">
                <CardHeader className="space-y-4 text-center">
                    <div
                        className={[
                            "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
                            isSettled
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-amber-500/10 text-amber-600"
                        ].join(" ")}
                    >
                        {isSettled ? (
                            <CheckCircle2 className="h-7 w-7" />
                        ) : (
                            <Clock3 className="h-7 w-7" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <CardTitle>
                            {isSettled ? "Payment confirmed" : "Payment received, syncing..."}
                        </CardTitle>
                        <CardDescription>
                            {sessionId
                                ? "The app is checking Stripe webhook sync and updating your subscription status."
                                : "Checkout completed, but session details were not provided in the return URL."}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {status ? (
                        <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                            <StatusRow label="Product" value={status.productTitle} />
                            <StatusRow label="Plan" value={status.planName} />
                            <StatusRow label="Provider" value={status.paymentProvider} />
                            <StatusRow label="Invoice status" value={status.invoiceStatus} />
                            <StatusRow label="Subscription" value={status.subscriptionStatus} />
                            <StatusRow
                                label="Cancel at period end"
                                value={status.cancelAtPeriodEnd ? "Yes" : "No"}
                            />
                        </div>
                    ) : null}

                    {error ? (
                        <p className="text-center text-sm text-destructive">
                            {error.message || "Could not verify checkout status."}
                        </p>
                    ) : null}

                    {isLoading && !status ? (
                        <p className="text-center text-sm text-muted-foreground">
                            Waiting for checkout confirmation...
                        </p>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button asChild className="gap-2">
                            <Link to="/billing">
                                <CreditCard className="h-4 w-4" />
                                Open Billing
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="gap-2">
                            <Link to="/">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const StatusRow = ({ label, value }: { label: string; value: string }) => {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-medium">{value}</p>
        </div>
    )
}
