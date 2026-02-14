import { useEffect, useMemo, useState } from "react"

import {
    createUsageApi,
    ingestUsageRecord,
    type UsageRecordBody,
    type UsageSummaryItem
} from "@/api/usage"
import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { UsageSkeleton } from "@/components/skeletons/usage-skeleton"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { EmptyBlock } from "@/components/ui-states/empty-block"
import { ErrorBlock } from "@/components/ui-states/error-block"
import { notifyError, notifyInfo, notifySuccess } from "@/lib/notify"
import { formatDate, formatNumber } from "@/lib/format"

const clampPercent = (value: number) => {
    if (!Number.isFinite(value)) {
        return 0
    }
    return Math.min(100, Math.max(0, value))
}

const resolvePercent = (item: UsageSummaryItem) => {
    if (Number.isFinite(item.percent)) {
        return clampPercent(item.percent)
    }
    if (item.quotaRequests > 0) {
        return clampPercent((item.usedRequests / item.quotaRequests) * 100)
    }
    return 0
}

export const UsagePage = () => {
    const { accessToken, refresh } = useAuth()
    const usageApi = useMemo(
        () => createUsageApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [items, setItems] = useState<UsageSummaryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)
    const [selectedId, setSelectedId] = useState("all")
    const [devSubscriptionId, setDevSubscriptionId] = useState("")
    const [devEndpoint, setDevEndpoint] = useState("")
    const [devRequestCount, setDevRequestCount] = useState("1")
    const [devSecret, setDevSecret] = useState("")
    const [isIngesting, setIsIngesting] = useState(false)
    const [retryKey, setRetryKey] = useState(0)

    const loadSummary = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await usageApi.getSummary()
            setItems(response.items)
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            setError(apiError)
            setItems([])
            notifyError(apiError ?? err, "Usage error")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadSummary()
    }, [usageApi, retryKey])

    useEffect(() => {
        if (items.length > 0 && !devSubscriptionId) {
            setDevSubscriptionId(items[0].subscriptionId)
        }
    }, [items, devSubscriptionId])

    useEffect(() => {
        if (selectedId !== "all" && !items.some((item) => item.subscriptionId === selectedId)) {
            setSelectedId("all")
        }
    }, [items, selectedId])

    const filteredItems = selectedId === "all"
        ? items
        : items.filter((item) => item.subscriptionId === selectedId)

    const handleIngest = async () => {
        if (!import.meta.env.DEV) {
            return
        }

        if (!devSubscriptionId) {
            notifyInfo("Missing subscription", "Select a subscription before sending usage.")
            return
        }

        const endpoint = devEndpoint.trim()
        if (!endpoint) {
            notifyInfo("Endpoint required", "Provide an endpoint label to ingest usage.")
            return
        }

        const requestCount = Number(devRequestCount)
        if (!Number.isFinite(requestCount) || requestCount <= 0) {
            notifyInfo("Invalid request count", "Request count must be a positive number.")
            return
        }

        const secret = devSecret.trim()
        if (!secret) {
            notifyInfo("Secret required", "Enter the usage ingest secret to continue.")
            return
        }

        const payload: UsageRecordBody = {
            subscriptionId: devSubscriptionId,
            endpoint,
            requestCount
        }

        setIsIngesting(true)
        try {
            await ingestUsageRecord(payload, secret)
            notifySuccess("Usage record added", "Usage ingestion succeeded.")
            await loadSummary()
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            notifyError(apiError ?? err, "Usage ingest failed")
        } finally {
            setIsIngesting(false)
        }
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>
                    <p className="text-muted-foreground">
                        Track API usage for the current billing period
                    </p>
                </div>
                {items.length > 1 ? (
                    <div className="w-full max-w-xs space-y-1">
                        <Label htmlFor="usage-filter">Filter</Label>
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger id="usage-filter">
                                <SelectValue placeholder="All subscriptions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All subscriptions</SelectItem>
                                {items.map((item) => (
                                    <SelectItem key={item.subscriptionId} value={item.subscriptionId}>
                                        {item.product.title} - {item.plan.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : null}
            </div>

            {isLoading ? <UsageSkeleton /> : null}

            {error && !isLoading ? (
                <ErrorBlock
                    title="Usage unavailable"
                    description={error.message || "Unable to fetch usage summary."}
                    code={error.code}
                    onRetry={() => setRetryKey((prev) => prev + 1)}
                />
            ) : null}

            {!isLoading && filteredItems.length === 0 && !error ? (
                <EmptyBlock
                    title="No usage data"
                    description="No active subscriptions were found for this account."
                    actionLabel="Browse catalog"
                    actionTo="/catalog"
                />
            ) : null}

            {!isLoading && filteredItems.length > 0 ? (
                <div className="grid gap-4">
                    {filteredItems.map((item) => (
                        <UsageCard key={item.subscriptionId} item={item} />
                    ))}
                </div>
            ) : null}

            {import.meta.env.DEV ? (
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <CardTitle>DEV tools</CardTitle>
                                <CardDescription>
                                    Ingest test usage records using the x-usage-secret header.
                                </CardDescription>
                            </div>
                            <Badge variant="destructive">DEV ONLY</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1 md:col-span-2">
                            <Label htmlFor="usage-subscription">Subscription</Label>
                            <Select
                                value={devSubscriptionId}
                                onValueChange={setDevSubscriptionId}
                            >
                                <SelectTrigger id="usage-subscription" disabled={items.length === 0}>
                                    <SelectValue placeholder="Select subscription" />
                                </SelectTrigger>
                                <SelectContent>
                                    {items.map((item) => (
                                        <SelectItem key={item.subscriptionId} value={item.subscriptionId}>
                                            {item.product.title} - {item.plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {items.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    No subscriptions available for usage ingestion.
                                </p>
                            ) : null}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="usage-endpoint">Endpoint label</Label>
                            <Input
                                id="usage-endpoint"
                                placeholder="Endpoint label"
                                value={devEndpoint}
                                onChange={(event) => setDevEndpoint(event.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="usage-count">Request count</Label>
                            <Input
                                id="usage-count"
                                type="number"
                                min={1}
                                value={devRequestCount}
                                onChange={(event) => setDevRequestCount(event.target.value)}
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <Label htmlFor="usage-secret">Usage ingest secret</Label>
                            <Input
                                id="usage-secret"
                                type="password"
                                value={devSecret}
                                onChange={(event) => setDevSecret(event.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button
                            type="button"
                            onClick={handleIngest}
                            disabled={isIngesting || items.length === 0}
                        >
                            {isIngesting ? "Sending..." : "Send usage record"}
                        </Button>
                    </CardFooter>
                </Card>
            ) : null}
        </div>
    )
}

type UsageCardProps = {
    item: UsageSummaryItem
}

const UsageCard = ({ item }: UsageCardProps) => {
    const percent = resolvePercent(item)
    const quotaExceeded = percent >= 100
    const usageStatus = quotaExceeded ? "Exceeded" : percent >= 80 ? "Near limit" : "OK"

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle>{item.product.title}</CardTitle>
                        <CardDescription>{item.plan.name}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge kind="usage" value={usageStatus} />
                        <Badge variant="outline">{`${Math.round(percent)}%`}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                        <div className="text-xs uppercase">Usage</div>
                        <div>
                            {formatNumber(item.usedRequests)} / {formatNumber(item.quotaRequests)} requests
                        </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase">Plan quota</div>
                        <div>{formatNumber(item.plan.quotaRequests)} requests</div>
                    </div>
                    <div className="sm:col-span-2">
                        <div className="text-xs uppercase">Period</div>
                        <div>
                            {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}
                        </div>
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Usage</span>
                        <span>{Math.round(percent)}%</span>
                    </div>
                    <Progress value={percent} />
                    {quotaExceeded ? (
                        <p className="text-xs text-destructive">Quota exceeded</p>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    )
}



