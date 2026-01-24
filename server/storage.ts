import { db } from "./db";
import { users, tasks, symptoms, reminders, type User, type InsertUser, type Task, type Symptom, type Reminder } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User & Auth
  getUserByAddress(walletAddress: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser & { nonce: string }): Promise<User>;
  updateUserNonce(id: number, nonce: string): Promise<User>;
  updateUserProfile(id: number, profile: Partial<InsertUser>): Promise<User>;
  
  // Tasks
  getDailyTasks(userId: number, date: string): Promise<Task[]>;
  createTask(task: InsertUser & { userId: number }): Promise<Task>; // Fix type
  createTaskActual(task: any): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task>;

  // Symptoms
  createSymptom(symptom: any): Promise<Symptom>;
  getSymptoms(userId: number): Promise<Symptom[]>;

  // Reminders
  createReminder(reminder: any): Promise<Reminder>;
  getReminders(userId: number): Promise<Reminder[]>;
  toggleReminder(id: number): Promise<Reminder>;
}

export class DatabaseStorage implements IStorage {
  async getUserByAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser & { nonce: string }): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserNonce(id: number, nonce: string): Promise<User> {
    const [updated] = await db.update(users).set({ nonce }).where(eq(users.id, id)).returning();
    return updated;
  }

  async updateUserProfile(id: number, profile: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(profile).where(eq(users.id, id)).returning();
    return updated;
  }

  async getDailyTasks(userId: number, date: string): Promise<Task[]> {
    return await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.date, date)));
  }

  // Helper because types in schema are strict
  async createTaskActual(task: any): Promise<Task> {
      const [newTask] = await db.insert(tasks).values(task).returning();
      return newTask;
  }
  
  // satisfy interface
  async createTask(task: any): Promise<Task> {
      return this.createTaskActual(task);
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async createSymptom(symptom: any): Promise<Symptom> {
    const [newSymptom] = await db.insert(symptoms).values(symptom).returning();
    return newSymptom;
  }

  async getSymptoms(userId: number): Promise<Symptom[]> {
    return await db.select().from(symptoms).where(eq(symptoms.userId, userId));
  }

  async createReminder(reminder: any): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.userId, userId));
  }
  
  async toggleReminder(id: number): Promise<Reminder> {
      const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
      if (!reminder) throw new Error("Reminder not found");
      const [updated] = await db.update(reminders).set({ completed: !reminder.completed }).where(eq(reminders.id, id)).returning();
      return updated;
  }
}

export const storage = new DatabaseStorage();
