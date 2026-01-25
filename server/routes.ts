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
      const taskId = parseInt(req.params.id);
      const userId = (req.session as any).userId;
      const updates = req.body;
      
      // Get current task state before update
      const tasks = await storage.getDailyTasks(userId, new Date().toISOString().split('T')[0]);
      const currentTask = tasks.find(t => t.id === taskId);
      
      const updated = await storage.updateTask(taskId, updates);
      
      // Award points if task was just completed (wasn't completed before, now is)
      if (updates.completed === true && currentTask && !currentTask.completed) {
          const user = await storage.getUser(userId);
          const today = new Date().toISOString().split('T')[0];
          
          // Add 10 points for task completion
          await storage.addPoints(userId, 10);
          
          // Check streak logic
          const lastTaskDate = user?.lastTaskDate;
          let newStreak = user?.currentStreak || 0;
          
          if (!lastTaskDate) {
              newStreak = 1;
          } else {
              const lastDate = new Date(lastTaskDate);
              const todayDate = new Date(today);
              const diffTime = todayDate.getTime() - lastDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                  newStreak += 1;
              } else if (diffDays > 1) {
                  newStreak = 1; // Reset streak
              }
              // Same day = keep current streak
          }
          
          // Check for streak bonuses
          let bonusPoints = 0;
          if (newStreak === 7) {
              bonusPoints = 50; // 7-day streak bonus
          } else if (newStreak === 30 || (newStreak > 0 && newStreak % 30 === 0)) {
              bonusPoints = 100; // 30-day streak bonus
          }
          
          if (bonusPoints > 0) {
              await storage.addPoints(userId, bonusPoints);
          }
          
          // Update user's streak and last task date
          await storage.updateUserProfile(userId, { 
              currentStreak: newStreak, 
              lastTaskDate: today 
          });
      }
      
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

  // Chatbot - using OpenAI integration with precision upgrade
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
          
          const systemPrompt = `You are a precise preventive healthcare assistant.

RESPONSE STRUCTURE:
1. DIRECT ANSWER to the main problem first (1-2 sentences max)
2. Secondary guidance ONLY if directly relevant
3. End with "Consult a doctor if symptoms persist" ONLY for concerning symptoms

STRICT RULES:
- Problem-first approach: Address the core issue immediately
- NO generic wellness advice unless specifically asked
- NO obvious statements ("drink water", "get rest") unless directly relevant
- NEVER diagnose or prescribe medications
- Keep total response under 50 words unless complex question
- Be warm but efficient

USER MEDICAL CONTEXT:
- Age: ${user?.age || "unknown"}, Gender: ${user?.gender || "unknown"}
- Health Scores: Physical ${user?.physicalScore || 50}/100, Mental ${user?.mentalScore || 50}/100
- Lifestyle: ${user?.lifestyle || "not specified"}
- Known Allergies: ${user?.allergies || "none reported"}
- Past Conditions: ${user?.pastDiseases || "none reported"}
- Current Conditions: ${user?.currentConditions || "none reported"}`;

          const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: message }
              ],
              max_completion_tokens: 200,
          });
          
          const reply = completion.choices[0]?.message?.content || "Could you describe your concern more specifically?";
          res.json({ reply });
      } catch (error) {
          console.error("Chat error:", error);
          res.json({ reply: "Please describe your health concern and I'll provide focused guidance." });
      }
  });

  // Image Analysis endpoint
  app.post(api.chat.analyzeImage.path, requireAuth, async (req, res) => {
      const { image, context } = req.body;
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({
              apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
              baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
          });
          
          const systemPrompt = `You are a medical image analysis assistant for preliminary health guidance only.

RESPONSE FORMAT:
1. **Observation**: Brief description of what you see (1 sentence)
2. **Possible Condition**: Most likely explanation (1 sentence)
3. **Recommended Action**: What the user should do next (1 sentence)

DISCLAIMER (always include):
"This is NOT a medical diagnosis. Please consult a healthcare professional for accurate evaluation."

RULES:
- Be observational, not diagnostic
- Focus on visible symptoms only
- Suggest professional consultation for anything concerning
- Consider user context: Age ${user?.age || "unknown"}, Allergies: ${user?.allergies || "none known"}`;

          const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                  { role: "system", content: systemPrompt },
                  { 
                      role: "user", 
                      content: [
                          { type: "text", text: context || "Please analyze this image for any health concerns." },
                          { type: "image_url", image_url: { url: image } }
                      ]
                  }
              ],
              max_completion_tokens: 300,
          });
          
          const analysis = completion.choices[0]?.message?.content || "Unable to analyze this image. Please try with a clearer photo.";
          res.json({ analysis });
      } catch (error) {
          console.error("Image analysis error:", error);
          res.json({ analysis: "Image analysis is temporarily unavailable. Please describe your concern in text instead.\n\nDisclaimer: This is NOT a medical diagnosis." });
      }
  });

  // Points system endpoints
  app.get(api.points.get.path, requireAuth, async (req, res) => {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      const points = user?.points || 0;
      const streak = user?.currentStreak || 0;
      const canRedeem = points >= 10000;
      const redeemValue = Math.floor(points / 1000) * 10; // 1000 points = ₹10
      
      res.json({ points, streak, canRedeem, redeemValue });
  });

  app.post(api.points.addReferral.path, requireAuth, async (req, res) => {
      const { referralCode } = req.body;
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      if (user?.referredBy) {
          return res.status(400).json({ message: "You have already used a referral code" });
      }
      
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
          return res.status(400).json({ message: "Invalid referral code" });
      }
      
      if (referrer.id === userId) {
          return res.status(400).json({ message: "Cannot use your own referral code" });
      }
      
      // Add 100 points to both users
      await storage.addPoints(userId, 100);
      await storage.addPoints(referrer.id, 100);
      await storage.updateUserProfile(userId, { referredBy: referralCode });
      
      const updatedUser = await storage.getUser(userId);
      res.json({ success: true, points: updatedUser?.points || 0 });
  });

  return httpServer;
}
