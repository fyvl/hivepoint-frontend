import { type HttpOptions, http, httpWithRetry } from "@/api/http"
import type { paths } from "@/api/generated/schema"
import type { GetQueryParams } from "@/api/types"

export type ListPlansQuery = GetQueryParams<"/billing/plans">
type GeneratedListPlansResponse =
    paths["/billing/plans"]["get"]["responses"][200]["content"]["application/json"]
type GeneratedPlan = GeneratedListPlansResponse["items"][number]
type GeneratedCreatePlanBody =
    paths["/billing/plans"]["post"]["requestBody"]["content"]["application/json"]
type GeneratedListSubscriptionsResponse =
    paths["/billing/subscriptions"]["get"]["responses"][200]["content"]["application/json"]
type GeneratedSubscription = GeneratedListSubscriptionsResponse["items"][number]
type GeneratedBillingPortalSessionResponse =
    paths["/billing/portal-session"]["post"]["responses"][200]["content"]["application/json"]
type GeneratedBillingConfigResponse =
    paths["/billing/config"]["get"]["responses"][200]["content"]["application/json"]
type GeneratedBillingCheckoutStatusResponse =
    paths["/billing/checkout-status/{sessionId}"]["get"]["responses"][200]["content"]["application/json"]
type GeneratedBillingAlertsResponse =
    paths["/billing/alerts"]["get"]["responses"][200]["content"]["application/json"]

export type Plan = Omit<GeneratedPlan, "rateLimitRpm"> & {
    rateLimitRpm: number | null
}
export type ListPlansResponse = Omit<GeneratedListPlansResponse, "items"> & {
    items: Plan[]
}
export type CreatePlanBody = GeneratedCreatePlanBody
export type CreatePlanResponse =
    paths["/billing/plans"]["post"]["responses"][200]["content"]["application/json"]

export type SubscribeBody =
    paths["/billing/subscribe"]["post"]["requestBody"]["content"]["application/json"]
export type SubscribeResponse =
    paths["/billing/subscribe"]["post"]["responses"][200]["content"]["application/json"]

export type Subscription = Omit<GeneratedSubscription, "plan"> & {
    plan: Omit<GeneratedSubscription["plan"], "rateLimitRpm"> & {
        rateLimitRpm: number | null
    }
}
export type ListSubscriptionsResponse = Omit<
    GeneratedListSubscriptionsResponse,
    "items"
> & {
    items: Subscription[]
}

export type CancelSubscriptionResponse =
    paths["/billing/subscriptions/{id}/cancel"]["post"]["responses"][200]["content"]["application/json"]

export type BillingPortalSessionResponse = GeneratedBillingPortalSessionResponse

export type BillingConfigResponse = GeneratedBillingConfigResponse

export type BillingLatestInvoice = GeneratedSubscription["invoices"][number]

export type BillingCheckoutStatusResponse = GeneratedBillingCheckoutStatusResponse
export type BillingAlertsResponse = GeneratedBillingAlertsResponse
export type BillingAlert = GeneratedBillingAlertsResponse["items"][number]

export type MockPaymentResponse =
    paths["/billing/mock/succeed"]["post"]["responses"][200]["content"]["application/json"]

export type MockPaymentHeader =
    paths["/billing/mock/succeed"]["post"]["parameters"]["header"]["x-mock-payment-secret"]

export type MockPaymentQuery =
    paths["/billing/mock/succeed"]["post"]["parameters"]["query"]

type BillingClient = {
    accessToken?: string | null
    refresh?: () => Promise<string | null>
}

type Requester = <T>(path: string, options?: HttpOptions) => Promise<T>

type QueryValue = string | number | boolean

const buildQuery = (params: Record<string, unknown>) => {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return
        }

        if (typeof value === "string" && value.trim() === "") {
            return
        }

        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            searchParams.set(key, String(value as QueryValue))
        }
    })

    const query = searchParams.toString()
    return query ? `?${query}` : ""
}

const createRequester = (client?: BillingClient): Requester => {
    const refresh = client?.refresh
    const accessToken = client?.accessToken

    if (refresh) {
        return async <T,>(path: string, options: HttpOptions = {}) => {
            return await httpWithRetry<T>(
                path,
                {
                    ...options,
                    accessToken
                },
                refresh
            )
        }
    }

    return async <T,>(path: string, options: HttpOptions = {}) => {
        return await http<T>(path, {
            ...options,
            accessToken
        })
    }
}

export const createBillingApi = (client?: BillingClient) => {
    const request = createRequester(client)

    return {
        listPlans: async (query: ListPlansQuery): Promise<ListPlansResponse> => {
            const queryString = buildQuery(query as Record<string, unknown>)
            return await request<ListPlansResponse>(`/billing/plans${queryString}`, {
                method: "GET"
            })
        },
        createPlan: async (payload: CreatePlanBody): Promise<CreatePlanResponse> => {
            return await request<CreatePlanResponse>("/billing/plans", {
                method: "POST",
                body: payload
            })
        },
        subscribe: async (payload: SubscribeBody): Promise<SubscribeResponse> => {
            return await request<SubscribeResponse>("/billing/subscribe", {
                method: "POST",
                body: payload
            })
        },
        listSubscriptions: async (): Promise<ListSubscriptionsResponse> => {
            return await request<ListSubscriptionsResponse>("/billing/subscriptions", {
                method: "GET"
            })
        },
        listAlerts: async (): Promise<BillingAlertsResponse> => {
            return await request<BillingAlertsResponse>("/billing/alerts", {
                method: "GET"
            })
        },
        getConfig: async (): Promise<BillingConfigResponse> => {
            return await request<BillingConfigResponse>("/billing/config", {
                method: "GET"
            })
        },
        getCheckoutStatus: async (sessionId: string): Promise<BillingCheckoutStatusResponse> => {
            const encodedSessionId = encodeURIComponent(sessionId)
            return await request<BillingCheckoutStatusResponse>(
                `/billing/checkout-status/${encodedSessionId}`,
                {
                    method: "GET"
                }
            )
        },
        cancelSubscription: async (subscriptionId: string): Promise<CancelSubscriptionResponse> => {
            const encodedId = encodeURIComponent(subscriptionId)
            return await request<CancelSubscriptionResponse>(
                `/billing/subscriptions/${encodedId}/cancel`,
                {
                    method: "POST"
                }
            )
        },
        createPortalSession: async (): Promise<BillingPortalSessionResponse> => {
            return await request<BillingPortalSessionResponse>("/billing/portal-session", {
                method: "POST"
            })
        }
    }
}

export const mockPayment = {
    succeed: async (invoiceId: string, secret: MockPaymentHeader): Promise<MockPaymentResponse> => {
        const query: MockPaymentQuery = { invoiceId }
        const queryString = buildQuery(query as Record<string, unknown>)
        return await http<MockPaymentResponse>(`/billing/mock/succeed${queryString}`, {
            method: "POST",
            headers: {
                "x-mock-payment-secret": secret
            }
        })
    },
    fail: async (invoiceId: string, secret: MockPaymentHeader): Promise<MockPaymentResponse> => {
        const query: MockPaymentQuery = { invoiceId }
        const queryString = buildQuery(query as Record<string, unknown>)
        return await http<MockPaymentResponse>(`/billing/mock/fail${queryString}`, {
            method: "POST",
            headers: {
                "x-mock-payment-secret": secret
            }
        })
    }
}

