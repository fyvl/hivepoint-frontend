import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    FilterX,
    LayoutGrid,
    Search,
    Tags
} from "lucide-react";

import { createCatalogApi, type CatalogProduct, type ListProductsResponse } from "@/api/catalog";
import { ApiError } from "@/api/http";
import { useAuth } from "@/auth/auth-context";
import { StatusBadge } from "@/components/status-badge";
import { CatalogGridSkeleton } from "@/components/skeletons/catalog-grid-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyBlock } from "@/components/ui-states/empty-block";
import { ErrorBlock } from "@/components/ui-states/error-block";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useI18n } from "@/i18n/i18n";
import { formatCategoryLabel } from "@/lib/categories";
import { formatNumber } from "@/lib/format";
import { notifyError } from "@/lib/notify";
import { fetchWithCache } from "@/lib/request-cache";
import { cn } from "@/lib/utils";

const limitOptions = [6, 12, 24];

const clampStyle: CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
};

const accentPalettes = [
    {
        gradient: "from-amber-500 via-amber-400 to-stone-600",
        badge: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    },
    {
        gradient: "from-amber-500 via-stone-500 to-slate-700",
        badge: "border-stone-500/20 bg-stone-500/10 text-stone-700 dark:text-stone-300"
    },
    {
        gradient: "from-amber-400 via-orange-500 to-stone-700",
        badge: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300"
    },
    {
        gradient: "from-amber-500 via-slate-500 to-slate-800",
        badge: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300"
    }
];

type CatalogFetchState = {
    items: CatalogProduct[];
    total?: number;
};

type FilterOption = {
    value: string;
    count: number;
};

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

const extractListItems = (payload: ListProductsResponse): CatalogProduct[] => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (!isRecord(payload)) {
        return [];
    }

    const items = payload.items;
    return Array.isArray(items) ? items : [];
};

const extractListTotal = (payload: ListProductsResponse): number | undefined => {
    if (!isRecord(payload)) {
        return undefined;
    }

    const total = payload.total;
    return typeof total === "number" ? total : undefined;
};

const getCardKey = (product: CatalogProduct, index: number) => {
    const record = isRecord(product) ? product : null;
    const id = getString(record, "id");
    return id ?? `product-${index}`;
};

const getPalette = (key: string) => {
    const normalized = key.trim();
    if (!normalized) {
        return accentPalettes[0];
    }

    const score = Array.from(normalized).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return accentPalettes[score % accentPalettes.length];
};

