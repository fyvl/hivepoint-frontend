import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { type Locale, translationPairs } from "@/i18n/translations"

export type { Locale } from "@/i18n/translations"

const STORAGE_KEY = "hp_locale"
const DEFAULT_LOCALE: Locale = "en"
const SKIP_SELECTOR = "script, style, noscript, textarea, pre, code, [data-i18n-skip]"

let currentLocale: Locale = DEFAULT_LOCALE

const isLocale = (value: unknown): value is Locale => {
    return value === "en" || value === "ru"
}

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim()

const preserveOuterWhitespace = (source: string, translated: string) => {
    const leading = source.match(/^\s*/)?.[0] ?? ""
    const trailing = source.match(/\s*$/)?.[0] ?? ""
    return `${leading}${translated}${trailing}`
}

const exactTranslations = new Map<string, Record<Locale, string>>()

translationPairs.forEach((pair) => {
    const englishKey = normalizeText(pair.en)
    const russianKey = normalizeText(pair.ru)

    if (!exactTranslations.has(englishKey)) {
        exactTranslations.set(englishKey, pair)
    }

    if (!exactTranslations.has(russianKey)) {
        exactTranslations.set(russianKey, pair)
    }
})

type PatternTranslation = {
    from: Locale
    to: Locale
    pattern: RegExp
    replace: (match: RegExpMatchArray) => string
}

const translateRoleList = (value: string) =>
    value
        .split("/")
        .map((role) => translateText(role.trim(), "ru"))
        .join(" / ")

const formatRuPlural = (countText: string, forms: [string, string, string]) => {
    const count = Math.abs(Number.parseInt(countText.replace(/\s/g, ""), 10))
    const mod10 = count % 10
    const mod100 = count % 100
    const form =
        mod10 === 1 && mod100 !== 11
            ? forms[0]
            : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
                ? forms[1]
                : forms[2]

    return `${countText} ${form}`
}

const workspaceModeTranslations: Record<string, string> = {
    admin: "администратора",
    seller: "продавца",
    buyer: "покупателя",
    public: "гостевого режима"
}

