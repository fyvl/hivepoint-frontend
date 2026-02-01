import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type ErrorBlockProps = {
    title?: string
    description?: string
    code?: string | null
    retryLabel?: string
    onRetry?: () => void
}

export const ErrorBlock = ({
    title = "Something went wrong",
    description = "We could not load this data.",
    code,
    retryLabel = "Try again",
    onRetry
}: ErrorBlockProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    {code ? `${code}: ${description}` : description}
                </CardDescription>
            </CardHeader>
            {onRetry ? (
                <CardFooter>
                    <Button variant="outline" onClick={onRetry}>
                        {retryLabel}
                    </Button>
                </CardFooter>
            ) : null}
        </Card>
    )
}
