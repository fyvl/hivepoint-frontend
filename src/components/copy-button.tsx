import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button, type ButtonProps } from "@/components/ui/button"
import { notifyError, notifySuccess } from "@/lib/notify"
import { cn } from "@/lib/utils"

type CopyButtonProps = {
    value: string
    label?: string
    copiedLabel?: string
    disabled?: boolean
    showIcon?: boolean
    className?: string
} & Pick<ButtonProps, "variant" | "size">

export const CopyButton = ({
    value,
    label = "Copy",
    copiedLabel = "Copied!",
    disabled,
    variant = "outline",
    size = "sm",
    showIcon = true,
    className
}: CopyButtonProps) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!value) {
            return
        }
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            notifySuccess("Copied", "Copied to clipboard.")
            setTimeout(() => setCopied(false), 2000)
        } catch {
            notifyError(new Error("Unable to copy to clipboard."), "Copy failed")
        }
    }

    return (
        <Button
            type="button"
            variant={copied ? "default" : variant}
            size={size}
            onClick={handleCopy}
            disabled={disabled || !value}
            className={cn(
                "gap-2 transition-all",
                copied && "bg-emerald-500 hover:bg-emerald-600 text-white",
                className
            )}
        >
            {showIcon && (
                copied ? (
                    <Check className="h-4 w-4" />
                ) : (
                    <Copy className="h-4 w-4" />
                )
            )}
            {copied ? copiedLabel : label}
        </Button>
    )
}

// Compact version for inline use
export const CopyIconButton = ({
    value,
    disabled,
    className
}: {
    value: string
    disabled?: boolean
    className?: string
}) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!value) return
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Silent fail for icon button
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            disabled={disabled || !value}
            className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                "disabled:pointer-events-none disabled:opacity-50",
                copied && "text-emerald-500",
                className
            )}
            title={copied ? "Copied!" : "Copy to clipboard"}
        >
            {copied ? (
                <Check className="h-4 w-4" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
        </button>
    )
}
