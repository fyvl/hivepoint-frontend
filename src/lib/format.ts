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


