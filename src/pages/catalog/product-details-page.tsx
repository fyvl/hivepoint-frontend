import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"

import {
    createCatalogApi,
    type CatalogProduct,
    type CatalogVersion,
    type GetProductResponse,
    type GetVersionsResponse,
    type VersionSchemaResponse
} from "@/api/catalog"
import {
    createBillingApi,
    type ListPlansResponse,
    type Plan,
    type SubscribeResponse
} from "@/api/billing"
import { createGatewayApi, type GatewayDispatchResponse, type GatewayMethod } from "@/api/gateway"
import { ApiError } from "@/api/http"
import { createKeysApi } from "@/api/keys"
import { useAuth } from "@/auth/auth-context"
import { CopyButton } from "@/components/copy-button"
import { ProductDetailsSkeleton } from "@/components/skeletons/product-details-skeleton"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { EmptyBlock } from "@/components/ui-states/empty-block"
import { ErrorBlock } from "@/components/ui-states/error-block"
import { LoadingBlock } from "@/components/ui-states/loading-block"
import { apiBaseUrl } from "@/config/env"
import { notifyError, notifyInfo, notifySuccess } from "@/lib/notify"
import {
    formatCurrency,
    formatDate,
    formatNumber,
    formatRequestsPerMinute
} from "@/lib/format"
import { clearCachedRawApiKey, getCachedRawApiKey, saveCachedRawApiKey } from "@/lib/raw-api-key-cache"
import { DevMockPaymentActions } from "@/pages/billing/dev-mock-payment"

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

const extractPlans = (payload: ListPlansResponse): Plan[] => {
    return payload.items ?? []
}

type EndpointOption = {
    method: GatewayMethod
    path: string
}

type SchemaState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "available"; payload: VersionSchemaResponse }
    | { status: "unavailable" }
    | { status: "error"; error: ApiError | null }

const isVersionPublished = (version: CatalogVersion) => {
    const record = isRecord(version) ? version : null
    return getString(record, "status") === "PUBLISHED"
}

const pickPreferredVersion = (versions: CatalogVersion[]) => {
    return versions.find((version) => isVersionPublished(version)) ?? versions[0] ?? null
}

const isSchemaUnavailableError = (error: ApiError | null) => {
    return error?.status === 404 && error.code === "NOT_FOUND" && error.message === "OPENAPI_SCHEMA_NOT_AVAILABLE"
}

const isMockPaymentLink = (paymentLink: string) => {
    return paymentLink.includes("/billing/mock/pay")
}

const parseSchemaDocument = (schema: string) => {
    try {
        const parsed = JSON.parse(schema)
        return isRecord(parsed) ? parsed : null
    } catch {
        return null
    }
}

const extractEndpointOptions = (schema: string): EndpointOption[] => {
    const document = parseSchemaDocument(schema)
    if (!document) {
        return []
    }

    const pathsValue = document.paths
    if (!isRecord(pathsValue)) {
        return []
    }

    const supportedMethods: GatewayMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]
    const endpoints: EndpointOption[] = []

    Object.entries(pathsValue).forEach(([path, definition]) => {
        if (!isRecord(definition)) {
            return
        }

        supportedMethods.forEach((method) => {
            if (definition[method.toLowerCase()]) {
                endpoints.push({ method, path })
            }
        })
    })

    return endpoints
}

const stringifyPreview = (value: unknown, maxLength = 2400) => {
    const formatted = typeof value === "string" ? value : JSON.stringify(value, null, 2)
    if (!formatted) {
        return ""
    }

    return formatted.length > maxLength
        ? `${formatted.slice(0, maxLength)}\n...`
        : formatted
}

const buildGatewayCurl = (params: {
    productId: string
    method: GatewayMethod
    path: string
    apiKey: string
}) => {
    const normalizedPath = params.path.startsWith("/") ? params.path : `/${params.path}`
    return [
        `curl -X ${params.method} "${apiBaseUrl}/gateway/products/${params.productId}${normalizedPath}"`,
        `  -H "x-api-key: ${params.apiKey || "<your-api-key>"}"`
    ].join(" \\\n")
}

