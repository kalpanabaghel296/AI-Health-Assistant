import { useState } from "react";
import { AppLayout } from "@/components/Navigation";
import { useSymptoms, useAddSymptom } from "@/hooks/use-health-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Symptoms() {
  const { data: symptoms, isLoading } = useSymptoms();
  const addSymptom = useAddSymptom();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState([5]);
  const [duration, setDuration] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSymptom.mutateAsync({
        description,
        severity: severity[0],
        duration,
        userId: 0 // handled by backend
      });
      setIsOpen(false);
      setDescription("");
      setSeverity([5]);
      setDuration(1);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Symptom Tracker</h1>
          <p className="text-muted-foreground">Log symptoms for AI analysis.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20">
              Log New Symptom
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Log Symptom</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="e.g. Headache on left side..." 
                  className="resize-none h-32 rounded-xl"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Severity (1-10)</Label>
                  <span className="text-primary font-bold text-lg">{severity[0]}</span>
                </div>
                <Slider 
                  value={severity} 
                  onValueChange={setSeverity} 
                  max={10} 
                  step={1} 
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Input 
                  type="number" 
                  min={1} 
                  value={duration} 
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl" disabled={addSymptom.isPending}>
                {addSymptom.isPending ? <Loader2 className="animate-spin" /> : "Analyze & Save"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {isLoading && <p>Loading symptoms...</p>}
        {symptoms?.map((symptom) => (
          <Card key={symptom.id} className="p-6 rounded-2xl border-border/60 hover:border-primary/30 transition-colors">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    symptom.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                    symptom.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {symptom.riskLevel || "Processing"} Risk
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(symptom.date!), "MMM d, yyyy")}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1">{symptom.description}</h3>
                <p className="text-muted-foreground text-sm">
                  Severity: {symptom.severity}/10 • Duration: {symptom.duration} days
                </p>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-xl md:max-w-sm border border-border/50">
                <div className="flex items-start gap-2">
                   <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                   <div className="text-sm">
                     <span className="font-semibold text-foreground block mb-1">AI Analysis</span>
                     <p className="text-muted-foreground leading-relaxed">
                       {symptom.aiAnalysis || "Analysis pending..."}
                     </p>
                   </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {symptoms?.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
            <h3 className="text-lg font-medium text-muted-foreground">No symptoms logged yet</h3>
            <p className="text-sm text-muted-foreground/60">Stay healthy! Log a symptom if you feel unwell.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