const patternTranslations: PatternTranslation[] = [
    {
        from: "en",
        to: "ru",
        pattern: /^This area is available for (.+) accounts\. Your role is (.+)\.$/,
        replace: ([, allowedRoles, userRole]) =>
            `Этот раздел доступен для ролей ${translateRoleList(allowedRoles)}. Ваша роль: ${translateText(userRole, "ru")}.`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Showing the most useful routes for (.+) mode\.$/,
        replace: ([, mode]) => {
            const translatedMode = workspaceModeTranslations[mode.toLowerCase()]
            if (translatedMode === "гостевого режима") {
                return "Показаны основные разделы гостевого режима."
            }
            return `Показаны основные разделы для ${translatedMode ?? mode}.`
        }
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Open (.+)$/,
        replace: ([, target]) => `Открыть ${translateText(target, "ru")}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Requests \((\d+)d\)$/,
        replace: ([, days]) => `Запросы (${days} д.)`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Page ([\d\s.,-]+)$/,
        replace: ([, page]) => `Страница ${page}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^([\d\s.,]+) products$/,
        replace: ([, count]) => formatRuPlural(count, ["продукт", "продукта", "продуктов"])
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Showing ([\d\s.,]+) items$/,
        replace: ([, count]) => `Показано элементов: ${count}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^0 of 0$/,
        replace: () => "0 из 0"
    },
    {
        from: "en",
        to: "ru",
        pattern: /^([\d\s.,]+)-([\d\s.,]+) of ([\d\s.,]+)$/,
        replace: ([, start, end, total]) => `${start}-${end} из ${total}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^([\d\s.,]+) visible$/,
        replace: ([, count]) => `${count} в выдаче`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Search: (.+)$/,
        replace: ([, value]) => `Поиск: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Category: (.+)$/,
        replace: ([, value]) => `Категория: ${translateText(value, "ru")}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Tag: (.+)$/,
        replace: ([, value]) => `Тег: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Rate limit: (.+)$/,
        replace: ([, value]) => `Лимит скорости: ${translateText(value, "ru")}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Status: (.+)$/,
        replace: ([, value]) => `Статус: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Subscription: (.+)$/,
        replace: ([, value]) => `Подписка: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Requests used in call: (.+)$/,
        replace: ([, value]) => `Запросов в вызове: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Remaining requests: (.+)$/,
        replace: ([, value]) => `Осталось запросов: ${translateText(value, "ru")}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Remaining this minute: (.+)$/,
        replace: ([, value]) => `Осталось в эту минуту: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Period end: (.+)$/,
        replace: ([, value]) => `Конец периода: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Invoice ID: (.+)$/,
        replace: ([, value]) => `ID счета: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^([\d\s.,]+) requests per period$/,
        replace: ([, value]) => `${value} запросов за период`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^([\d\s.,]+) endpoint routes found$/,
        replace: ([, count]) => `Найдено эндпоинтов: ${count}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^(\d+) cards$/,
        replace: ([, count]) => formatRuPlural(count, ["карточка", "карточки", "карточек"])
    },
    {
        from: "ru",
        to: "en",
        pattern: /^(\d+) карточек$/,
        replace: ([, count]) => `${count} cards`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Page ([\d\s.,-]+) - (.+)$/,
        replace: ([, page, range]) => `Страница ${page} - ${translateText(range, "ru")}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Страница ([\d\s.,-]+) - (.+)$/,
        replace: ([, page, range]) => `Page ${page} - ${translateText(range, "en")}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Showing: (\d+)$/,
        replace: ([, count]) => `Показано: ${count}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Показано: (\d+)$/,
        replace: ([, count]) => `Showing: ${count}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^(\d+) endpoint routes detected from the schema snapshot\.$/,
        replace: ([, count]) => `Найдено эндпоинтов в снимке схемы: ${count}.`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Найдено эндпоинтов в снимке схемы: (\d+)\.$/,
        replace: ([, count]) => `${count} endpoint routes detected from the schema snapshot.`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Snapshot fetched (.+) · found endpoint routes: (.+)$/,
        replace: ([, date, count]) => `Снимок получен ${date} · эндпоинтов найдено: ${count}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Снимок получен (.+) · эндпоинтов найдено: (.+)$/,
        replace: ([, date, count]) => `Snapshot fetched ${date} · found endpoint routes: ${count}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Snapshot fetched (.+) · ([\d\s.,]+) endpoint routes found$/,
        replace: ([, date, count]) => `Снимок получен ${date} · эндпоинтов: ${count}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Снимок получен (.+) · эндпоинтов: ([\d\s.,]+)$/,
        replace: ([, date, count]) => `Snapshot fetched ${date} · ${count} endpoint routes found`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Payment past due for (.+)$/,
        replace: ([, product]) => `Просрочена оплата: ${product}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Просрочена оплата: (.+)$/,
        replace: ([, product]) => `Payment past due for ${product}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Retry scheduled for (.+)$/,
        replace: ([, product]) => `Запланирован повтор оплаты: ${product}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Запланирован повтор оплаты: (.+)$/,
        replace: ([, product]) => `Retry scheduled for ${product}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Renewal coming up for (.+)$/,
        replace: ([, product]) => `Скоро продление: ${product}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Скоро продление: (.+)$/,
        replace: ([, product]) => `Renewal coming up for ${product}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^New API version available for (.+)$/,
        replace: ([, product]) => `Доступна новая версия API: ${product}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Доступна новая версия API: (.+)$/,
        replace: ([, product]) => `New API version available for ${product}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Overage active for (.+)$/,
        replace: ([, product]) => `Активен перерасход: ${product}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Активен перерасход: (.+)$/,
        replace: ([, product]) => `Overage active for ${product}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Quota exceeded for (.+)$/,
        replace: ([, product]) => `Квота превышена: ${product}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Квота превышена: (.+)$/,
        replace: ([, product]) => `Quota exceeded for ${product}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Quota nearing limit for (.+)$/,
        replace: ([, product]) => `Квота близка к лимиту: ${product}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Квота близка к лимиту: (.+)$/,
        replace: ([, product]) => `Quota nearing limit for ${product}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Metrics history points: ([\d\s.,]+)$/,
        replace: ([, count]) => `Точек истории метрик: ${count}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Captured every ([\d\s.,]+)s and retained for ([\d\s.,]+) day\(s\)\.$/,
        replace: ([, interval, days]) => `Снимок каждые ${interval} с, хранение ${days} дн.`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Latest capture: (.+)$/,
        replace: ([, value]) => `Последний снимок: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Interval ([\d\s.,]+)s, cooldown ([\d\s.,]+)s$/,
        replace: ([, interval, cooldown]) => `Интервал ${interval} с, пауза ${cooldown} с`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Targets: (.+)$/,
        replace: ([, value]) => `Цели: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Last delivery error: (.+)$/,
        replace: ([, value]) => `Ошибка последней доставки: ${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^Retry #(.+)$/,
        replace: ([, value]) => `Повтор #${value}`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^([\d\s.,]+) of ([\d\s.,]+) requests have been consumed in the current billing period\.$/,
        replace: ([, used, quota]) => `Использовано ${used} из ${quota} запросов за текущий платежный период.`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Использовано ([\d\s.,]+) из ([\d\s.,]+) запросов за текущий платежный период\.$/,
        replace: ([, used, quota]) => `${used} of ${quota} requests have been consumed in the current billing period.`
    },
    {
        from: "en",
        to: "ru",
        pattern: /^([\d\s.,]+) of ([\d\s.,]+) included requests have been consumed in the current billing period\.(.*)$/,
        replace: ([, used, quota, suffix]) =>
            `Использовано ${used} из ${quota} включенных запросов за текущий платежный период.${suffix}`
    },
    {
        from: "ru",
        to: "en",
        pattern: /^Использовано ([\d\s.,]+) из ([\d\s.,]+) включенных запросов за текущий платежный период\.(.*)$/,
        replace: ([, used, quota, suffix]) =>
            `${used} of ${quota} included requests have been consumed in the current billing period.${suffix}`
    }
]

