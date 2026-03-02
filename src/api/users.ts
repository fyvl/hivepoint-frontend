import { httpWithRetry } from "@/api/http"
import type { GetResponseJsonAny } from "@/api/types"

export type UserMeResponse = GetResponseJsonAny<"/users/me">
export type UpdateMyRolePayload = {
    role: "SELLER"
}
export type UserProfileSummary = {
    subscriptionsTotal: number
    subscriptionsActive: number
    apiKeysActive: number
    productsTotal: number
    productsPublished: number
    canUpgradeToSeller: boolean
}
export type ChangePasswordPayload = {
    currentPassword: string
    newPassword: string
}
export type ChangePasswordResponse = {
    ok: true
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

export const getProfileSummary = async (
    accessToken: string | null,
    refresh: () => Promise<string | null>
): Promise<UserProfileSummary> => {
    return await httpWithRetry<UserProfileSummary>(
        "/users/profile-summary",
        {
            method: "GET",
            accessToken
        },
        refresh
    )
}

export const changePassword = async (
    accessToken: string | null,
    refresh: () => Promise<string | null>,
    payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> => {
    return await httpWithRetry<ChangePasswordResponse>(
        "/users/change-password",
        {
            method: "POST",
            accessToken,
            body: payload
        },
        refresh
    )
}
