import React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type ErrorBoundaryProps = {
    children: React.ReactNode
}

type ErrorBoundaryState = {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
        error: null
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children
        }

        return (
            <div className="flex min-h-[60vh] items-center justify-center p-6">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>Something went wrong</CardTitle>
                        <CardDescription>
                            An unexpected error occurred. Try reloading the page.
                        </CardDescription>
                    </CardHeader>
                    {import.meta.env.DEV && this.state.error ? (
                        <CardContent>
                            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                                {this.state.error.stack ?? this.state.error.message}
                            </pre>
                        </CardContent>
                    ) : null}
                    <CardFooter>
                        <Button onClick={() => window.location.reload()}>
                            Reload
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }
}
