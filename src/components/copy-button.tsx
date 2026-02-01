import { Button, type ButtonProps } from "@/components/ui/button"
import { notifyError, notifySuccess } from "@/lib/notify"

type CopyButtonProps = {
    value: string
    label?: string
    disabled?: boolean
} & Pick<ButtonProps, "variant" | "size">

export const CopyButton = ({
    value,
    label = "Copy",
    disabled,
    variant = "outline",
    size = "sm"
}: CopyButtonProps) => {
    const handleCopy = async () => {
        if (!value) {
            return
        }
        try {
            await navigator.clipboard.writeText(value)
            notifySuccess("Copied", "Copied to clipboard.")
        } catch {
            notifyError(new Error("Unable to copy to clipboard."), "Copy failed")
        }
    }

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            onClick={handleCopy}
            disabled={disabled || !value}
        >
            {label}
        </Button>
    )
}
