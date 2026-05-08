export type ApiCategoryOption = {
    key: string;
    label: string;
};

export const API_CATEGORY_OPTIONS: ApiCategoryOption[] = [
    { key: "payments", label: "Payments" },
    { key: "communications", label: "Communications" },
    { key: "auth_identity", label: "Auth & Identity" },
    { key: "data_validation", label: "Data Validation" },
    { key: "ai_ml", label: "AI & ML" },
    { key: "geo_maps", label: "Geo & Maps" },
    { key: "finance_data", label: "Finance Data" },
    { key: "ecommerce_logistics", label: "E-commerce & Logistics" },
    { key: "media_content", label: "Media & Content" },
    { key: "analytics_monitoring", label: "Analytics & Monitoring" }
];

const LEGACY_CATEGORY_OPTIONS: ApiCategoryOption[] = [
    { key: "developer-tools", label: "Developer Tools" },
    { key: "ai", label: "AI" },
    { key: "samples", label: "Samples" },
    { key: "security", label: "Security" },
    { key: "analytics", label: "Analytics" },
    { key: "testing", label: "Testing" }
];

const ALL_CATEGORY_OPTIONS = [...API_CATEGORY_OPTIONS, ...LEGACY_CATEGORY_OPTIONS];

const normalizeCategoryToken = (value: string) => {
    return value
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
};

const categoryByKey = new Map(ALL_CATEGORY_OPTIONS.map((option) => [option.key, option]));
const categoryKeyByToken = new Map<string, string>();

ALL_CATEGORY_OPTIONS.forEach((option) => {
    categoryKeyByToken.set(normalizeCategoryToken(option.key), option.key);
    categoryKeyByToken.set(normalizeCategoryToken(option.label), option.key);
});

export const resolveKnownCategoryKey = (value: string | null | undefined) => {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }

    if (categoryByKey.has(trimmed)) {
        return trimmed;
    }

    return categoryKeyByToken.get(normalizeCategoryToken(trimmed));
};

export const formatCategoryLabel = (value: string | null | undefined) => {
    const knownKey = resolveKnownCategoryKey(value);
    if (knownKey) {
        return categoryByKey.get(knownKey)?.label ?? knownKey;
    }

    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : "Uncategorized";
};

export const toStoredCategoryValue = (value: string) => {
    return resolveKnownCategoryKey(value) ?? value.trim();
};
