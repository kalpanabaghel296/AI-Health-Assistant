# Vital.AI - Web3 Health & Fitness Assistant

## Overview

Vital.AI is a Web3-powered AI health and fitness assistant web application. Users authenticate via MetaMask wallet connection (Monad Testnet), and the app provides personalized health tracking, AI-powered symptom analysis, medication reminders, and a rewards/points system. Health data is stored securely off-chain with privacy-first design principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with path aliases (`@/` for client/src, `@shared/` for shared)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts`
- **Session Management**: Cookie-based sessions with `cookie-session`
- **Build**: esbuild bundles server for production

### Authentication System
- **Method**: Wallet-based authentication using MetaMask/ethers.js
- **Flow**: Nonce generation → Message signing → Signature verification
- **Network**: Enforces Monad Testnet connection
- **Identity**: Wallet address serves as user identity (no email/password)

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client/server)
- **Migrations**: Managed via `drizzle-kit push`
- **Tables**: users, tasks, symptoms, reminders, conversations, messages

### Key Features
1. **Health Scoring**: Physical, mental, and overall health scores (0-100)
2. **Smart Avatar**: BMI/age/gender-based dynamic avatar generation
3. **AI Chat Assistant**: Global chat bubble with image analysis capability
4. **Task System**: Daily health tasks with point rewards
5. **Symptom Tracking**: Log symptoms with severity and duration
6. **Medication Reminders**: Scheduled notifications with alarm system
7. **Rewards System**: Points for task completion, streak bonuses, referral codes

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations
- **Features**: Text chat, image analysis, voice chat (SSE streaming)
- **Server Modules**: Located in `server/replit_integrations/` (audio, chat, image, batch)

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (shadcn/ui + custom)
    hooks/        # React hooks (auth, health-data, theme)
    pages/        # Route pages
    lib/          # Utilities (queryClient, utils)
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database operations
  replit_integrations/  # AI service integrations
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
  routes.ts       # API route definitions with Zod validation
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and schema management

### Authentication
- **ethers.js**: Web3 wallet connection and message signing
- **MetaMask**: Required browser wallet extension

### AI Services
- **OpenAI API**: Powers chat, image analysis, and voice features
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### UI Components
- **shadcn/ui**: Pre-built accessible React components
- **Radix UI**: Underlying primitives for shadcn components
- **Lucide React**: Icon library

### Data Visualization
- **Recharts**: Health score charts
- **react-circular-progressbar**: Score ring displays

### Session & Security
- **cookie-session**: Server-side session management
- **SESSION_SECRET**: Environment variable for session encryption