export const CatalogPage = () => {
    const { accessToken, refresh } = useAuth();
    const { t } = useI18n();
    const catalogApi = useMemo(
        () => createCatalogApi({ accessToken, refresh }),
        [accessToken, refresh]
    );

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [tag, setTag] = useState("");
    const [limit, setLimit] = useState(12);
    const [offset, setOffset] = useState(0);
    const [state, setState] = useState<CatalogFetchState>({ items: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<ApiError | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const debouncedSearch = useDebouncedValue(search, 400);
    const debouncedCategory = useDebouncedValue(category, 400);
    const debouncedTag = useDebouncedValue(tag, 250);

    useEffect(() => {
        setOffset(0);
    }, [debouncedSearch, debouncedCategory, debouncedTag, limit]);

    useEffect(() => {
        let isActive = true;

        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const query: Record<string, unknown> = {
                    limit,
                    offset
                };

                if (debouncedSearch) {
                    query.search = debouncedSearch;
                }

                if (debouncedCategory) {
                    query.category = debouncedCategory;
                }

                if (debouncedTag) {
                    query.tag = debouncedTag;
                }

                const cacheKey = `catalog:list:${accessToken ?? "public"}:${JSON.stringify(query)}`;
                const result = await fetchWithCache(
                    cacheKey,
                    async () => await catalogApi.listProducts(query),
                    30000
                );

                if (!isActive) {
                    return;
                }

                setState({
                    items: extractListItems(result),
                    total: extractListTotal(result)
                });
            } catch (err) {
                if (!isActive) {
                    return;
                }

                const apiError = err instanceof ApiError ? err : null;
                setError(apiError);
                setState({ items: [] });
                notifyError(apiError ?? err, "Catalog error");
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            isActive = false;
        };
    }, [
        accessToken,
        catalogApi,
        debouncedSearch,
        debouncedCategory,
        debouncedTag,
        limit,
        offset,
        retryKey
    ]);

    const hasPrev = offset > 0;
    const hasNext =
        state.total !== undefined ? offset + limit < state.total : state.items.length === limit;

    const showingText =
        state.total !== undefined
            ? state.total === 0
                ? "0 of 0"
                : `${offset + 1}-${Math.min(offset + limit, state.total)} of ${state.total}`
            : `Showing ${state.items.length} items`;
    const hasFilters = Boolean(search) || Boolean(category) || Boolean(tag);

    const categoryFilters = useMemo<FilterOption[]>(() => {
        const counts = new Map<string, number>();
        state.items.forEach((product) => {
            const record = isRecord(product) ? product : null;
            const value = getString(record, "category");
            if (value) {
                counts.set(value, (counts.get(value) ?? 0) + 1);
            }
        });

        const options = [...counts.entries()]
            .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
            .slice(0, 6)
            .map(([value, count]) => ({ value, count }));

        if (category && !options.some((option) => option.value === category)) {
            return [{ value: category, count: 0 }, ...options].slice(0, 6);
        }

        return options;
    }, [category, state.items]);

    const tagFilters = useMemo<FilterOption[]>(() => {
        const counts = new Map<string, number>();
        state.items.forEach((product) => {
            const record = isRecord(product) ? product : null;
            getStringArray(record, "tags").forEach((value) => {
                counts.set(value, (counts.get(value) ?? 0) + 1);
            });
        });

        const options = [...counts.entries()]
            .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
            .slice(0, 10)
            .map(([value, count]) => ({ value, count }));

        if (tag && !options.some((option) => option.value === tag)) {
            return [{ value: tag, count: 0 }, ...options].slice(0, 10);
        }

        return options;
    }, [state.items, tag]);

    const totalProductsLabel =
        state.total !== undefined ? formatNumber(state.total) : formatNumber(state.items.length);
    const pageLabel = formatNumber(Math.floor(offset / limit) + 1);

    return (
        <div className="flex flex-col gap-8">
            <section className="motion-section surface-panel-strong relative overflow-hidden px-5 py-5 md:px-6 md:py-6">
                <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,0.84fr)_minmax(320px,1fr)] lg:items-end">
                    <div>
                        <div className="section-kicker">
                            <LayoutGrid className="h-3.5 w-3.5" />
                            Marketplace catalog
                        </div>
                        <h1 className="display-title mt-4 max-w-4xl text-3xl text-foreground sm:text-4xl lg:text-5xl">
                            Find API products ready for real traffic.
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                            Search by name, category, or tag. Use filters first, then open a product
                            for versions, plans, and gateway access.
                        </p>

                        <div className="motion-stagger mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{t(`${totalProductsLabel} products`)}</Badge>
                            <Badge variant="outline">{t(`Page ${pageLabel}`)}</Badge>
                            <span>{showingText}</span>
                        </div>
                    </div>

                    <div className="motion-section rounded-xl border border-border/80 bg-background/90 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-foreground">
                                    Filter catalog
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Narrow the list before scanning cards.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearch("");
                                    setCategory("");
                                    setTag("");
                                }}
                                disabled={!hasFilters}
                            >
                                Clear
                                <FilterX className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mt-4 grid gap-4">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="catalog-search"
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    Search
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="catalog-search"
                                        placeholder="Name, category, tag..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="h-12 pl-10"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs font-semibold text-muted-foreground">
                                    Cards per page
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {limitOptions.map((value) => (
                                        <Button
                                            key={value}
                                            variant={limit === value ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setLimit(value)}
                                        >
                                            {t(`${formatNumber(value)} cards`)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {categoryFilters.length > 0 || tagFilters.length > 0 ? (
                    <div className="motion-stagger relative z-10 mt-6 grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        {categoryFilters.length > 0 ? (
                            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <LayoutGrid className="h-3.5 w-3.5" />
                                            Categories
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Main marketplace sections.
                                        </p>
                                    </div>
                                    {category ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCategory("")}
                                        >
                                            Reset
                                        </Button>
                                    ) : null}
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    {categoryFilters.map(({ value, count }) => {
                                        const isActive = category === value;

                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() =>
                                                    setCategory((current) =>
                                                        current === value ? "" : value
                                                    )
                                                }
                                                    className={cn(
                                                    "motion-interactive group flex min-h-[68px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left",
                                                        isActive
                                                            ? "border-primary bg-primary text-primary-foreground shadow-soft"
                                                            : "border-border/80 bg-card/80 text-foreground hover:border-foreground/20 hover:bg-accent/60"
                                                    )}
                                            >
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-semibold">
                                                        {formatCategoryLabel(value)}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "mt-1 block text-xs",
                                                            isActive
                                                                ? "text-primary-foreground/70"
                                                                : "text-muted-foreground"
                                                        )}
                                                    >
                                                        {count > 0
                                                            ? `${formatNumber(count)} visible`
                                                            : "active"}
                                                    </span>
                                                </span>
                                                <ArrowRight
                                                    className={cn(
                                                        "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                                                        isActive
                                                            ? "text-primary-foreground/80"
                                                            : "text-muted-foreground"
                                                    )}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        {tagFilters.length > 0 ? (
                            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <Tags className="h-3.5 w-3.5" />
                                            Tags
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Smaller signals for stack, protocol, or use case.
                                        </p>
                                    </div>
                                    {tag ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setTag("")}
                                        >
                                            Reset
                                        </Button>
                                    ) : null}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {tagFilters.map(({ value, count }) => {
                                        const isActive = tag === value;

                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() =>
                                                    setTag((current) =>
                                                        current === value ? "" : value
                                                    )
                                                }
                                                className={cn(
                                                    "motion-interactive inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium",
                                                    isActive
                                                        ? "border-foreground bg-foreground text-background shadow-soft"
                                                        : "border-border/80 bg-card/80 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                                                )}
                                            >
                                                <span>{value}</span>
                                                <span
                                                    className={cn(
                                                        "rounded-full px-1.5 py-0.5 text-[11px]",
                                                        isActive
                                                            ? "bg-background/20 text-background"
                                                            : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {count > 0 ? formatNumber(count) : "on"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-foreground">{showingText}</p>
                    <p className="text-sm text-muted-foreground">
                        {hasFilters
                            ? "Current filters are tightening the marketplace view."
                            : "Showing the catalog without extra constraints."}
                    </p>
                </div>
                {hasFilters ? (
                    <div className="flex flex-wrap gap-2">
                        {search ? <Badge variant="secondary">Search: {search}</Badge> : null}
                        {category ? (
                            <Badge variant="secondary">
                                Category: {formatCategoryLabel(category)}
                            </Badge>
                        ) : null}
                        {tag ? <Badge variant="secondary">Tag: {tag}</Badge> : null}
                    </div>
                ) : null}
            </div>

            {isLoading ? <CatalogGridSkeleton count={Math.min(limit, 6)} /> : null}

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
                                  setSearch("");
                                  setCategory("");
                                  setTag("");
                              }
                            : undefined
                    }
                />
            ) : null}

            {!isLoading && state.items.length > 0 ? (
                <div className="motion-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {state.items.map((product, index) => (
                        <CatalogCard key={getCardKey(product, index)} product={product} />
                    ))}
                </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border/80 bg-card/80 px-4 py-4 shadow-soft">
                <div className="text-sm text-muted-foreground">
                    Page {pageLabel} - {showingText}
                </div>
                <div className="flex items-center gap-2">
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
        </div>
    );
};

const CatalogCard = ({ product }: { product: CatalogProduct }) => {
    const record = isRecord(product) ? product : null;
    const title = getString(record, "title") ?? "Untitled product";
    const description = getString(record, "description") ?? "No description available yet.";
    const category = getString(record, "category") ?? "Uncategorized";
    const categoryLabel = formatCategoryLabel(category);
    const status = getString(record, "status") ?? "";
    const tags = getStringArray(record, "tags");
    const productId = getString(record, "id");
    const palette = getPalette(category);

    const content = (
        <Card className="motion-interactive relative flex h-full min-h-[270px] flex-col overflow-hidden border-border/80 bg-card/95 hover:border-foreground/20 hover:shadow-md">
            <div
                className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", palette.gradient)}
            />

            <CardHeader className="relative p-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <Badge variant="outline" className={cn("font-medium", palette.badge)}>
                        {categoryLabel}
                    </Badge>
                    {status ? <StatusBadge kind="product" value={status} /> : null}
                </div>
                <CardTitle className="mt-5 text-xl leading-tight">{title}</CardTitle>
            </CardHeader>

            <CardContent className="relative flex-1 p-5 pt-0">
                <p className="text-sm leading-7 text-muted-foreground" style={clampStyle}>
                    {description}
                </p>

                {tags.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary">
                                {tag}
                            </Badge>
                        ))}
                        {tags.length > 3 ? (
                            <Badge variant="secondary">+{tags.length - 3}</Badge>
                        ) : null}
                    </div>
                ) : null}
            </CardContent>

            <CardFooter className="relative mt-auto border-t border-border/70 p-5 pt-4">
                <div className="flex w-full items-center justify-between text-sm font-medium text-foreground">
                    <span>{productId ? "Open product" : "Product unavailable"}</span>
                    {productId ? (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    ) : null}
                </div>
            </CardFooter>
        </Card>
    );

    if (!productId) {
        return <div className="h-full">{content}</div>;
    }

    return (
        <Link to={`/products/${productId}`} className="group block h-full min-w-0">
            {content}
        </Link>
    );
};
