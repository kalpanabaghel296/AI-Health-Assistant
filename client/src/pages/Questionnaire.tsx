import { useState } from "react";
import { useUpdateProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Heart, Brain, Moon, Dumbbell, Apple, Droplets, Monitor, Smile } from "lucide-react";

const questions = [
  {
    id: "sleepDuration",
    icon: Moon,
    question: "How many hours do you typically sleep per night?",
    type: "slider",
    min: 3,
    max: 12,
    step: 0.5,
    unit: "hours",
    category: "physical",
  },
  {
    id: "sleepQuality",
    icon: Moon,
    question: "How would you rate your sleep quality?",
    type: "radio",
    options: [
      { value: "poor", label: "Poor - I wake up tired" },
      { value: "fair", label: "Fair - Sometimes restless" },
      { value: "good", label: "Good - Usually rested" },
      { value: "excellent", label: "Excellent - Always refreshed" },
    ],
    category: "physical",
  },
  {
    id: "activityFreq",
    icon: Dumbbell,
    question: "How often do you exercise per week?",
    type: "radio",
    options: [
      { value: "none", label: "Rarely or never" },
      { value: "light", label: "1-2 times per week" },
      { value: "moderate", label: "3-4 times per week" },
      { value: "active", label: "5+ times per week" },
    ],
    category: "physical",
  },
  {
    id: "exerciseType",
    icon: Dumbbell,
    question: "What type of exercise do you prefer?",
    type: "radio",
    options: [
      { value: "cardio", label: "Cardio (running, cycling)" },
      { value: "strength", label: "Strength training" },
      { value: "yoga", label: "Yoga / Stretching" },
      { value: "mixed", label: "Mixed / Varied" },
      { value: "none", label: "I don't exercise regularly" },
    ],
    category: "physical",
  },
  {
    id: "stepsDaily",
    icon: Dumbbell,
    question: "How many steps do you typically walk daily?",
    type: "slider",
    min: 1000,
    max: 20000,
    step: 1000,
    unit: "steps",
    category: "physical",
  },
  {
    id: "diet",
    icon: Apple,
    question: "How would you describe your eating habits?",
    type: "radio",
    options: [
      { value: "poor", label: "Mostly fast food / processed" },
      { value: "fair", label: "Mixed, some healthy options" },
      { value: "balanced", label: "Balanced diet, home-cooked" },
      { value: "excellent", label: "Very healthy, plant-focused" },
    ],
    category: "physical",
  },
  {
    id: "waterIntake",
    icon: Droplets,
    question: "How many glasses of water do you drink daily?",
    type: "slider",
    min: 1,
    max: 15,
    step: 1,
    unit: "glasses",
    category: "physical",
  },
  {
    id: "screenTime",
    icon: Monitor,
    question: "How many hours of screen time per day (excluding work)?",
    type: "slider",
    min: 0,
    max: 12,
    step: 0.5,
    unit: "hours",
    category: "mental",
  },
  {
    id: "stressLevel",
    icon: Brain,
    question: "How would you rate your current stress level?",
    type: "slider",
    min: 1,
    max: 10,
    step: 1,
    unit: "/10",
    category: "mental",
  },
  {
    id: "mood",
    icon: Smile,
    question: "How would you describe your general mood lately?",
    type: "radio",
    options: [
      { value: "low", label: "Often low or anxious" },
      { value: "variable", label: "Up and down" },
      { value: "stable", label: "Generally stable" },
      { value: "positive", label: "Mostly positive and calm" },
    ],
    category: "mental",
  },
];

