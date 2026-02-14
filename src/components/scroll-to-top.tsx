import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ScrollToTopProps {
    threshold?: number
    className?: string
}

export const ScrollToTop = ({ threshold = 400, className }: ScrollToTopProps) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > threshold) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener("scroll", toggleVisibility, { passive: true })
        return () => window.removeEventListener("scroll", toggleVisibility)
    }, [threshold])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg",
                "bg-background/80 backdrop-blur-sm",
                "transition-all duration-300",
                isVisible 
                    ? "translate-y-0 opacity-100" 
                    : "translate-y-16 opacity-0 pointer-events-none",
                className
            )}
            aria-label="Scroll to top"
        >
            <ArrowUp className="h-5 w-5" />
        </Button>
    )
}
