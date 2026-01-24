import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { randomBytes } from "crypto";
// import { verifyMessage } from "ethers"; // We'll install ethers
import { insertUserSchema, insertSymptomSchema, insertReminderSchema } from "@shared/schema";

// Temporary mock for ethers verifyMessage until installed or use a lightweight verify function
// Actually, we should use a library. 'ethers' is heavy, 'viem' is lighter, but ethers is standard.
// For now, I'll assume we can use a basic verification or I'll add ethers to package.json later.
// Let's implement a simple verify wrapper.
import { verifyMessage } from "ethers";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Middleware to simulate session (using wallet address stored in session)
  // Note: Standard express-session is setup in index.ts usually.
  
  // Auth Routes
  app.post(api.auth.getNonce.path, async (req, res) => {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ message: "Address required" });

    let user = await storage.getUserByAddress(walletAddress);
    const nonce = randomBytes(16).toString("hex");

    if (!user) {
      user = await storage.createUser({ 
          walletAddress, 
          nonce,
          // Defaults
          physicalScore: 50,
          mentalScore: 50,
          overallScore: 50
      });
    } else {
      user = await storage.updateUserNonce(user.id, nonce);
    }

    res.json({ nonce });
  });

  app.post(api.auth.verify.path, async (req, res) => {
    const { walletAddress, signature } = req.body;
    const user = await storage.getUserByAddress(walletAddress);
    
    if (!user) return res.status(401).json({ message: "User not found" });

    try {
      const recoveredAddress = verifyMessage(user.nonce, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ message: "Invalid signature" });
      }
      
      // Update nonce to prevent replay
      const newNonce = randomBytes(16).toString("hex");
      await storage.updateUserNonce(user.id, newNonce);

      // Set session
      (req.session as any).userId = user.id;
      
      res.json({ token: "session_cookie_used", user });
    } catch (e) {
      console.error("Verification failed:", e);
      res.status(401).json({ message: "Verification failed" });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json(null);
    const user = await storage.getUser(userId);
    res.json(user || null);
  });
  
  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out" });
    });
  });

  // Protected Routes Middleware
  const requireAuth = (req: any, res: any, next: any) => {
      if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
      next();
  };

  // Profile
  app.patch(api.users.updateProfile.path, requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const updates = req.body;
    
    // Calculate simple scores based on inputs (Mock logic)
    // In real app, complex logic goes here
    if (updates.questionnaire) {
        updates.physicalScore = Math.floor(Math.random() * 30) + 70; // 70-100
        updates.mentalScore = Math.floor(Math.random() * 30) + 70;
        updates.overallScore = Math.floor((updates.physicalScore + updates.mentalScore) / 2);
    }

    const user = await storage.updateUserProfile(userId, updates);
    res.json(user);
  });

  // Tasks
  app.get(api.tasks.list.path, requireAuth, async (req, res) => {
      const userId = (req.session as any).userId;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const tasks = await storage.getDailyTasks(userId, date);
      res.json(tasks);
  });

  app.post(api.tasks.generate.path, requireAuth, async (req, res) => {
      const userId = (req.session as any).userId;
      const date = new Date().toISOString().split('T')[0];
      
      // Check if exist
      let tasks = await storage.getDailyTasks(userId, date);
      if (tasks.length === 0) {
          // Create defaults
          await storage.createTaskActual({ userId, date, type: 'steps', target: 10000, current: 0 });
          await storage.createTaskActual({ userId, date, type: 'water', target: 2500, current: 0 }); // ml
          await storage.createTaskActual({ userId, date, type: 'sleep', target: 8, current: 0 }); // hours
          await storage.createTaskActual({ userId, date, type: 'exercise', target: 30, current: 0 }); // mins
          tasks = await storage.getDailyTasks(userId, date);
      }
      res.json(tasks);
  });

  app.patch(api.tasks.update.path, requireAuth, async (req, res) => {
      const updated = await storage.updateTask(parseInt(req.params.id), req.body);
      res.json(updated);
  });

  // Symptoms
  app.post(api.symptoms.create.path, requireAuth, async (req, res) => {
      const userId = (req.session as any).userId;
      const data = { ...req.body, userId };
      
      // Mock AI Analysis
      data.aiAnalysis = `Based on your symptom of ${data.description}, it is recommended to rest and hydrate. Consult a doctor if it persists.`;
      data.riskLevel = data.severity > 7 ? 'high' : data.severity > 4 ? 'medium' : 'low';
      
      const symptom = await storage.createSymptom(data);
      res.status(201).json(symptom);
  });

  app.get(api.symptoms.list.path, requireAuth, async (req, res) => {
      const userId = (req.session as any).userId;
      const list = await storage.getSymptoms(userId);
      res.json(list);
  });

  // Reminders
  app.post(api.reminders.create.path, requireAuth, async (req, res) => {
      const userId = (req.session as any).userId;
      // Ensure datetime is Date object
      const data = { ...req.body, userId, datetime: new Date(req.body.datetime) };
      const reminder = await storage.createReminder(data);
      res.status(201).json(reminder);
  });

  app.get(api.reminders.list.path, requireAuth, async (req, res) => {
      const userId = (req.session as any).userId;
      const list = await storage.getReminders(userId);
      res.json(list);
  });
  
  app.patch(api.reminders.toggle.path, requireAuth, async (req, res) => {
      const updated = await storage.toggleReminder(parseInt(req.params.id));
      res.json(updated);
  });

  // Chatbot - using OpenAI integration
  app.post(api.chat.send.path, requireAuth, async (req, res) => {
      const { message } = req.body;
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({
              apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
              baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
          });
          
          const systemPrompt = `You are a preventive healthcare assistant. Your role is to provide helpful, accurate, and supportive health guidance.

RULES:
- Answer ONLY what is asked. Be brief, concise, and to-the-point.
- Be supportive and actionable in your responses.
- NEVER diagnose medical conditions or prescribe medications.
- For serious symptoms, always recommend consulting a healthcare professional.
- Focus on preventive care: sleep, exercise, nutrition, hydration, stress management.
- Keep responses under 3 sentences unless more detail is specifically requested.

User context:
- Age: ${user?.age || "unknown"}
- Physical Health Score: ${user?.physicalScore || 50}/100
- Mental Wellness Score: ${user?.mentalScore || 50}/100
- Lifestyle: ${user?.lifestyle || "not specified"}`;

          const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: message }
              ],
              max_completion_tokens: 300,
          });
          
          const reply = completion.choices[0]?.message?.content || "I'm here to help with your health questions. Could you please rephrase that?";
          res.json({ reply });
      } catch (error) {
          console.error("Chat error:", error);
          // Fallback response if AI fails
          res.json({ reply: "I'm your health assistant. For specific medical concerns, please consult a healthcare professional. How else can I help with general wellness tips?" });
      }
  });

  return httpServer;
}
