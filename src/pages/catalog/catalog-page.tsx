import { type CSSProperties, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import {
    createCatalogApi,
    type CatalogListResult,
    type CatalogProduct
} from "@/api/catalog"
import { ApiError } from "@/api/http"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"

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

export const CatalogPage = () => {
    const { accessToken, refresh } = useAuth()
    const { toast } = useToast()
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

    const debouncedSearch = useDebouncedValue(search, 400)
    const debouncedCategory = useDebouncedValue(category, 400)

    useEffect(() => {
        setOffset(0)
    }, [debouncedSearch, debouncedCategory, limit])

    useEffect(() => {
        let isActive = true

        const load = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const result = (await catalogApi.listProducts({
                    search: debouncedSearch || undefined,
                    category: debouncedCategory || undefined,
                    limit,
                    offset
                })) as CatalogListResult

                if (!isActive) {
                    return
                }

                setState({
                    items: result.items,
                    total: result.total
                })
            } catch (err) {
                if (!isActive) {
                    return
                }

                const apiError = err instanceof ApiError ? err : null
                setError(apiError)
                setState({ items: [] })

                toast({
                    title: apiError?.code ?? "Catalog error",
                    description: apiError?.message ?? "Unable to load the catalog.",
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
    }, [catalogApi, debouncedSearch, debouncedCategory, limit, offset, toast])

    const hasPrev = offset > 0
    const hasNext = state.total !== undefined
        ? offset + limit < state.total
        : state.items.length === limit

    const showingText = state.total !== undefined
        ? state.total === 0
            ? "0 of 0"
            : `${offset + 1}-${Math.min(offset + limit, state.total)} of ${state.total}`
        : `Showing ${state.items.length} items`

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

            {error && !isLoading ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Catalog unavailable</CardTitle>
                        <CardDescription>
                            {error.message || "Unable to fetch products."}
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : null}

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: Math.min(limit, 6) }).map((_, index) => (
                        <Card key={`skeleton-${index}`} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 w-1/2 rounded bg-muted" />
                                <div className="h-3 w-3/4 rounded bg-muted" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-3 w-full rounded bg-muted" />
                                <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                            </CardContent>
                            <CardFooter className="justify-between">
                                <div className="h-6 w-20 rounded bg-muted" />
                                <div className="h-8 w-20 rounded bg-muted" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : null}

            {!isLoading && state.items.length === 0 && !error ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No products found</CardTitle>
                        <CardDescription>Try adjusting your filters.</CardDescription>
                    </CardHeader>
                </Card>
            ) : null}

            {!isLoading && state.items.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {state.items.map((product, index) => (
                        <CatalogCard key={product.id ?? `product-${index}`} product={product} />
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

const CatalogCard = ({ product }: { product: CatalogProduct }) => {
    const title = product.title ?? "Untitled product"
    const description = product.description ?? "No description available yet."
    const category = product.category ?? "Uncategorized"
    const tags = Array.isArray(product.tags)
        ? product.tags.filter((tag) => typeof tag === "string")
        : []

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
                <span className="text-xs text-muted-foreground">{product.status ?? ""}</span>
                {product.id ? (
                    <Button asChild size="sm">
                        <Link to={`/products/${product.id}`}>View</Link>
                    </Button>
                ) : (
                    <Button size="sm" disabled>
                        View
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
