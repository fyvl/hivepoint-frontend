import { ArrowLeft, Home } from "lucide-react"
import { Link } from "react-router-dom"

import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

export const NotFoundPage = () => {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="space-y-6">
                {/* 404 with hexagon styling */}
                <div className="relative">
                    <span className="text-[150px] font-bold leading-none text-primary/10 md:text-[200px]">
                        404
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Logo size="lg" showText={false} />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
                    <p className="mx-auto max-w-md text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                        Let&apos;s get you back on track.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Button asChild variant="outline" className="gap-2">
                        <Link to="/" onClick={() => window.history.back()}>
                            <ArrowLeft className="h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                    <Button asChild className="gap-2 shadow-glow">
                        <Link to="/">
                            <Home className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
