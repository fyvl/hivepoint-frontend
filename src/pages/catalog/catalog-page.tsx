import { type CSSProperties, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, ChevronLeft, ChevronRight, Search, Tag } from "lucide-react"

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
import { cn } from "@/lib/utils"

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
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">API Catalog</h1>
                    <p className="text-muted-foreground">
                        Discover and integrate powerful APIs for your applications
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-soft sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1.5">
                        <Label htmlFor="catalog-search" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Search
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="catalog-search"
                                placeholder="Search products..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="flex-1 space-y-1.5 sm:max-w-[200px]">
                        <Label htmlFor="catalog-category" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Category
                        </Label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="catalog-category"
                                placeholder="All categories"
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{showingText}</p>
                <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
                    {limitOptions.map((value) => (
                        <Button
                            key={value}
                            variant={limit === value ? "default" : "ghost"}
                            size="sm"
                            className={cn(
                                "h-8 px-3",
                                limit === value && "shadow-sm"
                            )}
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

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset((prev) => Math.max(prev - limit, 0))}
                    disabled={!hasPrev}
                    className="gap-1"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset((prev) => prev + limit)}
                    disabled={!hasNext}
                    className="gap-1"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
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
        <Card className="group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="mb-2 text-xs font-normal">
                        {category}
                    </Badge>
                    {status ? <StatusBadge kind="product" value={status} /> : null}
                </div>
                <CardTitle className="line-clamp-1 text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <p className="text-sm text-muted-foreground" style={clampStyle}>
                    {description}
                </p>
                {tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs font-normal">
                                {tag}
                            </Badge>
                        ))}
                        {tags.length > 3 && (
                            <Badge variant="outline" className="text-xs font-normal">
                                +{tags.length - 3}
                            </Badge>
                        )}
                    </div>
                ) : null}
            </CardContent>
            <CardFooter className="border-t bg-muted/30 pt-4">
                {productId ? (
                    <Button asChild className="w-full gap-2 shadow-glow hover:shadow-glow-lg">
                        <Link to={`/products/${productId}`}>
                            View Details
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                ) : (
                    <Button className="w-full" disabled>
                        View Details
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
