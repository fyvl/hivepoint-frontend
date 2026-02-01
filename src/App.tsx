import { Route, Routes } from "react-router-dom"

import { RequireAuth } from "@/auth/require-auth"
import { AppShell } from "@/components/layout/app-shell"
import { BillingPage } from "@/pages/billing/billing-page"
import { CatalogPage } from "@/pages/catalog/catalog-page"
import { ProductDetailsPage } from "@/pages/catalog/product-details-page"
import { DashboardPage } from "@/pages/dashboard/dashboard-page"
import { DebugConnectionPage } from "@/pages/debug-connection-page"
import { KeysPage } from "@/pages/keys/keys-page"
import { LoginPage } from "@/pages/login-page"
import { NotFoundPage } from "@/pages/not-found/not-found-page"
import { RegisterPage } from "@/pages/register-page"
import { UsagePage } from "@/pages/usage/usage-page"

export default function App() {
    return (
        <AppShell>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/products/:id" element={<ProductDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<RequireAuth />}>
                    <Route path="/billing" element={<BillingPage />} />
                    <Route path="/keys" element={<KeysPage />} />
                    <Route path="/usage" element={<UsagePage />} />
                    <Route path="/debug/connection" element={<DebugConnectionPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </AppShell>
    )
}
