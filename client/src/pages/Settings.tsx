import { AppLayout } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { User, FileQuestion, Moon, Sun, LogOut, ChevronRight, Shield } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  return (
    <AppLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </header>

      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.name || "Not set"}</p>
                <p className="text-sm text-muted-foreground">
                  {user.age ? `${user.age} years old` : "Age not set"} · {user.gender || "Gender not set"}
                </p>
              </div>
              <Link href="/profile">
                <Button variant="outline" className="rounded-xl">
                  Edit Profile
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5" />
              Health Questionnaire
            </CardTitle>
            <CardDescription>
              Update your lifestyle and health information to recalculate your scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Physical Score: <span className="font-semibold text-foreground">{user.physicalScore || 0}</span> · 
                  Mental Score: <span className="font-semibold text-foreground">{user.mentalScore || 0}</span>
                </p>
              </div>
              <Link href="/questionnaire">
                <Button variant="outline" className="rounded-xl">
                  Retake Assessment
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="cursor-pointer">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Your wallet and session information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Connected Wallet</p>
              <p className="font-mono text-sm">
                {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => logout()}
              className="w-full rounded-xl"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect Wallet & Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
