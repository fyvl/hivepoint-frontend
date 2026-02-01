import { type HttpOptions, http, httpWithRetry } from "@/api/http"
import type { GetQueryParams, GetResponseJsonAny } from "@/api/types"

export type ListProductsQuery = GetQueryParams<"/catalog/products">
export type ListProductsResponse = GetResponseJsonAny<"/catalog/products">
export type GetProductResponse = GetResponseJsonAny<"/catalog/products/{id}">
export type GetVersionsResponse = GetResponseJsonAny<"/catalog/products/{id}/versions">

export type CatalogProduct = ListProductsResponse extends { items: (infer Item)[] }
    ? Item
    : ListProductsResponse extends Array<infer Item>
        ? Item
        : unknown

export type CatalogVersion = GetVersionsResponse extends Array<infer Item>
    ? Item
    : GetVersionsResponse extends { items: (infer Item)[] }
        ? Item
        : unknown

type AsRecord<T> = T extends Record<string, unknown> ? T : Record<string, unknown>

export type ListProductsQueryInput = Partial<AsRecord<ListProductsQuery>>

type CatalogClient = {
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

const createRequester = (client?: CatalogClient): Requester => {
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

export const createCatalogApi = (client?: CatalogClient) => {
    const request = createRequester(client)

    return {
        listProducts: async (
            params: ListProductsQueryInput = {},
            options: HttpOptions = {}
        ): Promise<ListProductsResponse> => {
            const query = buildQuery(params as Record<string, unknown>)
            return await request<ListProductsResponse>(`/catalog/products${query}`, {
                ...options,
                method: "GET"
            })
        },
        getProduct: async (
            id: string,
            options: HttpOptions = {}
        ): Promise<GetProductResponse> => {
            const encodedId = encodeURIComponent(id)
            return await request<GetProductResponse>(`/catalog/products/${encodedId}`, {
                ...options,
                method: "GET"
            })
        },
        getVersions: async (
            productId: string,
            options: HttpOptions = {}
        ): Promise<GetVersionsResponse> => {
            const encodedId = encodeURIComponent(productId)
            return await request<GetVersionsResponse>(`/catalog/products/${encodedId}/versions`, {
                ...options,
                method: "GET"
            })
        }
    }
}
