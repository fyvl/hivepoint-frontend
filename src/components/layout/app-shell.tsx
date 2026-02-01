import { Laptop, Moon, Sun } from "lucide-react"
import { Link, NavLink } from "react-router-dom"

import { useAuth } from "@/auth/auth-context"
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
    const { accessToken, logout } = useAuth()
    const { theme, setTheme } = useTheme()

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="border-b bg-background">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Link className="text-lg font-semibold" to="/">
                            HivePoint
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Toggle theme">
                                    {theme === "dark" ? (
                                        <Moon className="h-4 w-4" />
                                    ) : theme === "light" ? (
                                        <Sun className="h-4 w-4" />
                                    ) : (
                                        <Laptop className="h-4 w-4" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setTheme("system")}>
                                    <Laptop className="mr-2 h-4 w-4" />
                                    System
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("light")}>
                                    <Sun className="mr-2 h-4 w-4" />
                                    Light
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")}>
                                    <Moon className="mr-2 h-4 w-4" />
                                    Dark
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {accessToken ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        Account
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Account</DropdownMenuLabel>
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
