import { Inbox, Search, FileQuestion, type LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

type EmptyBlockProps = {
    title: string
    description?: string
    actionLabel?: string
    actionTo?: string
    onAction?: () => void
    icon?: LucideIcon
    variant?: "default" | "search" | "question"
}

const iconMap: Record<string, LucideIcon> = {
    default: Inbox,
    search: Search,
    question: FileQuestion
}

export const EmptyBlock = ({
    title,
    description,
    actionLabel,
    actionTo,
    onAction,
    icon,
    variant = "default"
}: EmptyBlockProps) => {
    const shouldRenderAction = Boolean(actionLabel) && (Boolean(actionTo) || Boolean(onAction))
    const Icon = icon || iconMap[variant]

    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">{title}</h3>
            {description && (
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {shouldRenderAction && (
                <Button asChild={Boolean(actionTo)} onClick={onAction}>
                    {actionTo ? <Link to={actionTo}>{actionLabel}</Link> : actionLabel}
                </Button>
            )}
        </div>
    )
}
