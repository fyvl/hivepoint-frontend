import type {
    BillingCheckoutStatusResponse,
    Subscription
} from "@/api/billing"
import { formatDate } from "@/lib/format"

export type SubscriptionNotice = {
    title: string
    description: string
    tone: "default" | "warning" | "danger"
}

export const hasRecoverablePortalAction = (subscription: Subscription) => {
    return subscription.paymentProvider === "STRIPE" && Boolean(subscription.hasExternalSubscription)
}

export const getSubscriptionNotice = (subscription: Subscription): SubscriptionNotice | null => {
    if (subscription.status === "PAST_DUE") {
        const gracePeriodDescription = subscription.gracePeriodEndsAt
            ? ` Access remains active through ${formatDate(subscription.gracePeriodEndsAt)} while billing is fixed.`
            : " Access is no longer extended by a grace period."
        const retryDescription = subscription.latestInvoice?.nextPaymentAttemptAt
            ? ` Stripe will retry payment on ${formatDate(subscription.latestInvoice.nextPaymentAttemptAt)}.`
            : ""

        if (hasRecoverablePortalAction(subscription)) {
            return {
                title: "Payment action required",
                description:
                    `A renewal payment failed.${gracePeriodDescription}${retryDescription} Update the payment method in the customer portal to restore normal billing.`,
                tone: "danger"
            }
        }

        return {
            title: "Checkout needs to be restarted",
            description:
                `A renewal payment failed.${gracePeriodDescription}${retryDescription} This billing record did not create a recoverable Stripe subscription, so a new checkout must be started from the product page.`,
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

export const isCheckoutSuccessful = (status: BillingCheckoutStatusResponse | null) => {
    return status?.invoiceStatus === "PAID" && status?.subscriptionStatus === "ACTIVE"
}

export const isCheckoutFailed = (status: BillingCheckoutStatusResponse | null) => {
    if (!status) {
        return false
    }

    return (
        status.invoiceStatus === "VOID" ||
        status.invoiceStatus === "PAST_DUE" ||
        status.subscriptionStatus === "PAST_DUE" ||
        status.subscriptionStatus === "CANCELED"
    )
}

export const getCheckoutTitle = (status: BillingCheckoutStatusResponse | null) => {
    if (isCheckoutSuccessful(status)) {
        return "Payment confirmed"
    }

    if (isCheckoutFailed(status)) {
        return "Payment not completed"
    }

    return "Payment received, syncing..."
}

export const getCheckoutDescription = (
    status: BillingCheckoutStatusResponse | null,
    hasSessionId: boolean
) => {
    if (!hasSessionId) {
        return "Checkout completed, but session details were not provided in the return URL."
    }

    if (isCheckoutSuccessful(status)) {
        return "Your subscription is active and ready to use."
    }

    if (isCheckoutFailed(status)) {
        if (status?.subscriptionStatus === "PAST_DUE" && status.gracePeriodEndsAt) {
            return `The subscription is past due, but access remains available through ${formatDate(status.gracePeriodEndsAt)} while billing is resolved.`
        }

        return "The checkout session was found, but the invoice or subscription did not finish successfully."
    }

    return "The app is checking Stripe webhook sync and updating your subscription status."
}
