import { useEffect, useRef, useState } from "react";
import { useReminders } from "@/hooks/use-health-data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ReminderAlarm() {
  const { data: reminders } = useReminders();
  const { toast } = useToast();
  const [activeAlarm, setActiveAlarm] = useState<{ title: string; dosage?: string | null } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const checkedReminders = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!reminders) return;

    const checkReminders = () => {
      const now = new Date();
      
      reminders.forEach((reminder) => {
        if (reminder.completed || checkedReminders.current.has(reminder.id)) return;
        
        const reminderTime = new Date(reminder.datetime);
        const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
        
        if (timeDiff < 60000) {
          checkedReminders.current.add(reminder.id);
          setActiveAlarm({ title: reminder.title, dosage: reminder.dosage });
          playAlarm();
          
          toast({
            title: `Reminder: ${reminder.title}`,
            description: reminder.dosage ? `Dosage: ${reminder.dosage}` : undefined,
          });
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [reminders, toast]);

  const playAlarm = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.src = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + 
          "JvT19" + "A".repeat(1000);
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 1000;
        oscillator2.type = "sine";
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 1);
      }, 300);
    } catch (e) {
      console.log("Audio playback not available");
    }
  };

  const dismissAlarm = () => {
    setActiveAlarm(null);
  };

  return (
    <AnimatePresence>
      {activeAlarm && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-primary text-primary-foreground px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">{activeAlarm.title}</p>
            {activeAlarm.dosage && (
              <p className="text-sm opacity-90">Dosage: {activeAlarm.dosage}</p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={dismissAlarm}
            className="text-primary-foreground hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
