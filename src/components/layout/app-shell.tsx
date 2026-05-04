import {
    BarChart3,
    BriefcaseBusiness,
    CreditCard,
    Home,
    Key,
    Laptop,
    LayoutGrid,
    LogOut,
    Menu,
    Moon,
    ShieldCheck,
    Sun,
    User
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "@/auth/auth-context";
import { Logo } from "@/components/brand/logo";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/theme-context";

type NavItem = {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

const publicNav: NavItem[] = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/catalog", label: "Catalog", icon: LayoutGrid }
];

const buyerNav: NavItem[] = [
    { to: "/billing", label: "Billing", icon: CreditCard },
    { to: "/keys", label: "Keys", icon: Key },
    { to: "/usage", label: "Usage", icon: BarChart3 }
];

const sellerNav: NavItem[] = [{ to: "/seller/studio", label: "Studio", icon: BriefcaseBusiness }];

const adminNav: NavItem[] = [{ to: "/admin/ops", label: "Admin", icon: ShieldCheck }];

const accountNav: NavItem[] = [{ to: "/profile", label: "Profile", icon: User }];

type AppShellProps = {
    children: React.ReactNode;
};

const getRoleLabel = (role: string | null) => {
    if (role === "BUYER") {
        return "Buyer";
    }
    if (role === "SELLER") {
        return "Seller";
    }
    if (role === "ADMIN") {
        return "Admin";
    }
    return null;
};

export const AppShell = ({ children }: AppShellProps) => {
    const { accessToken, email, role, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const accountLabel = email || "Account";
    const accountRole = getRoleLabel(role);
    const workspaceLabel = accountRole ? `${accountRole} workspace` : "Public workspace";

    const protectedNav = useMemo(() => {
        if (!accessToken || !role) {
            return [] as NavItem[];
        }

        if (role === "SELLER") {
            return [...buyerNav, ...sellerNav, ...accountNav];
        }

        if (role === "BUYER") {
            return [...buyerNav, ...accountNav];
        }

        return [...adminNav, ...sellerNav, ...buyerNav, ...accountNav];
    }, [accessToken, role]);
    const shellNav = accessToken ? [...publicNav, ...protectedNav] : publicNav;

    return (
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
            <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 lg:hidden"
                                    aria-label="Open menu"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-80 bg-background">
                                <SheetHeader className="text-left">
                                    <SheetTitle>
                                        <Logo size="sm" />
                                    </SheetTitle>
                                </SheetHeader>

                                <div className="mt-8 flex flex-col gap-5">
                                    <div className="rounded-lg border border-border/80 bg-card/75 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                                            {workspaceLabel}
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            {accessToken
                                                ? "Session tools are available for your role."
                                                : "Explore the catalog or sign in to operate."}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <p className="px-2 text-xs font-semibold uppercase text-muted-foreground">
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
                                            <Separator />
                                            <div className="grid gap-2">
                                                <Button
                                                    variant="ghost"
                                                    className="justify-start text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setIsMobileNavOpen(false);
                                                        logout();
                                                    }}
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Logout
                                                </Button>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Link to="/" className="flex min-w-0 items-center gap-3">
                            <Logo size="md" />
                            <span className="hidden text-sm font-medium text-muted-foreground xl:inline">
                                API Marketplace
                            </span>
                        </Link>
                    </div>

                    <nav className="hidden min-w-0 items-center gap-1 rounded-lg border border-border/70 bg-card/75 p-1 shadow-sm lg:flex">
                        {shellNav.map((item) => (
                            <HeaderNavLink
                                key={item.to}
                                to={item.to}
                                label={item.label}
                                icon={item.icon}
                            />
                        ))}
                    </nav>

                    <div className="flex shrink-0 items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12"
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
                                        className="h-12 max-w-[280px] px-3.5 sm:px-4"
                                    >
                                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                                            <User className="h-4 w-4" />
                                        </span>
                                        <span className="hidden min-w-0 flex-col items-start pr-1 text-left sm:flex">
                                            <span className="max-w-40 truncate text-sm text-foreground">
                                                {accountLabel}
                                            </span>
                                            {accountRole ? (
                                                <span className="text-[11px] uppercase text-muted-foreground">
                                                    {accountRole}
                                                </span>
                                            ) : null}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="truncate text-sm font-medium leading-none">
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
                                            <User className="h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={logout}
                                        className="gap-2 text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button asChild variant="ghost" className="h-10 px-4">
                                    <Link to="/login">Sign in</Link>
                                </Button>
                                <Button asChild className="h-10 px-4">
                                    <Link to="/register">Get started</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="animate-fade-in">{children}</div>
            </main>

            <ScrollToTop />
        </div>
    );
};

type HeaderNavLinkProps = {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

const HeaderNavLink = ({ to, label, icon: Icon }: HeaderNavLinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex h-10 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-[background-color,color,box-shadow]",
                    isActive
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )
            }
        >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </NavLink>
    );
};

type MobileNavLinkProps = {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onNavigate?: () => void;
};

const MobileNavLink = ({ to, label, icon: Icon, onNavigate }: MobileNavLinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm font-medium transition-[background-color,border-color,color]",
                    isActive
                        ? "border-border bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
            }
            onClick={onNavigate}
        >
            <Icon className="h-5 w-5" />
            {label}
        </NavLink>
    );
};
