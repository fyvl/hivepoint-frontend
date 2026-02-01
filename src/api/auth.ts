import { http } from "@/api/http"
import type { PostRequestBody, PostResponseJsonAny } from "@/api/types"

type RegisterBody = PostRequestBody<"/auth/register">
type RegisterResponse = PostResponseJsonAny<"/auth/register">

type LoginBody = PostRequestBody<"/auth/login">
type LoginResponse = PostResponseJsonAny<"/auth/login">

type RefreshResponse = PostResponseJsonAny<"/auth/refresh">

export const register = async (payload: RegisterBody): Promise<RegisterResponse> => {
    return await http<RegisterResponse>("/auth/register", {
        method: "POST",
        body: payload
    })
}

export const login = async (payload: LoginBody): Promise<LoginResponse> => {
    return await http<LoginResponse>("/auth/login", {
        method: "POST",
        body: payload
    })
}

export const refresh = async (): Promise<RefreshResponse> => {
    return await http<RefreshResponse>("/auth/refresh", {
        method: "POST"
    })
}

export const logout = async (): Promise<void> => {
    await http<unknown>("/auth/logout", {
        method: "POST"
    })
}
