import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, CircleDashed, Rocket } from "lucide-react"

import {
    createCatalogApi,
    type CatalogProduct,
    type CatalogVersion,
    type ListProductsResponse
} from "@/api/catalog"
import { createBillingApi, type ListPlansResponse, type Plan } from "@/api/billing"
import { ApiError } from "@/api/http"
import { useAuth } from "@/auth/auth-context"
import { CopyButton } from "@/components/copy-button"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyBlock } from "@/components/ui-states/empty-block"
import { ErrorBlock } from "@/components/ui-states/error-block"
import { LoadingBlock } from "@/components/ui-states/loading-block"
import { formatCurrency, formatNumber } from "@/lib/format"
import { notifyError, notifyInfo, notifySuccess } from "@/lib/notify"
import { cn } from "@/lib/utils"

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

const getProductId = (product: CatalogProduct) => {
    const record = isRecord(product) ? product : null
    return getString(record, "id") ?? null
}

const getVersionId = (version: CatalogVersion) => {
    const record = isRecord(version) ? version : null
    return getString(record, "id") ?? null
}

const extractProducts = (payload: ListProductsResponse): CatalogProduct[] => {
    if (Array.isArray(payload)) {
        return payload
    }
    if (!isRecord(payload)) {
        return []
    }
    const items = payload.items
    return Array.isArray(items) ? items : []
}

const extractVersions = (payload: unknown): CatalogVersion[] => {
    if (Array.isArray(payload)) {
        return payload
    }
    if (!isRecord(payload)) {
        return []
    }
    const items = payload.items
    return Array.isArray(items) ? items : []
}

const extractPlans = (payload: ListPlansResponse): Plan[] => {
    return payload.items ?? []
}

const splitTags = (raw: string) => {
    return raw
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
}

