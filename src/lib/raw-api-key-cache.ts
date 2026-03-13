const STORAGE_KEY = "hivepoint:last-raw-api-key"

export type CachedRawApiKey = {
    value: string
    label?: string
    createdAt?: string
}

const isBrowser = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"

export const getCachedRawApiKey = (): CachedRawApiKey | null => {
    if (!isBrowser()) {
        return null
    }

    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY)
        if (!raw) {
            return null
        }

        const parsed = JSON.parse(raw) as CachedRawApiKey
        if (!parsed || typeof parsed.value !== "string" || parsed.value.trim() === "") {
            return null
        }

        return parsed
    } catch {
        return null
    }
}

export const saveCachedRawApiKey = (payload: CachedRawApiKey) => {
    if (!isBrowser()) {
        return
    }

    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
        // Ignore storage errors in private mode or restricted environments.
    }
}

export const clearCachedRawApiKey = () => {
    if (!isBrowser()) {
        return
    }

    try {
        window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
        // Ignore storage errors in private mode or restricted environments.
    }
}
