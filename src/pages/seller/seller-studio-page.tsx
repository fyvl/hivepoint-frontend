import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleDashed, Plus, Rocket, WandSparkles } from "lucide-react";

import {
    createCatalogApi,
    type CatalogProduct,
    type CatalogVersion,
    type ListProductsResponse
} from "@/api/catalog";
import { createBillingApi, type ListPlansResponse, type Plan } from "@/api/billing";
import { createSellerApi, type SellerAnalyticsOverview } from "@/api/seller";
import { ApiError } from "@/api/http";
import { useAuth } from "@/auth/auth-context";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyBlock } from "@/components/ui-states/empty-block";
import { ErrorBlock } from "@/components/ui-states/error-block";
import { LoadingBlock } from "@/components/ui-states/loading-block";
import {
    API_CATEGORY_OPTIONS,
    formatCategoryLabel,
    toStoredCategoryValue
} from "@/lib/categories";
import { formatCurrency, formatNumber, formatRequestsPerMinute } from "@/lib/format";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/utils";

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const getString = (record: Record<string, unknown> | null, key: string) => {
    if (!record) {
        return undefined;
    }
    const value = record[key];
    return typeof value === "string" ? value : undefined;
};

const getStringArray = (record: Record<string, unknown> | null, key: string) => {
    if (!record) {
        return [];
    }
    const value = record[key];
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item) => typeof item === "string");
};

const getProductId = (product: CatalogProduct) => {
    const record = isRecord(product) ? product : null;
    return getString(record, "id") ?? null;
};

const getVersionId = (version: CatalogVersion) => {
    const record = isRecord(version) ? version : null;
    return getString(record, "id") ?? null;
};

const extractProducts = (payload: ListProductsResponse): CatalogProduct[] => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (!isRecord(payload)) {
        return [];
    }
    const items = payload.items;
    return Array.isArray(items) ? items : [];
};

const extractVersions = (payload: unknown): CatalogVersion[] => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (!isRecord(payload)) {
        return [];
    }
    const items = payload.items;
    return Array.isArray(items) ? items : [];
};

const extractPlans = (payload: ListPlansResponse): Plan[] => {
    return payload.items ?? [];
};

const splitTags = (raw: string) => {
    return raw
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
};

const getPlanRateLimitLine = (rateLimitRpm: number | null | undefined) => {
    return `Rate limit: ${formatRequestsPerMinute(rateLimitRpm)}`;
};

const CATEGORY_REVIEW_SCORE_THRESHOLD = 0.35;

