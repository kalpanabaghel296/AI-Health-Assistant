import { AppLayout } from "@/components/Navigation";
import { useAuth, useUpdateProfile } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Loader2, Gift, Copy, Check } from "lucide-react";
import { User } from "@shared/schema";
import { SmartAvatar } from "@/components/SmartAvatar";
import { usePoints, useAddReferral } from "@/hooks/use-health-data";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const { data: pointsData } = usePoints();
  const addReferral = useAddReferral();
  const { toast } = useToast();
  const [referralInput, setReferralInput] = useState("");
  const [copied, setCopied] = useState(false);
  
  const form = useForm<Partial<User>>({
    defaultValues: {
      name: user?.name || "",
      age: user?.age || 0,
      height: user?.height || 0,
      weight: user?.weight || 0,
      pastDiseases: user?.pastDiseases || "",
      allergies: user?.allergies || "",
      currentConditions: user?.currentConditions || "",
    }
  });

  useEffect(() => {
    if (user && !user.referralCode) {
      const code = `VITAL${user.id}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      updateProfile.mutate({ referralCode: code });
    }
  }, [user]);

  const onSubmit = (data: Partial<User>) => {
    let bmi = user?.bmi;
    if (data.height && data.weight) {
       const h = Number(data.height) / 100;
       bmi = Math.round(Number(data.weight) / (h * h));
    }
    updateProfile.mutate({ ...data, bmi });
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toast({ title: "Copied!", description: "Referral code copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const applyReferral = () => {
    if (referralInput.trim()) {
      addReferral.mutate(referralInput.trim());
      setReferralInput("");
    }
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="mb-8">
         <h1 className="text-3xl font-display font-bold">Your Profile</h1>
         <p className="text-muted-foreground">Manage your personal health data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Personal Information</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input {...form.register("name")} className="rounded-xl" data-testid="input-name" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" {...form.register("age", { valueAsNumber: true })} className="rounded-xl" data-testid="input-age" />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input type="number" {...form.register("height", { valueAsNumber: true })} className="rounded-xl" data-testid="input-height" />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" {...form.register("weight", { valueAsNumber: true })} className="rounded-xl" data-testid="input-weight" />
                </div>
              </div>

              <Button type="submit" className="w-full rounded-xl mt-4" disabled={updateProfile.isPending} data-testid="button-save-profile">
                {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Card>

          <Card className="p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Medical History</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Past Diseases / Conditions</Label>
                <Textarea 
                  {...form.register("pastDiseases")} 
                  placeholder="e.g., Diabetes, Hypertension, Previous surgeries..."
                  className="rounded-xl min-h-[80px]"
                  data-testid="input-past-diseases"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Known Allergies</Label>
                <Textarea 
                  {...form.register("allergies")} 
                  placeholder="e.g., Penicillin, Peanuts, Dust..."
                  className="rounded-xl min-h-[80px]"
                  data-testid="input-allergies"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Current Medical Conditions</Label>
                <Textarea 
                  {...form.register("currentConditions")} 
                  placeholder="e.g., Currently managing asthma, taking medication for..."
                  className="rounded-xl min-h-[80px]"
                  data-testid="input-current-conditions"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={updateProfile.isPending} data-testid="button-save-medical">
                {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Medical History
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 rounded-2xl text-center">
            <SmartAvatar user={user} size="xl" className="mx-auto mb-4" />
            <h3 className="font-bold text-lg">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.age} years · {user.gender}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="bg-muted p-3 rounded-xl">
                <p className="text-2xl font-bold text-primary">{user.bmi || "—"}</p>
                <p className="text-xs text-muted-foreground">BMI</p>
              </div>
              <div className="bg-muted p-3 rounded-xl">
                <p className="text-2xl font-bold text-primary">{user.overallScore || 0}</p>
                <p className="text-xs text-muted-foreground">Health Score</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Rewards</h3>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-xl mb-4">
              <p className="text-3xl font-bold text-primary">{pointsData?.points || 0}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
              {pointsData?.streak ? (
                <p className="text-xs mt-1 text-primary">{pointsData.streak} day streak</p>
              ) : null}
            </div>
            
            <div className="text-xs text-muted-foreground mb-4 space-y-1">
              <p>Daily task = 10 pts</p>
              <p>7-day streak = 50 bonus pts</p>
              <p>Referral = 100 pts each</p>
              <p className="font-medium">Redeem at 10,000 pts (₹{Math.floor((pointsData?.points || 0) / 100)})</p>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-sm font-medium mb-2">Your Referral Code</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted p-2 rounded-lg font-mono text-sm truncate">
                  {user.referralCode || "Loading..."}
                </div>
                <Button size="icon" variant="outline" onClick={copyReferralCode} data-testid="button-copy-referral">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {!user.referredBy && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Have a referral code?</p>
                <div className="flex gap-2">
                  <Input 
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    placeholder="Enter code"
                    className="rounded-lg"
                    data-testid="input-referral-code"
                  />
                  <Button 
                    onClick={applyReferral} 
                    disabled={addReferral.isPending || !referralInput.trim()}
                    data-testid="button-apply-referral"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 rounded-2xl bg-primary text-primary-foreground border-none">
            <h3 className="font-bold mb-2">Wallet Connected</h3>
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm break-all font-mono text-xs">
              {user.walletAddress}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
