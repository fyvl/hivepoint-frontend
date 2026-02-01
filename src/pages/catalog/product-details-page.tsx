import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import {
    createCatalogApi,
    type CatalogProduct,
    type CatalogVersion,
    type GetProductResponse,
    type GetVersionsResponse
} from "@/api/catalog"
import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null
}

const getString = (record: Record<string, unknown> | null, key: string) => {
    if (!record) {
        return undefined
    }
    const value = record[key]
    return typeof value === "string" ? value : undefined
}

const getStringArray = (record: Record<string, unknown> | null, key: string) => {
    if (!record) {
        return []
    }
    const value = record[key]
    if (!Array.isArray(value)) {
        return []
    }
    return value.filter((item) => typeof item === "string")
}

const extractVersions = (payload: GetVersionsResponse): CatalogVersion[] => {
    if (Array.isArray(payload)) {
        return payload
    }

    if (!isRecord(payload)) {
        return []
    }

    const items = payload.items
    return Array.isArray(items) ? items : []
}

export const ProductDetailsPage = () => {
    const { id } = useParams<{ id: string }>()
    const { accessToken, refresh } = useAuth()
    const { toast } = useToast()
    const catalogApi = useMemo(
        () => createCatalogApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [product, setProduct] = useState<CatalogProduct | null>(null)
    const [versions, setVersions] = useState<CatalogVersion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)

    useEffect(() => {
        if (!id) {
            setError(new ApiError(400, "Missing product id"))
            setIsLoading(false)
            return
        }

        let isActive = true

        const load = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const [productResponse, versionResponse] = await Promise.all([
                    catalogApi.getProduct(id),
                    catalogApi.getVersions(id)
                ])

                if (!isActive) {
                    return
                }

                setProduct(productResponse as GetProductResponse)
                setVersions(extractVersions(versionResponse))
            } catch (err) {
                if (!isActive) {
                    return
                }

                const apiError = err instanceof ApiError ? err : null
                setError(apiError)
                setProduct(null)
                setVersions([])

                toast({
                    title: apiError?.code ?? "Product error",
                    description: apiError?.message ?? "Unable to load product details.",
                    variant: "destructive"
                })
            } finally {
                if (isActive) {
                    setIsLoading(false)
                }
            }
        }

        load()

        return () => {
            isActive = false
        }
    }, [catalogApi, id, toast])

    if (isLoading) {
        return (
            <div className="grid gap-4">
                <Card className="animate-pulse">
                    <CardHeader>
                        <div className="h-4 w-1/3 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                    </CardContent>
                </Card>
                <Card className="animate-pulse">
                    <CardHeader>
                        <div className="h-4 w-1/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (error) {
        const isForbidden = error.status === 403 || error.code === "FORBIDDEN"
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Product unavailable</CardTitle>
                    <CardDescription>
                        {error.message || "Unable to load this product."}
                    </CardDescription>
                </CardHeader>
                {isForbidden ? (
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            This product might be private. Try signing in to access it.
                        </p>
                        <div className="mt-4">
                            <Button asChild variant="outline" size="sm">
                                <Link to="/login">Go to login</Link>
                            </Button>
                        </div>
                    </CardContent>
                ) : null}
            </Card>
        )
    }

    if (!product) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Product not found</CardTitle>
                    <CardDescription>No product data was returned.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const productRecord = isRecord(product) ? product : null
    const tags = getStringArray(productRecord, "tags")

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>{getString(productRecord, "title") ?? "Untitled product"}</CardTitle>
                    <CardDescription>{getString(productRecord, "category") ?? "Uncategorized"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {getString(productRecord, "description") ?? "No description available."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                                {tag}
                            </Badge>
                        ))}
                        {getString(productRecord, "status") ? (
                            <Badge variant="outline">{getString(productRecord, "status")}</Badge>
                        ) : null}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Versions</CardTitle>
                    <CardDescription>Published versions for this product.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {versions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No versions available.</p>
                    ) : (
                        versions.map((version, index) => {
                            const versionRecord = isRecord(version) ? version : null
                            const versionId = getString(versionRecord, "id")
                            const versionLabel = getString(versionRecord, "version") ?? "Unnamed version"
                            const status = getString(versionRecord, "status") ?? ""
                            const openApiUrl = getString(versionRecord, "openApiUrl")

                            return (
                                <div
                                    key={versionId ?? `${versionLabel}-${index}`}
                                    className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-medium">{versionLabel}</p>
                                        <p className="text-sm text-muted-foreground">{status}</p>
                                    </div>
                                    {openApiUrl ? (
                                        <Button asChild variant="link">
                                            <a href={openApiUrl} target="_blank" rel="noreferrer">
                                                OpenAPI
                                            </a>
                                        </Button>
                                    ) : null}
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
