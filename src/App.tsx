import { Suspense, lazy } from "react"
import { Route, Routes } from "react-router-dom"

import { RequireAuth } from "@/auth/require-auth"
import { RequireRole } from "@/auth/require-role"
import { AppShell } from "@/components/layout/app-shell"
import { LoadingBlock } from "@/components/ui-states/loading-block"

const BillingPage = lazy(() =>
    import("@/pages/billing/billing-page").then((module) => ({ default: module.BillingPage }))
)
const BillingCancelPage = lazy(() =>
    import("@/pages/billing/billing-cancel-page").then((module) => ({
        default: module.BillingCancelPage
    }))
)
const BillingSuccessPage = lazy(() =>
    import("@/pages/billing/billing-success-page").then((module) => ({
        default: module.BillingSuccessPage
    }))
)
const CatalogPage = lazy(() =>
    import("@/pages/catalog/catalog-page").then((module) => ({ default: module.CatalogPage }))
)
const ProductDetailsPage = lazy(() =>
    import("@/pages/catalog/product-details-page").then((module) => ({
        default: module.ProductDetailsPage
    }))
)
const DashboardPage = lazy(() =>
    import("@/pages/dashboard/dashboard-page").then((module) => ({ default: module.DashboardPage }))
)
const DebugConnectionPage = lazy(() =>
    import("@/pages/debug-connection-page").then((module) => ({
        default: module.DebugConnectionPage
    }))
)
const KeysPage = lazy(() =>
    import("@/pages/keys/keys-page").then((module) => ({ default: module.KeysPage }))
)
const LoginPage = lazy(() =>
    import("@/pages/login-page").then((module) => ({ default: module.LoginPage }))
)
const NotFoundPage = lazy(() =>
    import("@/pages/not-found/not-found-page").then((module) => ({
        default: module.NotFoundPage
    }))
)
const ProfilePage = lazy(() =>
    import("@/pages/profile/profile-page").then((module) => ({ default: module.ProfilePage }))
)
const RegisterPage = lazy(() =>
    import("@/pages/register-page").then((module) => ({ default: module.RegisterPage }))
)
const SellerStudioPage = lazy(() =>
    import("@/pages/seller/seller-studio-page").then((module) => ({
        default: module.SellerStudioPage
    }))
)
const UsagePage = lazy(() =>
    import("@/pages/usage/usage-page").then((module) => ({ default: module.UsagePage }))
)

const PageFallback = () => (
    <div className="px-4 py-10">
        <LoadingBlock title="Loading page..." count={1} />
    </div>
)

export default function App() {
    return (
        <AppShell>
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/products/:id" element={<ProductDetailsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route element={<RequireAuth />}>
                        <Route path="/debug/connection" element={<DebugConnectionPage />} />
                        <Route path="/profile" element={<ProfilePage />} />

                        <Route element={<RequireRole allow={["BUYER", "SELLER", "ADMIN"]} />}>
                            <Route path="/billing" element={<BillingPage />} />
                            <Route path="/billing/success" element={<BillingSuccessPage />} />
                            <Route path="/billing/cancel" element={<BillingCancelPage />} />
                            <Route path="/keys" element={<KeysPage />} />
                            <Route path="/usage" element={<UsagePage />} />
                        </Route>

                        <Route element={<RequireRole allow={["SELLER", "ADMIN"]} />}>
                            <Route path="/seller/studio" element={<SellerStudioPage />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </AppShell>
    )
}
