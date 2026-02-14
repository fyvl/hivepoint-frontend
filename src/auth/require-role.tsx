import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth, type UserRole } from "@/auth/auth-context"
import { EmptyBlock } from "@/components/ui-states/empty-block"

type RequireRoleProps = {
    allow: UserRole[]
}

const roleLabel = (role: UserRole) => {
    if (role === "BUYER") {
        return "Buyer"
    }
    if (role === "SELLER") {
        return "Seller"
    }
    return "Admin"
}

export const RequireRole = ({ allow }: RequireRoleProps) => {
    const { accessToken, role } = useAuth()
    const location = useLocation()

    if (!accessToken) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    if (!role) {
        return (
            <EmptyBlock
                title="Role unavailable"
                description="Your session is valid, but we could not determine account role from token."
                actionLabel="Back to dashboard"
                actionTo="/"
                variant="question"
            />
        )
    }

    if (allow.includes(role)) {
        return <Outlet />
    }

    return (
        <EmptyBlock
            title="Access limited by role"
            description={`This area is available for ${allow.map(roleLabel).join(" / ")} accounts. Your role is ${roleLabel(role)}.`}
            actionLabel="Open dashboard"
            actionTo="/"
            variant="question"
        />
    )
}

