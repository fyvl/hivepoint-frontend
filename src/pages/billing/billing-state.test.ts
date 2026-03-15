import { describe, expect, it } from "vitest"

import type {
    BillingCheckoutStatusResponse,
    Subscription
} from "@/api/billing"
import {
    getCheckoutDescription,
    getSubscriptionNotice,
    hasRecoverablePortalAction,
    isCheckoutFailed
} from "@/pages/billing/billing-state"
import { formatDate } from "@/lib/format"

const createSubscription = (overrides: Partial<Subscription> = {}): Subscription => {
    return {
        id: "sub-1",
        status: "ACTIVE",
        currentPeriodStart: "2026-03-01T00:00:00.000Z",
        currentPeriodEnd: "2026-04-01T00:00:00.000Z",
        gracePeriodEndsAt: null,
        cancelAtPeriodEnd: false,
        paymentProvider: "STRIPE",
        hasExternalSubscription: true,
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-15T00:00:00.000Z",
        plan: {
            id: "plan-1",
            name: "Starter",
            priceCents: 4900,
            currency: "USD",
            quotaRequests: 1000,
            productId: "prod-1",
            rateLimitRpm: 120
        },
        product: {
            id: "prod-1",
            title: "Payments API"
        },
        latestInvoice: {
            id: "inv-1",
            status: "PAST_DUE",
            amountCents: 4900,
            currency: "USD",
            attemptCount: 2,
            nextPaymentAttemptAt: "2026-03-20T00:00:00.000Z",
            createdAt: "2026-03-15T00:00:00.000Z"
        },
        invoices: [],
        ...overrides
    } as Subscription
}

const createCheckoutStatus = (
    overrides: Partial<BillingCheckoutStatusResponse> = {}
): BillingCheckoutStatusResponse => {
    return {
        sessionId: "cs_123",
        invoiceId: "inv-1",
        invoiceStatus: "PAID",
        subscriptionId: "sub-1",
        subscriptionStatus: "ACTIVE",
        gracePeriodEndsAt: null,
        cancelAtPeriodEnd: false,
        paymentProvider: "STRIPE",
        productTitle: "Payments API",
        planName: "Starter",
        ...overrides
    }
}

describe("billing-state", () => {
    it("detects recoverable portal actions for Stripe subscriptions", () => {
        expect(hasRecoverablePortalAction(createSubscription())).toBe(true)
        expect(
            hasRecoverablePortalAction(
                createSubscription({
                    paymentProvider: "MOCK",
                    hasExternalSubscription: false
                })
            )
        ).toBe(false)
    })

    it("builds a past due notice with grace and retry details", () => {
        const subscription = createSubscription({
            status: "PAST_DUE",
            gracePeriodEndsAt: "2026-03-18T00:00:00.000Z"
        })

        const notice = getSubscriptionNotice(subscription)

        expect(notice).toMatchObject({
            title: "Payment action required",
            tone: "danger"
        })
        expect(notice?.description).toContain(formatDate("2026-03-18T00:00:00.000Z"))
        expect(notice?.description).toContain(formatDate("2026-03-20T00:00:00.000Z"))
    })

    it("treats past due invoice states as failed checkout results", () => {
        expect(
            isCheckoutFailed(
                createCheckoutStatus({
                    invoiceStatus: "PAST_DUE",
                    subscriptionStatus: "PAST_DUE"
                })
            )
        ).toBe(true)
    })

    it("describes grace-period checkout failures clearly", () => {
        const description = getCheckoutDescription(
            createCheckoutStatus({
                invoiceStatus: "PAST_DUE",
                subscriptionStatus: "PAST_DUE",
                gracePeriodEndsAt: "2026-03-18T00:00:00.000Z"
            }),
            true
        )

        expect(description).toContain(formatDate("2026-03-18T00:00:00.000Z"))
        expect(description).toContain("past due")
    })
})