const getPlanRateLimitLine = (rateLimitRpm: number | null | undefined) => {
    return `Rate limit: ${formatRequestsPerMinute(rateLimitRpm)}`
}

export const ProductDetailsPage = () => {
    const { id } = useParams<{ id: string }>()
    const { accessToken, refresh, userId, isHydrating } = useAuth()
    const catalogApi = useMemo(
        () => createCatalogApi({ accessToken, refresh }),
        [accessToken, refresh]
    )
    const billingApi = useMemo(
        () => createBillingApi({ accessToken, refresh }),
        [accessToken, refresh]
    )
    const keysApi = useMemo(
        () => createKeysApi({ accessToken, refresh }),
        [accessToken, refresh]
    )
    const gatewayApi = useMemo(() => createGatewayApi(), [])

    const [product, setProduct] = useState<CatalogProduct | null>(null)
    const [versions, setVersions] = useState<CatalogVersion[]>([])
    const [plans, setPlans] = useState<Plan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPlansLoading, setIsPlansLoading] = useState(true)
    const [error, setError] = useState<ApiError | null>(null)
    const [plansError, setPlansError] = useState<ApiError | null>(null)
    const [subscribeResult, setSubscribeResult] = useState<SubscribeResponse | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null)
    const [retryKey, setRetryKey] = useState(0)
    const [plansRetryKey, setPlansRetryKey] = useState(0)
    const [selectedVersionId, setSelectedVersionId] = useState("")
    const [schemaState, setSchemaState] = useState<SchemaState>({ status: "idle" })
    const [schemaRetryKey, setSchemaRetryKey] = useState(0)
    const [playgroundKey, setPlaygroundKey] = useState("")
    const [isCreatingPlaygroundKey, setIsCreatingPlaygroundKey] = useState(false)
    const [gatewayMethod, setGatewayMethod] = useState<GatewayMethod>("GET")
    const [gatewayPath, setGatewayPath] = useState("/")
    const [gatewayBody, setGatewayBody] = useState("{\n  \n}")
    const [gatewayResult, setGatewayResult] = useState<GatewayDispatchResponse | null>(null)
    const [gatewayError, setGatewayError] = useState<ApiError | null>(null)
    const [isGatewayLoading, setIsGatewayLoading] = useState(false)
    const previousUserIdRef = useRef<string | null | undefined>(undefined)

    useEffect(() => {
        if (isHydrating) {
            return
        }

        const previousUserId = previousUserIdRef.current
        const cached = getCachedRawApiKey(userId)

        if (previousUserId === undefined) {
            setPlaygroundKey(cached?.value ?? "")
            previousUserIdRef.current = userId
            return
        }

        if (previousUserId !== userId) {
            setPlaygroundKey(cached?.value ?? "")
            previousUserIdRef.current = userId
        }
    }, [isHydrating, userId])

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

                const nextVersions = extractVersions(versionResponse)
                setProduct(productResponse as GetProductResponse)
                setVersions(nextVersions)
                const preferredVersion = pickPreferredVersion(nextVersions)
                setSelectedVersionId((currentValue) => {
                    if (
                        currentValue &&
                        nextVersions.some((version) => {
                            const versionRecord = isRecord(version) ? version : null
                            return getString(versionRecord, "id") === currentValue
                        })
                    ) {
                        return currentValue
                    }

                    const preferredRecord = isRecord(preferredVersion) ? preferredVersion : null
                    return getString(preferredRecord, "id") ?? ""
                })
            } catch (err) {
                if (!isActive) {
                    return
                }

                const apiError = err instanceof ApiError ? err : null
                setError(apiError)
                setProduct(null)
                setVersions([])

                notifyError(apiError ?? err, "Product error")
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
    }, [catalogApi, id, retryKey])

    useEffect(() => {
        if (!id) {
            return
        }

        let isActive = true

        const loadPlans = async () => {
            setIsPlansLoading(true)
            setPlansError(null)

            try {
                const response = await billingApi.listPlans({ productId: id })
                if (!isActive) {
                    return
                }
                setPlans(extractPlans(response))
            } catch (err) {
                if (!isActive) {
                    return
                }
                const apiError = err instanceof ApiError ? err : null
                setPlansError(apiError)
                setPlans([])
                notifyError(apiError ?? err, "Plans error")
            } finally {
                if (isActive) {
                    setIsPlansLoading(false)
                }
            }
        }

        loadPlans()

        return () => {
            isActive = false
        }
    }, [billingApi, id, plansRetryKey])

    useEffect(() => {
        if (!selectedVersionId) {
            setSchemaState({ status: "idle" })
            return
        }

        let isActive = true

        const loadSchema = async () => {
            setSchemaState({ status: "loading" })

            try {
                const response = await catalogApi.getVersionSchema(selectedVersionId)
                if (!isActive) {
                    return
                }
                setSchemaState({
                    status: "available",
                    payload: response
                })
            } catch (err) {
                if (!isActive) {
                    return
                }

                const apiError = err instanceof ApiError ? err : null
                if (isSchemaUnavailableError(apiError)) {
                    setSchemaState({ status: "unavailable" })
                    return
                }

                setSchemaState({
                    status: "error",
                    error: apiError
                })
            }
        }

        void loadSchema()

        return () => {
            isActive = false
        }
    }, [catalogApi, schemaRetryKey, selectedVersionId])

    const selectedVersion = useMemo(() => {
        return versions.find((version) => {
            const versionRecord = isRecord(version) ? version : null
            return getString(versionRecord, "id") === selectedVersionId
        }) ?? pickPreferredVersion(versions)
    }, [selectedVersionId, versions])

    const selectedVersionRecord = isRecord(selectedVersion) ? selectedVersion : null
    const selectedVersionOpenApiUrl = getString(selectedVersionRecord, "openApiUrl")
    const endpointOptions = useMemo(() => {
        if (schemaState.status !== "available") {
            return []
        }
        return extractEndpointOptions(schemaState.payload.schema)
    }, [schemaState])

    useEffect(() => {
        if (endpointOptions.length === 0) {
            return
        }

        const currentExists = endpointOptions.some(
            (endpoint) => endpoint.method === gatewayMethod && endpoint.path === gatewayPath
        )
        if (currentExists) {
            return
        }

        setGatewayMethod(endpointOptions[0].method)
        setGatewayPath(endpointOptions[0].path)
    }, [endpointOptions, gatewayMethod, gatewayPath])

    const schemaPreview = useMemo(() => {
        if (schemaState.status !== "available") {
            return ""
        }

        const parsed = parseSchemaDocument(schemaState.payload.schema)
        return stringifyPreview(parsed ?? schemaState.payload.schema)
    }, [schemaState])

    const handleSubscribe = async (planId: string) => {
        if (!accessToken) {
            notifyInfo("Sign in required", "Please sign in to subscribe to a plan.")
            return
        }

        setSubscribingPlanId(planId)
        try {
            const response = await billingApi.subscribe({ planId })
            setSubscribeResult(response)
            setIsDialogOpen(true)
            notifySuccess("Subscription created", "Complete payment to activate.")
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            notifyError(apiError ?? err, "Subscribe failed")
        } finally {
            setSubscribingPlanId(null)
        }
    }

    const handleCreatePlaygroundKey = async () => {
        if (!accessToken) {
            notifyInfo("Sign in required", "Sign in to create an API key.")
            return
        }

        setIsCreatingPlaygroundKey(true)
        try {
            const response = await keysApi.createKey({
                label: `Playground ${new Date().toISOString()}`
            })
            setPlaygroundKey(response.rawKey)
            saveCachedRawApiKey({
                value: response.rawKey,
                userId: userId ?? undefined,
                label: response.label,
                createdAt: response.createdAt
            })
            notifySuccess("Playground key created", "Raw key saved in this browser session.")
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            notifyError(apiError ?? err, "Key creation failed")
        } finally {
            setIsCreatingPlaygroundKey(false)
        }
    }

    const handleSendGateway = async () => {
        if (!id) {
            return
        }

        if (!playgroundKey.trim()) {
            notifyInfo("API key required", "Create or paste a raw API key before sending a request.")
            return
        }

        setIsGatewayLoading(true)
        setGatewayError(null)
        setGatewayResult(null)

        try {
            let parsedBody: unknown

            if (gatewayMethod !== "GET" && gatewayMethod !== "DELETE" && gatewayBody.trim()) {
                try {
                    parsedBody = JSON.parse(gatewayBody)
                } catch {
                    parsedBody = gatewayBody
                }
            }

            const normalizedPath = gatewayPath.trim() ? gatewayPath.trim() : "/"
            const response = await gatewayApi.dispatch(
                {
                    productId: id,
                    path: normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`,
                    method: gatewayMethod,
                    body: parsedBody,
                    requestCount: 1
                },
                playgroundKey.trim()
            )

            setGatewayResult(response)
            if (userId) {
                saveCachedRawApiKey({
                    value: playgroundKey.trim(),
                    userId,
                    createdAt: new Date().toISOString()
                })
            }
            notifySuccess("Gateway request completed", `Upstream returned ${response.status}.`)
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null
            setGatewayError(apiError)
            notifyError(apiError ?? err, "Gateway request failed")
        } finally {
            setIsGatewayLoading(false)
        }
    }

    if (isLoading) {
        return <ProductDetailsSkeleton />
    }

    if (error) {
        const isForbidden = error.status === 403 || error.code === "FORBIDDEN"
        return (
            <ErrorBlock
                title="Product unavailable"
                description={
                    isForbidden
                        ? "This product might be private. Sign in to access it."
                        : error.message || "Unable to load this product."
                }
                code={error.code}
                onRetry={() => setRetryKey((prev) => prev + 1)}
            />
        )
    }

    if (!product || !id) {
        return (
            <EmptyBlock
                title="Product not found"
                description="No product data was returned."
                actionLabel="Back to catalog"
                actionTo="/catalog"
            />
        )
    }

    const productRecord = isRecord(product) ? product : null
    const tags = getStringArray(productRecord, "tags")
    const productStatus = getString(productRecord, "status")
    const productTitle = getString(productRecord, "title") ?? "Untitled product"
    const productCategory = getString(productRecord, "category") ?? "Uncategorized"
    const preferredEndpoint = endpointOptions[0] ?? {
        method: gatewayMethod,
        path: gatewayPath
    }
    const quickstartCurl = buildGatewayCurl({
        productId: id,
        method: preferredEndpoint.method,
        path: preferredEndpoint.path,
        apiKey: playgroundKey.trim()
    })

    return (
        <>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{productTitle}</CardTitle>
                        <CardDescription>{productCategory}</CardDescription>
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
                            {productStatus ? (
                                <StatusBadge kind="product" value={productStatus} />
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Developer quickstart</CardTitle>
                            <CardDescription>
                                Subscribe, get a key, and make the first request through HivePoint.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                                    <div className="text-sm font-medium">1. Create or reuse a key</div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        Use the cached raw key from this browser session or create a new playground key.
                                    </div>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                                    <div className="text-sm font-medium">2. Pick an endpoint from the OpenAPI document</div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {endpointOptions.length > 0
                                            ? `${endpointOptions.length} endpoint routes detected from the schema snapshot.`
                                            : "Use the source OpenAPI if a schema snapshot is not stored yet."}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                                <div className="space-y-1">
                                    <Label htmlFor="playground-key">Raw API key</Label>
                                    <Input
                                        id="playground-key"
                                        value={playgroundKey}
                                        onChange={(event) => setPlaygroundKey(event.target.value)}
                                        placeholder="hp_live_..."
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isCreatingPlaygroundKey}
                                        onClick={() => void handleCreatePlaygroundKey()}
                                    >
                                        {isCreatingPlaygroundKey ? "Creating..." : "Create playground key"}
                                    </Button>
                                </div>
                                <div className="flex items-end gap-2">
                                    {playgroundKey ? (
                                        <>
                                            <CopyButton value={playgroundKey} label="Copy key" />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => {
                                                    setPlaygroundKey("")
                                                    clearCachedRawApiKey()
                                                }}
                                            >
                                                Clear
                                            </Button>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Gateway curl</Label>
                                <pre className="overflow-x-auto rounded-lg border border-border/60 bg-background/80 p-4 text-xs leading-6 text-muted-foreground">
                                    {quickstartCurl}
                                </pre>
                                <div className="flex flex-wrap gap-2">
                                    <CopyButton value={quickstartCurl} label="Copy curl" />
                                    <Button asChild variant="outline">
                                        <Link to="/billing">Open billing</Link>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link to="/keys">Open API keys</Link>
                                    </Button>
                                    {selectedVersionOpenApiUrl ? (
                                        <Button asChild variant="outline">
                                            <a href={selectedVersionOpenApiUrl} target="_blank" rel="noreferrer">
                                                Open source OpenAPI
                                            </a>
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Schema snapshot</CardTitle>
                            <CardDescription>
                                Stored OpenAPI snapshot for the selected version.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {versions.length > 0 ? (
                                <div className="space-y-1">
                                    <Label htmlFor="version-select">Version</Label>
                                    <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                                        <SelectTrigger id="version-select">
                                            <SelectValue placeholder="Pick a version" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {versions.map((version, index) => {
                                                const versionRecord = isRecord(version) ? version : null
                                                const versionId = getString(versionRecord, "id")
                                                const versionLabel = getString(versionRecord, "version") ?? `Version ${index + 1}`
                                                const status = getString(versionRecord, "status") ?? "UNKNOWN"

                                                return versionId ? (
                                                    <SelectItem key={versionId} value={versionId}>
                                                        {versionLabel} · {status}
                                                    </SelectItem>
                                                ) : null
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}

                            {schemaState.status === "loading" ? (
                                <LoadingBlock title="Loading schema snapshot..." count={1} />
                            ) : null}

                            {schemaState.status === "available" ? (
                                <>
                                    <div className="rounded-lg border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                                        Snapshot fetched {formatDate(schemaState.payload.fetchedAt)} ·
                                        {` ${formatNumber(endpointOptions.length)} endpoint routes found`}
                                    </div>
                                    <pre className="max-h-[28rem] overflow-auto rounded-lg border border-border/60 bg-background/80 p-4 text-xs leading-6 text-muted-foreground">
                                        {schemaPreview}
                                    </pre>
                                </>
                            ) : null}

                            {schemaState.status === "unavailable" ? (
                                <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                                    <div className="text-sm font-medium text-foreground">
                                        Schema snapshot not stored yet
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        This version has a source OpenAPI document, but HivePoint does not have a stored schema snapshot yet.
                                        Use the source OpenAPI or refresh the version in Seller Studio.
                                    </div>
                                </div>
                            ) : null}

                            {schemaState.status === "error" ? (
                                <ErrorBlock
                                    title="Schema unavailable"
                                    description={schemaState.error?.message || "Unable to load schema snapshot."}
                                    code={schemaState.error?.code}
                                    onRetry={() => setSchemaRetryKey((prev) => prev + 1)}
                                />
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Test through HivePoint</CardTitle>
                        <CardDescription>
                            Send a request through the gateway to validate access, quota, and seller upstream response.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 lg:grid-cols-[140px_1fr]">
                        <div className="space-y-1">
                            <Label htmlFor="gateway-method">Method</Label>
                            <Select
                                value={gatewayMethod}
                                onValueChange={(value) => setGatewayMethod(value as GatewayMethod)}
                            >
                                <SelectTrigger id="gateway-method">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="gateway-path">Path</Label>
                            <Input
                                id="gateway-path"
                                value={gatewayPath}
                                onChange={(event) => setGatewayPath(event.target.value)}
                                placeholder="/health"
                            />
                        </div>
                        <div className="space-y-1 lg:col-span-2">
                            <Label htmlFor="gateway-body">JSON body</Label>
                            <textarea
                                id="gateway-body"
                                value={gatewayBody}
                                onChange={(event) => setGatewayBody(event.target.value)}
                                className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                placeholder={"{\n  \"hello\": \"world\"\n}"}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 lg:col-span-2">
                            <Button type="button" disabled={isGatewayLoading} onClick={() => void handleSendGateway()}>
                                {isGatewayLoading ? "Sending..." : "Send via gateway"}
                            </Button>
                            {endpointOptions.length > 0 ? (
                                <Select
                                    value={`${gatewayMethod}:${gatewayPath}`}
                                    onValueChange={(value) => {
                                        const [method, ...pathParts] = value.split(":")
                                        setGatewayMethod(method as GatewayMethod)
                                        setGatewayPath(pathParts.join(":"))
                                    }}
                                >
                                    <SelectTrigger className="w-full max-w-sm">
                                        <SelectValue placeholder="Use endpoint from snapshot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {endpointOptions.map((endpoint) => (
                                            <SelectItem
                                                key={`${endpoint.method}:${endpoint.path}`}
                                                value={`${endpoint.method}:${endpoint.path}`}
                                            >
                                                {endpoint.method} {endpoint.path}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : null}
                        </div>

                        {gatewayError ? (
                            <div className="lg:col-span-2">
                                <ErrorBlock
                                    title="Gateway request failed"
                                    description={gatewayError.message || "Unable to complete the request."}
                                    code={gatewayError.code}
                                />
                            </div>
                        ) : null}

                        {gatewayResult ? (
                            <div className="grid gap-4 lg:col-span-2 xl:grid-cols-[1.2fr_0.8fr]">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Upstream response</div>
                                    <pre className="max-h-[24rem] overflow-auto rounded-lg border border-border/60 bg-background/80 p-4 text-xs leading-6 text-muted-foreground">
                                        {stringifyPreview(gatewayResult.body ?? null, 3200)}
                                    </pre>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Usage context</div>
                                    <div className="rounded-lg border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                                        <div>Status: {gatewayResult.status}</div>
                                        <div>Subscription: {gatewayResult.usage.subscriptionId}</div>
                                        <div>Requests used in call: {gatewayResult.usage.requestCount}</div>
                                        <div>
                                            Remaining requests: {gatewayResult.usage.remainingRequests ?? "Unlimited"}
                                        </div>
                                        <div>
                                            {getPlanRateLimitLine(gatewayResult.usage.rateLimitRpm)}
                                        </div>
                                        {typeof gatewayResult.usage.remainingRateLimitRequests === "number" ? (
                                            <div>
                                                Remaining this minute: {formatNumber(gatewayResult.usage.remainingRateLimitRequests)}
                                            </div>
                                        ) : null}
                                        <div>Period end: {formatDate(gatewayResult.usage.periodEnd)}</div>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-background/80 p-4 text-xs text-muted-foreground">
                                        <div className="font-medium text-foreground">Resolved upstream</div>
                                        <div className="mt-1 break-all">{gatewayResult.upstreamUrl}</div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {isPlansLoading ? (
                    <LoadingBlock title="Loading plans..." count={2} />
                ) : null}

                {plansError && !isPlansLoading ? (
                    <ErrorBlock
                        title="Plans unavailable"
                        description={plansError.message || "Unable to load plans."}
                        code={plansError.code}
                        onRetry={() => setPlansRetryKey((prev) => prev + 1)}
                    />
                ) : null}

                {!isPlansLoading && plans.length === 0 && !plansError ? (
                    <EmptyBlock
                        title="No plans available"
                        description="There are no active plans for this product yet."
                    />
                ) : null}

                {!isPlansLoading && plans.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Plans</CardTitle>
                            <CardDescription>Choose a plan to subscribe.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {plans.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    onSubscribe={handleSubscribe}
                                    isSubscribing={subscribingPlanId === plan.id}
                                    isAuthenticated={Boolean(accessToken)}
                                />
                            ))}
                        </CardContent>
                    </Card>
                ) : null}

                {versions.length === 0 ? (
                    <EmptyBlock
                        title="No versions available"
                        description="Published versions will appear here."
                    />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Versions</CardTitle>
                            <CardDescription>Published versions for this product.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {versions.map((version, index) => {
                                const versionRecord = isRecord(version) ? version : null
                                const versionId = getString(versionRecord, "id")
                                const versionLabel = getString(versionRecord, "version") ?? "Unnamed version"
                                const status = getString(versionRecord, "status") ?? ""
                                const openApiUrl = getString(versionRecord, "openApiUrl")
                                const isSelected = versionId === selectedVersionId

                                return (
                                    <div
                                        key={versionId ?? `${versionLabel}-${index}`}
                                        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{versionLabel}</p>
                                            {status ? (
                                                <StatusBadge kind="version" value={status} />
                                            ) : null}
                                            {isSelected ? <Badge variant="secondary">Selected</Badge> : null}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {versionId ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setSelectedVersionId(versionId)}
                                                >
                                                    Use in quickstart
                                                </Button>
                                            ) : null}
                                            {openApiUrl ? (
                                                <Button asChild variant="link">
                                                    <a href={openApiUrl} target="_blank" rel="noreferrer">
                                                        OpenAPI
                                                    </a>
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete payment</DialogTitle>
                        <DialogDescription>
                            Use the payment link to finish your subscription.
                        </DialogDescription>
                    </DialogHeader>
                    {subscribeResult ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="payment-link">Payment link</Label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input
                                        id="payment-link"
                                        value={subscribeResult.paymentLink}
                                        readOnly
                                    />
                                    <CopyButton
                                        value={subscribeResult.paymentLink}
                                        label="Copy link"
                                    />
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Invoice ID: {subscribeResult.invoiceId}
                            </div>
                            <div>
                                <Button asChild variant="link">
                                    <a
                                        href={subscribeResult.paymentLink}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open payment link
                                    </a>
                                </Button>
                            </div>
                            {isMockPaymentLink(subscribeResult.paymentLink) ? (
                                <DevMockPaymentActions
                                    invoiceId={subscribeResult.invoiceId}
                                    onSuccess={() => {
                                        notifySuccess(
                                            "Mock payment sent",
                                            "Refresh /billing to see updated status."
                                        )
                                    }}
                                />
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">No subscription data.</div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

type PlanCardProps = {
    plan: Plan
    onSubscribe: (planId: string) => void
    isSubscribing: boolean
    isAuthenticated: boolean
}

const PlanCard = ({ plan, onSubscribe, isSubscribing, isAuthenticated }: PlanCardProps) => {
    const isInactive = !plan.isActive

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                            {formatCurrency(plan.priceCents, plan.currency)} · {plan.period}
                        </CardDescription>
                    </div>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
                <div>{formatNumber(plan.quotaRequests)} requests per period</div>
                <div>{getPlanRateLimitLine(plan.rateLimitRpm)}</div>
            </CardContent>
            <CardContent className="flex items-center justify-between">
                {isAuthenticated ? (
                    <Button
                        type="button"
                        size="sm"
                        disabled={isInactive || isSubscribing}
                        onClick={() => onSubscribe(plan.id)}
                    >
                        {isSubscribing ? "Subscribing..." : "Subscribe"}
                    </Button>
                ) : (
                    <Button asChild size="sm" variant="outline">
                        <Link to="/login">Sign in to subscribe</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

