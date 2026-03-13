import { ArrowLeft, CircleSlash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const BillingCancelPage = () => {
    return (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center">
            <Card className="w-full border-amber-500/20 shadow-soft">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                        <CircleSlash2 className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle>Checkout was canceled</CardTitle>
                        <CardDescription>
                            No payment was completed. You can return to the product page and try
                            again whenever you are ready.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button asChild variant="outline" className="gap-2">
                        <Link to="/billing">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Billing
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
