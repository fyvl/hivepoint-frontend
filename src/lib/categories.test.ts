import { describe, expect, it } from "vitest"

import { formatCategoryLabel, toStoredCategoryValue } from "@/lib/categories"

describe("formatCategoryLabel", () => {
    it("formats known ML category slugs", () => {
        expect(formatCategoryLabel("ecommerce_logistics")).toBe("E-commerce & Logistics")
        expect(formatCategoryLabel("analytics_monitoring")).toBe("Analytics & Monitoring")
    })

    it("keeps custom categories readable", () => {
        expect(formatCategoryLabel("custom-market-data")).toBe("custom-market-data")
    })
})

describe("toStoredCategoryValue", () => {
    it("stores known category labels as stable slugs", () => {
        expect(toStoredCategoryValue("E-commerce & Logistics")).toBe("ecommerce_logistics")
        expect(toStoredCategoryValue("Data Validation")).toBe("data_validation")
    })

    it("allows categories outside the fixed ML taxonomy", () => {
        expect(toStoredCategoryValue("fintech")).toBe("fintech")
    })
})
