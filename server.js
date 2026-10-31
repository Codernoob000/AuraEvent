/**
 * @fileoverview Hardened Express Server for AuraEvent Celebration Planner.
 * Strictly adheres to Taha Jaffri's 13-category Security Constitution.
 * Features Helmet HTTP headers, multi-tier rate limiting, Zod validation, and Gemini AI proxy.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { queryGeminiApi, checkAndUpdateTokenBudget } from './services/geminiService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

/* ==========================================================================
   1. Security Headers (Rule 7)
   ========================================================================== */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://calendar.google.com"]
    }
  },
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  hidePoweredBy: true
}));

/* ==========================================================================
   2. CORS Configuration (Rule 6)
   ========================================================================== */
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.ALLOWED_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

/* ==========================================================================
   3. Rate Limiting per Endpoint Type (Rule 2)
   ========================================================================== */
/** Standard rate limit response generator */
const createRateLimitHandler = (message) => (req, res) => {
  res.setHeader('Retry-After', '60');
  res.status(429).json({ error: message });
};

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('General API limit reached (60 requests/min). Please retry shortly.')
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('AI inspiration request limit reached (10 requests/min). Please wait 60 seconds.')
});

const mutateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Data update limit reached. Please wait a moment before saving again.')
});

app.use('/api/', generalLimiter);

/* ==========================================================================
   4. In-Memory Store & Schemas (Rules 3 & 5)
   ========================================================================== */
const IN_MEMORY_DB = new Map();

const aiRequestSchema = z.object({
  eventType: z.enum(['Wedding', 'Birthday', 'Community Event', 'Anniversary', 'Gala', 'Corporate']),
  theme: z.string().min(1).max(120).trim(),
  vibe: z.string().max(80).trim().optional(),
  budget: z.number().positive().max(10000000),
  guestCount: z.number().int().positive().max(50000)
});

const eventSyncSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(120).trim(),
  type: z.string().min(1).max(50).trim(),
  date: z.string().min(1).max(40),
  budget: z.number().min(0).max(10000000),
  guestCount: z.number().int().min(1).max(50000),
  expenses: z.array(z.any()).optional(),
  milestones: z.array(z.any()).optional(),
  vendors: z.array(z.any()).optional(),
  savedPlans: z.array(z.any()).optional()
});

/* ==========================================================================
   5. Application Endpoints
   ========================================================================== */

/** Health verification check */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    googleServices: { gemini: Boolean(process.env.GEMINI_API_KEY), calendar: true }
  });
});

/** GenAI Planning Proxy (Rules 3, 9, 13) */
app.post('/api/ai/ideas', aiLimiter, async (req, res, next) => {
  try {
    const parseResult = aiRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed: Invalid event parameters.' });
    }

    const clientIdentifier = req.ip || 'anonymous-user';
    const hasQuota = checkAndUpdateTokenBudget(clientIdentifier, 400);
    if (!hasQuota) {
      return res.status(429).json({ error: 'Per-user AI token budget exceeded for this session.' });
    }

    const aiPlan = await queryGeminiApi(parseResult.data);
    res.json(aiPlan);
  } catch (error) {
    next(error);
  }
});

/** Retrieve saved event state (Rule 5) */
app.get('/api/events/:id', (req, res, next) => {
  try {
    const eventId = String(req.params.id);
    const eventRecord = IN_MEMORY_DB.get(eventId);
    if (!eventRecord) {
      return res.status(404).json({ error: 'Celebration not found.' });
    }
    // Return sanitized data payload; never leak ownerToken (Rule 4)
    res.json(eventRecord.data);
  } catch (error) {
    next(error);
  }
});

/** Sync/Save event state with cryptographic ownership validation (Rules 3, 4, 5, 9) */
app.put('/api/events/:id', mutateLimiter, (req, res, next) => {
  try {
    const parseResult = eventSyncSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed: Invalid event payload structure.' });
    }

    const eventId = String(req.params.id);
    const clientToken = req.headers['x-event-token'];
    const existing = IN_MEMORY_DB.get(eventId);

    if (existing) {
      if (!clientToken || clientToken !== existing.ownerToken) {
        return res.status(403).json({ error: 'Forbidden: Missing or invalid event ownership token.' });
      }
      existing.data = parseResult.data;
      existing.updatedAt = new Date();
      return res.json({ success: true, id: eventId, ownerToken: existing.ownerToken });
    }

    // New event: assign persistent cryptographic ownership token
    const ownerToken = (typeof clientToken === 'string' && clientToken.length >= 16)
      ? clientToken
      : crypto.randomUUID();

    IN_MEMORY_DB.set(eventId, {
      data: parseResult.data,
      ownerToken,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, id: eventId, ownerToken });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================================
   6. Central Error Handling Middleware (Rule 9)
   ========================================================================== */
app.use((err, req, res, _next) => {
  // Server-side audit log with sanitized details (never leaked to client)
  if (!IS_PROD) {
    process.stderr.write(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.url}: ${err.message}\n`);
  }
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

/* ==========================================================================
   7. Start Server
   ========================================================================== */
const isMainModule = process.argv[1] && (
  path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
  process.argv[1].endsWith('server.js')
);
if (isMainModule) {
  const server = app.listen(PORT, () => {
    if (!IS_PROD) {
      process.stdout.write(`AuraEvent Server running securely on port ${PORT}\n`);
    }
  });
  // Ensure Node event loop retains active reference on non-interactive Windows shells
  const keepAlive = setInterval(() => {}, 1000 * 60 * 60);
  process.on('SIGTERM', () => { clearInterval(keepAlive); server.close(); });
  process.on('SIGINT', () => { clearInterval(keepAlive); server.close(); });
}

export default app;

