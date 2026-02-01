import { Badge, type BadgeProps } from "@/components/ui/badge"

export type StatusBadgeKind = "product" | "version" | "subscription" | "key" | "usage"

type StatusConfig = {
    variant: BadgeProps["variant"]
    label?: string
}

const statusMaps: Record<StatusBadgeKind, Record<string, StatusConfig>> = {
    product: {
        PUBLISHED: { variant: "default", label: "Published" },
        DRAFT: { variant: "secondary", label: "Draft" },
        HIDDEN: { variant: "outline", label: "Hidden" },
        ARCHIVED: { variant: "secondary", label: "Archived" }
    },
    version: {
        PUBLISHED: { variant: "default", label: "Published" },
        DRAFT: { variant: "secondary", label: "Draft" },
        HIDDEN: { variant: "outline", label: "Hidden" },
        ARCHIVED: { variant: "secondary", label: "Archived" }
    },
    subscription: {
        ACTIVE: { variant: "default", label: "Active" },
        PENDING: { variant: "secondary", label: "Pending" },
        CANCELLED: { variant: "secondary", label: "Canceled" },
        CANCELED: { variant: "secondary", label: "Canceled" },
        INACTIVE: { variant: "secondary", label: "Inactive" },
        PAST_DUE: { variant: "destructive", label: "Past due" },
        FAILED: { variant: "destructive", label: "Failed" }
    },
    key: {
        ACTIVE: { variant: "default", label: "Active" },
        REVOKED: { variant: "secondary", label: "Revoked" }
    },
    usage: {
        OK: { variant: "default", label: "OK" },
        NEAR_LIMIT: { variant: "secondary", label: "Near limit" },
        EXCEEDED: { variant: "destructive", label: "Exceeded" }
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
    const label = config?.label ?? value
    const variant = config?.variant ?? "outline"

    return (
        <Badge variant={variant} className={className}>
            {label}
        </Badge>
    )
}
