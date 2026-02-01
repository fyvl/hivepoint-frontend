import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export const RegisterPage = () => {
    const { register } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsSubmitting(true)
        try {
            await register({ email, password })
            toast({
                title: "Registration complete",
                description: "You can now sign in with your credentials."
            })
            navigate("/login")
        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: error.code ?? "Registration failed",
                    description: error.message,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Registration failed",
                    description: "Unexpected error while registering.",
                    variant: "destructive"
                })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex w-full justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create account</CardTitle>
                    <CardDescription>Register as a HivePoint user.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Registering..." : "Register"}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Already registered?{" "}
                            <Link className="text-primary underline" to="/login">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
