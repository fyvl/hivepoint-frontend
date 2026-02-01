import { type HttpOptions, http, httpWithRetry } from "@/api/http"
import type { paths } from "@/api/generated/schema"

export type UsageSummaryResponse =
    paths["/usage/summary"]["get"]["responses"][200]["content"]["application/json"]
export type UsageSummaryItem = UsageSummaryResponse["items"][number]

export type UsageRecordBody =
    paths["/usage/record"]["post"]["requestBody"]["content"]["application/json"]
export type UsageRecordResponse =
    paths["/usage/record"]["post"]["responses"][200]["content"]["application/json"]
export type UsageSecretHeader =
    paths["/usage/record"]["post"]["parameters"]["header"]["x-usage-secret"]

type UsageClient = {
    accessToken: string | null
    refresh: () => Promise<string | null>
}

type Requester = <T>(path: string, options?: HttpOptions) => Promise<T>

const createRequester = (client: UsageClient): Requester => {
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

export const createUsageApi = (client: UsageClient) => {
    const request = createRequester(client)

    return {
        getSummary: async (): Promise<UsageSummaryResponse> => {
            return await request<UsageSummaryResponse>("/usage/summary", {
                method: "GET"
            })
        }
    }
}

export const ingestUsageRecord = async (
    payload: UsageRecordBody,
    secret: UsageSecretHeader
): Promise<UsageRecordResponse> => {
    return await http<UsageRecordResponse>("/usage/record", {
        method: "POST",
        body: payload,
        headers: {
            "x-usage-secret": secret
        }
    })
}

