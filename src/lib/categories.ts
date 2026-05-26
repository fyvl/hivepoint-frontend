import { getCurrentLocale, type Locale } from "@/i18n/i18n"

export type ApiCategoryOption = {
    key: string
    label: string
}

type LocalizedCategoryOption = {
    key: string
    labels: Record<Locale, string>
}

const API_CATEGORY_DEFINITIONS: LocalizedCategoryOption[] = [
    { key: "payments", labels: { en: "Payments", ru: "Платежи" } },
    { key: "communications", labels: { en: "Communications", ru: "Коммуникации" } },
    { key: "auth_identity", labels: { en: "Auth & Identity", ru: "Авторизация и идентификация" } },
    { key: "data_validation", labels: { en: "Data Validation", ru: "Проверка данных" } },
    { key: "ai_ml", labels: { en: "AI & ML", ru: "ИИ и ML" } },
    { key: "geo_maps", labels: { en: "Geo & Maps", ru: "Гео и карты" } },
    { key: "finance_data", labels: { en: "Finance Data", ru: "Финансовые данные" } },
    { key: "ecommerce_logistics", labels: { en: "E-commerce & Logistics", ru: "E-commerce и логистика" } },
    { key: "media_content", labels: { en: "Media & Content", ru: "Медиа и контент" } },
    { key: "analytics_monitoring", labels: { en: "Analytics & Monitoring", ru: "Аналитика и мониторинг" } }
]

const LEGACY_CATEGORY_DEFINITIONS: LocalizedCategoryOption[] = [
    { key: "developer-tools", labels: { en: "Developer Tools", ru: "Инструменты разработчика" } },
    { key: "ai", labels: { en: "AI", ru: "ИИ" } },
    { key: "samples", labels: { en: "Samples", ru: "Примеры" } },
    { key: "security", labels: { en: "Security", ru: "Безопасность" } },
    { key: "analytics", labels: { en: "Analytics", ru: "Аналитика" } },
    { key: "testing", labels: { en: "Testing", ru: "Тестирование" } }
]

const ALL_CATEGORY_DEFINITIONS = [...API_CATEGORY_DEFINITIONS, ...LEGACY_CATEGORY_DEFINITIONS]

export const API_CATEGORY_OPTIONS: ApiCategoryOption[] = API_CATEGORY_DEFINITIONS.map((option) => ({
    key: option.key,
    label: option.labels.en
}))

export const getApiCategoryOptions = (locale: Locale = getCurrentLocale()): ApiCategoryOption[] =>
    API_CATEGORY_DEFINITIONS.map((option) => ({
        key: option.key,
        label: option.labels[locale]
    }))

const normalizeCategoryToken = (value: string) => {
    return value
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^\p{L}\p{N}]+/gu, "_")
        .replace(/^_+|_+$/g, "")
}

const categoryByKey = new Map(ALL_CATEGORY_DEFINITIONS.map((option) => [option.key, option]))
const categoryKeyByToken = new Map<string, string>()

ALL_CATEGORY_DEFINITIONS.forEach((option) => {
    categoryKeyByToken.set(normalizeCategoryToken(option.key), option.key)
    Object.values(option.labels).forEach((label) => {
        categoryKeyByToken.set(normalizeCategoryToken(label), option.key)
    })
})

export const resolveKnownCategoryKey = (value: string | null | undefined) => {
    if (!value) {
        return undefined
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return undefined
    }

    if (categoryByKey.has(trimmed)) {
        return trimmed
    }

    return categoryKeyByToken.get(normalizeCategoryToken(trimmed))
}

export const formatCategoryLabel = (value: string | null | undefined) => {
    const knownKey = resolveKnownCategoryKey(value)
    if (knownKey) {
        return categoryByKey.get(knownKey)?.labels[getCurrentLocale()] ?? knownKey
    }

    const trimmed = value?.trim()
    return trimmed && trimmed.length > 0
        ? trimmed
        : getCurrentLocale() === "ru"
          ? "Без категории"
          : "Uncategorized"
}

export const toStoredCategoryValue = (value: string) => {
    return resolveKnownCategoryKey(value) ?? value.trim()
}
