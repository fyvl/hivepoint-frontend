import type { UsageSummaryItem } from "@/api/usage"
import { formatDate } from "@/lib/format"

export type UsageHealthNotice = {
    title: string
    description: string
    tone: "warning" | "danger"
}

export type UsagePageAlert = {
    title: string
    description: string
    tone: "warning" | "danger"
    actionLabel: string
    actionTo: string
}

export const clampPercent = (value: number) => {
    if (!Number.isFinite(value)) {
        return 0
    }
    return Math.min(100, Math.max(0, value))
}

export const resolvePercent = (item: UsageSummaryItem) => {
    if (Number.isFinite(item.percent)) {
        return clampPercent(item.percent)
    }
    if (item.quotaRequests > 0) {
        return clampPercent((item.usedRequests / item.quotaRequests) * 100)
    }
    return 0
}

export const getUsageHealthNotice = (item: UsageSummaryItem): UsageHealthNotice | null => {
    if (item.status !== "PAST_DUE") {
        return null
    }

    if (item.gracePeriodEndsAt) {
        return {
            title: "Billing grace period active",
            description: `Renewal billing is past due, but access remains available through ${formatDate(item.gracePeriodEndsAt)}.`,
            tone: "warning"
        }
    }

    return {
        title: "Billing past due",
        description: "Renewal billing is past due and access may stop until payment is resolved.",
        tone: "danger"
    }
}

export const getUsageSubscriptionLabel = (status?: UsageSummaryItem["status"]) => {
    return status === "PAST_DUE" ? "Past due" : "Active"
}

export const getUsageQuotaNotice = (item: UsageSummaryItem): UsagePageAlert | null => {
    const percent = resolvePercent(item)

    if (percent >= 100) {
        return {
            title: `Quota exceeded for ${item.product.title}`,
            description: `${item.usedRequests} of ${item.quotaRequests} requests have been consumed in the current billing period.`,
            tone: "danger",
            actionLabel: "Review billing",
            actionTo: "/billing"
        }
    }

    if (percent >= 80) {
        return {
            title: `Quota nearing limit for ${item.product.title}`,
            description: `${item.usedRequests} of ${item.quotaRequests} requests have been consumed before ${formatDate(item.periodEnd)}.`,
            tone: "warning",
            actionLabel: "Review usage",
            actionTo: "/usage"
        }
    }

    return null
}

export const getUsageAlerts = (items: UsageSummaryItem[]): UsagePageAlert[] => {
    const alerts: UsagePageAlert[] = []

    items.forEach((item) => {
        const quotaAlert = getUsageQuotaNotice(item)
        if (quotaAlert) {
            alerts.push(quotaAlert)
        }

        const healthNotice = getUsageHealthNotice(item)
        if (healthNotice) {
            alerts.push({
                ...healthNotice,
                actionLabel: "Open billing",
                actionTo: "/billing"
            })
        }
    })

    return alerts
}
