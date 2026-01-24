import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type Task, type Symptom, type Reminder } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { z } from "zod";

// --- TASKS ---
export function useTasks(date: Date = new Date()) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: [api.tasks.list.path, dateStr],
    queryFn: async () => {
      // ?date=YYYY-MM-DD
      const url = `${api.tasks.list.path}?date=${dateStr}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
  });
}

export function useGenerateTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.tasks.generate.path, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate tasks");
      return api.tasks.generate.responses[200].parse(await res.json());
    },
    onSuccess: (_, __, context) => {
      // Invalidate current day's tasks
      const dateStr = format(new Date(), "yyyy-MM-dd");
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, dateStr] });
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<Task> }) => {
      const url = buildUrl(api.tasks.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: (updatedTask) => {
      const dateStr = updatedTask.date;
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, dateStr] });
    }
  });
}

// --- SYMPTOMS ---
export function useSymptoms() {
  return useQuery({
    queryKey: [api.symptoms.list.path],
    queryFn: async () => {
      const res = await fetch(api.symptoms.list.path);
      if (!res.ok) throw new Error("Failed to fetch symptoms");
      return api.symptoms.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddSymptom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.symptoms.create.input>) => {
      const res = await fetch(api.symptoms.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log symptom");
      return api.symptoms.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.symptoms.list.path] });
      toast({ title: "Symptom logged", description: "AI is analyzing your input..." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save symptom.", variant: "destructive" });
    }
  });
}

// --- REMINDERS ---
export function useReminders() {
  return useQuery({
    queryKey: [api.reminders.list.path],
    queryFn: async () => {
      const res = await fetch(api.reminders.list.path);
      if (!res.ok) throw new Error("Failed to fetch reminders");
      return api.reminders.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.reminders.create.input>) => {
      // Ensure datetime is properly stringified if it's a Date object handled by zod coercion
      const res = await fetch(api.reminders.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create reminder");
      return api.reminders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path] });
      toast({ title: "Reminder set", description: "We'll notify you on time." });
    }
  });
}

export function useToggleReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.reminders.toggle.path, { id });
      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to toggle reminder");
      return api.reminders.toggle.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path] });
    }
  });
}

// --- CHAT ---
export function useChat() {
  return useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(api.chat.send.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.chat.send.responses[200].parse(await res.json());
    }
  });
}
