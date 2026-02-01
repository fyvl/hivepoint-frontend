import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "@/App"
import { AuthProvider } from "@/auth/auth-context"
import { Toaster } from "@/components/ui/toaster"
import "@/index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <App />
                <Toaster />
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>
)
