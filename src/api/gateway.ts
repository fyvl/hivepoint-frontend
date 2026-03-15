import { http } from "@/api/http"

export type GatewayMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type GatewayDispatchBody = {
    productId: string
    path: string
    method: GatewayMethod
    headers?: Record<string, string>
    query?: Record<string, string | number | boolean>
    body?: unknown
    requestCount?: number
}

export type GatewayDispatchResponse = {
    ok: boolean
    status: number
    method: GatewayMethod
    upstreamUrl: string
    contentType: string | null
    headers: Record<string, string>
    body: unknown
    usage: {
        subscriptionId: string
        requestCount: number
        remainingRequests: number | null
        rateLimitRpm: number | null
        remainingRateLimitRequests: number | null
        usageRecorded: boolean
        periodEnd: string | null
    }
}

export const createGatewayApi = () => {
    return {
        dispatch: async (
            payload: GatewayDispatchBody,
            apiKey: string
        ): Promise<GatewayDispatchResponse> => {
            return await http<GatewayDispatchResponse>("/gateway/dispatch", {
                method: "POST",
                headers: {
                    "x-api-key": apiKey
                },
                body: payload
            })
        }
    }
}
