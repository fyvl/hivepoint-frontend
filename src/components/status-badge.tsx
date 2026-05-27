import { Badge, type BadgeProps } from "@/components/ui/badge"
import { getCurrentLocale } from "@/i18n/i18n"

export type StatusBadgeKind = "product" | "version" | "subscription" | "key" | "usage"

type StatusConfig = {
    variant: BadgeProps["variant"]
    label?: {
        en: string
        ru: string
    }
}

const statusMaps: Record<StatusBadgeKind, Record<string, StatusConfig>> = {
    product: {
        PUBLISHED: { variant: "success", label: { en: "Published", ru: "Опубликован" } },
        DRAFT: { variant: "secondary", label: { en: "Draft", ru: "Черновик" } },
        HIDDEN: { variant: "outline", label: { en: "Hidden", ru: "Скрыт" } },
        ARCHIVED: { variant: "secondary", label: { en: "Archived", ru: "В архиве" } }
    },
    version: {
        PUBLISHED: { variant: "success", label: { en: "Published", ru: "Опубликована" } },
        DRAFT: { variant: "secondary", label: { en: "Draft", ru: "Черновик" } },
        HIDDEN: { variant: "outline", label: { en: "Hidden", ru: "Скрыта" } },
        ARCHIVED: { variant: "secondary", label: { en: "Archived", ru: "В архиве" } }
    },
    subscription: {
        ACTIVE: { variant: "success", label: { en: "Active", ru: "Активна" } },
        PENDING: { variant: "secondary", label: { en: "Pending", ru: "Ожидает" } },
        CANCELLED: { variant: "secondary", label: { en: "Canceled", ru: "Отменена" } },
        CANCELED: { variant: "secondary", label: { en: "Canceled", ru: "Отменена" } },
        INACTIVE: { variant: "secondary", label: { en: "Inactive", ru: "Неактивна" } },
        PAST_DUE: { variant: "destructive", label: { en: "Past due", ru: "Просрочена" } },
        FAILED: { variant: "destructive", label: { en: "Failed", ru: "Ошибка" } }
    },
    key: {
        ACTIVE: { variant: "success", label: { en: "Active", ru: "Активен" } },
        REVOKED: { variant: "secondary", label: { en: "Revoked", ru: "Отозван" } }
    },
    usage: {
        OK: { variant: "success", label: { en: "OK", ru: "OK" } },
        NEAR_LIMIT: { variant: "warning", label: { en: "Near limit", ru: "Близко к лимиту" } },
        EXCEEDED: { variant: "destructive", label: { en: "Exceeded", ru: "Лимит превышен" } }
    }
}

const normalizeStatus = (value: string) => {
    return value.trim().toUpperCase().replace(/[\s-]+/g, "_")
}

type StatusBadgeProps = {
    kind: StatusBadgeKind
    value: string
    className?: string
}

export const StatusBadge = ({ kind, value, className }: StatusBadgeProps) => {
    const normalized = normalizeStatus(value)
    const config = statusMaps[kind][normalized]
    const label = config?.label?.[getCurrentLocale()] ?? value
    const variant = config?.variant ?? "outline"

    return (
        <Badge variant={variant} className={className}>
            {label}
        </Badge>
    )
}
