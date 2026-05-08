import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    FilterX,
    LayoutGrid,
    Search,
    Sparkles,
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
        gradient: "from-amber-500 via-orange-400 to-yellow-300",
        badge: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    },
    {
        gradient: "from-emerald-500 via-teal-400 to-cyan-400",
        badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    },
    {
        gradient: "from-sky-500 via-cyan-400 to-blue-500",
        badge: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
    },
    {
        gradient: "from-violet-500 via-fuchsia-400 to-indigo-400",
        badge: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300"
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

    const categoriesInView = useMemo(() => {
        const categories = new Set<string>();
        state.items.forEach((product) => {
            const record = isRecord(product) ? product : null;
            const value = getString(record, "category");
            if (value) {
                categories.add(value);
            }
        });
        return Array.from(categories).slice(0, 6);
    }, [state.items]);

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
            <section className="surface-panel-strong relative overflow-hidden px-6 py-6 md:px-8 md:py-8">
                <div className="catalog-hero-accent" />

                <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_400px]">
                    <div>
                        <div className="section-kicker">
                            <Sparkles className="h-3.5 w-3.5" />
                            Public marketplace
                        </div>
                        <h1 className="display-title mt-5 text-4xl text-foreground sm:text-5xl">
                            Find API products that are already shaped for real traffic.
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                            Search the catalog, move from product metadata into versions, then step
                            into billing and gateway workflows without context switching.
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-3">
                            <StatPanel
                                label="Visible products"
                                value={totalProductsLabel}
                                caption="Matching the current query and filters."
                            />
                            <StatPanel
                                label="Categories in view"
                                value={formatNumber(categoriesInView.length)}
                                caption="A quick read on breadth inside the current slice."
                            />
                            <StatPanel
                                label="Page"
                                value={pageLabel}
                                caption={`${limit} cards per page right now.`}
                            />
                        </div>
                    </div>

                    <div className="surface-panel border-border/80 bg-background/86 px-5 py-5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                            Refine discovery
                        </div>

                        <div className="mt-5 grid gap-4">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="catalog-search"
                                    className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground"
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

                            <div className="space-y-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                    Density
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {limitOptions.map((value) => (
                                        <Button
                                            key={value}
                                            variant={limit === value ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setLimit(value)}
                                        >
                                            {value} cards
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="justify-between"
                                onClick={() => {
                                    setSearch("");
                                    setCategory("");
                                    setTag("");
                                }}
                                disabled={!hasFilters}
                            >
                                Clear filters
                                <FilterX className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {categoryFilters.length > 0 || tagFilters.length > 0 ? (
                    <div className="relative z-10 mt-8 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        {categoryFilters.length > 0 ? (
                            <div className="rounded-[1.2rem] border border-border/70 bg-background/76 px-4 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
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
                                                    "group flex min-h-[68px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
                                                    isActive
                                                        ? "border-primary bg-primary text-primary-foreground shadow-soft"
                                                        : "border-border/80 bg-card/78 text-foreground hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-accent/55"
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
                                                                ? "text-primary-foreground/72"
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
                            <div className="rounded-[1.2rem] border border-border/70 bg-background/76 px-4 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
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
                                                    "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition",
                                                    isActive
                                                        ? "border-foreground bg-foreground text-background shadow-soft"
                                                        : "border-border/80 bg-card/82 text-muted-foreground hover:-translate-y-0.5 hover:border-foreground/20 hover:text-foreground"
                                                )}
                                            >
                                                <span>{value}</span>
                                                <span
                                                    className={cn(
                                                        "rounded-full px-1.5 py-0.5 text-[11px]",
                                                        isActive
                                                            ? "bg-background/18 text-background"
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

const StatPanel = ({
    label,
    value,
    caption
}: {
    label: string;
    value: string;
    caption: string;
}) => {
    return (
        <div className="rounded-[1.2rem] border border-border/70 bg-background/72 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{caption}</div>
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
        <Card className="relative flex h-full min-h-[270px] flex-col overflow-hidden border-border/80 bg-card/95 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
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
