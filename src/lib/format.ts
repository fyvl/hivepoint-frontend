export const formatDate = (value: string | null) => {
    if (!value) {
        return "-"
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }
    return date.toLocaleDateString()
}

export const formatNumber = (value: number) => {
    try {
        return new Intl.NumberFormat("en-US").format(value)
    } catch {
        return String(value)
    }
}

export const formatCurrency = (priceCents: number, currency: string) => {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency
        }).format(priceCents / 100)
    } catch {
        return `${priceCents / 100} ${currency}`
    }
}


