import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/auth-context"
import { LoadingBlock } from "@/components/ui-states/loading-block"

export const RequireAuth = () => {
    const { accessToken, isHydrating } = useAuth()
    const location = useLocation()

    if (isHydrating) {
        return (
            <LoadingBlock
                title="Checking session..."
                variant="lines"
                count={3}
            />
        )
    }

    if (!accessToken) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    return <Outlet />
}
