import { useEffect, useRef, useState, useCallback } from "react";
import { useReminders } from "@/hooks/use-health-data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Bell, X, Pill, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AlarmData {
  id: number;
  title: string;
  dosage?: string | null;
  type: string;
}

export function ReminderAlarm() {
  const { data: reminders } = useReminders();
  const { toast } = useToast();
  const [activeAlarm, setActiveAlarm] = useState<AlarmData | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const checkedReminders = useRef<Set<number>>(new Set());
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playAlarm = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0.25, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      playTone(523, now, 0.3);
      playTone(659, now + 0.15, 0.3);
      playTone(784, now + 0.3, 0.4);
      
    } catch (e) {
      console.log("Audio playback not available");
    }
  }, []);

  const checkReminders = useCallback(() => {
    if (!reminders) return;
    
    const now = new Date();
    
    reminders.forEach((reminder) => {
      if (reminder.completed || checkedReminders.current.has(reminder.id)) return;
      
      const reminderTime = new Date(reminder.datetime);
      const timeDiff = now.getTime() - reminderTime.getTime();
      
      if (timeDiff >= 0 && timeDiff < 60000) {
        checkedReminders.current.add(reminder.id);
        
        setActiveAlarm({ 
          id: reminder.id,
          title: reminder.title, 
          dosage: reminder.dosage,
          type: reminder.type
        });
        
        playAlarm();
        
        const icon = reminder.type === 'medicine' ? 'Medicine' : 'Appointment';
        toast({
          title: `${icon} Reminder`,
          description: `${reminder.title}${reminder.dosage ? ` - ${reminder.dosage}` : ''}`,
        });
      }
    });
  }, [reminders, toast, playAlarm]);

  useEffect(() => {
    checkReminders();
    
    const interval = setInterval(checkReminders, 10000);
    
    return () => {
      clearInterval(interval);
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
    };
  }, [checkReminders]);

  const dismissAlarm = () => {
    setActiveAlarm(null);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const AlarmIcon = activeAlarm?.type === 'medicine' ? Pill : 
                    activeAlarm?.type === 'appointment' ? Calendar : Bell;

  return (
    <AnimatePresence>
      {activeAlarm && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-primary text-primary-foreground px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] max-w-[90vw]"
          data-testid="reminder-alarm-modal"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <AlarmIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider opacity-75 mb-1">
              {activeAlarm.type === 'medicine' ? 'Medicine Reminder' : 'Appointment'}
            </p>
            <p className="font-bold text-lg truncate">{activeAlarm.title}</p>
            {activeAlarm.dosage && (
              <p className="text-sm opacity-90 truncate">Dosage: {activeAlarm.dosage}</p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={dismissAlarm}
            className="text-primary-foreground hover:bg-white/20 shrink-0"
            data-testid="button-dismiss-alarm"
          >
            <X className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
