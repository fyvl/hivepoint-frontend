import { type CSSProperties, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import {
    createCatalogApi,
    type CatalogProduct,
    type ListProductsResponse
} from "@/api/catalog"
import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { StatusBadge } from "@/components/status-badge"
import { CatalogGridSkeleton } from "@/components/skeletons/catalog-grid-skeleton"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyBlock } from "@/components/ui-states/empty-block"
import { ErrorBlock } from "@/components/ui-states/error-block"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { notifyError } from "@/lib/notify"
import { fetchWithCache } from "@/lib/request-cache"

const limitOptions = [6, 12, 24]

const clampStyle: CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
}

type CatalogFetchState = {
    items: CatalogProduct[]
    total?: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null
}

const isAbortError = (error: unknown) => {
    if (!isRecord(error)) {
        return false
    }
    const name = error.name
    return typeof name === "string" && name === "AbortError"
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

const extractListItems = (payload: ListProductsResponse): CatalogProduct[] => {
    if (Array.isArray(payload)) {
        return payload
    }

    if (!isRecord(payload)) {
        return []
    }

    const items = payload.items
    return Array.isArray(items) ? items : []
}

const extractListTotal = (payload: ListProductsResponse): number | undefined => {
    if (!isRecord(payload)) {
        return undefined
    }

    const total = payload.total
    return typeof total === "number" ? total : undefined
}

export const CatalogPage = () => {
    const { accessToken, refresh } = useAuth()
    const catalogApi = useMemo(
        () => createCatalogApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [search, setSearch] = useState("")
    const [category, setCategory] = useState("")
    const [limit, setLimit] = useState(12)
    const [offset, setOffset] = useState(0)
    const [state, setState] = useState<CatalogFetchState>({ items: [] })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)
    const [retryKey, setRetryKey] = useState(0)

    const debouncedSearch = useDebouncedValue(search, 400)
    const debouncedCategory = useDebouncedValue(category, 400)

    useEffect(() => {
        setOffset(0)
    }, [debouncedSearch, debouncedCategory, limit])

    useEffect(() => {
        const controller = new AbortController()
        let isActive = true

        const load = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const query: Record<string, unknown> = {
                    limit,
                    offset
                }

                if (debouncedSearch) {
                    query.search = debouncedSearch
                }

                if (debouncedCategory) {
                    query.category = debouncedCategory
                }

                const cacheKey = `catalog:list:${accessToken ?? "public"}:${JSON.stringify(
                    query
                )}`
                const result = await fetchWithCache(
                    cacheKey,
                    async () => await catalogApi.listProducts(query, { signal: controller.signal }),
                    30000
                )

                if (!isActive) {
                    return
                }

                setState({
                    items: extractListItems(result),
                    total: extractListTotal(result)
                })
            } catch (err) {
                if (isAbortError(err)) {
                    return
                }

                if (!isActive) {
                    return
                }

                const apiError = err instanceof ApiError ? err : null
                setError(apiError)
                setState({ items: [] })

                notifyError(apiError ?? err, "Catalog error")
            } finally {
                if (isActive) {
                    setIsLoading(false)
                }
            }
        }

        load()

        return () => {
            isActive = false
            controller.abort()
        }
    }, [catalogApi, debouncedSearch, debouncedCategory, limit, offset, retryKey])

    const hasPrev = offset > 0
    const hasNext = state.total !== undefined
        ? offset + limit < state.total
        : state.items.length === limit

    const showingText = state.total !== undefined
        ? state.total === 0
            ? "0 of 0"
            : `${offset + 1}-${Math.min(offset + limit, state.total)} of ${state.total}`
        : `Showing ${state.items.length} items`
    const hasFilters = Boolean(search) || Boolean(category)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Catalog</h1>
                    <p className="text-sm text-muted-foreground">
                        Browse published API products.
                    </p>
                </div>
                <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="catalog-search">Search</Label>
                        <Input
                            id="catalog-search"
                            placeholder="Search products"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="catalog-category">Category</Label>
                        <Input
                            id="catalog-category"
                            placeholder="payments"
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{showingText}</p>
                <div className="flex items-center gap-2">
                    {limitOptions.map((value) => (
                        <Button
                            key={value}
                            variant={limit === value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setLimit(value)}
                        >
                            {value}
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <CatalogGridSkeleton count={Math.min(limit, 6)} />
            ) : null}

            {error && !isLoading ? (
                <ErrorBlock
                    title="Catalog unavailable"
                    description={error.message || "Unable to fetch products."}
                    code={error.code}
                    onRetry={() => setRetryKey((prev) => prev + 1)}
                />
            ) : null}

            {!isLoading && state.items.length === 0 && !error ? (
                <EmptyBlock
                    title="No products found"
                    description="Try adjusting your filters."
                    actionLabel={hasFilters ? "Clear filters" : undefined}
                    onAction={
                        hasFilters
                            ? () => {
                                  setSearch("")
                                  setCategory("")
                              }
                            : undefined
                    }
                />
            ) : null}

            {!isLoading && state.items.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {state.items.map((product, index) => (
                        <CatalogCard key={getCardKey(product, index)} product={product} />
                    ))}
                </div>
            ) : null}

            <div className="flex items-center justify-between gap-4">
                <Button
                    variant="outline"
                    onClick={() => setOffset((prev) => Math.max(prev - limit, 0))}
                    disabled={!hasPrev}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setOffset((prev) => prev + limit)}
                    disabled={!hasNext}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}

const getCardKey = (product: CatalogProduct, index: number) => {
    const record = isRecord(product) ? product : null
    const id = getString(record, "id")
    return id ?? `product-${index}`
}

const CatalogCard = ({ product }: { product: CatalogProduct }) => {
    const record = isRecord(product) ? product : null
    const title = getString(record, "title") ?? "Untitled product"
    const description = getString(record, "description") ?? "No description available yet."
    const category = getString(record, "category") ?? "Uncategorized"
    const status = getString(record, "status") ?? ""
    const tags = getStringArray(record, "tags")
    const productId = getString(record, "id")

    return (
        <Card className="flex h-full flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground" style={clampStyle}>
                    {description}
                </p>
                {tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                ) : null}
            </CardContent>
            <CardFooter className="justify-between">
                {status ? (
                    <StatusBadge kind="product" value={status} />
                ) : (
                    <span className="text-xs text-muted-foreground" />
                )}
                {productId ? (
                    <Button asChild size="sm">
                        <Link to={`/products/${productId}`}>Open</Link>
                    </Button>
                ) : (
                    <Button size="sm" disabled>
                        Open
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
