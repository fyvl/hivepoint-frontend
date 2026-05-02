import { type FormEvent, useState } from "react"
import {
    ArrowRight,
    BriefcaseBusiness,
    CreditCard,
    Loader2
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { ApiError } from "@/api/http"
import { type RegisterRole, useAuth } from "@/auth/auth-context"
import { AuthShell } from "@/components/layout/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notifyError, notifySuccess } from "@/lib/notify"
import { cn } from "@/lib/utils"

type RoleOption = {
    value: RegisterRole
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}

const roleOptions: RoleOption[] = [
    {
        value: "BUYER",
        title: "Buyer",
        description: "Subscribe to APIs, manage keys, and watch usage from one workspace.",
        icon: CreditCard
    },
    {
        value: "SELLER",
        title: "Dev",
        description: "Publish APIs, connect schemas, and create pricing plans in Seller Studio.",
        icon: BriefcaseBusiness
    }
]

export const RegisterPage = () => {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState<RegisterRole>("BUYER")
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
            await register({ email: trimmedEmail, password, role })
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
        <AuthShell
            eyebrow="New workspace"
            title="Create an account that matches how you want to use the platform."
            description="Start as a buyer or jump straight into seller mode. Either way, the account lands inside the same shell and can grow with your workflow."
            panelBadge="Role selection"
            panelTitle="The platform is built for both sides of the API transaction."
            panelDescription="Registration should make that split clear early: buyers need operational confidence, sellers need a path from API definition to packaged offering."
            panelMetrics={[
                { label: "Roles", value: "2" },
                { label: "Switching", value: "Flexible" },
                { label: "Onboarding", value: "Fast" }
            ]}
            panelHighlights={[
                {
                    title: "Buyer-first accounts stay operational",
                    description: "Subscriptions, keys, usage, and billing remain the center of gravity after sign-up."
                },
                {
                    title: "Seller-first accounts skip the awkward upgrade gap",
                    description: "You can start from publishing instead of pretending you only consume APIs."
                },
                {
                    title: "Role boundaries remain visible",
                    description: "The UI keeps buyer, seller, and admin contexts legible instead of blending them together."
                }
            ]}
        >
            <form onSubmit={handleSubmit} className="grid gap-5">
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
                        className="h-12"
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
                        placeholder="********"
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
                        className="h-12"
                        required
                    />
                    {errors.password ? (
                        <p id="password-error" className="text-xs text-destructive">
                            {errors.password}
                        </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                        Use at least 8 characters. You can start as Buyer and upgrade later from the dashboard.
                    </p>
                </div>

                <div className="space-y-3">
                    <Label>Workspace intent</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {roleOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={cn(
                                    "rounded-[1.25rem] border px-4 py-4 text-left transition-all",
                                    role === option.value
                                        ? "border-primary bg-primary/10 shadow-[0_18px_34px_-24px_hsl(var(--primary)/0.65)]"
                                        : "border-border/70 bg-background/70 hover:border-primary/25 hover:bg-accent/40"
                                )}
                                onClick={() => setRole(option.value)}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            "flex h-11 w-11 items-center justify-center rounded-2xl",
                                            role === option.value
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-primary/10 text-primary"
                                        )}
                                    >
                                        <option.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">
                                            {option.title}
                                        </div>
                                        <div className="mt-1 text-sm leading-6 text-muted-foreground">
                                            {option.description}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        <>
                            Create account
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </>
                    )}
                </Button>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Button asChild variant="outline" className="h-11">
                        <Link to="/login">Already have an account?</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11">
                        <Link to="/catalog">Explore catalog first</Link>
                    </Button>
                </div>
            </form>
        </AuthShell>
    )
}
