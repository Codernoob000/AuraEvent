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
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';

/* ==========================================================================
   Server Operational Constants
   ========================================================================== */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const GENERAL_RATE_LIMIT = 60;
const AI_RATE_LIMIT = 10;
const MUTATE_RATE_LIMIT = 15;
const RETRY_AFTER_SECONDS = '60';
const MAX_JSON_PAYLOAD_SIZE = '1mb';
const MAX_BUDGET_CEILING = 10000000;
const MAX_GUEST_CAPACITY = 50000;
const MIN_OWNER_TOKEN_LENGTH = 16;
const ESTIMATED_AI_TOKENS = 400;
const SERVER_KEEP_ALIVE_MS = 1000 * 60 * 60;

/* ==========================================================================
   1. Security Headers (Rule 7)
   ========================================================================== */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://calendar.google.com']
      }
    },
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true,
    hidePoweredBy: true
  })
);

/* ==========================================================================
   2. Static Assets Serving
   Serve client assets first so JavaScript modules and CSS are never blocked
   by API-specific CORS or JSON parsing middleware.
   ========================================================================== */
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));
app.use(express.static(__dirname));

/* ==========================================================================
   3. CORS Configuration (Rule 6)
   ========================================================================== */
const configuredOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map(originStr => originStr.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.RENDER_EXTERNAL_URL,
  ...configuredOrigins
].filter(Boolean);

/**
 * Validate incoming request origin against allowed hostnames.
 * @param {string|undefined} origin - Incoming Origin header.
 * @param {Function} callback - CORS evaluation callback.
 */
function validateCorsOrigin(origin, callback) {
  // Permit requests without Origin header (e.g. same-origin GET, curl, server-to-server)
  if (!origin) {
    return callback(null, true);
  }
  // Permit explicitly configured allowed origins
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  // Permit Render cloud subdomains (*.onrender.com) for zero-config Render web services
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) {
    return callback(null, true);
  }
  // Permit local loopback origins on any port for development and testing
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return callback(null, true);
  }
  return callback(new Error('CORS policy: Origin not allowed.'));
}

app.use(
  cors({
    origin: validateCorsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  })
);

app.use(express.json({ limit: MAX_JSON_PAYLOAD_SIZE }));

/* ==========================================================================
   4. Rate Limiting per Endpoint Type (Rule 2)
   ========================================================================== */
/**
 * Create standard rate limit error handler.
 * @param {string} message - User-facing rate limit explanation.
 * @returns {Function} Express middleware callback.
 */
const createRateLimitHandler = message => (req, res) => {
  res.setHeader('Retry-After', RETRY_AFTER_SECONDS);
  res.status(429).json({ error: message });
};

const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: GENERAL_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'General API limit reached (60 requests/min). Please retry shortly.'
  )
});

const aiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AI_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'AI inspiration request limit reached (10 requests/min). Please wait 60 seconds.'
  )
});

const mutateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: MUTATE_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'Data update limit reached. Please wait a moment before saving again.'
  )
});

app.use('/api/', generalLimiter);

/* ==========================================================================
   5. In-Memory Store & Schemas (Rules 3 & 5)
   ========================================================================== */
const IN_MEMORY_DB = new Map();

/** Schema for validating AI inspiration generation requests */
const aiRequestSchema = z.object({
  eventType: z.enum(['Wedding', 'Birthday', 'Community Event', 'Anniversary', 'Gala', 'Corporate']),
  theme: z.string().min(1).max(120).trim(),
  vibe: z.string().max(80).trim().optional(),
  budget: z.number().positive().max(MAX_BUDGET_CEILING),
  guestCount: z.number().int().positive().max(MAX_GUEST_CAPACITY)
});

/** Schema for validating celebration state synchronization */
const eventSyncSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(120).trim(),
  type: z.string().min(1).max(50).trim(),
  date: z.string().min(1).max(40),
  budget: z.number().min(0).max(MAX_BUDGET_CEILING),
  guestCount: z.number().int().min(1).max(MAX_GUEST_CAPACITY),
  expenses: z.array(z.any()).optional(),
  milestones: z.array(z.any()).optional(),
  vendors: z.array(z.any()).optional(),
  savedPlans: z.array(z.any()).optional()
});

/* ==========================================================================
   6. Application Endpoints
   ========================================================================== */

/** Silently respond to browser favicon probes */
app.get('/favicon.ico', (req, res) => res.status(204).end());

/** Health verification check (Supported on /api/health and /health for Render monitoring) */
app.get(['/api/health', '/health'], (req, res) => {
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
    const hasQuota = checkAndUpdateTokenBudget(clientIdentifier, ESTIMATED_AI_TOKENS);
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
        return res
          .status(403)
          .json({ error: 'Forbidden: Missing or invalid event ownership token.' });
      }
      existing.data = parseResult.data;
      existing.updatedAt = new Date();
      return res.json({ success: true, id: eventId, ownerToken: existing.ownerToken });
    }

    // New event: assign persistent cryptographic ownership token
    const ownerToken =
      typeof clientToken === 'string' && clientToken.length >= MIN_OWNER_TOKEN_LENGTH
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
   7. Central Error Handling Middleware (Rule 9)
   ========================================================================== */
app.use((err, req, res, _next) => {
  if (!IS_PROD) {
    process.stderr.write(
      `[ERROR] ${new Date().toISOString()} ${req.method} ${req.url}: ${err.message}\n`
    );
  }
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

/* ==========================================================================
   8. Start Server
   ========================================================================== */
const isMainModule =
  process.argv[1] &&
  (path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
    process.argv[1].endsWith('server.js'));
if (isMainModule) {
  const server = app.listen(PORT, HOST, () => {
    process.stdout.write(
      `AuraEvent Server running securely on http://${HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})\n`
    );
  });
  // Ensure Node event loop retains active reference on non-interactive Windows shells
  const keepAlive = setInterval(() => {}, SERVER_KEEP_ALIVE_MS);
  process.on('SIGTERM', () => {
    clearInterval(keepAlive);
    server.close();
  });
  process.on('SIGINT', () => {
    clearInterval(keepAlive);
    server.close();
  });
}

export default app;
