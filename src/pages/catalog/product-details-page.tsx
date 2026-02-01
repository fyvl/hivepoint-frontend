import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import {
    createCatalogApi,
    type CatalogProduct,
    type CatalogVersion,
    type GetProductResponse,
    type GetVersionsResponse
} from "@/api/catalog"
import {
    createBillingApi,
    type ListPlansResponse,
    type Plan,
    type SubscribeResponse
} from "@/api/billing"
import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DevMockPaymentActions } from "@/pages/billing/dev-mock-payment"

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null
}

const getString = (record: Record<string, unknown> | null, key: string) => {
    if (!record) {
        return undefined
    }
    const value = record[key]
    return typeof value === "string" ? value : undefined
}

const getStringArray = (record: Record<string, unknown> | null, key: string) => {
    if (!record) {
        return []
    }
    const value = record[key]
    if (!Array.isArray(value)) {
        return []
    }
    return value.filter((item) => typeof item === "string")
}

const extractVersions = (payload: GetVersionsResponse): CatalogVersion[] => {
    if (Array.isArray(payload)) {
        return payload
    }

    if (!isRecord(payload)) {
        return []
    }

    const items = payload.items
    return Array.isArray(items) ? items : []
}

const extractPlans = (payload: ListPlansResponse): Plan[] => {
    return payload.items ?? []
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

export const ProductDetailsPage = () => {
    const { id } = useParams<{ id: string }>()
    const { accessToken, refresh } = useAuth()
    const { toast } = useToast()
    const catalogApi = useMemo(
        () => createCatalogApi({ accessToken, refresh }),
        [accessToken, refresh]
    )
    const billingApi = useMemo(
        () => createBillingApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [product, setProduct] = useState<CatalogProduct | null>(null)
    const [versions, setVersions] = useState<CatalogVersion[]>([])
    const [plans, setPlans] = useState<Plan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPlansLoading, setIsPlansLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)
    const [plansError, setPlansError] = useState<ApiError | null>(null)
    const [subscribeResult, setSubscribeResult] = useState<SubscribeResponse | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null)

    useEffect(() => {
        if (!id) {
            setError(new ApiError(400, "Missing product id"))
            setIsLoading(false)
            return
        }

        let isActive = true

        const load = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const [productResponse, versionResponse] = await Promise.all([
                    catalogApi.getProduct(id),
                    catalogApi.getVersions(id)
                ])

                if (!isActive) {
                    return
                }

                setProduct(productResponse as GetProductResponse)
                setVersions(extractVersions(versionResponse))
            } catch (err) {
                if (!isActive) {
                    return
                }

                const apiError = err instanceof ApiError ? err : null
                setError(apiError)
                setProduct(null)
                setVersions([])

                toast({
                    title: apiError?.code ?? "Product error",
                    description: apiError?.message ?? "Unable to load product details.",
                    variant: "destructive"
                })
            } finally {
                if (isActive) {
                    setIsLoading(false)
                }
            }
        }

        load()

        return () => {
            isActive = false
        }
    }, [catalogApi, id, toast])

    useEffect(() => {
        if (!id) {
            return
        }

        let isActive = true

        const loadPlans = async () => {
            setIsPlansLoading(true)
            setPlansError(null)

            try {
                const response = await billingApi.listPlans({ productId: id })
                if (!isActive) {
                    return
                }
                setPlans(extractPlans(response))
            } catch (err) {
                if (!isActive) {
                    return
                }
                const apiError = err instanceof ApiError ? err : null
                setPlansError(apiError)
                setPlans([])
                toast({
                    title: apiError?.code ?? "Plans error",
                    description: apiError?.message ?? "Unable to load plans.",
                    variant: "destructive"
                })
            } finally {
                if (isActive) {
                    setIsPlansLoading(false)
                }
            }
        }

        loadPlans()

        return () => {
            isActive = false
        }
    }, [billingApi, id, toast])

    const handleSubscribe = async (planId: string) => {
        if (!accessToken) {
            toast({
                title: "Sign in required",
                description: "Please sign in to subscribe to a plan.",
                variant: "destructive"
            })
            return
        }

        setSubscribingPlanId(planId)
        try {
            const response = await billingApi.subscribe({ planId })
            setSubscribeResult(response)
            setIsDialogOpen(true)
            toast({
                title: "Subscription created",
                description: "Use the payment link to complete checkout."
            })
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            toast({
                title: apiError?.code ?? "Subscribe failed",
                description: apiError?.message ?? "Unable to subscribe to this plan.",
                variant: "destructive"
            })
        } finally {
            setSubscribingPlanId(null)
        }
    }

    const handleCopyLink = async () => {
        if (!subscribeResult?.paymentLink) {
            return
        }

        try {
            await navigator.clipboard.writeText(subscribeResult.paymentLink)
            toast({
                title: "Payment link copied",
                description: "The link is now in your clipboard."
            })
        } catch {
            toast({
                title: "Copy failed",
                description: "Unable to copy payment link.",
                variant: "destructive"
            })
        }
    }

    if (isLoading) {
        return (
            <div className="grid gap-4">
                <Card className="animate-pulse">
                    <CardHeader>
                        <div className="h-4 w-1/3 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                    </CardContent>
                </Card>
                <Card className="animate-pulse">
                    <CardHeader>
                        <div className="h-4 w-1/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (error) {
        const isForbidden = error.status === 403 || error.code === "FORBIDDEN"
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Product unavailable</CardTitle>
                    <CardDescription>
                        {error.message || "Unable to load this product."}
                    </CardDescription>
                </CardHeader>
                {isForbidden ? (
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            This product might be private. Try signing in to access it.
                        </p>
                        <div className="mt-4">
                            <Button asChild variant="outline" size="sm">
                                <Link to="/login">Go to login</Link>
                            </Button>
                        </div>
                    </CardContent>
                ) : null}
            </Card>
        )
    }

    if (!product) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Product not found</CardTitle>
                    <CardDescription>No product data was returned.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const productRecord = isRecord(product) ? product : null
    const tags = getStringArray(productRecord, "tags")

    return (
        <>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{getString(productRecord, "title") ?? "Untitled product"}</CardTitle>
                        <CardDescription>{getString(productRecord, "category") ?? "Uncategorized"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {getString(productRecord, "description") ?? "No description available."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                            {getString(productRecord, "status") ? (
                                <Badge variant="outline">{getString(productRecord, "status")}</Badge>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Plans</CardTitle>
                        <CardDescription>Choose a plan to subscribe.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {plansError && !isPlansLoading ? (
                            <div className="text-sm text-muted-foreground">
                                {plansError.message || "Unable to load plans."}
                            </div>
                        ) : null}

                        {isPlansLoading ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {Array.from({ length: 2 }).map((_, index) => (
                                    <Card key={`plan-skeleton-${index}`} className="animate-pulse">
                                        <CardHeader>
                                            <div className="h-4 w-1/3 rounded bg-muted" />
                                            <div className="h-3 w-1/2 rounded bg-muted" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-3 w-2/3 rounded bg-muted" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : null}

                        {!isPlansLoading && plans.length === 0 && !plansError ? (
                            <div className="text-sm text-muted-foreground">No plans available.</div>
                        ) : null}

                        {!isPlansLoading && plans.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {plans.map((plan) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        onSubscribe={handleSubscribe}
                                        isSubscribing={subscribingPlanId === plan.id}
                                        isAuthenticated={Boolean(accessToken)}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Versions</CardTitle>
                        <CardDescription>Published versions for this product.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {versions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No versions available.</p>
                        ) : (
                            versions.map((version, index) => {
                                const versionRecord = isRecord(version) ? version : null
                                const versionId = getString(versionRecord, "id")
                                const versionLabel = getString(versionRecord, "version") ?? "Unnamed version"
                                const status = getString(versionRecord, "status") ?? ""
                                const openApiUrl = getString(versionRecord, "openApiUrl")

                                return (
                                    <div
                                        key={versionId ?? `${versionLabel}-${index}`}
                                        className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <p className="font-medium">{versionLabel}</p>
                                            <p className="text-sm text-muted-foreground">{status}</p>
                                        </div>
                                        {openApiUrl ? (
                                            <Button asChild variant="link">
                                                <a href={openApiUrl} target="_blank" rel="noreferrer">
                                                    OpenAPI
                                                </a>
                                            </Button>
                                        ) : null}
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete payment</DialogTitle>
                        <DialogDescription>
                            Use the payment link to finish your subscription.
                        </DialogDescription>
                    </DialogHeader>
                    {subscribeResult ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="payment-link">Payment link</Label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input
                                        id="payment-link"
                                        value={subscribeResult.paymentLink}
                                        readOnly
                                    />
                                    <Button type="button" variant="outline" onClick={handleCopyLink}>
                                        Copy link
                                    </Button>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Invoice ID: {subscribeResult.invoiceId}
                            </div>
                            <div>
                                <Button asChild variant="link">
                                    <a
                                        href={subscribeResult.paymentLink}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open payment link
                                    </a>
                                </Button>
                            </div>
                            <DevMockPaymentActions
                                invoiceId={subscribeResult.invoiceId}
                                onSuccess={() => {
                                    toast({
                                        title: "Mock payment sent",
                                        description: "Refresh /billing to see updated status."
                                    })
                                }}
                            />
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">No subscription data.</div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

type PlanCardProps = {
    plan: Plan
    onSubscribe: (planId: string) => void
    isSubscribing: boolean
    isAuthenticated: boolean
}

const PlanCard = ({ plan, onSubscribe, isSubscribing, isAuthenticated }: PlanCardProps) => {
    const isInactive = !plan.isActive

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                            {formatPrice(plan.priceCents, plan.currency)} · {plan.period}
                        </CardDescription>
                    </div>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
                {plan.quotaRequests} requests per period
            </CardContent>
            <CardContent className="flex items-center justify-between">
                {isAuthenticated ? (
                    <Button
                        type="button"
                        size="sm"
                        disabled={isInactive || isSubscribing}
                        onClick={() => onSubscribe(plan.id)}
                    >
                        {isSubscribing ? "Subscribing..." : "Subscribe"}
                    </Button>
                ) : (
                    <Button asChild size="sm" variant="outline">
                        <Link to="/login">Sign in to subscribe</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
