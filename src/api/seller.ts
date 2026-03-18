import { type HttpOptions, httpWithRetry } from "@/api/http"
import type { paths } from "@/api/generated/schema"

type GeneratedSellerAnalyticsOverview =
    paths["/seller/analytics/overview"]["get"]["responses"][200]["content"]["application/json"]

export type SellerAnalyticsOverview = GeneratedSellerAnalyticsOverview
export type SellerAnalyticsProduct = SellerAnalyticsOverview["products"][number]

type SellerClient = {
    accessToken: string | null
    refresh: () => Promise<string | null>
}

type Requester = <T>(path: string, options?: HttpOptions) => Promise<T>

const createRequester = (client: SellerClient): Requester => {
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

export const createSellerApi = (client: SellerClient) => {
    const request = createRequester(client)

    return {
        getAnalyticsOverview: async (): Promise<SellerAnalyticsOverview> => {
            return await request<SellerAnalyticsOverview>("/seller/analytics/overview", {
                method: "GET"
            })
        }
    }
}
