import { Navigate, Outlet, useLocation } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/auth/auth-context"

export const RequireAuth = () => {
    const { accessToken, isHydrating } = useAuth()
    const location = useLocation()

    if (isHydrating) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Checking session</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Refreshing your session cookie and access token.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!accessToken) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    return <Outlet />
}
