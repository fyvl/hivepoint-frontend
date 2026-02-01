import { type FormEvent, useEffect, useMemo, useState } from "react"

import { ApiError } from "@/api/http"
import { createKeysApi, type CreateKeyResponse, type KeyItem } from "@/api/keys"
import { useAuth } from "@/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const formatDate = (value: string | null) => {
    if (!value) {
        return "—"
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }
    return date.toLocaleDateString()
}

export const KeysPage = () => {
    const { accessToken, refresh } = useAuth()
    const { toast } = useToast()
    const keysApi = useMemo(
        () => createKeysApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [label, setLabel] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [keys, setKeys] = useState<KeyItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)
    const [rawKey, setRawKey] = useState<string | null>(null)
    const [newKeyMeta, setNewKeyMeta] = useState<CreateKeyResponse | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [revokingId, setRevokingId] = useState<string | null>(null)

    const loadKeys = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await keysApi.listKeys()
            setKeys(response.items)
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            setError(apiError)
            setKeys([])
            toast({
                title: apiError?.code ?? "Keys error",
                description: apiError?.message ?? "Unable to load API keys.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadKeys()
    }, [keysApi])

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!label.trim()) {
            return
        }

        setIsCreating(true)
        try {
            const response = await keysApi.createKey({ label: label.trim() })
            setLabel("")
            setRawKey(response.rawKey)
            setNewKeyMeta(response)
            setIsDialogOpen(true)
            toast({
                title: "Key created",
                description: "Copy the key now. It will not be shown again."
            })
            await loadKeys()
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            toast({
                title: apiError?.code ?? "Create failed",
                description: apiError?.message ?? "Unable to create key.",
                variant: "destructive"
            })
        } finally {
            setIsCreating(false)
        }
    }

    const handleCopy = async () => {
        if (!rawKey) {
            return
        }
        try {
            await navigator.clipboard.writeText(rawKey)
            toast({
                title: "Copied",
                description: "API key copied to clipboard."
            })
        } catch {
            toast({
                title: "Copy failed",
                description: "Unable to copy API key.",
                variant: "destructive"
            })
        }
    }

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setRawKey(null)
            setNewKeyMeta(null)
        }
    }

    const handleRevoke = async (keyId: string) => {
        setRevokingId(keyId)
        try {
            await keysApi.revokeKey(keyId)
            toast({
                title: "Key revoked",
                description: "The key has been revoked."
            })
            await loadKeys()
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            toast({
                title: apiError?.code ?? "Revoke failed",
                description: apiError?.message ?? "Unable to revoke key.",
                variant: "destructive"
            })
        } finally {
            setRevokingId(null)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">API Keys</h1>
                <p className="text-sm text-muted-foreground">
                    Create and manage keys for accessing your subscriptions.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create API key</CardTitle>
                    <CardDescription>
                        The raw key is shown only once. Store it securely.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreate}>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="key-label">Label</Label>
                            <Input
                                id="key-label"
                                value={label}
                                onChange={(event) => setLabel(event.target.value)}
                                placeholder="My key"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? "Creating..." : "Create"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your keys</CardTitle>
                    <CardDescription>Active and revoked keys for this account.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && !isLoading ? (
                        <div className="text-sm text-muted-foreground">
                            {error.message || "Unable to fetch keys."}
                        </div>
                    ) : null}

                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Card key={`keys-skeleton-${index}`} className="animate-pulse">
                                    <CardHeader>
                                        <div className="h-4 w-1/3 rounded bg-muted" />
                                        <div className="h-3 w-1/2 rounded bg-muted" />
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : null}

                    {!isLoading && keys.length === 0 && !error ? (
                        <div className="text-sm text-muted-foreground">
                            No keys yet. Create one above.
                        </div>
                    ) : null}

                    {!isLoading && keys.length > 0 ? (
                        <div className="space-y-3">
                            {keys.map((key) => (
                                <KeyRow
                                    key={key.id}
                                    item={key}
                                    onRevoke={handleRevoke}
                                    isRevoking={revokingId === key.id}
                                />
                            ))}
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New API key</DialogTitle>
                        <DialogDescription>
                            This key is shown only once. Store it securely.
                        </DialogDescription>
                    </DialogHeader>
                    {rawKey ? (
                        <div className="space-y-3">
                            <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
                                {rawKey}
                            </div>
                            <Button type="button" variant="outline" onClick={handleCopy}>
                                Copy key
                            </Button>
                            {newKeyMeta ? (
                                <div className="text-xs text-muted-foreground">
                                    Label: {newKeyMeta.label} · Created {formatDate(newKeyMeta.createdAt)}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">No key available.</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

type KeyRowProps = {
    item: KeyItem
    onRevoke: (id: string) => void
    isRevoking: boolean
}

const KeyRow = ({ item, onRevoke, isRevoking }: KeyRowProps) => {
    const isRevoked = !item.isActive
    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div className="flex items-center gap-2">
                    <div className="font-medium">{item.label}</div>
                    <Badge variant={isRevoked ? "secondary" : "default"}>
                        {isRevoked ? "Revoked" : "Active"}
                    </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                    Created: {formatDate(item.createdAt)}
                    {item.revokedAt ? ` · Revoked: ${formatDate(item.revokedAt)}` : ""}
                </div>
            </div>
            <Button
                variant="outline"
                size="sm"
                disabled={isRevoked || isRevoking}
                onClick={() => onRevoke(item.id)}
            >
                {isRevoking ? "Revoking..." : "Revoke"}
            </Button>
        </div>
    )
}
