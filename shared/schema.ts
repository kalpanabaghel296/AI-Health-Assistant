import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  nonce: text("nonce").notNull(), // Random string for signature verification
  
  // Profile Data
  name: text("name"),
  age: integer("age"),
  gender: text("gender"),
  height: integer("height"), // in cm
  weight: integer("weight"), // in kg
  bmi: integer("bmi"), // Calculated
  lifestyle: text("lifestyle"), // student, corporate, other
  
  // Scores (0-100)
  physicalScore: integer("physical_score").default(0),
  mentalScore: integer("mental_score").default(0),
  overallScore: integer("overall_score").default(0),
  
  // Questionnaire Responses (stored as JSON)
  questionnaire: jsonb("questionnaire").$type<{
    sleepDuration?: number;
    sleepQuality?: string;
    activityFreq?: string;
    exerciseType?: string;
    diet?: string;
    waterIntake?: number;
    screenTime?: number;
    stressLevel?: number;
    mood?: string;
  }>(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  type: text("type").notNull(), // steps, water, sleep, exercise
  target: integer("target").notNull(),
  current: integer("current").default(0),
  completed: boolean("completed").default(false),
});

export const symptoms = pgTable("symptoms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  description: text("description").notNull(),
  severity: integer("severity").notNull(), // 1-10
  duration: integer("duration").notNull(), // days
  date: timestamp("date").defaultNow(),
  aiAnalysis: text("ai_analysis"),
  riskLevel: text("risk_level"), // low, medium, high
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // medicine, doctor
  title: text("title").notNull(),
  datetime: timestamp("datetime").notNull(),
  dosage: text("dosage"), // for medicine
  completed: boolean("completed").default(false),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, nonce: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertSymptomSchema = createInsertSchema(symptoms).omit({ id: true, date: true, aiAnalysis: true, riskLevel: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type Symptom = typeof symptoms.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
