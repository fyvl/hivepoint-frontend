import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    EyeOff,
    KeyRound,
    RefreshCw,
    ScrollText,
    ShieldCheck,
    Siren,
    SquareTerminal
} from "lucide-react"

import {
    createAdminApi,
    type AuditLogItem,
    type OperationalAlert,
    type OperationalAlertDeliveryStatus,
    type OperationalMetricsHistoryStatus,
    type OperationalMetricsSnapshot
} from "@/api/admin"
import {
    createCatalogApi,
    type CatalogProduct,
    type CatalogVersion,
    type ListProductsResponse
} from "@/api/catalog"
import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { CopyButton } from "@/components/copy-button"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyBlock } from "@/components/ui-states/empty-block"
import { ErrorBlock } from "@/components/ui-states/error-block"
import { LoadingBlock } from "@/components/ui-states/loading-block"
import { formatDate, formatNumber } from "@/lib/format"
import { notifyError, notifyInfo, notifySuccess } from "@/lib/notify"
import { cn } from "@/lib/utils"

const AUDIT_LOG_LIMIT = 50
const MANAGED_PRODUCTS_LIMIT = 100

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

    return value.filter((item): item is string => typeof item === "string")
}

const getProductId = (product: CatalogProduct) => {
    const record = isRecord(product) ? product : null
    return getString(record, "id") ?? null
}

const getVersionId = (version: CatalogVersion) => {
    const record = isRecord(version) ? version : null
    return getString(record, "id") ?? null
}

const extractProducts = (payload: ListProductsResponse): CatalogProduct[] => {
    if (Array.isArray(payload)) {
        return payload
    }

    if (!isRecord(payload)) {
        return []
    }

    return Array.isArray(payload.items) ? payload.items : []
}

const extractVersions = (payload: unknown): CatalogVersion[] => {
    if (Array.isArray(payload)) {
        return payload
    }

    if (!isRecord(payload)) {
        return []
    }

    return Array.isArray(payload.items) ? payload.items : []
}

const formatDateTime = (value: string | null) => {
    if (!value) {
        return "-"
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString()
}

const formatAuditDetails = (value: unknown) => {
    if (value === null || value === undefined) {
        return null
    }

    if (typeof value === "string") {
        return value
    }

    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return String(value)
    }
}

const getAlertSeverityVariant = (severity: OperationalAlert["severity"]) => {
    return severity === "DANGER" ? "destructive" : "warning"
}

const getAlertSeverityLabel = (severity: OperationalAlert["severity"]) => {
    return severity === "DANGER" ? "Danger" : "Warning"
}

const getActorLabel = (item: AuditLogItem) => {
    if (item.actorEmail) {
        return item.actorEmail
    }

    if (item.actorUserId) {
        return item.actorUserId
    }

    return "System"
}

const updateItemStatus = <T,>(items: T[], getId: (item: T) => string | null, status: string, targetId: string) => {
    return items.map((item) => {
        if (getId(item) !== targetId || !isRecord(item)) {
            return item
        }

        return {
            ...item,
            status
        } as T
    })
}

