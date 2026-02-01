import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { clearCache, fetchWithCache } from "@/lib/request-cache"

beforeEach(() => {
    clearCache()
})

afterEach(() => {
    clearCache()
    vi.useRealTimers()
})

describe("fetchWithCache", () => {
    it("returns cached value within ttl", async () => {
        const fetcher = vi.fn().mockResolvedValue("value")

        const first = await fetchWithCache("cache-key", fetcher, 1000)
        const second = await fetchWithCache("cache-key", fetcher, 1000)

        expect(first).toBe("value")
        expect(second).toBe("value")
        expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it("expires cached value after ttl", async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"))

        const fetcher = vi
            .fn()
            .mockResolvedValueOnce("first")
            .mockResolvedValueOnce("second")

        const first = await fetchWithCache("cache-key", fetcher, 1000)

        vi.setSystemTime(new Date("2024-01-01T00:00:02.000Z"))

        const second = await fetchWithCache("cache-key", fetcher, 1000)

        expect(first).toBe("first")
        expect(second).toBe("second")
        expect(fetcher).toHaveBeenCalledTimes(2)
    })
})
