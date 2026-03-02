import { httpWithRetry } from "@/api/http"
import type { GetResponseJsonAny } from "@/api/types"

export type UserMeResponse = GetResponseJsonAny<"/users/me">
export type UpdateMyRolePayload = {
    role: "SELLER"
}

export const getMe = async (
    accessToken: string | null,
    refresh: () => Promise<string | null>
): Promise<UserMeResponse> => {
    return await httpWithRetry<UserMeResponse>(
        "/users/me",
        {
            method: "GET",
            accessToken
        },
        refresh
    )
}

export const updateMyRole = async (
    accessToken: string | null,
    refresh: () => Promise<string | null>,
    payload: UpdateMyRolePayload
): Promise<UserMeResponse> => {
    return await httpWithRetry<UserMeResponse>(
        "/users/role",
        {
            method: "POST",
            accessToken,
            body: payload
        },
        refresh
    )
}
