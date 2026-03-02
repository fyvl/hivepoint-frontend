import { type FormEvent, useCallback, useEffect, useState } from "react"
import { Loader2, ShieldCheck, UserRound } from "lucide-react"

import { ApiError } from "@/api/http"
import {
    changePassword as changePasswordApi,
    getMe,
    getProfileSummary,
    type UserMeResponse,
    type UserProfileSummary,
    updateMyRole as updateMyRoleApi
} from "@/api/users"
import { useAuth } from "@/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorBlock } from "@/components/ui-states/error-block"
import { notifyError, notifySuccess } from "@/lib/notify"

const roleLabel = (role: string | null) => {
    if (role === "BUYER") {
        return "Buyer"
    }
    if (role === "SELLER") {
        return "Dev"
    }
    if (role === "ADMIN") {
        return "Admin"
    }
    return "Unknown"
}

export const ProfilePage = () => {
    const { accessToken, refresh } = useAuth()
    const [me, setMe] = useState<UserMeResponse | null>(null)
    const [summary, setSummary] = useState<UserProfileSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)
    const [retryKey, setRetryKey] = useState(0)

    const [isUpgradingRole, setIsUpgradingRole] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordErrors, setPasswordErrors] = useState<{
        currentPassword?: string
        newPassword?: string
        confirmPassword?: string
    }>({})

    const load = useCallback(async () => {
        if (!accessToken) {
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            const [meResponse, summaryResponse] = await Promise.all([
                getMe(accessToken, refresh),
                getProfileSummary(accessToken, refresh)
            ])

            setMe(meResponse)
            setSummary(summaryResponse)
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            setError(apiError)
            notifyError(apiError ?? err, "Could not load profile")
        } finally {
            setIsLoading(false)
        }
    }, [accessToken, refresh])

    useEffect(() => {
        void load()
    }, [load, retryKey])

    const handleUpgradeRole = useCallback(async () => {
        if (!accessToken || !summary?.canUpgradeToSeller) {
            return
        }

        setIsUpgradingRole(true)
        try {
            await updateMyRoleApi(accessToken, refresh, { role: "SELLER" })
            await refresh()
            await load()
            notifySuccess("Role upgraded", "Your account is now in Dev mode.")
        } catch (err) {
            notifyError(err, "Could not upgrade role")
        } finally {
            setIsUpgradingRole(false)
        }
    }, [accessToken, load, refresh, summary?.canUpgradeToSeller])

    const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const nextErrors: {
            currentPassword?: string
            newPassword?: string
            confirmPassword?: string
        } = {}

        if (!currentPassword) {
            nextErrors.currentPassword = "Current password is required."
        }
        if (!newPassword) {
            nextErrors.newPassword = "New password is required."
        } else if (newPassword.length < 8) {
            nextErrors.newPassword = "New password must be at least 8 characters."
        } else if (newPassword === currentPassword) {
            nextErrors.newPassword = "New password must differ from current password."
        }
        if (!confirmPassword) {
            nextErrors.confirmPassword = "Please confirm new password."
        } else if (confirmPassword !== newPassword) {
            nextErrors.confirmPassword = "Passwords do not match."
        }

        setPasswordErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0 || !accessToken) {
            return
        }

        setIsChangingPassword(true)
        try {
            await changePasswordApi(accessToken, refresh, {
                currentPassword,
                newPassword
            })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setPasswordErrors({})
            notifySuccess("Password updated", "Refresh tokens were revoked for security.")
        } catch (err) {
            notifyError(err, "Could not change password")
        } finally {
            setIsChangingPassword(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !me || !summary) {
        return (
            <ErrorBlock
                title="Profile unavailable"
                description={error?.message || "Could not load account data."}
                code={error?.code}
                onRetry={() => setRetryKey((prev) => prev + 1)}
            />
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">Manage your account role, security, and activity snapshot.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserRound className="h-5 w-5" />
                            Account
                        </CardTitle>
                        <CardDescription>Identity and access role</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{me.email}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Role</p>
                            <Badge variant="secondary">{roleLabel(me.role ?? null)}</Badge>
                        </div>
                        <div>
                            <p className="text-muted-foreground">User ID</p>
                            <p className="break-all font-mono text-xs">{me.id}</p>
                        </div>
                        {summary.canUpgradeToSeller ? (
                            <Button
                                className="mt-2 w-full"
                                onClick={handleUpgradeRole}
                                disabled={isUpgradingRole}
                            >
                                {isUpgradingRole ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Upgrading...
                                    </>
                                ) : (
                                    "Become Dev"
                                )}
                            </Button>
                        ) : null}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5" />
                            Activity Summary
                        </CardTitle>
                        <CardDescription>Current account usage across key modules</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <SummaryItem label="Subscriptions" value={summary.subscriptionsTotal} />
                            <SummaryItem label="Active Subscriptions" value={summary.subscriptionsActive} />
                            <SummaryItem label="Active API Keys" value={summary.apiKeysActive} />
                            <SummaryItem label="Products" value={summary.productsTotal} />
                            <SummaryItem label="Published Products" value={summary.productsPublished} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Updates password hash and revokes refresh tokens for active sessions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4 md:grid-cols-3" onSubmit={handleChangePassword}>
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(event) => {
                                    setCurrentPassword(event.target.value)
                                    if (passwordErrors.currentPassword) {
                                        setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }))
                                    }
                                }}
                            />
                            {passwordErrors.currentPassword ? (
                                <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">New password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(event) => {
                                    setNewPassword(event.target.value)
                                    if (passwordErrors.newPassword) {
                                        setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }))
                                    }
                                }}
                            />
                            {passwordErrors.newPassword ? (
                                <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm new password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => {
                                    setConfirmPassword(event.target.value)
                                    if (passwordErrors.confirmPassword) {
                                        setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                                    }
                                }}
                            />
                            {passwordErrors.confirmPassword ? (
                                <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                            ) : null}
                        </div>

                        <div className="md:col-span-3">
                            <Button type="submit" disabled={isChangingPassword}>
                                {isChangingPassword ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

const SummaryItem = ({ label, value }: { label: string; value: number }) => {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
    )
}
