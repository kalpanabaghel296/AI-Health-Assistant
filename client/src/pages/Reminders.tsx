import { useState } from "react";
import { AppLayout } from "@/components/Navigation";
import { useReminders, useAddReminder, useToggleReminder } from "@/hooks/use-health-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pill, Calendar, Clock, Check, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Reminders() {
  const { data: reminders, isLoading } = useReminders();
  const addReminder = useAddReminder();
  const toggleReminder = useToggleReminder();
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState("medicine");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [dosage, setDosage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    const datetime = new Date(`${date}T${time}`);

    await addReminder.mutateAsync({
      title,
      type,
      datetime,
      dosage: type === "medicine" ? dosage : undefined,
      userId: 0 // handled by backend
    });
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setType("medicine");
    setDate("");
    setTime("");
    setDosage("");
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Health Reminders</h1>
          <p className="text-muted-foreground">Manage medications and appointments.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>New Reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Aspirin" className="rounded-xl" required />
              </div>
              
              <div className="space-y-2">
                 <Label>Type</Label>
                 <Select value={type} onValueChange={setType}>
                   <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="medicine">Medicine</SelectItem>
                     <SelectItem value="doctor">Doctor Appointment</SelectItem>
                     <SelectItem value="test">Lab Test</SelectItem>
                   </SelectContent>
                 </Select>
              </div>

              {type === "medicine" && (
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 10mg after food" className="rounded-xl" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Date</Label>
                   <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                   <Label>Time</Label>
                   <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-xl" required />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl mt-2" disabled={addReminder.isPending}>
                Create Reminder
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {reminders?.map((reminder) => (
           <Card key={reminder.id} className="p-4 flex items-center justify-between rounded-xl hover:shadow-md transition-shadow">
             <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                 reminder.type === 'medicine' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
               }`}>
                 {reminder.type === 'medicine' ? <Pill className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
               </div>
               <div>
                 <h3 className={`font-semibold text-lg ${reminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                   {reminder.title}
                 </h3>
                 <div className="flex items-center gap-3 text-sm text-muted-foreground">
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(reminder.datetime), "MMM d, h:mm a")}</span>
                   {reminder.dosage && <span>• {reminder.dosage}</span>}
                 </div>
               </div>
             </div>

             <div className="flex items-center gap-3">
               <span className="text-sm font-medium text-muted-foreground">{reminder.completed ? "Done" : "Pending"}</span>
               <Switch 
                 checked={reminder.completed || false} 
                 onCheckedChange={() => toggleReminder.mutate(reminder.id)}
               />
             </div>
           </Card>
        ))}
      </div>
    </AppLayout>
  );
}
