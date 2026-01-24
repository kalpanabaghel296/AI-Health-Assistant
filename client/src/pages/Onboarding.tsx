import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

// Schema for all steps combined
const onboardingSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.coerce.number().min(10).max(120),
  gender: z.string().min(1),
  height: z.coerce.number().min(50).max(300), // cm
  weight: z.coerce.number().min(20).max(300), // kg
  lifestyle: z.string().min(1),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const updateProfile = useUpdateProfile();
  
  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      age: 25,
      gender: "prefer-not-to-say",
      height: 170,
      weight: 70,
      lifestyle: "corporate",
    }
  });

  const onSubmit = async (data: OnboardingForm) => {
    // Calculate BMI
    const heightM = data.height / 100;
    const bmi = Math.round(data.weight / (heightM * heightM));

    try {
      await updateProfile.mutateAsync({
        ...data,
        bmi,
        // Default questionnaires can be expanded in v2
        questionnaire: {
          sleepDuration: 7,
          activityFreq: "moderate",
          diet: "balanced",
          stressLevel: 5
        }
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  const nextStep = async () => {
    const fields = step === 1 
      ? ["name", "age", "gender"] 
      : ["height", "weight", "lifestyle"];
      
    const valid = await form.trigger(fields as any);
    if (valid) setStep(s => s + 1);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-display font-bold mb-2">Setup Your Profile</h1>
          <div className="flex justify-center gap-2">
            <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
        </div>

        <Card className="p-6 md:p-8 rounded-3xl shadow-xl border-border/60">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input {...form.register("name")} className="rounded-xl h-12" placeholder="Jane Doe" />
                    {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input type="number" {...form.register("age")} className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select 
                        onValueChange={(val) => form.setValue("gender", val)} 
                        defaultValue={form.getValues("gender")}
                      >
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="button" onClick={nextStep} className="w-full h-12 rounded-xl text-lg mt-4">
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      <Input type="number" {...form.register("height")} className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      <Input type="number" {...form.register("weight")} className="rounded-xl h-12" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Lifestyle</Label>
                    <Select 
                      onValueChange={(val) => form.setValue("lifestyle", val)} 
                      defaultValue={form.getValues("lifestyle")}
                    >
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue placeholder="Select Lifestyle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="corporate">Corporate / Desk Job</SelectItem>
                        <SelectItem value="active">Active / Field Work</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">
                      Back
                    </Button>
                    <Button type="submit" disabled={updateProfile.isPending} className="flex-1 h-12 rounded-xl bg-primary">
                      {updateProfile.isPending ? "Saving..." : "Complete Setup"}
                      {!updateProfile.isPending && <Check className="ml-2 w-4 h-4" />}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Card>
      </div>
    </div>
  );
}
