import { Laptop, Menu, Moon, Sun } from "lucide-react"
import { Link, NavLink } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"

import { useAuth } from "@/auth/auth-context"
import { getMe, type UserMeResponse } from "@/api/users"
import { Button, buttonVariants } from "@/components/ui/button"
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
}

const publicNav: NavItem[] = [
    { to: "/", label: "Dashboard" },
    { to: "/catalog", label: "Catalog" }
]

const protectedNav: NavItem[] = [
    { to: "/billing", label: "Billing" },
    { to: "/keys", label: "Keys" },
    { to: "/usage", label: "Usage" }
]

type AppShellProps = {
    children: React.ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
    const { accessToken, refresh, logout } = useAuth()
    const { theme, setTheme } = useTheme()
    const [user, setUser] = useState<UserMeResponse | null>(null)
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

    const themeLabel = theme === "system" ? "System" : theme === "light" ? "Light" : "Dark"

    useEffect(() => {
        let isActive = true

        const loadUser = async () => {
            if (!accessToken) {
                setUser(null)
                return
            }
            try {
                const data = await getMe(accessToken, refresh)
                if (isActive) {
                    setUser(data)
                }
            } catch {
                if (isActive) {
                    setUser(null)
                }
            }
        }

        loadUser()

        return () => {
            isActive = false
        }
    }, [accessToken, refresh])

    const accountLabel = useMemo(() => {
        if (!user || typeof user !== "object") {
            return "Account"
        }
        const email = (user as { email?: string }).email
        return email || "Account"
    }, [user])

    const accountRole = useMemo(() => {
        if (!user || typeof user !== "object") {
            return null
        }
        return (user as { role?: string }).role ?? null
    }, [user])

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="border-b bg-background">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Navigation</SheetTitle>
                                </SheetHeader>
                                <div className="mt-6 flex flex-col gap-2">
                                    {publicNav.map((item) => (
                                        <MobileNavLink
                                            key={item.to}
                                            to={item.to}
                                            label={item.label}
                                            onNavigate={() => setIsMobileNavOpen(false)}
                                        />
                                    ))}
                                    {accessToken ? (
                                        <>
                                            <Separator className="my-2" />
                                            {protectedNav.map((item) => (
                                                <MobileNavLink
                                                    key={item.to}
                                                    to={item.to}
                                                    label={item.label}
                                                    onNavigate={() => setIsMobileNavOpen(false)}
                                                />
                                            ))}
                                        </>
                                    ) : null}
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Link className="text-lg font-semibold" to="/">
                            HivePoint
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2" aria-label="Toggle theme">
                                    {theme === "dark" ? (
                                        <Moon className="h-4 w-4" />
                                    ) : theme === "light" ? (
                                        <Sun className="h-4 w-4" />
                                    ) : (
                                        <Laptop className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">{themeLabel}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel className="space-y-1">
                                    <div className="text-xs uppercase text-muted-foreground">Theme</div>
                                    <div className="text-sm font-medium">{themeLabel}</div>
                                    {theme === "system" ? (
                                        <div className="text-xs text-muted-foreground">
                                            Follows OS appearance
                                        </div>
                                    ) : null}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className={theme === "system" ? "font-medium" : undefined}
                                    onClick={() => setTheme("system")}
                                >
                                    <Laptop className="mr-2 h-4 w-4" />
                                    System
                                    {theme === "system" ? (
                                        <span className="ml-auto text-xs text-muted-foreground">Active</span>
                                    ) : null}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className={theme === "light" ? "font-medium" : undefined}
                                    onClick={() => setTheme("light")}
                                >
                                    <Sun className="mr-2 h-4 w-4" />
                                    Light
                                    {theme === "light" ? (
                                        <span className="ml-auto text-xs text-muted-foreground">Active</span>
                                    ) : null}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className={theme === "dark" ? "font-medium" : undefined}
                                    onClick={() => setTheme("dark")}
                                >
                                    <Moon className="mr-2 h-4 w-4" />
                                    Dark
                                    {theme === "dark" ? (
                                        <span className="ml-auto text-xs text-muted-foreground">Active</span>
                                    ) : null}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {accessToken ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        {accountLabel}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel className="space-y-1">
                                        <div className="text-sm font-medium">{accountLabel}</div>
                                        {accountRole ? (
                                            <div className="text-xs text-muted-foreground">{accountRole}</div>
                                        ) : null}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/debug/connection">Debug connection</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={logout}>
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button asChild variant="ghost" size="sm">
                                    <Link to="/login">Login</Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link to="/register">Register</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-8">
                <aside className="hidden w-56 shrink-0 flex-col gap-3 md:flex">
                    <nav className="flex flex-col gap-1">
                        {publicNav.map((item) => (
                            <NavItemLink key={item.to} to={item.to} label={item.label} />
                        ))}
                    </nav>
                    {accessToken ? (
                        <>
                            <Separator />
                            <nav className="flex flex-col gap-1">
                                {protectedNav.map((item) => (
                                    <NavItemLink key={item.to} to={item.to} label={item.label} />
                                ))}
                            </nav>
                        </>
                    ) : null}
                </aside>
                <main className="flex-1">{children}</main>
            </div>
        </div>
    )
}

type NavItemLinkProps = {
    to: string
    label: string
}

const NavItemLink = ({ to, label }: NavItemLinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-start",
                    isActive && "bg-accent text-accent-foreground"
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
    onNavigate?: () => void
}

const MobileNavLink = ({ to, label, onNavigate }: MobileNavLinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-start",
                    isActive && "bg-accent text-accent-foreground"
                )
            }
            onClick={onNavigate}
        >
            {label}
        </NavLink>
    )
}
