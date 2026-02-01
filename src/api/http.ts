import { apiBaseUrl } from "@/config/env"

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type HttpOptions = {
    method?: HttpMethod
    headers?: HeadersInit
    body?: unknown
    accessToken?: string | null
    signal?: AbortSignal
}

export class ApiError extends Error {
    status: number
    code?: string
    details?: unknown

    constructor(status: number, message: string, code?: string, details?: unknown) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.code = code
        this.details = details
    }
}

type ErrorPayload = {
    error?: {
        code?: string
        message?: string
        details?: unknown
    }
}

const buildUrl = (path: string) => {
    const trimmedBase = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${trimmedBase}${normalizedPath}`
}

const parseJsonSafely = async (response: Response) => {
    try {
        return (await response.json()) as unknown
    } catch {
        return null
    }
}

export const http = async <T>(path: string, options: HttpOptions = {}): Promise<T> => {
    const url = buildUrl(path)
    const headers = new Headers(options.headers ?? {})

    if (options.accessToken) {
        headers.set("Authorization", `Bearer ${options.accessToken}`)
    }

    let body: BodyInit | undefined
    if (options.body !== undefined) {
        if (
            typeof options.body === "string" ||
            options.body instanceof FormData ||
            options.body instanceof URLSearchParams ||
            options.body instanceof Blob
        ) {
            body = options.body
        } else {
            body = JSON.stringify(options.body)
            if (!headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json")
            }
        }
    }

    const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body,
        signal: options.signal,
        credentials: "include"
    })

    if (!response.ok) {
        const errorBody = (await parseJsonSafely(response)) as ErrorPayload | null
        const errorPayload = errorBody?.error
        const message = (errorPayload?.message ?? response.statusText) || "Request failed"
        const code = errorPayload?.code
        const details = errorPayload?.details ?? errorBody
        throw new ApiError(response.status, message, code, details)
    }

    if (response.status === 204) {
        return undefined as T
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
        return (await response.json()) as T
    }

    return (await response.text()) as T
}

export const httpWithRetry = async <T>(
    path: string,
    options: HttpOptions,
    refresh: () => Promise<string | null>
): Promise<T> => {
    try {
        return await http<T>(path, options)
    } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
            throw error
        }

        const newToken = await refresh()
        if (!newToken) {
            throw error
        }

        return await http<T>(path, {
            ...options,
            accessToken: newToken
        })
    }
}
