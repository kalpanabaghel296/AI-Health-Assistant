import { AppLayout } from "@/components/Navigation";
import { useAuth, useUpdateProfile } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { User } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  
  const form = useForm<Partial<User>>({
    defaultValues: {
      name: user?.name || "",
      age: user?.age || 0,
      height: user?.height || 0,
      weight: user?.weight || 0,
    }
  });

  const onSubmit = (data: Partial<User>) => {
    // Recalculate BMI if height/weight changed
    let bmi = user?.bmi;
    if (data.height && data.weight) {
       const h = data.height / 100;
       bmi = Math.round(data.weight / (h * h));
    }
    updateProfile.mutate({ ...data, bmi });
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="mb-8">
         <h1 className="text-3xl font-display font-bold">Your Profile</h1>
         <p className="text-muted-foreground">Manage your personal health data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Personal Information</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...form.register("name")} className="rounded-xl" />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" {...form.register("age")} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" {...form.register("height")} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" {...form.register("weight")} className="rounded-xl" />
              </div>
            </div>

            <Button type="submit" className="w-full rounded-xl mt-4" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Card>

        <Card className="p-6 rounded-2xl bg-primary text-primary-foreground border-none">
          <h2 className="text-xl font-bold mb-4">Wallet Connected</h2>
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm break-all font-mono text-sm mb-6">
            {user.walletAddress}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-xl">
               <p className="opacity-70 text-sm">BMI Score</p>
               <p className="text-3xl font-bold">{user.bmi}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
               <p className="opacity-70 text-sm">Overall Score</p>
               <p className="text-3xl font-bold">{user.overallScore}</p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
