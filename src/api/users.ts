import { httpWithRetry } from "@/api/http"
import type { GetResponseJsonAny } from "@/api/types"

export type UserMeResponse = GetResponseJsonAny<"/users/me">

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
