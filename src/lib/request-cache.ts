type CacheEntry<T> = {
    value: T
    expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

const now = () => Date.now()

const isExpired = (entry: CacheEntry<unknown>) => entry.expiresAt <= now()

const pruneExpired = () => {
    for (const [key, entry] of cache.entries()) {
        if (isExpired(entry)) {
            cache.delete(key)
        }
    }
}

export const clearCache = (prefix?: string) => {
    if (!prefix) {
        cache.clear()
        inflight.clear()
        return
    }
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key)
        }
    }
    for (const key of inflight.keys()) {
        if (key.startsWith(prefix)) {
            inflight.delete(key)
        }
    }
}

export const fetchWithCache = async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = 30000
): Promise<T> => {
    if (ttlMs <= 0) {
        return await fetcher()
    }

    pruneExpired()

    const existing = cache.get(key) as CacheEntry<T> | undefined
    if (existing && !isExpired(existing)) {
        return existing.value
    }

    const inFlight = inflight.get(key) as Promise<T> | undefined
    if (inFlight) {
        return inFlight
    }

    const promise = fetcher()
        .then((value) => {
            cache.set(key, { value, expiresAt: now() + ttlMs })
            inflight.delete(key)
            return value
        })
        .catch((error) => {
            inflight.delete(key)
            throw error
        })

    inflight.set(key, promise)
    return promise
}
