import { getCurrentLocale } from "@/i18n/i18n"

const getIntlLocale = () => (getCurrentLocale() === "ru" ? "ru-RU" : "en-US")

export const formatDate = (value: string | null) => {
    if (!value) {
        return "-"
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }
    return date.toLocaleDateString(getIntlLocale())
}

export const formatNumber = (value: number) => {
    try {
        return new Intl.NumberFormat(getIntlLocale()).format(value)
    } catch {
        return String(value)
    }
}

export const formatCurrency = (priceCents: number, currency: string) => {
    try {
        return new Intl.NumberFormat(getIntlLocale(), {
            style: "currency",
            currency
        }).format(priceCents / 100)
    } catch {
        return `${priceCents / 100} ${currency}`
    }
}

export const formatRequestsPerMinute = (value: number | null | undefined) => {
    if (typeof value !== "number" || value <= 0) {
        return getCurrentLocale() === "ru" ? "Без лимита RPM" : "No RPM cap"
    }

    return getCurrentLocale() === "ru"
        ? `${formatNumber(value)} запр./мин`
        : `${formatNumber(value)} req/min`
}
