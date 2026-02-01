import { useState } from "react"

import { mockPayment } from "@/api/billing"
import { ApiError } from "@/api/http"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const isDev = import.meta.env.DEV

type DevMockPaymentProps = {
    invoiceId: string
    onSuccess?: () => void
}

export const DevMockPaymentActions = ({ invoiceId, onSuccess }: DevMockPaymentProps) => {
    const { toast } = useToast()
    const [secret, setSecret] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isDev) {
        return null
    }

    const runAction = async (action: "succeed" | "fail") => {
        if (!secret.trim()) {
            toast({
                title: "Missing secret",
                description: "Provide MOCK_PAYMENT_SECRET to call mock endpoints.",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)
        try {
            if (action === "succeed") {
                await mockPayment.succeed(invoiceId, secret)
                toast({
                    title: "Mock payment succeeded",
                    description: "Invoice marked PAID."
                })
            } else {
                await mockPayment.fail(invoiceId, secret)
                toast({
                    title: "Mock payment failed",
                    description: "Invoice marked VOID."
                })
            }
            onSuccess?.()
        } catch (error) {
            const apiError = error instanceof ApiError ? error : null
            toast({
                title: apiError?.code ?? "Mock payment failed",
                description: apiError?.message ?? "Unable to call mock endpoint.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle className="text-sm">DEV ONLY: Mock payment</CardTitle>
                <CardDescription>
                    Uses `x-mock-payment-secret` with `MOCK_PAYMENT_SECRET` from the backend env.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label htmlFor="mock-secret">Mock payment secret</Label>
                    <Input
                        id="mock-secret"
                        value={secret}
                        onChange={(event) => setSecret(event.target.value)}
                        placeholder="MOCK_PAYMENT_SECRET"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => runAction("succeed")}
                    >
                        Mark Paid
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => runAction("fail")}
                    >
                        Mark Failed
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
