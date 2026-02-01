import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { applyTheme, getStoredTheme, resolveTheme, setStoredTheme, type Theme } from "@/theme/theme"

type ThemeContextValue = {
    theme: Theme
    resolvedTheme: "light" | "dark"
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? "system")
    const resolvedTheme = resolveTheme(theme)

    useEffect(() => {
        applyTheme(theme)
        setStoredTheme(theme)
    }, [theme])

    useEffect(() => {
        if (theme !== "system") {
            return
        }
        if (typeof window === "undefined") {
            return
        }
        const media = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = () => {
            applyTheme("system")
        }
        media.addEventListener("change", handleChange)
        return () => {
            media.removeEventListener("change", handleChange)
        }
    }, [theme])

    const setTheme = useCallback((nextTheme: Theme) => {
        setThemeState(nextTheme)
    }, [])

    const value = useMemo<ThemeContextValue>(
        () => ({
            theme,
            resolvedTheme,
            setTheme
        }),
        [theme, resolvedTheme, setTheme]
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider")
    }
    return context
}
