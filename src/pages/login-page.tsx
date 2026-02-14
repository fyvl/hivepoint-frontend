import { type FormEvent, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowRight, Loader2 } from "lucide-react"

import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notifyError, notifySuccess } from "@/lib/notify"

export const LoginPage = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

    const from = (location.state as { from?: string } | null)?.from ?? "/"

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const nextErrors: { email?: string; password?: string } = {}
        const trimmedEmail = email.trim()

        if (!trimmedEmail) {
            nextErrors.email = "Email is required."
        } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
            nextErrors.email = "Enter a valid email."
        }

        if (!password) {
            nextErrors.password = "Password is required."
        } else if (password.length < 8) {
            nextErrors.password = "Password must be at least 8 characters."
        }

        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) {
            return
        }

        setIsSubmitting(true)
        try {
            await login({ email, password })
            notifySuccess("Signed in", "Access token stored in memory.")
            navigate(from, { replace: true })
        } catch (error) {
            const apiError = error instanceof ApiError ? error : null
            notifyError(apiError ?? error, apiError?.code ?? "Login failed")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-[80vh] w-full items-center justify-center">
            <div className="w-full max-w-md space-y-6">
                {/* Logo */}
                <div className="flex justify-center">
                    <Logo size="lg" />
                </div>

                <Card className="border-0 shadow-xl shadow-primary/5">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                        <CardDescription>
                            Sign in to your HivePoint account
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value)
                                        if (errors.email) {
                                            setErrors((prev) => ({ ...prev, email: undefined }))
                                        }
                                    }}
                                    aria-invalid={Boolean(errors.email)}
                                    aria-describedby={errors.email ? "email-error" : undefined}
                                    className="h-11"
                                    required
                                />
                                {errors.email ? (
                                    <p id="email-error" className="text-xs text-destructive">
                                        {errors.email}
                                    </p>
                                ) : null}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value)
                                        if (errors.password) {
                                            setErrors((prev) => ({ ...prev, password: undefined }))
                                        }
                                    }}
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={errors.password ? "password-error" : undefined}
                                    className="h-11"
                                    required
                                />
                                {errors.password ? (
                                    <p id="password-error" className="text-xs text-destructive">
                                        {errors.password}
                                    </p>
                                ) : null}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button 
                                type="submit" 
                                className="w-full h-11 text-base shadow-glow hover:shadow-glow-lg" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">
                                        New to HivePoint?
                                    </span>
                                </div>
                            </div>
                            <Button asChild variant="outline" className="w-full h-11">
                                <Link to="/register">
                                    Create an account
                                </Link>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