export const SellerStudioPage = () => {
    const { accessToken, refresh } = useAuth()
    const catalogApi = useMemo(
        () => createCatalogApi({ accessToken, refresh }),
        [accessToken, refresh]
    )
    const billingApi = useMemo(
        () => createBillingApi({ accessToken, refresh }),
        [accessToken, refresh]
    )

    const [products, setProducts] = useState<CatalogProduct[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [versions, setVersions] = useState<CatalogVersion[]>([])
    const [plans, setPlans] = useState<Plan[]>([])

    const [isProductsLoading, setIsProductsLoading] = useState(true)
    const [isDetailsLoading, setIsDetailsLoading] = useState(false)
    const [productsError, setProductsError] = useState<ApiError | null>(null)
    const [detailsError, setDetailsError] = useState<ApiError | null>(null)
    const [retryKey, setRetryKey] = useState(0)

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")
    const [tags, setTags] = useState("")
    const [isCreatingProduct, setIsCreatingProduct] = useState(false)

    const [versionLabel, setVersionLabel] = useState("")
    const [openApiUrl, setOpenApiUrl] = useState("")
    const [isCreatingVersion, setIsCreatingVersion] = useState(false)

    const [planName, setPlanName] = useState("")
    const [planPrice, setPlanPrice] = useState("")
    const [planQuota, setPlanQuota] = useState("")
    const [planCurrency, setPlanCurrency] = useState("USD")
    const [isCreatingPlan, setIsCreatingPlan] = useState(false)

    const selectedProduct = useMemo(() => {
        return products.find((product) => getProductId(product) === selectedProductId) ?? null
    }, [products, selectedProductId])

    const publishedCount = useMemo(() => {
        return products.filter((product) => {
            const record = isRecord(product) ? product : null
            return getString(record, "status") === "PUBLISHED"
        }).length
    }, [products])

    const loadProducts = useCallback(async () => {
        setIsProductsLoading(true)
        setProductsError(null)
        try {
            const response = await catalogApi.listProducts({ limit: 48, offset: 0 })
            const items = extractProducts(response)
            setProducts(items)

            const hasSelectedProduct = items.some(
                (item) => getProductId(item) === selectedProductId
            )
            if (!selectedProductId || !hasSelectedProduct) {
                const fallbackId = items.map((item) => getProductId(item)).find(Boolean) ?? null
                setSelectedProductId(fallbackId)
            }
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            setProductsError(apiError)
            setProducts([])
            notifyError(apiError ?? err, "Could not load products")
        } finally {
            setIsProductsLoading(false)
        }
    }, [catalogApi, selectedProductId])

    useEffect(() => {
        void loadProducts()
    }, [loadProducts, retryKey])

    const loadSelectedDetails = useCallback(
        async (productId: string) => {
            setIsDetailsLoading(true)
            setDetailsError(null)
            try {
                const [versionsResponse, plansResponse] = await Promise.all([
                    catalogApi.getVersions(productId),
                    billingApi.listPlans({ productId })
                ])
                setVersions(extractVersions(versionsResponse))
                setPlans(extractPlans(plansResponse))
            } catch (err) {
                const apiError = err instanceof ApiError ? err : null
                setDetailsError(apiError)
                setVersions([])
                setPlans([])
                notifyError(apiError ?? err, "Could not load product details")
            } finally {
                setIsDetailsLoading(false)
            }
        },
        [billingApi, catalogApi]
    )

    useEffect(() => {
        if (!selectedProductId) {
            setVersions([])
            setPlans([])
            return
        }
        void loadSelectedDetails(selectedProductId)
    }, [selectedProductId, loadSelectedDetails])

    const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const trimmedTitle = title.trim()
        const trimmedDescription = description.trim()
        const trimmedCategory = category.trim()

        if (!trimmedTitle || !trimmedDescription || !trimmedCategory) {
            notifyInfo("Missing fields", "Title, description, and category are required.")
            return
        }

        setIsCreatingProduct(true)
        try {
            const created = await catalogApi.createProduct({
                title: trimmedTitle,
                description: trimmedDescription,
                category: trimmedCategory,
                tags: splitTags(tags)
            })
            const createdProduct = created as CatalogProduct
            const createdId = getProductId(createdProduct)

            setProducts((prev) => [createdProduct, ...prev])
            if (createdId) {
                setSelectedProductId(createdId)
            }

            setTitle("")
            setDescription("")
            setCategory("")
            setTags("")
            notifySuccess("Product created", "Your API product has been added to the workspace.")
        } catch (err) {
            notifyError(err, "Create product failed")
        } finally {
            setIsCreatingProduct(false)
        }
    }

    const handleChangeProductStatus = async (status: "DRAFT" | "PUBLISHED" | "HIDDEN") => {
        if (!selectedProductId) {
            notifyInfo("Select a product", "Pick a product before changing status.")
            return
        }

        try {
            const updated = await catalogApi.updateProduct(selectedProductId, { status })
            setProducts((prev) =>
                prev.map((product) => {
                    return getProductId(product) === selectedProductId
                        ? (updated as CatalogProduct)
                        : product
                })
            )
            notifySuccess("Status updated", `Product status set to ${status}.`)
        } catch (err) {
            notifyError(err, "Update status failed")
        }
    }

    const handleCreateVersion = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!selectedProductId) {
            notifyInfo("Select a product", "Pick a product before creating versions.")
            return
        }

        const trimmedVersion = versionLabel.trim()
        const trimmedUrl = openApiUrl.trim()
        if (!trimmedVersion || !trimmedUrl) {
            notifyInfo("Missing fields", "Version label and OpenAPI URL are required.")
            return
        }

        setIsCreatingVersion(true)
        try {
            const created = await catalogApi.createVersion(selectedProductId, {
                version: trimmedVersion,
                openApiUrl: trimmedUrl
            })
            setVersions((prev) => [created as CatalogVersion, ...prev])
            setVersionLabel("")
            setOpenApiUrl("")
            notifySuccess("Version created", "New API version is now available in draft mode.")
        } catch (err) {
            notifyError(err, "Create version failed")
        } finally {
            setIsCreatingVersion(false)
        }
    }

    const handleCreatePlan = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!selectedProductId) {
            notifyInfo("Select a product", "Pick a product before creating plans.")
            return
        }

        const trimmedName = planName.trim()
        const parsedPrice = Number(planPrice)
        const parsedQuota = Number(planQuota)

        if (!trimmedName || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isFinite(parsedQuota) || parsedQuota <= 0) {
            notifyInfo("Invalid plan fields", "Use a name, positive price, and positive quota.")
            return
        }

        setIsCreatingPlan(true)
        try {
            const created = await billingApi.createPlan({
                productId: selectedProductId,
                name: trimmedName,
                priceCents: Math.round(parsedPrice * 100),
                currency: planCurrency.trim().toUpperCase() || "USD",
                period: "MONTH",
                quotaRequests: Math.round(parsedQuota),
                isActive: true
            })
            setPlans((prev) => [created, ...prev])
            setPlanName("")
            setPlanPrice("")
            setPlanQuota("")
            notifySuccess("Plan created", "The pricing plan is now available for subscriptions.")
        } catch (err) {
            notifyError(err, "Create plan failed")
        } finally {
            setIsCreatingPlan(false)
        }
    }

    const selectedProductRecord = isRecord(selectedProduct) ? selectedProduct : null
    const selectedStatus = getString(selectedProductRecord, "status")
    const selectedTags = getStringArray(selectedProductRecord, "tags")

    return (
        <div className="flex flex-col gap-8">
            <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-8 text-white shadow-2xl">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />
                <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="relative z-10 space-y-4">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                        <Rocket className="h-3.5 w-3.5" />
                        Seller Studio
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Build, release, and monetize your APIs
                    </h1>
                    <p className="max-w-2xl text-sm text-white/85 md:text-base">
                        This workspace is tailored for sellers: publish products, release versions, and create pricing plans.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <StatChip label="Visible products" value={String(products.length)} />
                        <StatChip label="Published" value={String(publishedCount)} />
                        <StatChip label="Plans (selected product)" value={String(plans.length)} />
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="border-emerald-500/20">
                    <CardHeader>
                        <CardTitle>Create Product</CardTitle>
                        <CardDescription>Start a new API listing for your catalog.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleCreateProduct}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="seller-title">Title</Label>
                                    <Input
                                        id="seller-title"
                                        placeholder="Payments API"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="seller-category">Category</Label>
                                    <Input
                                        id="seller-category"
                                        placeholder="fintech"
                                        value={category}
                                        onChange={(event) => setCategory(event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="seller-tags">Tags (comma separated)</Label>
                                    <Input
                                        id="seller-tags"
                                        placeholder="payments, cards, invoices"
                                        value={tags}
                                        onChange={(event) => setTags(event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="seller-description">Description</Label>
                                    <textarea
                                        id="seller-description"
                                        className={cn(
                                            "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                                            "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none",
                                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        )}
                                        placeholder="Accept payments with a single endpoint."
                                        value={description}
                                        onChange={(event) => setDescription(event.target.value)}
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={isCreatingProduct}>
                                {isCreatingProduct ? "Creating..." : "Create product"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Selected Product</CardTitle>
                        <CardDescription>
                            Choose a product below to configure versions and plans.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {selectedProductRecord ? (
                            <>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">
                                        {getString(selectedProductRecord, "title") ?? "Untitled product"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {getString(selectedProductRecord, "category") ?? "Uncategorized"}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {selectedStatus ? <StatusBadge kind="product" value={selectedStatus} /> : null}
                                    {selectedTags.slice(0, 4).map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                {selectedProductId ? (
                                    <CopyButton
                                        value={selectedProductId}
                                        label="Copy product ID"
                                        size="sm"
                                    />
                                ) : null}
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={selectedStatus === "DRAFT" ? "default" : "outline"}
                                        onClick={() => handleChangeProductStatus("DRAFT")}
                                    >
                                        Set draft
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={selectedStatus === "PUBLISHED" ? "default" : "outline"}
                                        onClick={() => handleChangeProductStatus("PUBLISHED")}
                                    >
                                        Publish
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={selectedStatus === "HIDDEN" ? "default" : "outline"}
                                        onClick={() => handleChangeProductStatus("HIDDEN")}
                                    >
                                        Hide
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <EmptyBlock
                                title="No product selected"
                                description="Create or choose a product to manage releases and plans."
                                variant="question"
                            />
                        )}
                    </CardContent>
                </Card>
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Release Versions</CardTitle>
                            <CardDescription>
                                Publish a new OpenAPI definition for the selected product.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form className="space-y-3" onSubmit={handleCreateVersion}>
                                <div className="space-y-2">
                                    <Label htmlFor="version-label">Version</Label>
                                    <Input
                                        id="version-label"
                                        placeholder="v1"
                                        value={versionLabel}
                                        onChange={(event) => setVersionLabel(event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="version-openapi">OpenAPI URL</Label>
                                    <Input
                                        id="version-openapi"
                                        placeholder="https://example.com/openapi.json"
                                        value={openApiUrl}
                                        onChange={(event) => setOpenApiUrl(event.target.value)}
                                    />
                                </div>
                                <Button type="submit" size="sm" disabled={isCreatingVersion || !selectedProductId}>
                                    {isCreatingVersion ? "Creating..." : "Create version"}
                                </Button>
                            </form>

                            {isDetailsLoading ? (
                                <LoadingBlock title="Loading versions..." count={2} variant="lines" />
                            ) : null}

                            {detailsError && !isDetailsLoading ? (
                                <ErrorBlock
                                    title="Could not load versions"
                                    description={detailsError.message || "Please select another product."}
                                    code={detailsError.code}
                                />
                            ) : null}

                            {!isDetailsLoading && !detailsError && versions.length > 0 ? (
                                <div className="space-y-2">
                                    {versions.slice(0, 4).map((version, index) => {
                                        const record = isRecord(version) ? version : null
                                        const versionId = getVersionId(version)
                                        const versionName = getString(record, "version") ?? `Version ${index + 1}`
                                        const versionStatus = getString(record, "status")
                                        return (
                                            <div
                                                key={versionId ?? `${versionName}-${index}`}
                                                className="flex items-center justify-between rounded-lg border px-3 py-2"
                                            >
                                                <span className="text-sm font-medium">{versionName}</span>
                                                {versionStatus ? (
                                                    <StatusBadge kind="version" value={versionStatus} />
                                                ) : (
                                                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Create Pricing Plan</CardTitle>
                            <CardDescription>
                                Set monthly pricing and quota for the selected product.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form className="space-y-3" onSubmit={handleCreatePlan}>
                                <div className="space-y-2">
                                    <Label htmlFor="plan-name">Plan name</Label>
                                    <Input
                                        id="plan-name"
                                        placeholder="Starter"
                                        value={planName}
                                        onChange={(event) => setPlanName(event.target.value)}
                                    />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="plan-price">Price / month</Label>
                                        <Input
                                            id="plan-price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="19.99"
                                            value={planPrice}
                                            onChange={(event) => setPlanPrice(event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="plan-currency">Currency</Label>
                                        <Input
                                            id="plan-currency"
                                            maxLength={3}
                                            placeholder="USD"
                                            value={planCurrency}
                                            onChange={(event) => setPlanCurrency(event.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan-quota">Quota requests / month</Label>
                                    <Input
                                        id="plan-quota"
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="10000"
                                        value={planQuota}
                                        onChange={(event) => setPlanQuota(event.target.value)}
                                    />
                                </div>
                                <Button type="submit" size="sm" disabled={isCreatingPlan || !selectedProductId}>
                                    {isCreatingPlan ? "Creating..." : "Create plan"}
                                </Button>
                            </form>

                            {!isDetailsLoading && plans.length > 0 ? (
                                <div className="space-y-2">
                                    {plans.slice(0, 4).map((plan) => (
                                        <div
                                            key={plan.id}
                                            className="rounded-lg border px-3 py-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium">{plan.name}</p>
                                                {plan.isActive ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Inactive</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(plan.priceCents, plan.currency)} - {formatNumber(plan.quotaRequests)} requests
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Product List</CardTitle>
                    <CardDescription>
                        Select the API you want to configure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isProductsLoading ? (
                        <LoadingBlock title="Loading products..." count={3} />
                    ) : null}

                    {productsError && !isProductsLoading ? (
                        <ErrorBlock
                            title="Could not load products"
                            description={productsError.message || "Please retry."}
                            code={productsError.code}
                            onRetry={() => setRetryKey((prev) => prev + 1)}
                        />
                    ) : null}

                    {!isProductsLoading && !productsError && products.length === 0 ? (
                        <EmptyBlock
                            title="No products yet"
                            description="Create your first product to start building your seller catalog."
                            variant="default"
                        />
                    ) : null}

                    {!isProductsLoading && !productsError && products.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {products.map((product, index) => {
                                const record = isRecord(product) ? product : null
                                const productId = getProductId(product)
                                const isSelected = productId !== null && productId === selectedProductId
                                const titleValue = getString(record, "title") ?? `Product ${index + 1}`
                                const descriptionValue = getString(record, "description") ?? "No description"
                                const statusValue = getString(record, "status")

                                return (
                                    <button
                                        key={productId ?? `product-${index}`}
                                        type="button"
                                        className={cn(
                                            "rounded-xl border p-4 text-left transition-all",
                                            "hover:border-primary/40 hover:bg-muted/30",
                                            isSelected && "border-primary bg-primary/5"
                                        )}
                                        onClick={() => setSelectedProductId(productId)}
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-3">
                                            <p className="font-semibold">{titleValue}</p>
                                            {statusValue ? (
                                                <StatusBadge kind="product" value={statusValue} />
                                            ) : null}
                                        </div>
                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                            {descriptionValue}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}

const StatChip = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-wide text-white/70">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
        </div>
    )
}
