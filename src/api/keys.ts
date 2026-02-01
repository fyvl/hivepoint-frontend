import { type HttpOptions, httpWithRetry } from "@/api/http"
import type { paths } from "@/api/generated/schema"

export type CreateKeyBody =
    paths["/keys"]["post"]["requestBody"]["content"]["application/json"]
export type CreateKeyResponse =
    paths["/keys"]["post"]["responses"][200]["content"]["application/json"]

export type ListKeysResponse =
    paths["/keys"]["get"]["responses"][200]["content"]["application/json"]
export type KeyItem = ListKeysResponse["items"][number]

export type RevokeKeyResponse =
    paths["/keys/{id}/revoke"]["post"]["responses"][200]["content"]["application/json"]

type KeysClient = {
    accessToken: string | null
    refresh: () => Promise<string | null>
}

type Requester = <T>(path: string, options?: HttpOptions) => Promise<T>

const createRequester = (client: KeysClient): Requester => {
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

export const createKeysApi = (client: KeysClient) => {
    const request = createRequester(client)

    return {
        listKeys: async (): Promise<ListKeysResponse> => {
            return await request<ListKeysResponse>("/keys", {
                method: "GET"
            })
        },
        createKey: async (body: CreateKeyBody): Promise<CreateKeyResponse> => {
            return await request<CreateKeyResponse>("/keys", {
                method: "POST",
                body
            })
        },
        revokeKey: async (id: string): Promise<RevokeKeyResponse> => {
            const encodedId = encodeURIComponent(id)
            return await request<RevokeKeyResponse>(`/keys/${encodedId}/revoke`, {
                method: "POST"
            })
        }
    }
}
