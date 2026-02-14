import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Check, Loader2 } from "lucide-react"

import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notifyError, notifySuccess } from "@/lib/notify"

const benefits = [
    "Access to all API products",
    "Real-time usage analytics",
    "Dedicated support"
]

export const RegisterPage = () => {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

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
            await register({ email, password })
            notifySuccess("Registration complete", "You can now sign in with your credentials.")
            navigate("/login")
        } catch (error) {
            const apiError = error instanceof ApiError ? error : null
            notifyError(apiError ?? error, apiError?.code ?? "Registration failed")
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
                        <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                        <CardDescription>
                            Start building with HivePoint APIs today
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {/* Benefits */}
                            <div className="rounded-lg bg-muted/50 p-3">
                                <ul className="space-y-2">
                                    {benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                                                <Check className="h-3 w-3 text-primary" />
                                            </div>
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>

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
                                    autoComplete="new-password"
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
                                <p className="text-xs text-muted-foreground">
                                    Must be at least 8 characters
                                </p>
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
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Get Started
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link className="font-medium text-primary hover:underline" to="/login">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
