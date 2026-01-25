import { AppLayout } from "@/components/Navigation";
import { HealthCard } from "@/components/HealthCard";
import { AIChat } from "@/components/AIChat";
import { useAuth } from "@/hooks/use-auth";
import {
  useTasks,
  useGenerateTasks,
  useUpdateTask,
} from "@/hooks/use-health-data";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  Activity,
  Droplets,
  Moon,
  Footprints,
  RefreshCw,
  CheckCircle2,
  Circle,
  User,
  Ruler,
  Weight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartAvatar } from "@/components/SmartAvatar";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function ScoreRing({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-24 h-24">
        <CircularProgressbar
          value={value}
          text={`${value}`}
          styles={buildStyles({
            pathColor: color,
            textColor: "var(--foreground)",
            trailColor: "var(--muted)",
            textSize: "24px",
            pathTransitionDuration: 1.5,
          })}
        />
      </div>
      <span className="font-medium text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const generateTasks = useGenerateTasks();
  const updateTask = useUpdateTask();

  useEffect(() => {
    // Generate tasks on first load if empty and not loading
    if (!tasksLoading && (!tasks || tasks.length === 0)) {
      generateTasks.mutate();
    }
  }, [tasks, tasksLoading]);

  const toggleTask = (taskId: number, currentCompleted: boolean) => {
    updateTask.mutate({
      id: taskId,
      updates: { completed: !currentCompleted },
    });
  };

  if (!user) return null;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <AppLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold">
          {getGreeting()}, {user.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-muted-foreground">
          Here's your daily health overview.
        </p>
      </header>

      <Card className="p-6 rounded-2xl mb-8 border-border/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <SmartAvatar user={user} size="lg" />
          
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <User className="w-3.5 h-3.5" />
                <span>Name</span>
              </div>
              <p className="font-semibold">{user.name || "Not set"}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>Age / Gender</span>
              </div>
              <p className="font-semibold">{user.age || "?"} yrs · {user.gender === "male" ? "M" : user.gender === "female" ? "F" : "—"}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Ruler className="w-3.5 h-3.5" />
                <span>Height / Weight</span>
              </div>
              <p className="font-semibold">{user.height || "?"} cm · {user.weight || "?"} kg</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Activity className="w-3.5 h-3.5" />
                <span>BMI</span>
              </div>
              <p className="font-semibold">
                {user.bmi || "—"}
                <span className="text-xs text-muted-foreground ml-1">
                  {user.bmi && user.bmi < 18.5 ? "(Underweight)" : 
                   user.bmi && user.bmi < 25 ? "(Normal)" :
                   user.bmi && user.bmi < 30 ? "(Overweight)" :
                   user.bmi ? "(Obese)" : ""}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <HealthCard title="Physical Score" delay={0}>
          <div className="flex justify-center py-2">
            <ScoreRing
              value={user.physicalScore || 0}
              label="Physical"
              color="hsl(176, 60%, 38%)"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Based on activity & BMI
          </p>
        </HealthCard>

        <HealthCard title="Mental Score" delay={1}>
          <div className="flex justify-center py-2">
            <ScoreRing
              value={user.mentalScore || 0}
              label="Mental"
              color="hsl(200, 80%, 60%)"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Based on sleep & stress
          </p>
        </HealthCard>

        <HealthCard
          title="Overall Wellness"
          delay={2}
          className="bg-primary text-primary-foreground border-none"
        >
          <div className="flex items-center justify-between h-full">
            <div>
              <div className="text-5xl font-display font-bold mb-2">
                {user.overallScore || 0}
              </div>
              <p className="opacity-90 font-medium">Excellent Condition</p>
              <p className="text-xs opacity-70 mt-1">
                Top 15% of users like you
              </p>
            </div>
            <Activity className="w-16 h-16 opacity-20" />
          </div>
        </HealthCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Daily Goals</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generateTasks.mutate()}
              disabled={generateTasks.isPending}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${generateTasks.isPending ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {tasksLoading
              ? Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))
              : tasks?.map((task) => (
                  <div
                    key={task.id}
                    className={`
                    flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                    ${task.completed ? "bg-primary/5 border-primary/20" : "bg-card border-border/60 hover:border-primary/30"}
                  `}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          task.type === "water"
                            ? "bg-blue-100 text-blue-600"
                            : task.type === "sleep"
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {task.type === "water" && (
                          <Droplets className="w-5 h-5" />
                        )}
                        {task.type === "sleep" && <Moon className="w-5 h-5" />}
                        {task.type === "steps" && (
                          <Footprints className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold capitalize">
                          {task.type} Goal
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Target: {task.target}{" "}
                          {task.type === "water"
                            ? "ml"
                            : task.type === "sleep"
                              ? "hrs"
                              : "steps"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        toggleTask(task.id, task.completed || false)
                      }
                      className={`transition-colors duration-200 ${task.completed ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-8 h-8" />
                      ) : (
                        <Circle className="w-8 h-8" />
                      )}
                    </button>
                  </div>
                ))}
          </div>
        </div>

        {/* Quick Actions / Recommendations */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-display">AI Insights</h2>
          <HealthCard
            title="Analysis"
            icon={<Activity className="w-5 h-5" />}
            className="h-auto"
          >
            <p className="text-muted-foreground leading-relaxed">
              Your hydration levels are slightly lower than optimal for your
              BMI. Consider increasing water intake by 500ml today. Sleep
              patterns are consistent and healthy.
            </p>
            <div className="mt-4 pt-4 border-t border-border flex gap-2">
              <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                Hydration Alert
              </span>
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                Sleep Good
              </span>
            </div>
          </HealthCard>

          {/* Placeholder for chart - requires recharts */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 h-64 flex items-center justify-center text-muted-foreground bg-grid-slate-100/[0.05]">
            <span className="text-sm">Activity Chart Visualization</span>
          </div>
        </div>
      </div>

      <AIChat />
    </AppLayout>
  );
}