export const SellerStudioPage = () => {
    const { accessToken, refresh } = useAuth();
    const catalogApi = useMemo(
        () => createCatalogApi({ accessToken, refresh }),
        [accessToken, refresh]
    );
    const billingApi = useMemo(
        () => createBillingApi({ accessToken, refresh }),
        [accessToken, refresh]
    );
    const sellerApi = useMemo(
        () => createSellerApi({ accessToken, refresh }),
        [accessToken, refresh]
    );

    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [versions, setVersions] = useState<CatalogVersion[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [analytics, setAnalytics] = useState<SellerAnalyticsOverview | null>(null);

    const [isProductsLoading, setIsProductsLoading] = useState(true);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
    const [productsError, setProductsError] = useState<ApiError | null>(null);
    const [detailsError, setDetailsError] = useState<ApiError | null>(null);
    const [analyticsError, setAnalyticsError] = useState<ApiError | null>(null);
    const [retryKey, setRetryKey] = useState(0);
    const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [isSuggestingClassification, setIsSuggestingClassification] = useState(false);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);

    const [versionLabel, setVersionLabel] = useState("");
    const [openApiUrl, setOpenApiUrl] = useState("");
    const [isCreatingVersion, setIsCreatingVersion] = useState(false);
    const [updatingVersionId, setUpdatingVersionId] = useState<string | null>(null);

    const [planName, setPlanName] = useState("");
    const [planPrice, setPlanPrice] = useState("");
    const [planQuota, setPlanQuota] = useState("");
    const [planRateLimitRpm, setPlanRateLimitRpm] = useState("");
    const [planCurrency, setPlanCurrency] = useState("USD");
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const detailsRequestIdRef = useRef(0);

    const selectedProduct = useMemo(() => {
        return products.find((product) => getProductId(product) === selectedProductId) ?? null;
    }, [products, selectedProductId]);
    const selectedProductAnalytics = useMemo(() => {
        return (
            analytics?.products.find((product) => product.productId === selectedProductId) ?? null
        );
    }, [analytics, selectedProductId]);

    const publishedCount = useMemo(() => {
        return products.filter((product) => {
            const record = isRecord(product) ? product : null;
            return getString(record, "status") === "PUBLISHED";
        }).length;
    }, [products]);

    const loadProducts = useCallback(async () => {
        setIsProductsLoading(true);
        setProductsError(null);
        try {
            const response = await catalogApi.listMyProducts({ limit: 48, offset: 0 });
            const items = extractProducts(response);
            setProducts(items);
            setSelectedProductId((currentSelectedProductId) => {
                const hasSelectedProduct = items.some(
                    (item) => getProductId(item) === currentSelectedProductId
                );
                if (currentSelectedProductId && hasSelectedProduct) {
                    return currentSelectedProductId;
                }

                return items.map((item) => getProductId(item)).find(Boolean) ?? null;
            });
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null;
            setProductsError(apiError);
            setProducts([]);
            notifyError(apiError ?? err, "Could not load products");
        } finally {
            setIsProductsLoading(false);
        }
    }, [catalogApi]);

    useEffect(() => {
        void loadProducts();
    }, [loadProducts, retryKey]);

    const loadAnalytics = useCallback(async () => {
        setIsAnalyticsLoading(true);
        setAnalyticsError(null);
        try {
            const response = await sellerApi.getAnalyticsOverview();
            setAnalytics(response);
        } catch (err) {
            const apiError = err instanceof ApiError ? err : null;
            setAnalyticsError(apiError);
            setAnalytics(null);
            notifyError(apiError ?? err, "Could not load seller analytics");
        } finally {
            setIsAnalyticsLoading(false);
        }
    }, [sellerApi]);

    useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics, retryKey]);

    const loadSelectedDetails = useCallback(
        async (productId: string) => {
            const requestId = detailsRequestIdRef.current + 1;
            detailsRequestIdRef.current = requestId;
            setIsDetailsLoading(true);
            setDetailsError(null);
            try {
                const [versionsResponse, plansResponse] = await Promise.all([
                    catalogApi.getVersions(productId),
                    billingApi.listPlans({ productId })
                ]);
                if (detailsRequestIdRef.current !== requestId) {
                    return;
                }
                setVersions(extractVersions(versionsResponse));
                setPlans(extractPlans(plansResponse));
            } catch (err) {
                if (detailsRequestIdRef.current !== requestId) {
                    return;
                }
                const apiError = err instanceof ApiError ? err : null;
                setDetailsError(apiError);
                setVersions([]);
                setPlans([]);
                notifyError(apiError ?? err, "Could not load product details");
            } finally {
                if (detailsRequestIdRef.current === requestId) {
                    setIsDetailsLoading(false);
                }
            }
        },
        [billingApi, catalogApi]
    );

    useEffect(() => {
        if (!selectedProductId) {
            detailsRequestIdRef.current += 1;
            setIsDetailsLoading(false);
            setDetailsError(null);
            setVersions([]);
            setPlans([]);
            return;
        }
        void loadSelectedDetails(selectedProductId);
    }, [selectedProductId, loadSelectedDetails]);

    const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();
        const trimmedCategory = category.trim();

        if (!trimmedTitle || !trimmedDescription || !trimmedCategory) {
            notifyInfo("Missing fields", "Title, description, and category are required.");
            return;
        }

        setIsCreatingProduct(true);
        try {
            const created = await catalogApi.createProduct({
                title: trimmedTitle,
                description: trimmedDescription,
                category: toStoredCategoryValue(trimmedCategory),
                tags: splitTags(tags)
            });
            const createdProduct = created as CatalogProduct;
            const createdId = getProductId(createdProduct);

            setProducts((prev) => [createdProduct, ...prev]);
            if (createdId) {
                setSelectedProductId(createdId);
            }

            setTitle("");
            setDescription("");
            setCategory("");
            setTags("");
            setIsCreateProductOpen(false);
            await loadAnalytics();
            notifySuccess("Product created", "Your API product has been added to the workspace.");
        } catch (err) {
            notifyError(err, "Create product failed");
        } finally {
            setIsCreatingProduct(false);
        }
    };

    const handleGenerateDescription = async () => {
        const trimmedTitle = title.trim();
        const trimmedCategory = category.trim();

        if (!trimmedTitle || !trimmedCategory) {
            notifyInfo(
                "Missing fields",
                "Add a title and category before generating a description."
            );
            return;
        }

        setIsGeneratingDescription(true);
        try {
            const response = await catalogApi.generateProductDescription({
                title: trimmedTitle,
                category: formatCategoryLabel(trimmedCategory),
                tags: splitTags(tags)
            });
            setDescription(response.description);
            notifySuccess(
                "Description generated",
                "Review the draft and edit it before publishing."
            );
        } catch (err) {
            notifyError(err, "Description generation failed");
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const handleSuggestClassification = async () => {
        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();

        if (!trimmedTitle || !trimmedDescription) {
            notifyInfo(
                "Missing fields",
                "Add a title and description before suggesting category and tags."
            );
            return;
        }

        setIsSuggestingClassification(true);
        try {
            const response = await catalogApi.suggestCategoryAndTags({
                title: trimmedTitle,
                description: trimmedDescription,
                topKTags: 3
            });
            setCategory(formatCategoryLabel(response.category));
            setTags(response.tags.map((item) => item.tag).join(", "));
            if (response.categoryScore < CATEGORY_REVIEW_SCORE_THRESHOLD) {
                notifyInfo(
                    "Low-confidence category",
                    "Review the suggestion or enter a custom category before creating the product."
                );
            } else {
                notifySuccess(
                    "Suggestions applied",
                    "Review the category and tags before creating the product."
                );
            }
        } catch (err) {
            notifyError(err, "Category suggestion failed");
        } finally {
            setIsSuggestingClassification(false);
        }
    };

    const handleChangeProductStatus = async (status: "DRAFT" | "PUBLISHED" | "HIDDEN") => {
        if (!selectedProductId) {
            notifyInfo("Select a product", "Pick a product before changing status.");
            return;
        }

        try {
            const updated = await catalogApi.updateProduct(selectedProductId, { status });
            setProducts((prev) =>
                prev.map((product) => {
                    return getProductId(product) === selectedProductId
                        ? (updated as CatalogProduct)
                        : product;
                })
            );
            await loadAnalytics();
            notifySuccess("Status updated", `Product status set to ${status}.`);
        } catch (err) {
            notifyError(err, "Update status failed");
        }
    };

    const handleCreateVersion = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedProductId) {
            notifyInfo("Select a product", "Pick a product before creating versions.");
            return;
        }

        const trimmedVersion = versionLabel.trim();
        const trimmedUrl = openApiUrl.trim();
        if (!trimmedVersion || !trimmedUrl) {
            notifyInfo("Missing fields", "Version label and OpenAPI URL are required.");
            return;
        }

        setIsCreatingVersion(true);
        try {
            const created = await catalogApi.createVersion(selectedProductId, {
                version: trimmedVersion,
                openApiUrl: trimmedUrl
            });
            setVersions((prev) => [created as CatalogVersion, ...prev]);
            setVersionLabel("");
            setOpenApiUrl("");
            await loadAnalytics();
            notifySuccess("Version created", "New API version is now available in draft mode.");
        } catch (err) {
            notifyError(err, "Create version failed");
        } finally {
            setIsCreatingVersion(false);
        }
    };

    const handleChangeVersionStatus = async (
        versionId: string | null,
        status: "DRAFT" | "PUBLISHED"
    ) => {
        if (!versionId) {
            notifyInfo("Missing version ID", "Reload the product details and try again.");
            return;
        }

        setUpdatingVersionId(versionId);
        try {
            const updated = await catalogApi.updateVersion(versionId, { status });
            setVersions((prev) =>
                prev.map((version) => {
                    return getVersionId(version) === versionId
                        ? (updated as CatalogVersion)
                        : version;
                })
            );
            await loadAnalytics();
            notifySuccess("Version status updated", `Version set to ${status}.`);
        } catch (err) {
            notifyError(err, "Update version status failed");
        } finally {
            setUpdatingVersionId(null);
        }
    };

    const handleCreatePlan = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedProductId) {
            notifyInfo("Select a product", "Pick a product before creating plans.");
            return;
        }

        const trimmedName = planName.trim();
        const parsedPrice = Number(planPrice);
        const parsedQuota = Number(planQuota);
        const parsedRateLimit = planRateLimitRpm.trim() === "" ? null : Number(planRateLimitRpm);

        if (
            !trimmedName ||
            !Number.isFinite(parsedPrice) ||
            parsedPrice <= 0 ||
            !Number.isFinite(parsedQuota) ||
            parsedQuota <= 0 ||
            (parsedRateLimit !== null &&
                (!Number.isFinite(parsedRateLimit) || parsedRateLimit <= 0))
        ) {
            notifyInfo(
                "Invalid plan fields",
                "Use a name, positive price, positive quota, and an optional positive RPM limit."
            );
            return;
        }

        setIsCreatingPlan(true);
        try {
            const created = await billingApi.createPlan({
                productId: selectedProductId,
                name: trimmedName,
                priceCents: Math.round(parsedPrice * 100),
                currency: planCurrency.trim().toUpperCase() || "USD",
                period: "MONTH",
                quotaRequests: Math.round(parsedQuota),
                ...(parsedRateLimit !== null ? { rateLimitRpm: Math.round(parsedRateLimit) } : {}),
                isActive: true
            });
            setPlans((prev) => [created, ...prev]);
            setPlanName("");
            setPlanPrice("");
            setPlanQuota("");
            setPlanRateLimitRpm("");
            await loadAnalytics();
            notifySuccess("Plan created", "The pricing plan is now available for subscriptions.");
        } catch (err) {
            notifyError(err, "Create plan failed");
        } finally {
            setIsCreatingPlan(false);
        }
    };

    const selectedProductRecord = isRecord(selectedProduct) ? selectedProduct : null;
    const selectedStatus = getString(selectedProductRecord, "status");
    const selectedTags = getStringArray(selectedProductRecord, "tags");
    const hasSchemaConnected = versions.length > 0;
    const hasPublishedVersion = useMemo(() => {
        return versions.some((version) => {
            const record = isRecord(version) ? version : null;
            return getString(record, "status") === "PUBLISHED";
        });
    }, [versions]);
    const setupSteps = [
        {
            label: "Create product",
            done: products.length > 0
        },
        {
            label: "Connect schema (OpenAPI URL)",
            done: hasSchemaConnected
        },
        {
            label: "Publish at least one version",
            done: hasPublishedVersion
        },
        {
            label: "Create pricing plan",
            done: plans.length > 0
        }
    ];

    return (
        <div className="flex flex-col gap-8">
            <section className="surface-panel-strong p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="section-kicker">
                            <Rocket className="h-3.5 w-3.5" />
                            Seller Studio
                        </div>
                        <h1 className="mt-3 text-3xl font-semibold text-foreground">
                            Products, releases, and plans
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Select a product, check what is missing, then publish versions and
                            pricing from the same workspace.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 lg:min-w-[520px] lg:items-end">
                        <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto">
                                    <Plus className="h-4 w-4" />
                                    New product
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Create new product</DialogTitle>
                                    <DialogDescription>
                                        Create a separate catalog listing. This does not edit the
                                        currently selected product.
                                    </DialogDescription>
                                </DialogHeader>
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
                                                list="seller-category-options"
                                                placeholder="Payments"
                                                value={category}
                                                onChange={(event) =>
                                                    setCategory(event.target.value)
                                                }
                                            />
                                            <datalist id="seller-category-options">
                                                {API_CATEGORY_OPTIONS.map((option) => (
                                                    <option key={option.key} value={option.label} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="seller-tags">
                                                Tags (comma separated)
                                            </Label>
                                            <Input
                                                id="seller-tags"
                                                placeholder="payments, cards, invoices"
                                                value={tags}
                                                onChange={(event) => setTags(event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <Label htmlFor="seller-description">
                                                    Description
                                                </Label>
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={
                                                            isSuggestingClassification ||
                                                            isCreatingProduct ||
                                                            !title.trim() ||
                                                            !description.trim()
                                                        }
                                                        onClick={handleSuggestClassification}
                                                    >
                                                        <WandSparkles className="h-4 w-4" />
                                                        {isSuggestingClassification
                                                            ? "Suggesting..."
                                                            : "Suggest category"}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={
                                                            isGeneratingDescription ||
                                                            isCreatingProduct ||
                                                            !title.trim() ||
                                                            !category.trim()
                                                        }
                                                        onClick={handleGenerateDescription}
                                                    >
                                                        {isGeneratingDescription
                                                            ? "Generating..."
                                                            : "Generate with AI"}
                                                    </Button>
                                                </div>
                                            </div>
                                            <textarea
                                                id="seller-description"
                                                className={cn(
                                                    "flex min-h-[120px] w-full rounded-md border border-border/80 bg-background px-3 py-2 text-sm shadow-sm transition-[border-color,box-shadow,background-color] duration-150",
                                                    "placeholder:text-muted-foreground focus-visible:border-foreground/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
                                                )}
                                                placeholder="Accept payments with a single endpoint."
                                                value={description}
                                                onChange={(event) =>
                                                    setDescription(event.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateProductOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isCreatingProduct}>
                                            {isCreatingProduct ? "Creating..." : "Create product"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <div className="grid w-full gap-3 sm:grid-cols-3">
                            <StatChip label="Visible products" value={String(products.length)} />
                            <StatChip label="Published" value={String(publishedCount)} />
                            <StatChip
                                label="Plans (selected product)"
                                value={String(plans.length)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {isAnalyticsLoading ? (
                <LoadingBlock title="Loading seller analytics..." count={1} />
            ) : analyticsError ? (
                <ErrorBlock
                    title="Seller analytics unavailable"
                    description={analyticsError.message || "Please retry."}
                    code={analyticsError.code}
                    onRetry={() => setRetryKey((prev) => prev + 1)}
                />
            ) : analytics ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <OverviewMetric
                        label="Active clients"
                        value={formatNumber(analytics.totals.activeClients)}
                    />
                    <OverviewMetric
                        label="Past due clients"
                        value={formatNumber(analytics.totals.pastDueClients)}
                    />
                    <OverviewMetric
                        label={`Requests (${analytics.windowDays}d)`}
                        value={formatNumber(analytics.totals.requests30d)}
                    />
                    <OverviewMetric
                        label="Active MRR"
                        value={formatCurrency(analytics.totals.mrrCents, "EUR")}
                    />
                </div>
            ) : null}

            <StudioSectionHeader
                eyebrow="Existing products"
                title="Manage a selected product"
                description="Choose a product from the list. Status, versions, plans, and analytics in the workspace below all apply to that selected product."
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Selected product</CardTitle>
                        <CardDescription>
                            Current status, release readiness, and product controls.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {selectedProductRecord ? (
                            <>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {selectedStatus ? (
                                                <StatusBadge
                                                    kind="product"
                                                    value={selectedStatus}
                                                />
                                            ) : null}
                                            <span className="text-sm text-muted-foreground">
                                                {formatCategoryLabel(
                                                    getString(selectedProductRecord, "category")
                                                )}
                                            </span>
                                        </div>
                                        <h2 className="mt-2 text-2xl font-semibold text-foreground">
                                            {getString(selectedProductRecord, "title") ??
                                                "Untitled product"}
                                        </h2>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedTags.slice(0, 5).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-md border px-2 py-1 text-xs text-muted-foreground"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {selectedProductId ? (
                                        <CopyButton
                                            value={selectedProductId}
                                            label="Copy product ID"
                                            size="sm"
                                        />
                                    ) : null}
                                </div>

                                <div className="grid gap-2 sm:grid-cols-4">
                                    {setupSteps.map((step) => (
                                        <div
                                            key={step.label}
                                            className={cn(
                                                "rounded-lg border px-3 py-3",
                                                step.done
                                                    ? "border-emerald-500/35 bg-emerald-500/5"
                                                    : "border-border bg-muted/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {step.done ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="text-sm font-medium">
                                                    {step.label}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
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
                                        variant={
                                            selectedStatus === "PUBLISHED" ? "default" : "outline"
                                        }
                                        onClick={() => handleChangeProductStatus("PUBLISHED")}
                                    >
                                        Publish
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            selectedStatus === "HIDDEN" ? "default" : "outline"
                                        }
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

                <ProductListPanel
                    products={products}
                    isLoading={isProductsLoading}
                    error={productsError}
                    selectedProductId={selectedProductId}
                    onSelect={setSelectedProductId}
                    onRetry={() => setRetryKey((prev) => prev + 1)}
                />
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <StudioSectionHeader
                        eyebrow="Selected product workspace"
                        title="Work on one product at a time"
                        description="Use the tabs to switch between readiness, releases, plans, and performance for the selected product."
                    />
                    <TabsList className="h-10 w-full justify-start lg:w-auto">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="releases">Releases</TabsTrigger>
                        <TabsTrigger value="plans">Plans</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="mt-0">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Release snapshot</CardTitle>
                                <CardDescription>
                                    Quick read on the selected product before editing versions and
                                    plans.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedProductRecord ? (
                                    <>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <AnalyticsStat
                                                label="Versions"
                                                value={formatNumber(versions.length)}
                                            />
                                            <AnalyticsStat
                                                label="Plans"
                                                value={formatNumber(plans.length)}
                                            />
                                            <AnalyticsStat
                                                label="Published version"
                                                value={hasPublishedVersion ? "Ready" : "Missing"}
                                            />
                                            <AnalyticsStat
                                                label="Schema"
                                                value={hasSchemaConnected ? "Connected" : "Missing"}
                                            />
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
                                            Buyers can evaluate this product once it has a published
                                            version and at least one active plan.
                                        </div>
                                    </>
                                ) : (
                                    <EmptyBlock
                                        title="No release snapshot"
                                        description="Select a product to see version and plan readiness."
                                        variant="question"
                                    />
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Analytics for selected product</CardTitle>
                                <CardDescription>
                                    Views, subscriptions, conversion, billing issues, and top
                                    endpoints.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedProductAnalytics ? (
                                    <>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <AnalyticsStat
                                                label="Views (30d)"
                                                value={formatNumber(
                                                    selectedProductAnalytics.views30d
                                                )}
                                            />
                                            <AnalyticsStat
                                                label="Subscriptions (30d)"
                                                value={formatNumber(
                                                    selectedProductAnalytics.subscriptions30d
                                                )}
                                            />
                                            <AnalyticsStat
                                                label="Conversion"
                                                value={`${selectedProductAnalytics.conversionRate30d}%`}
                                            />
                                            <AnalyticsStat
                                                label="Active clients"
                                                value={formatNumber(
                                                    selectedProductAnalytics.activeClients
                                                )}
                                            />
                                            <AnalyticsStat
                                                label="Failed payments"
                                                value={formatNumber(
                                                    selectedProductAnalytics.failedPayments30d
                                                )}
                                            />
                                            <AnalyticsStat
                                                label="Requests (30d)"
                                                value={formatNumber(
                                                    selectedProductAnalytics.requests30d
                                                )}
                                            />
                                        </div>

                                        <div className="rounded-lg border p-3">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Latest published version
                                            </p>
                                            <p className="mt-1 text-sm font-medium">
                                                {selectedProductAnalytics.latestPublishedVersion
                                                    ? selectedProductAnalytics
                                                          .latestPublishedVersion.version
                                                    : "No published version yet"}
                                            </p>
                                            {selectedProductAnalytics.latestPublishedVersion ? (
                                                <p className="text-xs text-muted-foreground">
                                                    Published{" "}
                                                    {new Date(
                                                        selectedProductAnalytics
                                                            .latestPublishedVersion.createdAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Top endpoints
                                            </p>
                                            {selectedProductAnalytics.topEndpoints.length > 0 ? (
                                                <div className="grid gap-2">
                                                    {selectedProductAnalytics.topEndpoints.map(
                                                        (endpoint) => (
                                                            <div
                                                                key={endpoint.endpoint}
                                                                className="flex items-center justify-between rounded-lg border px-3 py-2"
                                                            >
                                                                <span className="font-mono text-xs text-foreground">
                                                                    {endpoint.endpoint}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {formatNumber(
                                                                        endpoint.requestCount
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <EmptyBlock
                                                    title="No endpoint traffic yet"
                                                    description="Analytics will populate once buyers send gateway traffic."
                                                />
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <EmptyBlock
                                        title="No analytics yet"
                                        description="Views, subscriptions, and usage will appear here once the selected product is visited and used."
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="releases" className="mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>Versions for selected product</CardTitle>
                            <CardDescription>
                                Add a version and OpenAPI URL. New versions start as DRAFT, then
                                publish below.
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
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isCreatingVersion || !selectedProductId}
                                >
                                    {isCreatingVersion ? "Creating..." : "Create version"}
                                </Button>
                            </form>

                            {isDetailsLoading ? (
                                <LoadingBlock
                                    title="Loading versions..."
                                    count={2}
                                    variant="lines"
                                />
                            ) : null}

                            {detailsError && !isDetailsLoading ? (
                                <ErrorBlock
                                    title="Could not load versions"
                                    description={
                                        detailsError.message || "Please select another product."
                                    }
                                    code={detailsError.code}
                                />
                            ) : null}

                            {!isDetailsLoading && !detailsError && versions.length > 0 ? (
                                <div className="space-y-2">
                                    {versions.slice(0, 4).map((version, index) => {
                                        const record = isRecord(version) ? version : null;
                                        const versionId = getVersionId(version);
                                        const versionName =
                                            getString(record, "version") ?? `Version ${index + 1}`;
                                        const versionStatus = getString(record, "status");
                                        return (
                                            <div
                                                key={versionId ?? `${versionName}-${index}`}
                                                className="space-y-2 rounded-lg border px-3 py-2"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-sm font-medium">
                                                        {versionName}
                                                    </span>
                                                    {versionStatus ? (
                                                        <StatusBadge
                                                            kind="version"
                                                            value={versionStatus}
                                                        />
                                                    ) : (
                                                        <CircleDashed className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant={
                                                            versionStatus === "PUBLISHED"
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        disabled={
                                                            !versionId ||
                                                            updatingVersionId === versionId
                                                        }
                                                        onClick={() =>
                                                            handleChangeVersionStatus(
                                                                versionId,
                                                                "PUBLISHED"
                                                            )
                                                        }
                                                    >
                                                        {updatingVersionId === versionId
                                                            ? "Updating..."
                                                            : "Publish"}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant={
                                                            versionStatus === "DRAFT"
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        disabled={
                                                            !versionId ||
                                                            updatingVersionId === versionId
                                                        }
                                                        onClick={() =>
                                                            handleChangeVersionStatus(
                                                                versionId,
                                                                "DRAFT"
                                                            )
                                                        }
                                                    >
                                                        Set draft
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans" className="mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plans for selected product</CardTitle>
                            <CardDescription>
                                Set monthly pricing, quota, and an optional per-minute rate limit.
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
                                            onChange={(event) =>
                                                setPlanCurrency(event.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
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
                                    <div className="space-y-2">
                                        <Label htmlFor="plan-rate-limit">Rate limit / minute</Label>
                                        <Input
                                            id="plan-rate-limit"
                                            type="number"
                                            min="1"
                                            step="1"
                                            placeholder="Optional"
                                            value={planRateLimitRpm}
                                            onChange={(event) =>
                                                setPlanRateLimitRpm(event.target.value)
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave blank to allow unrestricted burst traffic inside
                                            the monthly quota.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isCreatingPlan || !selectedProductId}
                                >
                                    {isCreatingPlan ? "Creating..." : "Create plan"}
                                </Button>
                            </form>

                            {!isDetailsLoading && plans.length > 0 ? (
                                <div className="space-y-2">
                                    {plans.slice(0, 4).map((plan) => (
                                        <div key={plan.id} className="rounded-lg border px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium">{plan.name}</p>
                                                {plan.isActive ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(plan.priceCents, plan.currency)} -{" "}
                                                {formatNumber(plan.quotaRequests)} requests / month
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {getPlanRateLimitLine(plan.rateLimitRpm)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const ProductListPanel = ({
    products,
    isLoading,
    error,
    selectedProductId,
    onSelect,
    onRetry
}: {
    products: CatalogProduct[];
    isLoading: boolean;
    error: ApiError | null;
    selectedProductId: string | null;
    onSelect: (productId: string | null) => void;
    onRetry: () => void;
}) => {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Existing products</CardTitle>
                <CardDescription>Select the listing you want to configure.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <LoadingBlock title="Loading products..." count={3} /> : null}

                {error && !isLoading ? (
                    <ErrorBlock
                        title="Could not load products"
                        description={error.message || "Please retry."}
                        code={error.code}
                        onRetry={onRetry}
                    />
                ) : null}

                {!isLoading && !error && products.length === 0 ? (
                    <EmptyBlock
                        title="No products yet"
                        description="Create your first product to start building your seller catalog."
                        variant="default"
                    />
                ) : null}

                {!isLoading && !error && products.length > 0 ? (
                    <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
                        {products.map((product, index) => {
                            const record = isRecord(product) ? product : null;
                            const productId = getProductId(product);
                            const isSelected =
                                productId !== null && productId === selectedProductId;
                            const titleValue = getString(record, "title") ?? `Product ${index + 1}`;
                            const categoryValue = formatCategoryLabel(
                                getString(record, "category")
                            );
                            const statusValue = getString(record, "status");

                            return (
                                <button
                                    key={productId ?? `product-${index}`}
                                    type="button"
                                    className={cn(
                                        "rounded-lg border px-3 py-3 text-left transition-[background-color,border-color]",
                                        "hover:border-foreground/20 hover:bg-muted/40",
                                        isSelected && "border-primary/70 bg-primary/10"
                                    )}
                                    onClick={() => onSelect(productId)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {titleValue}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {categoryValue}
                                            </p>
                                        </div>
                                        {statusValue ? (
                                            <StatusBadge kind="product" value={statusValue} />
                                        ) : null}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
};

const StudioSectionHeader = ({
    eyebrow,
    title,
    description
}: {
    eyebrow: string;
    title: string;
    description: string;
}) => {
    return (
        <div className="flex flex-col gap-1 border-l-2 border-primary/70 pl-4">
            <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
    );
};

const StatChip = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="rounded-lg border border-border/80 bg-background/70 px-4 py-3">
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
        </div>
    );
};

const OverviewMetric = ({ label, value }: { label: string; value: string }) => {
    return (
        <Card>
            <CardHeader className="flex min-h-[84px] justify-center py-4">
                <CardDescription>{label}</CardDescription>
                <CardTitle>{value}</CardTitle>
            </CardHeader>
        </Card>
    );
};

const AnalyticsStat = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    );
};
