import type { UsageSummaryItem } from "@/api/usage"
import { formatDate } from "@/lib/format"

export type UsageHealthNotice = {
    title: string
    description: string
    tone: "warning" | "danger"
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