export const AdminOpsPage = () => {
    const { accessToken, refresh } = useAuth()
    const adminApi = useMemo(() => createAdminApi({ accessToken, refresh }), [accessToken, refresh])
    const catalogApi = useMemo(() => createCatalogApi({ accessToken, refresh }), [accessToken, refresh])

    const [alerts, setAlerts] = useState<OperationalAlert[]>([])
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
    const [metricsSnapshot, setMetricsSnapshot] = useState<OperationalMetricsSnapshot | null>(null)
    const [alertDeliveryStatus, setAlertDeliveryStatus] = useState<OperationalAlertDeliveryStatus | null>(null)
    const [metricsHistory, setMetricsHistory] = useState<OperationalMetricsHistoryStatus | null>(null)
    const [products, setProducts] = useState<CatalogProduct[]>([])
    const [versions, setVersions] = useState<CatalogVersion[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [apiKeyId, setApiKeyId] = useState("")

    const [isOpsLoading, setIsOpsLoading] = useState(true)
    const [isProductsLoading, setIsProductsLoading] = useState(true)
    const [isVersionsLoading, setIsVersionsLoading] = useState(false)
    const [isRefreshingAll, setIsRefreshingAll] = useState(false)
    const [isHidingProduct, setIsHidingProduct] = useState(false)
    const [hidingVersionId, setHidingVersionId] = useState<string | null>(null)
    const [isRevokingKey, setIsRevokingKey] = useState(false)

    const [opsError, setOpsError] = useState<ApiError | null>(null)
    const [productsError, setProductsError] = useState<ApiError | null>(null)
    const [versionsError, setVersionsError] = useState<ApiError | null>(null)

    const versionRequestIdRef = useRef(0)

    const loadOpsData = useCallback(async () => {
        setIsOpsLoading(true)
        setOpsError(null)
        try {
            const [dashboardResponse, auditLogsResponse] = await Promise.all([
                adminApi.getOperationalDashboard(),
                adminApi.listAuditLogs(AUDIT_LOG_LIMIT)
            ])
            setMetricsSnapshot(dashboardResponse.snapshot ?? null)
            setAlerts(dashboardResponse.alerts ?? [])
            setAlertDeliveryStatus(dashboardResponse.alertDelivery ?? null)
            setMetricsHistory(dashboardResponse.metricsHistory ?? null)
            setAuditLogs(auditLogsResponse.items ?? [])
        } catch (error) {
            const apiError = error instanceof ApiError ? error : null
            setOpsError(apiError)
            setMetricsSnapshot(null)
            setAlerts([])
            setAlertDeliveryStatus(null)
            setMetricsHistory(null)
            setAuditLogs([])
            notifyError(apiError ?? error, "Could not load admin operations data")
        } finally {
            setIsOpsLoading(false)
        }
    }, [adminApi])

    const loadProducts = useCallback(async () => {
        setIsProductsLoading(true)
        setProductsError(null)
        try {
            const response = await catalogApi.listMyProducts({
                limit: MANAGED_PRODUCTS_LIMIT,
                offset: 0
            })
            const items = extractProducts(response)
            setProducts(items)
            setSelectedProductId((currentSelectedProductId) => {
                const hasCurrentSelection = items.some(
                    (item) => getProductId(item) === currentSelectedProductId
                )

                if (currentSelectedProductId && hasCurrentSelection) {
                    return currentSelectedProductId
                }

                return items.map((item) => getProductId(item)).find(Boolean) ?? null
            })
        } catch (error) {
            const apiError = error instanceof ApiError ? error : null
            setProductsError(apiError)
            setProducts([])
            notifyError(apiError ?? error, "Could not load managed products")
        } finally {
            setIsProductsLoading(false)
        }
    }, [catalogApi])

    const loadSelectedVersions = useCallback(async (productId: string) => {
        const requestId = versionRequestIdRef.current + 1
        versionRequestIdRef.current = requestId
        setIsVersionsLoading(true)
        setVersionsError(null)

        try {
            const response = await catalogApi.getVersions(productId)
            if (versionRequestIdRef.current !== requestId) {
                return
            }

            setVersions(extractVersions(response))
        } catch (error) {
            if (versionRequestIdRef.current !== requestId) {
                return
            }

            const apiError = error instanceof ApiError ? error : null
            setVersionsError(apiError)
            setVersions([])
            notifyError(apiError ?? error, "Could not load product versions")
        } finally {
            if (versionRequestIdRef.current === requestId) {
                setIsVersionsLoading(false)
            }
        }
    }, [catalogApi])

    const refreshAll = useCallback(async () => {
        setIsRefreshingAll(true)
        try {
            await Promise.all([loadOpsData(), loadProducts()])
        } finally {
            setIsRefreshingAll(false)
        }
    }, [loadOpsData, loadProducts])

    useEffect(() => {
        void refreshAll()
    }, [refreshAll])

    useEffect(() => {
        if (!selectedProductId) {
            versionRequestIdRef.current += 1
            setVersions([])
            setVersionsError(null)
            setIsVersionsLoading(false)
            return
        }

        void loadSelectedVersions(selectedProductId)
    }, [loadSelectedVersions, selectedProductId])

    const handleHideProduct = async () => {
        if (!selectedProductId) {
            notifyInfo("Select a product", "Choose a product before hiding it.")
            return
        }

        setIsHidingProduct(true)
        try {
            await adminApi.hideProduct(selectedProductId)
            setProducts((currentProducts) =>
                updateItemStatus(currentProducts, getProductId, "HIDDEN", selectedProductId)
            )
            await loadOpsData()
            notifySuccess("Product hidden", "The product is now hidden from buyers.")
        } catch (error) {
            notifyError(error, "Hide product failed")
        } finally {
            setIsHidingProduct(false)
        }
    }

    const handleHideVersion = async (versionId: string | null) => {
        if (!versionId) {
            notifyInfo("Missing version ID", "Reload the page and try again.")
            return
        }

        setHidingVersionId(versionId)
        try {
            await adminApi.hideVersion(versionId)
            setVersions((currentVersions) =>
                updateItemStatus(currentVersions, getVersionId, "DRAFT", versionId)
            )
            await loadOpsData()
            notifySuccess("Version set to draft", "The version is no longer publicly published.")
        } catch (error) {
            notifyError(error, "Hide version failed")
        } finally {
            setHidingVersionId(null)
        }
    }

    const handleRevokeKey = async () => {
        const trimmedKeyId = apiKeyId.trim()
        if (!trimmedKeyId) {
            notifyInfo("Missing key ID", "Provide a key ID before revoking it.")
            return
        }

        setIsRevokingKey(true)
        try {
            await adminApi.revokeKey(trimmedKeyId)
            setApiKeyId("")
            await loadOpsData()
            notifySuccess("Key revoked", "The API key has been revoked.")
        } catch (error) {
            notifyError(error, "Revoke key failed")
        } finally {
            setIsRevokingKey(false)
        }
    }

    const selectedProduct = useMemo(() => {
        return products.find((product) => getProductId(product) === selectedProductId) ?? null
    }, [products, selectedProductId])

    const selectedProductRecord = isRecord(selectedProduct) ? selectedProduct : null
    const selectedProductStatus = getString(selectedProductRecord, "status") ?? "UNKNOWN"
    const selectedProductOwnerId = getString(selectedProductRecord, "ownerId") ?? "-"
    const selectedProductTitle = getString(selectedProductRecord, "title") ?? "Selected product"
    const selectedProductDescription = getString(selectedProductRecord, "description") ?? "No description"
    const selectedProductCategory = getString(selectedProductRecord, "category") ?? "-"
    const selectedProductTags = getStringArray(selectedProductRecord, "tags")

    const productStatusCounts = useMemo(() => {
        return products.reduce(
            (accumulator, product) => {
                const record = isRecord(product) ? product : null
                const status = getString(record, "status")

                if (status === "PUBLISHED") {
                    accumulator.published += 1
                } else if (status === "HIDDEN") {
                    accumulator.hidden += 1
                } else {
                    accumulator.draft += 1
                }

                return accumulator
            },
            {
                published: 0,
                hidden: 0,
                draft: 0
            }
        )
    }, [products])

    const dangerAlertsCount = useMemo(() => {
        return alerts.filter((alert) => alert.severity === "DANGER").length
    }, [alerts])

    const overviewAuditLogs = auditLogs.slice(0, 5)
    const recentDeliveryStates = alertDeliveryStatus?.items.slice(0, 3) ?? []
    const recentTargetDeliveryStates = alertDeliveryStatus?.targetItems.slice(0, 3) ?? []
    const deliveryTargetHosts = alertDeliveryStatus?.targets.map((target) => target.host).join(", ") ?? ""
    const latestHistoryPoint = metricsHistory?.items.at(-1) ?? null

    return (
        <div className="flex flex-col gap-8">
            <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-8 text-white shadow-2xl">
                <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-sky-400/15 blur-3xl" />
                <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Admin Ops
                        </p>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                                Monitor platform health and moderate live catalog state
                            </h1>
                            <p className="max-w-3xl text-sm text-white/80 md:text-base">
                                Review operational alerts, audit trail, and admin moderation actions from one workspace.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <StatChip label="Open alerts" value={String(alerts.length)} />
                            <StatChip label="Danger alerts" value={String(dangerAlertsCount)} />
                            <StatChip label="Managed products" value={String(products.length)} />
                            <StatChip label="Recent audit events" value={String(auditLogs.length)} />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                            onClick={() => void refreshAll()}
                            disabled={isRefreshingAll}
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshingAll && "animate-spin")} />
                            Refresh workspace
                        </Button>
                    </div>
                </div>
            </section>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-muted/70 p-2 md:grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                    <TabsTrigger value="moderation">Moderation</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <Card>
                            <CardHeader>
                                <CardTitle>Operational status</CardTitle>
                                <CardDescription>
                                    Current alert pressure across queue workers, billing leases, and subscription state.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isOpsLoading ? (
                                    <LoadingBlock title="Loading operational status..." count={2} variant="lines" />
                                ) : opsError ? (
                                    <ErrorBlock
                                        title="Operational status unavailable"
                                        description={opsError.message || "Please retry."}
                                        code={opsError.code}
                                        onRetry={() => void loadOpsData()}
                                    />
                                ) : alerts.length === 0 ? (
                                    <EmptyBlock
                                        title="No operational alerts"
                                        description="The current monitoring rules are not reporting warnings or danger signals."
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            {alerts.slice(0, 3).map((alert) => (
                                                <AlertCard key={alert.kind} alert={alert} compact />
                                            ))}
                                        </div>
                                        {metricsSnapshot ? (
                                            <div className="grid gap-3 sm:grid-cols-4">
                                                <OverviewStat
                                                    label="Queue pending"
                                                    value={formatNumber(metricsSnapshot.usageIngestPendingJobs)}
                                                    tone="secondary"
                                                />
                                                <OverviewStat
                                                    label="Queue failed"
                                                    value={formatNumber(metricsSnapshot.usageIngestFailedJobs)}
                                                    tone={metricsSnapshot.usageIngestFailedJobs > 0 ? "warning" : "default"}
                                                />
                                                <OverviewStat
                                                    label="Past due"
                                                    value={formatNumber(metricsSnapshot.subscriptionsPastDue)}
                                                    tone={metricsSnapshot.subscriptionsPastDue > 0 ? "warning" : "default"}
                                                />
                                                <OverviewStat
                                                    label="Overage worker"
                                                    value={metricsSnapshot.billingOverageCollectionLeasePresent ? "Lease ok" : "Missing"}
                                                    tone={metricsSnapshot.billingOverageCollectionLeasePresent ? "default" : "warning"}
                                                />
                                            </div>
                                        ) : null}
                                        {metricsHistory ? (
                                            <div className="rounded-xl border bg-muted/30 p-4">
                                                <p className="text-sm font-medium">
                                                    Metrics history points: {formatNumber(metricsHistory.items.length)}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {metricsHistory.enabled
                                                        ? `Captured every ${formatNumber(metricsHistory.intervalSeconds)}s and retained for ${formatNumber(metricsHistory.retentionDays)} day(s).`
                                                        : "Persistent metrics history is disabled."}
                                                </p>
                                                {latestHistoryPoint ? (
                                                    <p className="mt-2 text-xs text-muted-foreground">
                                                        Latest capture: {formatDateTime(latestHistoryPoint.capturedAt)}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Managed catalog</CardTitle>
                                <CardDescription>
                                    Current moderation surface visible from the catalog management endpoints.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isProductsLoading ? (
                                    <LoadingBlock title="Loading managed products..." count={3} variant="lines" />
                                ) : productsError ? (
                                    <ErrorBlock
                                        title="Managed catalog unavailable"
                                        description={productsError.message || "Please retry."}
                                        code={productsError.code}
                                        onRetry={() => void loadProducts()}
                                    />
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <OverviewStat
                                            label="Published"
                                            value={formatNumber(productStatusCounts.published)}
                                            tone="default"
                                        />
                                        <OverviewStat
                                            label="Draft"
                                            value={formatNumber(productStatusCounts.draft)}
                                            tone="secondary"
                                        />
                                        <OverviewStat
                                            label="Hidden"
                                            value={formatNumber(productStatusCounts.hidden)}
                                            tone="warning"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                        <Card>
                            <CardHeader>
                                <CardTitle>Latest audit events</CardTitle>
                                <CardDescription>
                                    Most recent admin actions recorded by the backend audit log.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isOpsLoading ? (
                                    <LoadingBlock title="Loading audit trail..." count={4} variant="lines" />
                                ) : opsError ? (
                                    <ErrorBlock
                                        title="Audit trail unavailable"
                                        description={opsError.message || "Please retry."}
                                        code={opsError.code}
                                        onRetry={() => void loadOpsData()}
                                    />
                                ) : overviewAuditLogs.length === 0 ? (
                                    <EmptyBlock
                                        title="No audit entries yet"
                                        description="Admin actions will appear here after the first moderation event."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {overviewAuditLogs.map((item) => (
                                            <AuditLogRow key={item.id} item={item} compact />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>External alert delivery</CardTitle>
                                <CardDescription>
                                    Webhook delivery status, cooldown policy, and the most recent tracked alert states.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isOpsLoading ? (
                                    <LoadingBlock title="Loading delivery status..." count={3} variant="lines" />
                                ) : alertDeliveryStatus ? (
                                    <>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <OverviewStat
                                                label="Delivery enabled"
                                                value={alertDeliveryStatus.enabled ? "Yes" : "No"}
                                                tone={alertDeliveryStatus.enabled ? "default" : "secondary"}
                                            />
                                            <OverviewStat
                                                label="Webhook configured"
                                                value={alertDeliveryStatus.webhookConfigured ? "Yes" : "No"}
                                                tone={alertDeliveryStatus.webhookConfigured ? "default" : "warning"}
                                            />
                                            <OverviewStat
                                                label="Targets"
                                                value={formatNumber(alertDeliveryStatus.configuredTargetCount)}
                                                tone={alertDeliveryStatus.configuredTargetCount > 1 ? "default" : "secondary"}
                                            />
                                        </div>
                                        <div className="rounded-xl border bg-muted/30 p-4">
                                            <p className="text-sm font-medium">
                                                Interval {formatNumber(alertDeliveryStatus.intervalSeconds)}s, cooldown {formatNumber(alertDeliveryStatus.cooldownSeconds)}s
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Active alerts are pushed to the configured webhook, with reminder sends after the cooldown window.
                                            </p>
                                            {deliveryTargetHosts ? (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    Targets: {deliveryTargetHosts}
                                                </p>
                                            ) : null}
                                        </div>
                                        {recentDeliveryStates.length > 0 ? (
                                            <div className="space-y-3">
                                                {recentDeliveryStates.map((item) => (
                                                    <DeliveryStateRow key={item.kind} item={item} />
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyBlock
                                                title="No delivery state yet"
                                                description="Tracked alert delivery state will appear after the first webhook cycle."
                                            />
                                        )}
                                        {recentTargetDeliveryStates.length > 0 ? (
                                            <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
                                                <p className="text-sm font-medium">Target fan-out</p>
                                                <div className="space-y-2">
                                                    {recentTargetDeliveryStates.map((item) => (
                                                        <div
                                                            key={`${item.alertKind}:${item.targetKey}`}
                                                            className="flex items-center justify-between gap-3 rounded-lg border bg-background/80 px-3 py-2"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-medium">{item.targetKey}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.alertKind}
                                                                </p>
                                                            </div>
                                                            <div className="text-right text-xs text-muted-foreground">
                                                                <p>Delivered {formatNumber(item.deliveryCount)}</p>
                                                                <p>Failures {formatNumber(item.deliveryFailures)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <EmptyBlock
                                        title="Delivery status unavailable"
                                        description="Refresh the workspace after the observability backend is reachable."
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="alerts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Operational alerts</CardTitle>
                            <CardDescription>
                                Prioritized warnings and danger states derived from queue backlog, leases, and billing health.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isOpsLoading ? (
                                <LoadingBlock title="Loading operational alerts..." count={3} />
                            ) : opsError ? (
                                <ErrorBlock
                                    title="Operational alerts unavailable"
                                    description={opsError.message || "Please retry."}
                                    code={opsError.code}
                                    onRetry={() => void loadOpsData()}
                                />
                            ) : alerts.length === 0 ? (
                                <EmptyBlock
                                    title="No active alerts"
                                    description="Nothing currently exceeds the configured warning thresholds."
                                    icon={Siren}
                                />
                            ) : (
                                <div className="grid gap-4">
                                    {alerts.map((alert) => (
                                        <AlertCard key={alert.kind} alert={alert} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audit">
                    <Card>
                        <CardHeader>
                            <CardTitle>Audit trail</CardTitle>
                            <CardDescription>
                                Recent admin actions with actor identity, request correlation, and serialized details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isOpsLoading ? (
                                <LoadingBlock title="Loading audit trail..." count={4} />
                            ) : opsError ? (
                                <ErrorBlock
                                    title="Audit trail unavailable"
                                    description={opsError.message || "Please retry."}
                                    code={opsError.code}
                                    onRetry={() => void loadOpsData()}
                                />
                            ) : auditLogs.length === 0 ? (
                                <EmptyBlock
                                    title="No audit entries"
                                    description="Run an admin action and its audit log entry will appear here."
                                    icon={ScrollText}
                                />
                            ) : (
                                <div className="grid gap-4">
                                    {auditLogs.map((item) => (
                                        <AuditLogRow key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="moderation" className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                        <Card>
                            <CardHeader>
                                <CardTitle>Managed products</CardTitle>
                                <CardDescription>
                                    Admin users can review all managed products and select one for moderation.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isProductsLoading ? (
                                    <LoadingBlock title="Loading managed products..." count={4} />
                                ) : productsError ? (
                                    <ErrorBlock
                                        title="Managed products unavailable"
                                        description={productsError.message || "Please retry."}
                                        code={productsError.code}
                                        onRetry={() => void loadProducts()}
                                    />
                                ) : products.length === 0 ? (
                                    <EmptyBlock
                                        title="No managed products"
                                        description="There are no products available through the managed catalog endpoint."
                                        icon={SquareTerminal}
                                    />
                                ) : (
                                    <div className="grid gap-3">
                                        {products.map((product, index) => {
                                            const record = isRecord(product) ? product : null
                                            const productId = getProductId(product)
                                            const title = getString(record, "title") ?? `Product ${index + 1}`
                                            const description = getString(record, "description") ?? "No description"
                                            const status = getString(record, "status")
                                            const isSelected = productId !== null && productId === selectedProductId

                                            return (
                                                <button
                                                    key={productId ?? `product-${index}`}
                                                    type="button"
                                                    className={cn(
                                                        "rounded-xl border p-4 text-left transition-all",
                                                        "hover:border-primary/40 hover:bg-muted/30",
                                                        isSelected && "border-primary bg-primary/5"
                                                    )}
                                                    onClick={() => setSelectedProductId(productId)}
                                                >
                                                    <div className="mb-2 flex items-start justify-between gap-3">
                                                        <p className="font-medium">{title}</p>
                                                        {status ? (
                                                            <StatusBadge kind="product" value={status} />
                                                        ) : null}
                                                    </div>
                                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                                        {description}
                                                    </p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Selected product</CardTitle>
                                    <CardDescription>
                                        Review current metadata and apply moderation to the selected product.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!selectedProduct ? (
                                        <EmptyBlock
                                            title="No product selected"
                                            description="Choose a managed product from the list to inspect it."
                                        />
                                    ) : (
                                        <div className="space-y-5">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-lg font-semibold">{selectedProductTitle}</p>
                                                    <p className="max-w-2xl text-sm text-muted-foreground">
                                                        {selectedProductDescription}
                                                    </p>
                                                </div>
                                                <StatusBadge kind="product" value={selectedProductStatus} />
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <MetadataRow label="Product ID" value={selectedProductId ?? "-"} />
                                                <MetadataRow label="Owner ID" value={selectedProductOwnerId} />
                                                <MetadataRow label="Category" value={selectedProductCategory} />
                                                <MetadataRow
                                                    label="Created"
                                                    value={formatDate(getString(selectedProductRecord, "createdAt") ?? null)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Tags
                                                </p>
                                                {selectedProductTags.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedProductTags.map((tag) => (
                                                            <Badge key={tag} variant="outline">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">No tags assigned.</p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() => void handleHideProduct()}
                                                    disabled={isHidingProduct || selectedProductStatus === "HIDDEN"}
                                                >
                                                    <EyeOff className="h-4 w-4" />
                                                    {selectedProductStatus === "HIDDEN"
                                                        ? "Already hidden"
                                                        : isHidingProduct
                                                            ? "Hiding..."
                                                            : "Hide product"}
                                                </Button>
                                                {selectedProductId ? (
                                                    <CopyButton value={selectedProductId} label="Copy product ID" />
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Selected product versions</CardTitle>
                                    <CardDescription>
                                        Hide actions on versions are implemented as rollback to draft.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!selectedProduct ? (
                                        <EmptyBlock
                                            title="Select a product first"
                                            description="Version moderation appears after you choose a product."
                                        />
                                    ) : isVersionsLoading ? (
                                        <LoadingBlock title="Loading versions..." count={3} />
                                    ) : versionsError ? (
                                        <ErrorBlock
                                            title="Versions unavailable"
                                            description={versionsError.message || "Please retry."}
                                            code={versionsError.code}
                                            onRetry={() => selectedProductId ? void loadSelectedVersions(selectedProductId) : undefined}
                                        />
                                    ) : versions.length === 0 ? (
                                        <EmptyBlock
                                            title="No versions for this product"
                                            description="Create a version in Seller Studio before using version moderation."
                                        />
                                    ) : (
                                        <div className="grid gap-3">
                                            {versions.map((version, index) => {
                                                const record = isRecord(version) ? version : null
                                                const versionId = getVersionId(version)
                                                const versionLabel = getString(record, "version") ?? `Version ${index + 1}`
                                                const versionStatus = getString(record, "status") ?? "UNKNOWN"
                                                const openApiUrl = getString(record, "openApiUrl") ?? "-"
                                                const createdAt = getString(record, "createdAt") ?? null

                                                return (
                                                    <div key={versionId ?? `${versionLabel}-${index}`} className="rounded-xl border p-4">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div className="space-y-1">
                                                                <p className="font-medium">{versionLabel}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {openApiUrl}
                                                                </p>
                                                            </div>
                                                            <StatusBadge kind="version" value={versionStatus} />
                                                        </div>

                                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                            <MetadataRow label="Version ID" value={versionId ?? "-"} />
                                                            <MetadataRow label="Created" value={formatDateTime(createdAt)} />
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap gap-3">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={!versionId || hidingVersionId === versionId}
                                                                onClick={() => void handleHideVersion(versionId)}
                                                            >
                                                                <EyeOff className="h-4 w-4" />
                                                                {hidingVersionId === versionId ? "Updating..." : "Set draft"}
                                                            </Button>
                                                            {versionId ? (
                                                                <CopyButton value={versionId} label="Copy version ID" />
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Direct API key revoke</CardTitle>
                                    <CardDescription>
                                        The backend currently exposes revoke-by-ID only. Paste a key ID from support or abuse workflows.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="admin-key-id">API key ID</Label>
                                        <Input
                                            id="admin-key-id"
                                            placeholder="key_123..."
                                            value={apiKeyId}
                                            onChange={(event) => setApiKeyId(event.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => void handleRevokeKey()}
                                        disabled={isRevokingKey}
                                    >
                                        <KeyRound className="h-4 w-4" />
                                        {isRevokingKey ? "Revoking..." : "Revoke API key"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

const StatChip = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-wide text-white/60">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
        </div>
    )
}

const OverviewStat = ({
    label,
    value,
    tone
}: {
    label: string
    value: string
    tone: "default" | "secondary" | "warning"
}) => {
    const toneClassName =
        tone === "warning"
            ? "border-amber-500/20 bg-amber-500/5"
            : tone === "secondary"
                ? "border-border bg-muted/40"
                : "border-emerald-500/20 bg-emerald-500/5"

    return (
        <div className={cn("rounded-xl border p-4", toneClassName)}>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
    )
}

const AlertCard = ({ alert, compact = false }: { alert: OperationalAlert; compact?: boolean }) => {
    return (
        <div className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
                <Badge variant={getAlertSeverityVariant(alert.severity)}>
                    {getAlertSeverityLabel(alert.severity)}
                </Badge>
            </div>
            {!compact && alert.details && Object.keys(alert.details).length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(alert.details).map(([key, value]) => (
                        <Badge key={key} variant="outline">
                            {key}: {String(value)}
                        </Badge>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

const AuditLogRow = ({ item, compact = false }: { item: AuditLogItem; compact?: boolean }) => {
    const details = formatAuditDetails(item.details)
    const actorRoleSuffix = item.actorRole ? ` (${item.actorRole})` : ""

    return (
        <div className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{item.action}</Badge>
                        <Badge variant="outline">{item.resourceType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {getActorLabel(item)}{actorRoleSuffix} on {item.resourceId}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                </div>

                {item.requestId ? <CopyButton value={item.requestId} label="Copy request ID" /> : null}
            </div>

            {!compact && details ? (
                <div className="mt-4 rounded-lg bg-muted/40 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Details
                    </p>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                        {details}
                    </pre>
                </div>
            ) : null}
        </div>
    )
}

const DeliveryStateRow = ({
    item
}: {
    item: OperationalAlertDeliveryStatus["items"][number]
}) => {
    const statusLabel = item.resolvedAt ? "Resolved" : "Active"
    const statusVariant = item.resolvedAt ? "secondary" : item.lastDeliveryError ? "warning" : "default"

    return (
        <div className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                    <Badge variant="outline">{item.kind}</Badge>
                </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetadataRow label="Last observed" value={formatDateTime(item.lastObservedAt)} />
                <MetadataRow
                    label="Last delivered"
                    value={item.lastDeliveredAt ? formatDateTime(item.lastDeliveredAt) : "Not delivered yet"}
                />
            </div>
            {item.lastDeliveryError ? (
                <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                    Last delivery error: {item.lastDeliveryError}
                </p>
            ) : null}
        </div>
    )
}

const MetadataRow = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="rounded-xl border bg-muted/25 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 break-all text-sm font-medium">{value}</p>
        </div>
    )
}
