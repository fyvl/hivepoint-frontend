import { type HttpOptions, httpWithRetry } from "@/api/http"
import type { paths } from "@/api/generated/schema"

export type OperationalAlertSeverity = "WARNING" | "DANGER"

export type OperationalAlert = {
    kind: string
    severity: OperationalAlertSeverity
    title: string
    message: string
    details?: Record<string, string | number | boolean | null>
}

export type OperationalAlertsResponse = {
    items: OperationalAlert[]
}

export type OperationalMetricsSnapshot = {
    usageIngestPendingJobs: number
    usageIngestFailedJobs: number
    usageIngestOldestPendingAgeSeconds: number
    usageIngestLeasePresent: boolean
    usageIngestLeaseSecondsUntilExpiry: number
    billingReconciliationLeasePresent: boolean
    billingReconciliationLeaseSecondsUntilExpiry: number
    subscriptionsPastDue: number
    auditLogsLast24h: number
}

export type OperationalAlertDeliveryState = {
    kind: string
    severity: string
    title: string
    message: string
    details: unknown
    firstObservedAt: string
    lastObservedAt: string
    resolvedAt: string | null
    lastDeliveredAt: string | null
    lastDeliveryAttemptAt: string | null
    deliveryCount: number
    deliveryFailures: number
    lastDeliveryError: string | null
}

export type OperationalAlertDeliveryStatus = {
    enabled: boolean
    webhookConfigured: boolean
    intervalSeconds: number
    cooldownSeconds: number
    items: OperationalAlertDeliveryState[]
}

export type OperationalDashboardResponse = {
    snapshot: OperationalMetricsSnapshot
    alerts: OperationalAlert[]
    alertDelivery: OperationalAlertDeliveryStatus
}

export type AuditLogActorRole = "BUYER" | "SELLER" | "ADMIN" | null

export type AuditLogItem = {
    id: string
    requestId: string | null
    actorUserId: string | null
    actorEmail: string | null
    actorRole: AuditLogActorRole
    action: string
    resourceType: string
    resourceId: string
    details: unknown
    createdAt: string
}

export type ListAuditLogsResponse = {
    items: AuditLogItem[]
}

export type HideProductResponse =
    paths["/admin/products/{id}/hide"]["post"]["responses"][200]["content"]["application/json"]

export type HideVersionResponse =
    paths["/admin/versions/{id}/hide"]["post"]["responses"][200]["content"]["application/json"]

export type RevokeKeyResponse =
    paths["/admin/keys/{id}/revoke"]["post"]["responses"][200]["content"]["application/json"]

type AdminClient = {
    accessToken: string | null
    refresh: () => Promise<string | null>
}

type Requester = <T>(path: string, options?: HttpOptions) => Promise<T>

const createRequester = (client: AdminClient): Requester => {
    return async <T,>(path: string, options: HttpOptions = {}) => {
        return await httpWithRetry<T>(
            path,
            {
                ...options,
                accessToken: client.accessToken
            },
            client.refresh
        )
    }
}

export const createAdminApi = (client: AdminClient) => {
    const request = createRequester(client)

    return {
        getOperationalDashboard: async (): Promise<OperationalDashboardResponse> => {
            return await request<OperationalDashboardResponse>("/admin/ops/dashboard", {
                method: "GET"
            })
        },
        listOperationalAlerts: async (): Promise<OperationalAlertsResponse> => {
            return await request<OperationalAlertsResponse>("/admin/ops/alerts", {
                method: "GET"
            })
        },
        listAuditLogs: async (limit = 50): Promise<ListAuditLogsResponse> => {
            const normalizedLimit = Math.max(1, Math.min(Math.round(limit), 100))
            return await request<ListAuditLogsResponse>(`/admin/audit-logs?limit=${normalizedLimit}`, {
                method: "GET"
            })
        },
        hideProduct: async (productId: string): Promise<HideProductResponse> => {
            const encodedProductId = encodeURIComponent(productId)
            return await request<HideProductResponse>(`/admin/products/${encodedProductId}/hide`, {
                method: "POST"
            })
        },
        hideVersion: async (versionId: string): Promise<HideVersionResponse> => {
            const encodedVersionId = encodeURIComponent(versionId)
            return await request<HideVersionResponse>(`/admin/versions/${encodedVersionId}/hide`, {
                method: "POST"
            })
        },
        revokeKey: async (keyId: string): Promise<RevokeKeyResponse> => {
            const encodedKeyId = encodeURIComponent(keyId)
            return await request<RevokeKeyResponse>(`/admin/keys/${encodedKeyId}/revoke`, {
                method: "POST"
            })
        }
    }
}
