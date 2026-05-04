import { type FormEvent, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "@/api/http";
import { useAuth } from "@/auth/auth-context";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyError, notifySuccess } from "@/lib/notify";

export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const from = (location.state as { from?: string } | null)?.from ?? "/";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors: { email?: string; password?: string } = {};
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            nextErrors.email = "Email is required.";
        } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
            nextErrors.email = "Enter a valid email.";
        }

        if (!password) {
            nextErrors.password = "Password is required.";
        } else if (password.length < 8) {
            nextErrors.password = "Password must be at least 8 characters.";
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            await login({ email: trimmedEmail, password });
            notifySuccess("Signed in", "Access token stored in memory.");
            navigate(from, { replace: true });
        } catch (error) {
            const apiError = error instanceof ApiError ? error : null;
            notifyError(apiError ?? error, apiError?.code ?? "Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthShell
            eyebrow="Account access"
            title="Sign in and move from browsing to operations."
            panelBadge="Secure session"
            panelTitle="Operational access should feel calm and direct."
            panelDescription="The sign-in surface is intentionally light on ceremony: clear fields, direct routing back to the page that asked for auth, and no confusion about what unlocks next."
            panelMetrics={[
                { label: "Redirect", value: "Smart" },
                { label: "Session", value: "JWT" },
                { label: "Mode", value: "Role-aware" }
            ]}
            panelHighlights={[
                {
                    title: "Buyer flows unlock instantly",
                    description:
                        "Subscriptions, API keys, and usage analytics become available right after sign-in."
                },
                {
                    title: "Seller work begins from the same shell",
                    description:
                        "No second product or hidden admin panel is required to start publishing APIs."
                },
                {
                    title: "Gateway debugging stays close",
                    description:
                        "Auth context, cookies, and bearer flow can be checked from the same application shell."
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
                            setEmail(event.target.value);
                            if (errors.email) {
                                setErrors((prev) => ({ ...prev, email: undefined }));
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
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);
                            if (errors.password) {
                                setErrors((prev) => ({ ...prev, password: undefined }));
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
                </div>

                <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign in
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </>
                    )}
                </Button>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Button asChild variant="outline" className="h-11">
                        <Link to="/register">Create account</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11">
                        <Link to="/catalog">Explore catalog</Link>
                    </Button>
                </div>
            </form>
        </AuthShell>
    );
};
