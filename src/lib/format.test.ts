import { describe, it, expect } from "vitest"

import {
    formatCurrency,
    formatDate,
    formatNumber,
    formatRequestsPerMinute
} from "@/lib/format"

describe("formatDate", () => {
    it("returns dash for null", () => {
        expect(formatDate(null)).toBe("-")
    })

    it("returns original value for invalid date", () => {
        expect(formatDate("not-a-date")).toBe("not-a-date")
    })

    it("formats valid ISO date", () => {
        const value = "2024-01-15T00:00:00.000Z"
        const formatted = formatDate(value)
        expect(formatted).not.toBe("-")
        expect(formatted).not.toBe(value)
    })
})

describe("formatNumber", () => {
    it("formats numbers with en-US separators", () => {
        expect(formatNumber(12000)).toBe("12,000")
    })
})

describe("formatCurrency", () => {
    it("formats currency with en-US locale", () => {
        const expected = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(12345 / 100)

        expect(formatCurrency(12345, "USD")).toBe(expected)
    })
})

describe("formatRequestsPerMinute", () => {
    it("formats RPM values with separators", () => {
        expect(formatRequestsPerMinute(1200)).toBe("1,200 req/min")
    })

    it("returns a fallback label when unset", () => {
        expect(formatRequestsPerMinute(null)).toBe("No RPM cap")
    })
})
