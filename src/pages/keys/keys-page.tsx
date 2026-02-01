import { type FormEvent, useEffect, useMemo, useState } from "react"

import { ApiError } from "@/api/http"
import { createKeysApi, type CreateKeyResponse, type KeyItem } from "@/api/keys"
import { useAuth } from "@/auth/auth-context"
import { CopyButton } from "@/components/copy-button"
import { KeysTableSkeleton } from "@/components/skeletons/keys-table-skeleton"
import { StatusBadge } from "@/components/status-badge"
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
import { EmptyBlock } from "@/components/ui-states/empty-block"
import { ErrorBlock } from "@/components/ui-states/error-block"
import { notifyError, notifySuccess } from "@/lib/notify"
import { formatDate } from "@/lib/format"

export const KeysPage = () => {
    const { accessToken, refresh } = useAuth()
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
    const [retryKey, setRetryKey] = useState(0)

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
            notifyError(apiError ?? err, "Keys error")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadKeys()
    }, [keysApi, retryKey])

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
            notifySuccess("API key created", "Copy the key now. It will not be shown again.")
            await loadKeys()
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            notifyError(apiError ?? err, "Create failed")
        } finally {
            setIsCreating(false)
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
            notifySuccess("API key revoked", "The key has been revoked.")
            await loadKeys()
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            notifyError(apiError ?? err, "Revoke failed")
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

            {isLoading ? <KeysTableSkeleton /> : null}

            {error && !isLoading ? (
                <ErrorBlock
                    title="Keys unavailable"
                    description={error.message || "Unable to fetch keys."}
                    code={error.code}
                    onRetry={() => setRetryKey((prev) => prev + 1)}
                />
            ) : null}

            {!isLoading && keys.length === 0 && !error ? (
                <EmptyBlock
                    title="No keys yet"
                    description="Create a key above to start using the API."
                />
            ) : null}

            {!isLoading && keys.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Your keys</CardTitle>
                        <CardDescription>Active and revoked keys for this account.</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            ) : null}

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
                            <CopyButton value={rawKey} label="Copy key" />
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
                    <StatusBadge kind="key" value={isRevoked ? "Revoked" : "Active"} />
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

