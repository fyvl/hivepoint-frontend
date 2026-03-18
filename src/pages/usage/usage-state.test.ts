import { describe, expect, it } from "vitest"

import type { UsageSummaryItem } from "@/api/usage"
import {
    getUsageAlerts,
    getUsageHealthNotice,
    getUsageQuotaNotice,
    getUsageSubscriptionLabel,
    resolvePercent
} from "@/pages/usage/usage-state"
import { formatDate } from "@/lib/format"

const createUsageItem = (overrides: Partial<UsageSummaryItem> = {}): UsageSummaryItem => {
    return {
        subscriptionId: "sub-1",
        status: "ACTIVE",
        periodStart: "2026-03-01T00:00:00.000Z",
        periodEnd: "2026-04-01T00:00:00.000Z",
        gracePeriodEndsAt: null,
        usedRequests: 100,
        quotaRequests: 1000,
        percent: 10,
        plan: {
            id: "plan-1",
            name: "Starter",
            quotaRequests: 1000,
            rateLimitRpm: 120
        },
        product: {
            id: "prod-1",
            title: "Payments API"
        },
        ...overrides
    } as UsageSummaryItem
}

describe("usage-state", () => {
    it("calculates percent from raw usage when the provided percent is invalid", () => {
        const item = createUsageItem({
            percent: Number.NaN,
            usedRequests: 250,
            quotaRequests: 1000
        })

        expect(resolvePercent(item)).toBe(25)
    })

    it("builds a grace-period notice for past due subscriptions", () => {
        const item = createUsageItem({
            status: "PAST_DUE",
            gracePeriodEndsAt: "2026-03-18T00:00:00.000Z"
        })

        const notice = getUsageHealthNotice(item)

        expect(notice).toMatchObject({
            title: "Billing grace period active",
            tone: "warning"
        })
        expect(notice?.description).toContain(formatDate("2026-03-18T00:00:00.000Z"))
    })

    it("labels past due subscriptions clearly", () => {
        expect(getUsageSubscriptionLabel("PAST_DUE")).toBe("Past due")
        expect(getUsageSubscriptionLabel("ACTIVE")).toBe("Active")
    })

    it("builds a quota warning notice at 80 percent", () => {
        const item = createUsageItem({
            usedRequests: 800,
            quotaRequests: 1000,
            percent: 80
        })

        expect(getUsageQuotaNotice(item)).toMatchObject({
            title: "Quota nearing limit for Payments API",
            tone: "warning"
        })
    })

    it("collects quota and billing alerts for page-level rendering", () => {
        const alerts = getUsageAlerts([
            createUsageItem({
                usedRequests: 1200,
                quotaRequests: 1000,
                percent: 100
            }),
            createUsageItem({
                subscriptionId: "sub-2",
                status: "PAST_DUE",
                gracePeriodEndsAt: "2026-03-18T00:00:00.000Z"
            })
        ])

        expect(alerts).toHaveLength(2)
        expect(alerts[0]).toMatchObject({
            tone: "danger"
        })
        expect(alerts[1]).toMatchObject({
            actionTo: "/billing"
        })
    })
})
