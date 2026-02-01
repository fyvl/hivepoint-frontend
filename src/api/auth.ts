import { http } from "@/api/http"

export type RegisterRequest = {
    email: string
    password: string
}

export type LoginRequest = {
    email: string
    password: string
}

export type AuthUserResponse = {
    id: string
    email: string
    role: "BUYER" | "SELLER" | "ADMIN"
}

export type AccessTokenResponse = {
    accessToken: string
}

export const register = async (payload: RegisterRequest): Promise<AuthUserResponse> => {
    return await http<AuthUserResponse>("/auth/register", {
        method: "POST",
        body: payload
    })
}

export const login = async (payload: LoginRequest): Promise<AccessTokenResponse> => {
    return await http<AccessTokenResponse>("/auth/login", {
        method: "POST",
        body: payload
    })
}

export const refresh = async (): Promise<AccessTokenResponse> => {
    return await http<AccessTokenResponse>("/auth/refresh", {
        method: "POST"
    })
}

export const logout = async (): Promise<void> => {
    await http<unknown>("/auth/logout", {
        method: "POST"
    })
}
