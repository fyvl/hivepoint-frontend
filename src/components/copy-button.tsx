import { Button, type ButtonProps } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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
    const { toast } = useToast()

    const handleCopy = async () => {
        if (!value) {
            return
        }
        try {
            await navigator.clipboard.writeText(value)
            toast({
                title: "Copied",
                description: "Copied to clipboard."
            })
        } catch {
            toast({
                title: "Copy failed",
                description: "Unable to copy to clipboard.",
                variant: "destructive"
            })
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
