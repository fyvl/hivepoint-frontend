import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type EmptyBlockProps = {
    title: string
    description?: string
    actionLabel?: string
    actionTo?: string
    onAction?: () => void
}

export const EmptyBlock = ({
    title,
    description,
    actionLabel,
    actionTo,
    onAction
}: EmptyBlockProps) => {
    const shouldRenderAction = Boolean(actionLabel) && (Boolean(actionTo) || Boolean(onAction))

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            {shouldRenderAction ? (
                <CardFooter>
                    <Button asChild={Boolean(actionTo)} onClick={onAction} variant="outline">
                        {actionTo ? <Link to={actionTo}>{actionLabel}</Link> : actionLabel}
                    </Button>
                </CardFooter>
            ) : null}
        </Card>
    )
}