export default function Questionnaire() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    sleepDuration: 7,
    sleepQuality: "good",
    activityFreq: "moderate",
    exerciseType: "mixed",
    stepsDaily: 5000,
    diet: "balanced",
    waterIntake: 8,
    screenTime: 4,
    stressLevel: 5,
    mood: "stable",
  });
  const [, setLocation] = useLocation();
  const updateProfile = useUpdateProfile();

  const question = questions[currentQ];
  const Icon = question.icon;
  const progress = ((currentQ + 1) / questions.length) * 100;

  const handleAnswer = (value: any) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const next = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
    }
  };

  const prev = () => {
    if (currentQ > 0) {
      setCurrentQ((c) => c - 1);
    }
  };

  const calculateScores = () => {
    let physicalScore = 50;
    let mentalScore = 50;

    // Physical scoring
    const sleep = answers.sleepDuration;
    if (sleep >= 7 && sleep <= 9) physicalScore += 10;
    else if (sleep >= 6) physicalScore += 5;

    if (answers.sleepQuality === "excellent") physicalScore += 10;
    else if (answers.sleepQuality === "good") physicalScore += 7;
    else if (answers.sleepQuality === "fair") physicalScore += 3;

    if (answers.activityFreq === "active") physicalScore += 15;
    else if (answers.activityFreq === "moderate") physicalScore += 10;
    else if (answers.activityFreq === "light") physicalScore += 5;

    if (answers.diet === "excellent") physicalScore += 10;
    else if (answers.diet === "balanced") physicalScore += 7;
    else if (answers.diet === "fair") physicalScore += 3;

    const water = answers.waterIntake;
    if (water >= 8) physicalScore += 5;
    else if (water >= 5) physicalScore += 2;

    // Mental scoring
    const stress = answers.stressLevel;
    mentalScore += (10 - stress) * 3;

    if (answers.mood === "positive") mentalScore += 15;
    else if (answers.mood === "stable") mentalScore += 10;
    else if (answers.mood === "variable") mentalScore += 5;

    const screen = answers.screenTime;
    if (screen <= 2) mentalScore += 10;
    else if (screen <= 4) mentalScore += 5;
    else if (screen > 6) mentalScore -= 5;

    return {
      physicalScore: Math.min(100, Math.max(0, physicalScore)),
      mentalScore: Math.min(100, Math.max(0, mentalScore)),
    };
  };

  const handleSubmit = async () => {
    const scores = calculateScores();
    const overallScore = Math.round((scores.physicalScore + scores.mentalScore) / 2);

    try {
      await updateProfile.mutateAsync({
        questionnaire: answers,
        physicalScore: scores.physicalScore,
        mentalScore: scores.mentalScore,
        overallScore,
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Heart className="w-6 h-6" />
            <span className="font-display font-semibold">Health Assessment</span>
          </div>
          <h1 className="text-2xl font-display font-bold mb-4">
            Let's understand your lifestyle
          </h1>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Question {currentQ + 1} of {questions.length}
          </p>
        </div>

        <Card className="p-6 md:p-8 rounded-3xl shadow-xl border-border/60">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${question.category === "physical" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {question.category === "physical" ? "Physical Health" : "Mental Wellness"}
                </span>
              </div>

              <h2 className="text-xl font-semibold">{question.question}</h2>

              {question.type === "slider" && (
                <div className="space-y-6 py-4">
                  <div className="text-center">
                    <span className="text-4xl font-display font-bold text-primary">
                      {answers[question.id]}
                    </span>
                    <span className="text-muted-foreground ml-1">{question.unit}</span>
                  </div>
                  <Slider
                    value={[answers[question.id]]}
                    onValueChange={([v]) => handleAnswer(v)}
                    min={question.min}
                    max={question.max}
                    step={question.step}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{question.min} {question.unit}</span>
                    <span>{question.max} {question.unit}</span>
                  </div>
                </div>
              )}

              {question.type === "radio" && (
                <RadioGroup
                  value={answers[question.id]}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {question.options?.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={option.value}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        answers[question.id] === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <span>{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prev}
              disabled={currentQ === 0}
              className="flex-1 h-12 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentQ < questions.length - 1 ? (
              <Button
                type="button"
                onClick={next}
                className="flex-1 h-12 rounded-xl"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={updateProfile.isPending}
                className="flex-1 h-12 rounded-xl bg-primary"
              >
                {updateProfile.isPending ? "Saving..." : "Complete Assessment"}
                {!updateProfile.isPending && <Check className="ml-2 w-4 h-4" />}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
