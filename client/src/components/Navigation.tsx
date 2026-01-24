import { Link, useLocation } from "wouter";
import { LayoutDashboard, Stethoscope, Bell, User as UserIcon, LogOut, Activity, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const links = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/symptoms", icon: Stethoscope, label: "Symptoms" },
    { href: "/reminders", icon: Bell, label: "Reminders" },
    { href: "/profile", icon: UserIcon, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="hidden lg:flex flex-col w-64 h-screen bg-background border-r border-border fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl leading-none">Vital.AI</h1>
          <span className="text-xs text-muted-foreground font-medium">Web3 Health</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm",
              location === link.href
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const links = [
    { href: "/dashboard", icon: LayoutDashboard },
    { href: "/symptoms", icon: Stethoscope },
    { href: "/reminders", icon: Bell },
    { href: "/settings", icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 safe-area-bottom">
      <div className="flex justify-around items-center">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "p-3 rounded-full transition-all duration-200",
              location === link.href
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground"
            )}
          >
            <link.icon className="w-6 h-6" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