export const getCurrentLocale = () => currentLocale

export const setCurrentLocale = (locale: Locale) => {
    currentLocale = locale
}

export const getStoredLocale = (): Locale => {
    if (typeof window === "undefined") {
        return DEFAULT_LOCALE
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) {
        return stored
    }

    return window.navigator.language.toLowerCase().startsWith("ru") ? "ru" : DEFAULT_LOCALE
}

export const translateText = (value: string, locale: Locale = getCurrentLocale()) => {
    if (locale === "en") {
        return value
    }

    const normalized = normalizeText(value)
    if (!normalized) {
        return value
    }

    const exact = exactTranslations.get(normalized)
    if (exact) {
        return preserveOuterWhitespace(value, exact[locale])
    }

    for (const translation of patternTranslations) {
        if (translation.to !== locale) {
            continue
        }

        const match = normalized.match(translation.pattern)
        if (match) {
            return preserveOuterWhitespace(value, translation.replace(match))
        }
    }

    return value
}

const shouldSkipNode = (node: Node) => {
    const parent = node.parentElement
    return !parent || Boolean(parent.closest(SKIP_SELECTOR))
}

const translateAttributes = (root: ParentNode, locale: Locale) => {
    root.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]").forEach((element) => {
        ;["placeholder", "aria-label", "title"].forEach((attribute) => {
            const value = element.getAttribute(attribute)
            if (!value) {
                return
            }

            const translated = translateText(value, locale)
            if (translated !== value) {
                element.setAttribute(attribute, translated)
            }
        })
    })
}

export const translateDocument = (locale: Locale) => {
    if (typeof document === "undefined" || !document.body) {
        return
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
            shouldSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    })

    const nodes: Text[] = []
    let currentNode = walker.nextNode()
    while (currentNode) {
        nodes.push(currentNode as Text)
        currentNode = walker.nextNode()
    }

    nodes.forEach((node) => {
        const value = node.nodeValue ?? ""
        const translated = translateText(value, locale)
        if (translated !== value) {
            node.nodeValue = translated
        }
    })

    translateAttributes(document.body, locale)
}

type I18nContextValue = {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (value: string) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
    const [locale, setLocaleState] = useState<Locale>(() => {
        const storedLocale = getStoredLocale()
        setCurrentLocale(storedLocale)
        return storedLocale
    })
    const isTranslatingRef = useRef(false)

    const setLocale = useCallback((nextLocale: Locale) => {
        setCurrentLocale(nextLocale)
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, nextLocale)
        }
        setLocaleState(nextLocale)
    }, [])

    const t = useCallback((value: string) => translateText(value, locale), [locale])

    useEffect(() => {
        setCurrentLocale(locale)

        if (typeof document === "undefined") {
            return
        }

        document.documentElement.lang = locale
        isTranslatingRef.current = true
        translateDocument(locale)
        isTranslatingRef.current = false
    }, [locale])

    useEffect(() => {
        if (typeof MutationObserver === "undefined" || typeof document === "undefined") {
            return
        }

        if (locale !== "ru") {
            return
        }

        let animationFrameId = 0
        const observer = new MutationObserver(() => {
            if (isTranslatingRef.current) {
                return
            }

            isTranslatingRef.current = true
            animationFrameId = window.requestAnimationFrame(() => {
                translateDocument(getCurrentLocale())
                isTranslatingRef.current = false
            })
        })

        observer.observe(document.body, {
            attributeFilter: ["placeholder", "aria-label", "title"],
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true
        })

        return () => {
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId)
            }
            observer.disconnect()
        }
    }, [locale])

    const value = useMemo<I18nContextValue>(
        () => ({
            locale,
            setLocale,
            t
        }),
        [locale, setLocale, t]
    )

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error("useI18n must be used within I18nProvider")
    }
    return context
}
