import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "@/App"
import { AuthProvider } from "@/auth/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"
import { I18nProvider } from "@/i18n/i18n"
import { ThemeProvider } from "@/theme/theme-context"
import "@/index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <I18nProvider>
                    <AuthProvider>
                        <ErrorBoundary>
                            <App />
                        </ErrorBoundary>
                        <Toaster />
                    </AuthProvider>
                </I18nProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
)
