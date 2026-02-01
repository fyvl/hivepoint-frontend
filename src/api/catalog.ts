import { type HttpOptions, http, httpWithRetry } from "@/api/http"

export type CatalogListParams = {
    search?: string
    category?: string
    limit?: number
    offset?: number
}

export type CatalogProduct = {
    id?: string
    title?: string
    description?: string
    category?: string
    tags?: string[]
    status?: string
    [key: string]: unknown
}

export type CatalogVersion = {
    id?: string
    version?: string
    status?: string
    openApiUrl?: string
    [key: string]: unknown
}

export type CatalogListResult = {
    items: CatalogProduct[]
    total?: number
}

type CatalogClient = {
    accessToken?: string | null
    refresh?: () => Promise<string | null>
}

type Requester = <T>(path: string, options?: HttpOptions) => Promise<T>

const buildQuery = (params: CatalogListParams) => {
    const searchParams = new URLSearchParams()

    if (params.search) {
        searchParams.set("search", params.search)
    }

    if (params.category) {
        searchParams.set("category", params.category)
    }

    if (typeof params.limit === "number") {
        searchParams.set("limit", params.limit.toString())
    }

    if (typeof params.offset === "number") {
        searchParams.set("offset", params.offset.toString())
    }

    const query = searchParams.toString()
    return query ? `?${query}` : ""
}

const normalizeListResponse = (payload: unknown): CatalogListResult => {
    if (Array.isArray(payload)) {
        return { items: payload as CatalogProduct[] }
    }

    if (!payload || typeof payload !== "object") {
        return { items: [] }
    }

    const record = payload as Record<string, unknown>
    const itemsValue = Array.isArray(record.items) ? record.items : []
    const totalValue = typeof record.total === "number" ? record.total : undefined

    return {
        items: itemsValue as CatalogProduct[],
        total: totalValue
    }
}

const normalizeArrayResponse = (payload: unknown): CatalogVersion[] => {
    if (Array.isArray(payload)) {
        return payload as CatalogVersion[]
    }

    if (!payload || typeof payload !== "object") {
        return []
    }

    const record = payload as Record<string, unknown>
    if (Array.isArray(record.items)) {
        return record.items as CatalogVersion[]
    }

    return []
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
        listProducts: async (params: CatalogListParams): Promise<CatalogListResult> => {
            const query = buildQuery(params)
            const response = await request<unknown>(`/catalog/products${query}`, {
                method: "GET"
            })
            return normalizeListResponse(response)
        },
        getProduct: async (id: string): Promise<CatalogProduct> => {
            return await request<CatalogProduct>(`/catalog/products/${id}`, {
                method: "GET"
            })
        },
        getVersions: async (productId: string): Promise<CatalogVersion[]> => {
            const response = await request<unknown>(`/catalog/products/${productId}/versions`, {
                method: "GET"
            })
            return normalizeArrayResponse(response)
        }
    }
}
