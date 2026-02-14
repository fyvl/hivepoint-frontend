import { BarChart3, BriefcaseBusiness, CreditCard, Home, Key, Laptop, LayoutGrid, Menu, Moon, Sun, User } from "lucide-react"
import { Link, NavLink } from "react-router-dom"
import { useMemo, useState } from "react"

import { useAuth } from "@/auth/auth-context"
import { Logo } from "@/components/brand/logo"
import { ScrollToTop } from "@/components/scroll-to-top"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useTheme } from "@/theme/theme-context"

type NavItem = {
    to: string
    label: string
    icon: React.ComponentType<{ className?: string }>
}

const publicNav: NavItem[] = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/catalog", label: "Catalog", icon: LayoutGrid }
]

const buyerNav: NavItem[] = [
    { to: "/billing", label: "Billing", icon: CreditCard },
    { to: "/keys", label: "API Keys", icon: Key },
    { to: "/usage", label: "Usage", icon: BarChart3 }
]

const sellerNav: NavItem[] = [
    { to: "/seller/studio", label: "Seller Studio", icon: BriefcaseBusiness }
]

type AppShellProps = {
    children: React.ReactNode
}

const getRoleLabel = (role: string | null) => {
    if (role === "BUYER") {
        return "Buyer"
    }
    if (role === "SELLER") {
        return "Seller"
    }
    if (role === "ADMIN") {
        return "Admin"
    }
    return null
}

export const AppShell = ({ children }: AppShellProps) => {
    const { accessToken, email, role, logout } = useAuth()
    const { theme, setTheme } = useTheme()
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

    const accountLabel = email || "Account"
    const accountRole = getRoleLabel(role)

    const protectedNav = useMemo(() => {
        if (!accessToken || !role) {
            return [] as NavItem[]
        }

        if (role === "SELLER") {
            return sellerNav
        }

        if (role === "BUYER") {
            return buyerNav
        }

        return [...sellerNav, ...buyerNav]
    }, [accessToken, role])

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-72">
                                <SheetHeader className="text-left">
                                    <SheetTitle>
                                        <Logo size="sm" />
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="mt-8 flex flex-col gap-2">
                                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Navigation
                                    </p>
                                    {publicNav.map((item) => (
                                        <MobileNavLink
                                            key={item.to}
                                            to={item.to}
                                            label={item.label}
                                            icon={item.icon}
                                            onNavigate={() => setIsMobileNavOpen(false)}
                                        />
                                    ))}
                                    {accessToken ? (
                                        <>
                                            <Separator className="my-4" />
                                            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Account
                                            </p>
                                            {protectedNav.map((item) => (
                                                <MobileNavLink
                                                    key={item.to}
                                                    to={item.to}
                                                    label={item.label}
                                                    icon={item.icon}
                                                    onNavigate={() => setIsMobileNavOpen(false)}
                                                />
                                            ))}
                                        </>
                                    ) : null}
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Link to="/" className="transition-transform hover:scale-105">
                            <Logo size="md" />
                        </Link>
                    </div>

                    {/* Desktop Navigation in Header */}
                    <nav className="hidden items-center gap-1 md:flex">
                        {publicNav.map((item) => (
                            <HeaderNavLink key={item.to} to={item.to} label={item.label} />
                        ))}
                        {accessToken && protectedNav.map((item) => (
                            <HeaderNavLink key={item.to} to={item.to} label={item.label} />
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Toggle theme">
                                    {theme === "dark" ? (
                                        <Moon className="h-4 w-4" />
                                    ) : theme === "light" ? (
                                        <Sun className="h-4 w-4" />
                                    ) : (
                                        <Laptop className="h-4 w-4" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                    className={cn("gap-2", theme === "system" && "bg-accent")}
                                    onClick={() => setTheme("system")}
                                >
                                    <Laptop className="h-4 w-4" />
                                    System
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className={cn("gap-2", theme === "light" && "bg-accent")}
                                    onClick={() => setTheme("light")}
                                >
                                    <Sun className="h-4 w-4" />
                                    Light
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className={cn("gap-2", theme === "dark" && "bg-accent")}
                                    onClick={() => setTheme("dark")}
                                >
                                    <Moon className="h-4 w-4" />
                                    Dark
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Account Menu */}
                        {accessToken ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary/10">
                                        <User className="h-4 w-4 text-primary" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{accountLabel}</p>
                                            {accountRole ? (
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {accountRole}
                                                </p>
                                            ) : null}
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/debug/connection" className="gap-2">
                                            Debug connection
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button asChild variant="ghost" size="sm">
                                    <Link to="/login">Sign in</Link>
                                </Button>
                                <Button asChild size="sm" className="bg-primary text-primary-foreground shadow-glow hover:shadow-glow-lg">
                                    <Link to="/register">Get Started</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <div className="animate-fade-in">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t bg-muted/30">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
                    <Logo size="sm" />
                    <p className="text-sm text-muted-foreground">
                        (c) {new Date().getFullYear()} HivePoint. API Platform.
                    </p>
                </div>
            </footer>

            {/* Scroll to Top Button */}
            <ScrollToTop />
        </div>
    )
}

type HeaderNavLinkProps = {
    to: string
    label: string
}

const HeaderNavLink = ({ to, label }: HeaderNavLinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "relative px-3 py-2 text-sm font-medium transition-colors",
                    "hover:text-primary",
                    isActive 
                        ? "text-primary after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-primary" 
                        : "text-muted-foreground"
                )
            }
        >
            {label}
        </NavLink>
    )
}

type MobileNavLinkProps = {
    to: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    onNavigate?: () => void
}

const MobileNavLink = ({ to, label, icon: Icon, onNavigate }: MobileNavLinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
            }
            onClick={onNavigate}
        >
            <Icon className="h-5 w-5" />
            {label}
        </NavLink>
    )
}
