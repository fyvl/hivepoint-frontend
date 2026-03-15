import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { login as loginApi, logout as logoutApi, refresh as refreshApi, register as registerApi } from "@/api/auth"
import { ApiError, type HttpOptions, httpWithRetry } from "@/api/http"
import { clearCachedRawApiKey } from "@/lib/raw-api-key-cache"

export type UserRole = "BUYER" | "SELLER" | "ADMIN"
export type RegisterRole = Exclude<UserRole, "ADMIN">

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
    register: (payload: { email: string; password: string; role: RegisterRole }) => Promise<void>
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
    const accessTokenRef = useRef<string | null>(null)
    const refreshPromiseRef = useRef<Promise<string | null> | null>(null)
    const sessionVersionRef = useRef(0)
    const previousUserIdRef = useRef<string | null | undefined>(undefined)
    const identity = useMemo(() => parseAccessToken(accessToken), [accessToken])

    const applyAccessToken = useCallback((nextAccessToken: string | null) => {
        accessTokenRef.current = nextAccessToken
        setAccessToken(nextAccessToken)
    }, [])

    const refresh = useCallback(async () => {
        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current
        }

        const requestVersion = sessionVersionRef.current
        const refreshRequest = async () => {
            try {
                const response = await refreshApi()
                if (sessionVersionRef.current !== requestVersion) {
                    return accessTokenRef.current
                }

                if (!response || typeof response !== "object") {
                    applyAccessToken(null)
                    return null
                }

                const accessTokenValue = (response as { accessToken?: string }).accessToken
                if (!accessTokenValue) {
                    applyAccessToken(null)
                    return null
                }

                applyAccessToken(accessTokenValue)
                setLastError(null)
                return accessTokenValue
            } catch (error) {
                if (sessionVersionRef.current !== requestVersion) {
                    return accessTokenRef.current
                }

                if (error instanceof ApiError) {
                    setLastError(error)
                }
                applyAccessToken(null)
                return null
            } finally {
                if (refreshPromiseRef.current === requestPromise) {
                    refreshPromiseRef.current = null
                }
            }
        }

        const requestPromise = refreshRequest()
        refreshPromiseRef.current = requestPromise
        return requestPromise
    }, [applyAccessToken])

    const login = useCallback(async (payload: { email: string; password: string }) => {
        refreshPromiseRef.current = null
        const response = await loginApi({
            ...payload,
            email: payload.email.trim()
        })
        const accessTokenValue = (response as { accessToken?: string }).accessToken
        if (!accessTokenValue) {
            throw new ApiError(500, "Missing access token in login response", "INVALID_RESPONSE")
        }
        sessionVersionRef.current += 1
        applyAccessToken(accessTokenValue)
        setLastError(null)
    }, [applyAccessToken])

    const register = useCallback(async (payload: { email: string; password: string; role: RegisterRole }) => {
        await registerApi({
            ...payload,
            email: payload.email.trim()
        })
        setLastError(null)
    }, [])

    const logout = useCallback(async () => {
        try {
            await logoutApi()
        } finally {
            refreshPromiseRef.current = null
            sessionVersionRef.current += 1
            applyAccessToken(null)
            setLastError(null)
            clearCachedRawApiKey()
            navigate("/login")
        }
    }, [applyAccessToken, navigate])

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

    useEffect(() => {
        if (isHydrating) {
            return
        }

        const previousUserId = previousUserIdRef.current
        if (previousUserId !== undefined && previousUserId !== identity.userId) {
            clearCachedRawApiKey()
        }

        previousUserIdRef.current = identity.userId
    }, [identity.userId, isHydrating])

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
