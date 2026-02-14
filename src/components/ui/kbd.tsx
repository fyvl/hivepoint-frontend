import { cn } from "@/lib/utils"

interface KbdProps {
    children: React.ReactNode
    className?: string
}

export const Kbd = ({ children, className }: KbdProps) => {
    return (
        <kbd
            className={cn(
                "pointer-events-none inline-flex h-5 select-none items-center gap-1",
                "rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
                className
            )}
        >
            {children}
        </kbd>
    )
}

interface ShortcutProps {
    keys: string[]
    className?: string
}

export const Shortcut = ({ keys, className }: ShortcutProps) => {
    return (
        <span className={cn("flex items-center gap-0.5", className)}>
            {keys.map((key, index) => (
                <Kbd key={index}>{formatKey(key)}</Kbd>
            ))}
        </span>
    )
}

const formatKey = (key: string): string => {
    const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC")
    
    const keyMap: Record<string, string> = {
        mod: isMac ? "⌘" : "Ctrl",
        ctrl: isMac ? "⌃" : "Ctrl",
        alt: isMac ? "⌥" : "Alt",
        shift: "⇧",
        enter: "↵",
        escape: "Esc",
        backspace: "⌫",
        delete: "Del",
        tab: "Tab",
        space: "Space",
        up: "↑",
        down: "↓",
        left: "←",
        right: "→"
    }
    
    return keyMap[key.toLowerCase()] || key.toUpperCase()
}
