import { z } from "zod";
import { insertUserSchema, insertTaskSchema, insertSymptomSchema, insertReminderSchema, users, tasks, symptoms, reminders } from "./schema";

export const api = {
  auth: {
    getNonce: {
      method: "POST" as const,
      path: "/api/auth/nonce",
      input: z.object({ walletAddress: z.string() }),
      responses: {
        200: z.object({ nonce: z.string() }),
      },
    },
    verify: {
      method: "POST" as const,
      path: "/api/auth/verify",
      input: z.object({ walletAddress: z.string(), signature: z.string() }),
      responses: {
        200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }),
        401: z.object({ message: z.string() }),
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.null(),
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/auth/logout",
      responses: {
        200: z.object({ message: z.string() }),
      },
    }
  },
  users: {
    updateProfile: {
      method: "PATCH" as const,
      path: "/api/users/profile",
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
  },
  tasks: {
    list: {
      method: "GET" as const,
      path: "/api/tasks",
      input: z.object({ date: z.string() }).optional(),
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/tasks/:id",
      input: z.object({ current: z.number().optional(), completed: z.boolean().optional() }),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
      },
    },
    // Endpoint to generate daily tasks if they don't exist
    generate: {
        method: "POST" as const,
        path: "/api/tasks/generate",
        responses: {
            200: z.array(z.custom<typeof tasks.$inferSelect>()),
        }
    }
  },
  symptoms: {
    create: {
      method: "POST" as const,
      path: "/api/symptoms",
      input: insertSymptomSchema,
      responses: {
        201: z.custom<typeof symptoms.$inferSelect>(),
      },
    },
    list: {
      method: "GET" as const,
      path: "/api/symptoms",
      responses: {
        200: z.array(z.custom<typeof symptoms.$inferSelect>()),
      },
    },
  },
  reminders: {
    create: {
      method: "POST" as const,
      path: "/api/reminders",
      input: insertReminderSchema,
      responses: {
        201: z.custom<typeof reminders.$inferSelect>(),
      },
    },
    list: {
      method: "GET" as const,
      path: "/api/reminders",
      responses: {
        200: z.array(z.custom<typeof reminders.$inferSelect>()),
      },
    },
    toggle: {
        method: "PATCH" as const,
        path: "/api/reminders/:id/toggle",
        responses: {
            200: z.custom<typeof reminders.$inferSelect>(),
        }
    }
  },
  chat: {
    send: {
      method: "POST" as const,
      path: "/api/chat",
      input: z.object({ message: z.string() }),
      responses: {
        200: z.object({ reply: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
