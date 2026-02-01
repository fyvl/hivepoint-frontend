import { Navigate, Route, Routes } from "react-router-dom"

import { RequireAuth } from "@/auth/require-auth"
import { DebugConnectionPage } from "@/pages/debug-connection-page"
import { LoginPage } from "@/pages/login-page"
import { RegisterPage } from "@/pages/register-page"

export default function App() {
    return (
        <div className="min-h-screen bg-muted/40">
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<RequireAuth />}>
                    <Route path="/" element={<Navigate to="/debug/connection" replace />} />
                    <Route path="/debug/connection" element={<DebugConnectionPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/debug/connection" replace />} />
            </Routes>
        </div>
    )
}
