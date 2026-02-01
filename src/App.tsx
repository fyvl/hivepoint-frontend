import { Link, Navigate, Route, Routes } from "react-router-dom"

import { useAuth } from "@/auth/auth-context"
import { RequireAuth } from "@/auth/require-auth"
import { Button } from "@/components/ui/button"
import { DebugConnectionPage } from "@/pages/debug-connection-page"
import { BillingPage } from "@/pages/billing/billing-page"
import { CatalogPage } from "@/pages/catalog/catalog-page"
import { ProductDetailsPage } from "@/pages/catalog/product-details-page"
import { KeysPage } from "@/pages/keys/keys-page"
import { LoginPage } from "@/pages/login-page"
import { RegisterPage } from "@/pages/register-page"

export default function App() {
    const { accessToken, logout } = useAuth()

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="border-b bg-background">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <Link className="text-lg font-semibold" to="/catalog">
                            HivePoint
                        </Link>
                        <nav className="flex items-center gap-2">
                            <Button asChild variant="ghost" size="sm">
                                <Link to="/catalog">Catalog</Link>
                            </Button>
                            {accessToken ? (
                                <>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link to="/billing">Billing</Link>
                                    </Button>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link to="/keys">Keys</Link>
                                    </Button>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link to="/debug/connection">Debug</Link>
                                    </Button>
                                </>
                            ) : null}
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        {accessToken ? (
                            <Button variant="outline" size="sm" onClick={logout}>
                                Sign out
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm">
                                    <Link to="/login">Sign in</Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link to="/register">Register</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <main className="mx-auto w-full max-w-6xl px-6 py-8">
                <Routes>
                    <Route path="/" element={<Navigate to="/catalog" replace />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/products/:id" element={<ProductDetailsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route element={<RequireAuth />}>
                        <Route path="/billing" element={<BillingPage />} />
                        <Route path="/keys" element={<KeysPage />} />
                        <Route path="/debug/connection" element={<DebugConnectionPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/catalog" replace />} />
                </Routes>
            </main>
        </div>
    )
}
