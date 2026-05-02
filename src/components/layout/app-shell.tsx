import {
    BarChart3,
    BriefcaseBusiness,
    CreditCard,
    Home,
    Key,
    Laptop,
    LayoutGrid,
    Menu,
    Moon,
    ShieldCheck,
    Sun,
    User
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link, NavLink } from "react-router-dom"

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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet"
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

const adminNav: NavItem[] = [
    { to: "/admin/ops", label: "Admin Ops", icon: ShieldCheck }
]

const accountNav: NavItem[] = [{ to: "/profile", label: "Profile", icon: User }]

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
    const workspaceLabel = accountRole ? `${accountRole} workspace` : "Public workspace"

    const protectedNav = useMemo(() => {
        if (!accessToken || !role) {
            return [] as NavItem[]
        }

        if (role === "SELLER") {
            return [...buyerNav, ...sellerNav, ...accountNav]
        }

        if (role === "BUYER") {
            return [...buyerNav, ...accountNav]
        }

        return [...adminNav, ...sellerNav, ...buyerNav, ...accountNav]
    }, [accessToken, role])
    const shellNav = accessToken ? [...publicNav, ...protectedNav] : publicNav

    return (
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.12),_transparent_60%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92">
                <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                    aria-label="Open menu"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-80">
                                <SheetHeader className="text-left">
                                    <SheetTitle>
                                        <Logo size="sm" />
                                    </SheetTitle>
                                </SheetHeader>

                                <div className="mt-8 flex flex-col gap-4">
                                    <div className="surface-panel bg-muted/40 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                            {workspaceLabel}
                                        </p>
                                        <p className="mt-2 text-sm text-foreground">
                                            {accessToken
                                                ? "Role-aware tools are unlocked for this session."
                                                : "Browse the catalog and sign in when you are ready to operate."}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                            Navigation
                                        </p>
                                        {shellNav.map((item) => (
                                            <MobileNavLink
                                                key={item.to}
                                                to={item.to}
                                                label={item.label}
                                                icon={item.icon}
                                                onNavigate={() => setIsMobileNavOpen(false)}
                                            />
                                        ))}
                                    </div>

                                    {accessToken ? (
                                        <>
                                            <Separator className="my-2" />
                                            <div className="grid gap-2">
                                                <Button asChild variant="outline" className="justify-start">
                                                    <Link
                                                        to="/debug/connection"
                                                        onClick={() => setIsMobileNavOpen(false)}
                                                    >
                                                        Debug connection
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="justify-start text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setIsMobileNavOpen(false)
                                                        logout()
                                                    }}
                                                >
                                                    Logout
                                                </Button>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Link
                            to="/"
                            className="group flex items-center gap-3"
                        >
                            <Logo size="md" />
                            <div className="hidden flex-col sm:flex">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                                    Marketplace control
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Discovery, billing, gateway.
                                </span>
                            </div>
                        </Link>
                    </div>

                    <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-background/88 p-1 md:flex">
                        {shellNav.map((item) => (
                            <HeaderNavLink
                                key={item.to}
                                to={item.to}
                                label={item.label}
                                icon={item.icon}
                            />
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-full"
                                    aria-label="Toggle theme"
                                >
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

                        {accessToken ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-10 rounded-full px-2 sm:px-3"
                                    >
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                                            <User className="h-4 w-4" />
                                        </span>
                                        <span className="hidden flex-col items-start text-left sm:flex">
                                            <span className="max-w-40 truncate text-sm text-foreground">
                                                {accountLabel}
                                            </span>
                                            {accountRole ? (
                                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                                    {accountRole}
                                                </span>
                                            ) : null}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {accountLabel}
                                            </p>
                                            {accountRole ? (
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {accountRole}
                                                </p>
                                            ) : null}
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile" className="gap-2">
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/debug/connection" className="gap-2">
                                            Debug connection
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={logout}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button asChild variant="ghost" size="sm">
                                    <Link to="/login">Sign in</Link>
                                </Button>
                                <Button asChild size="sm" className="shadow-glow hover:shadow-glow-lg">
                                    <Link to="/register">Get Started</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
                <div className="animate-fade-in">{children}</div>
            </main>

            <footer className="mt-auto border-t border-border/70 bg-background/55">
                <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end lg:px-8">
                    <div className="max-w-xl">
                        <Logo size="sm" />
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            One control plane for API discovery, subscription operations, gateway
                            access, and seller publishing.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        {publicNav.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className="transition-colors hover:text-foreground"
                            >
                                {item.label}
                            </Link>
                        ))}
                        {accessToken ? (
                            <Link
                                to="/profile"
                                className="transition-colors hover:text-foreground"
                            >
                                Profile
                            </Link>
                        ) : null}
                    </div>
                    <div className="rounded-[1rem] border border-border/70 bg-background/80 px-4 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                            Workspace
                        </div>
                        <div className="mt-1 text-sm font-medium text-foreground">
                            {workspaceLabel}
                        </div>
                    </div>
                </div>
            </footer>

            <ScrollToTop />
        </div>
    )
}

type HeaderNavLinkProps = {
    to: string
    label: string
    icon: React.ComponentType<{ className?: string }>
}

const HeaderNavLink = ({ to, label, icon: Icon }: HeaderNavLinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-2 rounded-full border border-transparent px-3.5 py-2 text-sm font-medium transition-[background-color,border-color,color]",
                    isActive
                        ? "border-primary/20 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )
            }
        >
            <Icon className="h-4 w-4" />
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

const MobileNavLink = ({
    to,
    label,
    icon: Icon,
    onNavigate
}: MobileNavLinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm font-medium transition-[background-color,border-color,color]",
                    isActive
                        ? "border-primary/20 bg-primary/10 text-foreground"
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
