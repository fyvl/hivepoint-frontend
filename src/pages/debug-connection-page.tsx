import { useState } from "react"

import { ApiError } from "@/api/http"
import { getMe, type UserMeResponse } from "@/api/users"
import { useAuth } from "@/auth/auth-context"
import { apiBaseUrl } from "@/config/env"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const formatJson = (value: unknown) => {
    if (value === null || value === undefined) {
        return ""
    }
    return JSON.stringify(value, null, 2)
}

export const DebugConnectionPage = () => {
    const { accessToken, refresh, logout } = useAuth()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [response, setResponse] = useState<UserMeResponse | null>(null)
    const [error, setError] = useState<ApiError | null>(null)

    const handleFetch = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await getMe(accessToken, refresh)
            setResponse(data)
            toast({
                title: "Connected",
                description: "Fetched /users/me successfully."
            })
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            setError(apiError)
            toast({
                title: apiError?.code ?? "Request failed",
                description: apiError?.message ?? "Unable to reach /users/me.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleRefresh = async () => {
        const token = await refresh()
        if (token) {
            toast({
                title: "Session refreshed",
                description: "Received a new access token."
            })
        } else {
            toast({
                title: "Refresh failed",
                description: "No refresh cookie or refresh was rejected.",
                variant: "destructive"
            })
        }
    }

    const handleLogout = async () => {
        await logout()
        toast({
            title: "Logged out",
            description: "Refresh cookie cleared on the backend."
        })
    }

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
            <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Debug connection</CardTitle>
                        <CardDescription>
                            Verify credentials, refresh cookies, and the /users/me response.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline">Session notes</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Session details</DialogTitle>
                                    <DialogDescription>
                                        Refresh cookies are httpOnly, so the browser sends them when
                                        credentials are included.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 text-sm">
                                    <p>Base URL: {apiBaseUrl}</p>
                                    <p>Access token in memory: {accessToken ? "present" : "missing"}</p>
                                    <p>Refresh endpoint: POST /auth/refresh</p>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">Session actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Auth</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleRefresh}>Refresh token</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleFetch} disabled={isLoading}>
                            {isLoading ? "Calling /users/me..." : "Call /users/me"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        API base URL: <span className="font-medium text-foreground">{apiBaseUrl}</span>
                    </div>
                    <Tabs defaultValue="response" className="w-full">
                        <TabsList>
                            <TabsTrigger value="response">Response</TabsTrigger>
                            <TabsTrigger value="error">Error</TabsTrigger>
                        </TabsList>
                        <TabsContent value="response">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">/users/me payload</CardTitle>
                                    <CardDescription>Bearer auth + refresh retry enabled.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-xs">
                                        {response ? formatJson(response) : "No response yet."}
                                    </pre>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="error">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Last error</CardTitle>
                                    <CardDescription>Backend unified error schema if available.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-xs">
                                        {error
                                            ? formatJson({
                                                  status: error.status,
                                                  code: error.code,
                                                  message: error.message,
                                                  details: error.details
                                              })
                                            : "No errors yet."}
                                    </pre>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
