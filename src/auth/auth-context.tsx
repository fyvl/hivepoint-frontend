import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { login as loginApi, logout as logoutApi, refresh as refreshApi, register as registerApi } from "@/api/auth"
import { ApiError, type HttpOptions, httpWithRetry } from "@/api/http"

export type UserRole = "BUYER" | "SELLER" | "ADMIN"

type AccessTokenClaims = {
    sub?: string
    email?: string
    role?: string
}

type SessionIdentity = {
    userId: string | null
    email: string | null
    role: UserRole | null
}

export type AuthContextValue = {
    accessToken: string | null
    userId: string | null
    email: string | null
    role: UserRole | null
    isHydrating: boolean
    login: (payload: { email: string; password: string }) => Promise<void>
    register: (payload: { email: string; password: string }) => Promise<void>
    refresh: () => Promise<string | null>
    logout: () => Promise<void>
    authedRequest: <T>(path: string, options?: HttpOptions) => Promise<T>
    lastError: ApiError | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const decodeBase64Url = (payload: string) => {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=")
    return atob(padded)
}

const parseRole = (value: unknown): UserRole | null => {
    if (value === "BUYER" || value === "SELLER" || value === "ADMIN") {
        return value
    }
    return null
}

const parseAccessToken = (token: string | null): SessionIdentity => {
    if (!token) {
        return { userId: null, email: null, role: null }
    }

    const segments = token.split(".")
    if (segments.length < 2) {
        return { userId: null, email: null, role: null }
    }

    try {
        const claims = JSON.parse(decodeBase64Url(segments[1])) as AccessTokenClaims
        return {
            userId: typeof claims.sub === "string" ? claims.sub : null,
            email: typeof claims.email === "string" ? claims.email : null,
            role: parseRole(claims.role)
        }
    } catch {
        return { userId: null, email: null, role: null }
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate()
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [isHydrating, setIsHydrating] = useState(true)
    const [lastError, setLastError] = useState<ApiError | null>(null)
    const identity = useMemo(() => parseAccessToken(accessToken), [accessToken])

    const refresh = useCallback(async () => {
        try {
            const response = await refreshApi()
            if (!response || typeof response !== "object") {
                setAccessToken(null)
                return null
            }
            const accessTokenValue = (response as { accessToken?: string }).accessToken
            if (!accessTokenValue) {
                setAccessToken(null)
                return null
            }
            setAccessToken(accessTokenValue)
            setLastError(null)
            return accessTokenValue
        } catch (error) {
            if (error instanceof ApiError) {
                setLastError(error)
            }
            setAccessToken(null)
            return null
        }
    }, [])

    const login = useCallback(async (payload: { email: string; password: string }) => {
        const response = await loginApi(payload)
        const accessTokenValue = (response as { accessToken?: string }).accessToken
        if (!accessTokenValue) {
            throw new ApiError(500, "Missing access token in login response", "INVALID_RESPONSE")
        }
        setAccessToken(accessTokenValue)
        setLastError(null)
    }, [])

    const register = useCallback(async (payload: { email: string; password: string }) => {
        await registerApi(payload)
        setLastError(null)
    }, [])

    const logout = useCallback(async () => {
        try {
            await logoutApi()
        } finally {
            setAccessToken(null)
            setLastError(null)
            navigate("/login")
        }
    }, [navigate])

    const authedRequest = useCallback(
        async <T,>(path: string, options: HttpOptions = {}) => {
            return await httpWithRetry<T>(
                path,
                {
                    ...options,
                    accessToken
                },
                refresh
            )
        },
        [accessToken, refresh]
    )

    useEffect(() => {
        let isActive = true

        const hydrate = async () => {
            await refresh()
            if (isActive) {
                setIsHydrating(false)
            }
        }

        hydrate()

        return () => {
            isActive = false
        }
    }, [refresh])

    useEffect(() => {
        if (!import.meta.env.DEV) {
            return
        }

        if (accessToken) {
            localStorage.setItem("hp_access_token", accessToken)
        } else {
            localStorage.removeItem("hp_access_token")
        }
    }, [accessToken])

    const value = useMemo<AuthContextValue>(
        () => ({
            accessToken,
            userId: identity.userId,
            email: identity.email,
            role: identity.role,
            isHydrating,
            login,
            register,
            refresh,
            logout,
            authedRequest,
            lastError
        }),
        [accessToken, identity.userId, identity.email, identity.role, isHydrating, login, register, refresh, logout, authedRequest, lastError]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}
