import { ApiError } from "@/api/http"
import { toast } from "@/hooks/use-toast"

export const notifySuccess = (title: string, description?: string) => {
    toast({
        title,
        description,
        variant: "success"
    })
}

export const notifyInfo = (title: string, description?: string) => {
    toast({
        title,
        description,
        variant: "info"
    })
}

export const notifyWarning = (title: string, description?: string) => {
    toast({
        title,
        description,
        variant: "warning"
    })
}

export const notifyError = (err: unknown, fallbackTitle?: string) => {
    if (err instanceof ApiError) {
        toast({
            title: fallbackTitle ?? err.code ?? "Error",
            description: err.message,
            variant: "destructive"
        })
        return
    }

    toast({
        title: fallbackTitle ?? "Unexpected error",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive"
    })
}
