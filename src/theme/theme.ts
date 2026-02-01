export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "theme"

export const getStoredTheme = (): Theme | null => {
    if (typeof window === "undefined") {
        return null
    }
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") {
        return stored
    }
    return null
}

export const setStoredTheme = (theme: Theme) => {
    if (typeof window === "undefined") {
        return
    }
    window.localStorage.setItem(STORAGE_KEY, theme)
}

export const resolveTheme = (theme: Theme): "light" | "dark" => {
    if (theme === "system") {
        if (typeof window === "undefined") {
            return "light"
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
}

export const applyTheme = (theme: Theme) => {
    if (typeof document === "undefined") {
        return
    }
    const resolved = resolveTheme(theme)
    document.documentElement.classList.toggle("dark", resolved === "dark")
}
