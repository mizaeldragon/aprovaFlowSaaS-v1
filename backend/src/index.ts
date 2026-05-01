import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { promises as dns } from 'dns';
import { createClient } from '@supabase/supabase-js';
import { prisma } from './prisma';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// FIX [CRÍTICO]: JWT_SECRET sem fallback hardcoded — obrigatório em todos os ambientes
const JWT_SECRET = String(process.env.JWT_SECRET || '').trim();
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET obrigatorio. Defina-o no arquivo .env');
}

const frontendUrlFromEnv = String(process.env.FRONTEND_URL || '').trim();
if (IS_PRODUCTION && !frontendUrlFromEnv) {
  throw new Error('FRONTEND_URL obrigatorio em producao.');
}
const FRONTEND_URL = frontendUrlFromEnv || 'http://localhost:5173';
const STRIPE_SECRET_KEY = String(process.env.STRIPE_SECRET_KEY || '').trim();
const STRIPE_WEBHOOK_SECRET = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const STRIPE_PRICE_STARTER_MONTHLY = String(process.env.STRIPE_PRICE_STARTER_MONTHLY || '').trim();
const STRIPE_PRICE_STARTER_YEARLY = String(process.env.STRIPE_PRICE_STARTER_YEARLY || '').trim();
const STRIPE_PRICE_PRO_MONTHLY = String(process.env.STRIPE_PRICE_PRO_MONTHLY || '').trim();
const STRIPE_PRICE_PRO_YEARLY = String(process.env.STRIPE_PRICE_PRO_YEARLY || '').trim();
const CUSTOM_DOMAIN_CNAME_TARGET = String(process.env.CUSTOM_DOMAIN_CNAME_TARGET || 'lb.aprovaflow.com').trim().toLowerCase();
const OPS_ALERT_WEBHOOK_URL = String(process.env.OPS_ALERT_WEBHOOK_URL || '').trim();
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const SUPABASE_STORAGE_BUCKET = String(process.env.SUPABASE_STORAGE_BUCKET || 'creative-assets').trim();
const BOOTED_AT = new Date();

// FIX [CRÍTICO]: Set para idempotência do webhook Stripe
const processedStripeEvents = new Set<string>();

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })
  : null;
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function requireStripe() {
  if (!stripe) throw new Error('STRIPE_NOT_CONFIGURED');
  return stripe;
}

function getStripePriceId(plan: 'starter' | 'pro', interval: 'monthly' | 'yearly' = 'monthly') {
  if (plan === 'starter') {
    if (interval === 'yearly' && STRIPE_PRICE_STARTER_YEARLY) return STRIPE_PRICE_STARTER_YEARLY;
    return STRIPE_PRICE_STARTER_MONTHLY;
  }
  if (interval === 'yearly' && STRIPE_PRICE_PRO_YEARLY) return STRIPE_PRICE_PRO_YEARLY;
  return STRIPE_PRICE_PRO_MONTHLY;
}

function resolvePlanFromPriceId(priceId?: string | null): PlanTier {
  const normalized = String(priceId || '').trim();
  if (!normalized) return 'STARTER';
  if (normalized === STRIPE_PRICE_PRO_MONTHLY || normalized === STRIPE_PRICE_PRO_YEARLY) return 'PRO';
  if (normalized === STRIPE_PRICE_STARTER_MONTHLY || normalized === STRIPE_PRICE_STARTER_YEARLY) return 'STARTER';
  return 'STARTER';
}

function isSubscriptionActiveStatus(status?: string | null) {
  return status === 'active' || status === 'trialing';
}

function parseAllowedOrigins() {
  const envOrigins = String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (envOrigins.length > 0) return envOrigins;
  if (!IS_PRODUCTION) return ['http://localhost:5173', 'http://localhost:4173', FRONTEND_URL];
  return [];
}

const allowedOrigins = parseAllowedOrigins();

const isOriginAllowed = (origin?: string) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return false;
};

type PlanTier = 'STARTER' | 'PRO';
type ErrorSeverity = 'warning' | 'error' | 'critical';

function toIsoDateFromUnix(seconds?: number | null): Date | null {
  if (!seconds || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000);
}

function extractErrorInfo(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  return {
    message: String(error || 'Erro desconhecido'),
    name: 'UnknownError',
    stack: undefined as string | undefined,
  };
}

async function notifyOpsWebhook(payload: Record<string, unknown>) {
  if (!OPS_ALERT_WEBHOOK_URL) return;
  try {
    await fetch(OPS_ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const meta = extractErrorInfo(error);
    console.error('[ops-alert] Falha ao enviar alerta para webhook', meta.message);
  }
}

async function reportBackendError(params: {
  scope: string;
  error: unknown;
  severity?: ErrorSeverity;
  meta?: Record<string, unknown>;
}) {
  const severity = params.severity || 'error';
  const errorInfo = extractErrorInfo(params.error);
  const payload = {
    scope: params.scope,
    severity,
    message: errorInfo.message,
    name: errorInfo.name,
    // FIX [CRÍTICO]: Nunca expor stack trace em produção (pode vazar secrets)
    stack: IS_PRODUCTION ? undefined : errorInfo.stack,
    meta: params.meta || {},
    ts: new Date().toISOString(),
    env: NODE_ENV,
  };
  console.error('[backend-error]', JSON.stringify(payload));

  if (severity === 'critical' || params.scope.startsWith('billing.')) {
    await notifyOpsWebhook(payload);
  }
}

function normalizeTenantPlan(plan?: string | null, isPro?: boolean | null): PlanTier {
  if (plan === 'PRO' || isPro) return 'PRO';
  return 'STARTER';
}

function hasProAccess(tenant?: { plan?: string | null; isPro?: boolean | null } | null) {
  return normalizeTenantPlan(tenant?.plan, tenant?.isPro) === 'PRO';
}

function canTenantAccessApp(tenant?: { billingRequired?: boolean | null; stripeSubscriptionStatus?: string | null } | null) {
  if (!tenant?.billingRequired) return true;
  return isSubscriptionActiveStatus(tenant?.stripeSubscriptionStatus);
}

const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
};

function normalizeHost(value?: string | null) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
}

// FIX [ALTO]: Validação de domínio RFC 1123
const RFC1123_DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

async function verifyDomainCname(customDomain: string) {
  const domain = normalizeHost(customDomain);
  const expectedTarget = normalizeHost(CUSTOM_DOMAIN_CNAME_TARGET);

  if (!domain) {
    return {
      status: 'missing',
      expectedTarget,
      resolvedTo: [] as string[],
      message: 'Dominio nao informado.',
    };
  }

  // FIX [ALTO]: Rejeitar domínios com formato inválido antes de chamar dns.resolveCname
  if (!RFC1123_DOMAIN_REGEX.test(domain)) {
    return {
      status: 'invalid',
      expectedTarget,
      resolvedTo: [] as string[],
      message: 'Formato de dominio invalido.',
    };
  }

  try {
    const cnameRecords = await dns.resolveCname(domain);
    const normalizedRecords = cnameRecords.map((record) => normalizeHost(record));
    const isConnected = normalizedRecords.includes(expectedTarget);
    return {
      status: isConnected ? 'connected' : 'not_connected',
      expectedTarget,
      resolvedTo: normalizedRecords,
      message: isConnected
        ? 'DNS conectado com sucesso.'
        : 'CNAME encontrado, mas apontando para destino diferente.',
    };
  } catch (error) {
    return {
      status: 'not_connected',
      expectedTarget,
      resolvedTo: [] as string[],
      message: `Nao foi possivel resolver CNAME (${(error as Error)?.message || 'erro desconhecido'}).`,
    };
  }
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use(cors(corsOptions));

app.post('/api/billing/webhook', express.raw({ type: 'application/json', limit: '2mb' }), async (req, res) => {
  try {
    const stripeClient = requireStripe();
    if (!STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'Webhook Stripe nao configurado.' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).send('Missing stripe-signature');
    }

    const event = stripeClient.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);

    // FIX [CRÍTICO]: Idempotência — ignorar eventos já processados
    if (processedStripeEvents.has(event.id)) {
      return res.json({ received: true, duplicate: true });
    }
    processedStripeEvents.add(event.id);
    setTimeout(() => processedStripeEvents.delete(event.id), 24 * 60 * 60 * 1000);

    const markTenantSubscription = async (params: {
      tenantId: string;
      plan: PlanTier;
      customerId?: string | null;
      subscriptionId?: string | null;
      status?: string | null;
      priceId?: string | null;
      currentPeriodEnd?: Date | null;
    }) => {
      const isActiveSubscription = isSubscriptionActiveStatus(params.status);
      const data: any = {
        isPro: isActiveSubscription && params.plan === 'PRO',
        plan: isActiveSubscription ? params.plan : 'STARTER',
        stripeCustomerId: params.customerId || null,
        stripeSubscriptionId: params.subscriptionId || null,
        stripeSubscriptionStatus: params.status || null,
        stripePriceId: params.priceId || null,
        stripeCurrentPeriodEnd: params.currentPeriodEnd || null,
      };
      const updated = await prisma.tenant.update({ where: { id: params.tenantId }, data });
      emitTenantDashboardUpdate(updated.id, 'billing_subscription_updated');
    };

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription') {
        const tenantId = String(session.metadata?.tenantId || '');
        if (tenantId) {
          let status: string | null = 'active';
          let priceId: string | null = null;
          let currentPeriodEnd: Date | null = null;
          if (typeof session.subscription === 'string') {
            const subscription = await stripeClient.subscriptions.retrieve(session.subscription);
            status = subscription.status;
            priceId = subscription.items?.data?.[0]?.price?.id || null;
            currentPeriodEnd = toIsoDateFromUnix(subscription.items?.data?.[0]?.current_period_end || null);
          }

          await markTenantSubscription({
            tenantId,
            plan: resolvePlanFromPriceId(priceId),
            customerId: typeof session.customer === 'string' ? session.customer : null,
            subscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
            status,
            priceId,
            currentPeriodEnd,
          });
        }
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      if (customerId) {
        const tenantByCustomer = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } });
        if (tenantByCustomer) {
          await markTenantSubscription({
            tenantId: tenantByCustomer.id,
            plan: resolvePlanFromPriceId(tenantByCustomer.stripePriceId),
            customerId,
            subscriptionId: tenantByCustomer.stripeSubscriptionId || null,
            status: 'active',
            priceId: tenantByCustomer.stripePriceId || null,
            currentPeriodEnd: toIsoDateFromUnix(invoice.lines?.data?.[0]?.period?.end || null),
          });
        }
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantIdFromMetadata = String(subscription.metadata?.tenantId || '');
      let tenantId = tenantIdFromMetadata;
      if (!tenantId) {
        const bySub = await prisma.tenant.findFirst({ where: { stripeSubscriptionId: subscription.id } });
        tenantId = bySub?.id || '';
      }
      if (tenantId) {
        const priceId = subscription.items?.data?.[0]?.price?.id || null;
        await markTenantSubscription({
          tenantId,
          plan: resolvePlanFromPriceId(priceId),
          customerId: typeof subscription.customer === 'string' ? subscription.customer : null,
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId,
          currentPeriodEnd: toIsoDateFromUnix(subscription.items?.data?.[0]?.current_period_end || null),
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    await reportBackendError({
      scope: 'billing.webhook',
      error,
      severity: 'critical',
      meta: {
        contentType: req.headers['content-type'] || '',
        stripeSignaturePresent: Boolean(req.headers['stripe-signature']),
      },
    });
    return res.status(400).send(`Webhook error: ${(error as Error).message}`);
  }
});

type RateLimitOptions = {
  windowMs: number;
  max: number;
  scope: string;
};

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(options: RateLimitOptions) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const key = `${options.scope}:${getClientIp(req)}`;
    const current = rateLimitBuckets.get(key);

    if (!current || current.resetAt <= now) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > options.max) {
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
    }

    return next();
  };
}

app.use(express.json({ limit: '8mb' }));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  },
});

type JwtPayload = { userId: string; tenantId: string };

function emitTenantDashboardUpdate(tenantId?: string | null, reason = 'updated') {
  if (!tenantId) return;
  io.to(`tenant:${tenantId}`).emit('dashboard:update', {
    tenantId,
    reason,
    at: new Date().toISOString(),
  });
}

// FIX [CRÍTICO]: Leitura de cookie httpOnly para auth
function parseTokenFromCookies(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)aprovaflow-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// FIX [CRÍTICO]: Emitir cookie httpOnly no login/register
function setAuthCookie(res: express.Response, token: string) {
  res.cookie('aprovaflow-token', token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

// FIX [CRÍTICO]: jwt.verify com algoritmo explícito HS256; lê de cookie OU Authorization header
function getTokenPayload(req: express.Request): JwtPayload | null {
  try {
    const authHeader = req.headers.authorization;
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : parseTokenFromCookies(req.headers.cookie);
    if (!rawToken) return null;
    return jwt.verify(rawToken, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
  } catch {
    return null;
  }
}

function requireAuthPayload(req: express.Request, res: express.Response): JwtPayload | null {
  const payload = getTokenPayload(req);
  if (!payload) {
    res.status(401).json({ error: 'Nao autorizado' });
    return null;
  }
  return payload;
}

async function resolveCurrentTenantFromAuth(req: express.Request) {
  const payload = getTokenPayload(req);
  if (!payload) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: { id: true, plan: true, isPro: true },
  });
  if (!tenant) return null;
  return { payload, tenant };
}

// Socket.io: tenta autenticar mas permite conexão mesmo sem token.
// Sockets sem tenantId simplesmente não entram em nenhuma sala e não recebem updates.
// A segurança real está nas APIs HTTP — Socket.io é apenas notificação.
io.use((socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token as string | undefined;
    const bearerToken = typeof authToken === 'string' && authToken.startsWith('Bearer ')
      ? authToken.slice(7)
      : authToken || parseTokenFromCookies(socket.handshake.headers.cookie);

    if (bearerToken) {
      const payload = jwt.verify(bearerToken, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
      socket.data.tenantId = payload.tenantId;
    }
  } catch {
    // token inválido — conecta sem tenantId, não recebe nenhum update
  }
  return next();
});

io.on('connection', (socket) => {
  const tenantId = String(socket.data?.tenantId || '');
  if (tenantId) {
    socket.join(`tenant:${tenantId}`);
  }
});

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || 'unknown';
}

function buildPostVersionHash(input: {
  title?: string | null;
  channel?: string | null;
  caption?: string | null;
  imageUrl?: string | null;
  clientName?: string | null;
  tenantId?: string | null;
}) {
  const raw = JSON.stringify({
    title: input.title || '',
    channel: input.channel || '',
    caption: input.caption || '',
    imageUrl: input.imageUrl || '',
    clientName: input.clientName || '',
    tenantId: input.tenantId || '',
  });
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

function normalizeMediaType(value: unknown): 'IMAGE' | 'VIDEO' {
  return String(value || '').trim().toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
}

function sanitizeFileName(value: unknown) {
  const raw = String(value || 'arquivo').trim().toLowerCase();
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'arquivo';
}

function isAllowedMediaMime(mimeType: string, mediaType: 'IMAGE' | 'VIDEO') {
  const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  return mediaType === 'VIDEO' ? videoTypes.includes(mimeType) : imageTypes.includes(mimeType);
}

function getMediaSizeLimit(mediaType: 'IMAGE' | 'VIDEO') {
  return mediaType === 'VIDEO' ? 150 * 1024 * 1024 : 10 * 1024 * 1024;
}

function validateRegisterPayload(payload: { name?: unknown; email?: unknown; password?: unknown; agencyName?: unknown }) {
  const name = normalizeText(payload.name);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || '');
  const agencyName = normalizeText(payload.agencyName);

  if (!agencyName || agencyName.length < 2 || agencyName.length > 80) {
    return { ok: false, error: 'Nome da agencia deve ter entre 2 e 80 caracteres.' } as const;
  }
  if (!name || name.length < 2 || name.length > 80) {
    return { ok: false, error: 'Seu nome deve ter entre 2 e 80 caracteres.' } as const;
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'Informe um e-mail valido.' } as const;
  }
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return { ok: false, error: 'Senha fraca. Use 8+ caracteres com maiuscula, minuscula, numero e simbolo.' } as const;
  }

  return { ok: true, value: { name, email, password, agencyName } } as const;
}

function validateLoginPayload(payload: { email?: unknown; password?: unknown }) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || '');

  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'Informe um e-mail valido.' } as const;
  }
  // FIX [MÉDIO]: Consistência com register — mínimo 8 caracteres
  if (!password || password.length < 8) {
    return { ok: false, error: 'A senha precisa ter no minimo 8 caracteres.' } as const;
  }

  return { ok: true, value: { email, password } } as const;
}

function validateForgotPasswordPayload(payload: { email?: unknown }) {
  const email = normalizeEmail(payload.email);
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'Informe um e-mail valido.' } as const;
  }
  return { ok: true, value: { email } } as const;
}

function validateResetPasswordPayload(payload: { token?: unknown; password?: unknown }) {
  const token = String(payload.token || '').trim();
  const password = String(payload.password || '');

  if (!token) {
    return { ok: false, error: 'Token de recuperacao invalido.' } as const;
  }
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return { ok: false, error: 'Senha fraca. Use 8+ caracteres com maiuscula, minuscula, numero e simbolo.' } as const;
  }

  return { ok: true, value: { token, password } } as const;
}

async function sendResetPasswordEmail(to: string, resetLink: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    throw new Error('EMAIL_NOT_CONFIGURED');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject: 'AprovaFlow | Redefinicao de senha',
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.5; color:#0f172a;">
        <h2>Redefinicao de senha</h2>
        <p>Recebemos um pedido para redefinir sua senha.</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#00E5FF;color:#021220;text-decoration:none;font-weight:700;">
            Redefinir senha
          </a>
        </p>
        <p>Se o botao nao funcionar, copie e cole este link no navegador:</p>
        <p style="word-break:break-all;">${resetLink}</p>
        <p>Este link expira em 1 hora.</p>
      </div>
    `,
  });
}

// FIX [MÉDIO]: Limite de tamanho para prevenir ReDoS
function extractChecklistItems(text: string): string[] {
  if (text.length > 10000) return [];
  const normalized = text
    .replace(/\r/g, '\n')
    .split(/\n|\.\s+|;\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 6);

  const dedup = new Set<string>();
  for (const item of normalized) {
    const cleaned = item.replace(/^[-*\d.)\s]+/, '').trim();
    if (cleaned.length >= 6) dedup.add(cleaned);
  }
  return Array.from(dedup).slice(0, 10);
}

app.use('/api/auth/register', rateLimit({ scope: 'auth.register', windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/auth/login', rateLimit({ scope: 'auth.login', windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/auth/forgot-password', rateLimit({ scope: 'auth.forgot_password', windowMs: 60 * 60 * 1000, max: 5 }));
app.use('/api/auth/reset-password', rateLimit({ scope: 'auth.reset_password', windowMs: 60 * 60 * 1000, max: 10 }));
app.use('/api/public', rateLimit({ scope: 'public.review', windowMs: 10 * 60 * 1000, max: 60 }));

app.get('/', (req, res) => {
  res.json({ message: 'AprovaFlow SaaS API online!' });
});

app.get('/api/ops/health', (req, res) => {
  res.json({
    status: 'ok',
    env: NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    bootedAt: BOOTED_AT.toISOString(),
    now: new Date().toISOString(),
    stripe: {
      configured: Boolean(STRIPE_SECRET_KEY),
      webhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
    },
    alerting: {
      webhookConfigured: Boolean(OPS_ALERT_WEBHOOK_URL),
    },
    storage: {
      configured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
      bucket: SUPABASE_STORAGE_BUCKET,
    },
  });
});

app.post('/api/ops/alert-test', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });
    if (!OPS_ALERT_WEBHOOK_URL) {
      return res.status(400).json({ error: 'OPS_ALERT_WEBHOOK_URL nao configurado.' });
    }

    const testEvent = {
      scope: 'ops.alert_test',
      severity: 'warning',
      message: 'Teste manual de monitoramento',
      ts: new Date().toISOString(),
      env: NODE_ENV,
      meta: {
        tenantId: payload.tenantId,
        userId: payload.userId,
        source: 'manual_test_endpoint',
      },
    };

    await notifyOpsWebhook(testEvent);
    return res.json({ ok: true, sent: true, event: testEvent });
  } catch (error) {
    await reportBackendError({
      scope: 'ops.alert_test',
      error,
      meta: { hasBody: Boolean(req.body) },
    });
    return res.status(500).json({ error: 'Falha ao enviar alerta de teste.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const validation = validateRegisterPayload(req.body || {});
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, email, password, agencyName } = validation.value;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email ja cadastrado' });

    const passwordHash = await bcrypt.hash(password, 10);

    const tenant = await prisma.tenant.create({
      data: {
        name: agencyName,
        themeColor: '#709BFF',
        billingRequired: true,
      },
    });
    const user = await prisma.user.create({
      data: { name, email, passwordHash, tenantId: tenant.id },
    });

    const token = jwt.sign({ userId: user.id, tenantId: tenant.id }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });

    // FIX [CRÍTICO]: Emitir cookie httpOnly — token nunca mais precisa ficar em localStorage
    setAuthCookie(res, token);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
      tenantId: tenant.id,
    });
  } catch (error) {
    await reportBackendError({
      scope: 'auth.register',
      error,
      meta: {
        hasBody: Boolean(req.body),
        email: normalizeEmail(req.body?.email),
      },
    });
    res.status(500).json({ error: 'Erro ao registrar usuario' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const validation = validateLoginPayload(req.body || {});
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const { email, password } = validation.value;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ error: 'E-mail nao cadastrado.' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Senha incorreta.' });

    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });

    // FIX [CRÍTICO]: Emitir cookie httpOnly
    setAuthCookie(res, token);

    res.json({ user: { id: user.id, name: user.name, email: user.email }, token, tenantId: user.tenantId });
  } catch {
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'Usuario nao encontrado' });

    // Renovar cookie a cada /me (sessão deslizante)
    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
    setAuthCookie(res, token);

    res.json({ user: { id: user.id, name: user.name, email: user.email }, tenantId: user.tenantId, token });
  } catch {
    return res.status(401).json({ error: 'Token invalido' });
  }
});

// FIX [CRÍTICO]: Endpoint de logout que limpa o cookie httpOnly
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('aprovaflow-token', { path: '/', httpOnly: true });
  res.json({ ok: true });
});

app.patch('/api/auth/me', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const email = normalizeEmail(req.body?.email);
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Informe um e-mail valido.' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const duplicated = await prisma.user.findFirst({
      where: {
        email,
        id: { not: user.id },
      },
      select: { id: true },
    });
    if (duplicated) {
      return res.status(400).json({ error: 'Este e-mail ja esta em uso.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { email },
      select: { id: true, name: true, email: true, tenantId: true },
    });

    return res.json({ user: updatedUser });
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar perfil do usuario.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const validation = validateForgotPasswordPayload(req.body || {});
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }
    const { email } = validation.value;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'Se o e-mail existir, voce recebera o link para redefinir a senha.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashResetToken(resetToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: resetTokenHash,
        resetPasswordExpiresAt: expiresAt,
      },
    });

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendResetPasswordEmail(email, resetLink);

    return res.json({
      message: 'Se o e-mail existir, voce recebera o link para redefinir a senha.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_NOT_CONFIGURED') {
      return res.status(500).json({ error: 'Servico de e-mail nao configurado no servidor.' });
    }
    return res.status(500).json({ error: 'Erro ao solicitar recuperacao de senha.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const validation = validateResetPasswordPayload(req.body || {});
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }
    const { token, password } = validation.value;

    const tokenHash = hashResetToken(token);
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token de recuperacao invalido ou expirado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
      },
    });

    return res.json({ message: 'Senha redefinida com sucesso.' });
  } catch {
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
});

app.use('/api', async (req, res, next) => {
  const exemptPrefixes = ['/auth/', '/billing/', '/ops/health', '/public/', '/tenantsSettings'];
  if (exemptPrefixes.some((prefix) => req.path.startsWith(prefix))) return next();

  const payload = getTokenPayload(req);
  if (!payload) return next();

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { billingRequired: true, stripeSubscriptionStatus: true },
    });
    if (!tenant) return next();
    if (canTenantAccessApp(tenant)) return next();
    return res.status(402).json({
      error: 'Assinatura do plano Starter ou Pro obrigatoria para acessar este recurso.',
      code: 'BILLING_REQUIRED',
    });
  } catch (error) {
    await reportBackendError({
      scope: 'billing.access_guard',
      error,
      severity: 'error',
      meta: {
        path: req.path,
        method: req.method,
        tenantId: payload.tenantId,
      },
    });

    return res.status(500).json({ error: 'Erro ao validar acesso por assinatura.' });
  }
});

// ─── ENDPOINTS PÚBLICOS (sem auth) ────────────────────────────────────────────
// FIX [CRÍTICO]: Endpoints dedicados para revisão pública — usam publicToken do Post
// Não exigem autenticação, mas são identificados pelo token único do post

app.get('/api/public/:publicToken', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { publicToken: req.params.publicToken },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
        tasks: { orderBy: { createdAt: 'asc' } },
        tenant: {
          select: { name: true, logoUrl: true, themeColor: true },
        },
      },
    });
    if (!post) return res.status(404).json({ error: 'Link de revisao invalido ou expirado.' });

    // Retorna apenas campos necessários para o cliente — sem tenantId, audit trail, hashes internos
    const { tenantId: _tid, currentVersionHash: _vh, ...safePost } = post as any;
    res.json(safePost);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar revisao.' });
  }
});

app.patch('/api/public/:publicToken/status', async (req, res) => {
  try {
    const { status, actorName } = req.body;
    const normalizedStatus = String(status || '').trim().toUpperCase();
    if (!['APPROVED', 'ADJUSTMENT', 'PENDING'].includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Status invalido.' });
    }

    const post = await prisma.post.findUnique({
      where: { publicToken: req.params.publicToken },
    });
    if (!post) return res.status(404).json({ error: 'Link de revisao invalido.' });

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: { status: normalizedStatus },
    });

    await prisma.approvalEvent.create({
      data: {
        postId: post.id,
        actorName: normalizeText(actorName) || 'Cliente',
        action: normalizedStatus,
        postVersion: post.version,
        versionHash: post.currentVersionHash,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        meta: { source: 'api/public/:publicToken/status', publicReview: true },
      },
    });

    emitTenantDashboardUpdate(post.tenantId, 'post_status_updated');
    res.json({ status: updated.status });
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

app.post('/api/public/:publicToken/comments', async (req, res) => {
  try {
    const { text, author } = req.body;
    if (!author || !String(author).trim()) {
      return res.status(400).json({ error: 'Nome do aprovador e obrigatorio' });
    }
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Comentario obrigatorio' });
    }

    const post = await prisma.post.findUnique({
      where: { publicToken: req.params.publicToken },
    });
    if (!post) return res.status(404).json({ error: 'Link de revisao invalido.' });

    const normalizedText = String(text).trim().slice(0, 5000);
    const normalizedAuthor = String(author).trim().slice(0, 80);

    const comment = await prisma.comment.create({
      data: { text: normalizedText, author: normalizedAuthor, postId: post.id, actionType: 'COMMENT' },
    });

    const checklist = extractChecklistItems(normalizedText);
    if (checklist.length > 0) {
      await prisma.taskItem.createMany({
        data: checklist.map((title) => ({
          postId: post.id,
          title,
          sourceCommentId: comment.id,
        })),
      });
    }

    await prisma.approvalEvent.create({
      data: {
        postId: post.id,
        actorName: normalizedAuthor,
        action: 'COMMENT',
        postVersion: post.version,
        versionHash: post.currentVersionHash,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        meta: { source: 'api/public/:publicToken/comments', publicReview: true },
      },
    });

    emitTenantDashboardUpdate(post.tenantId, 'post_comment_created');
    return res.status(201).json(comment);
  } catch {
    return res.status(500).json({ error: 'Erro ao registrar comentario.' });
  }
});

// ─── ENDPOINTS AUTENTICADOS ────────────────────────────────────────────────────

app.post('/api/ai/improve-copy', async (req, res) => {
  const auth = await resolveCurrentTenantFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Nao autorizado' });
  if (!hasProAccess(auth.tenant)) {
    return res.status(403).json({ error: 'Recurso disponivel apenas no plano Pro.' });
  }

  const { caption, tone } = req.body;
  if (!caption) return res.status(400).json({ error: 'Texto original e obrigatorio' });

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('sua-chave')) {
    await new Promise((r) => setTimeout(r, 1200));
    const simulacao = `Texto otimizado para tom [${tone || 'neutro'}]. Defina OPENAI_API_KEY para usar IA real.`;
    return res.json({ improvedCopy: simulacao });
  }

  try {
    const openai = new OpenAI();
    let systemPrompt = 'Voce e um redator publicitario experiente. Melhore a legenda para redes sociais.';
    if (tone === 'persuasive') systemPrompt += ' Use gatilhos mentais e seja persuasivo.';
    if (tone === 'formal') systemPrompt += ' Seja formal e profissional.';
    if (tone === 'short') systemPrompt += ' Seja curto e direto.';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: caption },
      ],
      temperature: 0.7,
    });

    res.json({ improvedCopy: response.choices[0].message.content });
  } catch {
    res.status(500).json({ error: 'Erro ao gerar texto com IA' });
  }
});

app.post('/api/uploads/signed-url', async (req, res) => {
  try {
    const payload = requireAuthPayload(req, res);
    if (!payload) return;
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase Storage nao configurado no servidor.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { id: true, plan: true, isPro: true },
    });
    if (!tenant) return res.status(404).json({ error: 'Agencia nao encontrada.' });

    const fileName = sanitizeFileName(req.body?.fileName);
    const mimeType = normalizeText(req.body?.contentType).toLowerCase();
    const mediaType = normalizeMediaType(req.body?.mediaType);
    const size = Number(req.body?.size || 0);

    if (!mimeType || !isAllowedMediaMime(mimeType, mediaType)) {
      return res.status(400).json({ error: 'Formato de arquivo nao permitido.' });
    }
    if (!Number.isFinite(size) || size <= 0) {
      return res.status(400).json({ error: 'Tamanho do arquivo invalido.' });
    }

    const maxBytes = getMediaSizeLimit(mediaType);
    if (size > maxBytes) {
      const maxMb = Math.floor(maxBytes / 1024 / 1024);
      return res.status(400).json({ error: `Arquivo muito grande. Maximo: ${maxMb}MB.` });
    }

    if (mediaType === 'VIDEO' && !hasProAccess(tenant)) {
      return res.status(403).json({ error: 'Upload de video esta disponivel apenas no plano Pro.' });
    }

    const path = `${payload.tenantId}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token) {
      throw error || new Error('SIGNED_UPLOAD_URL_FAILED');
    }

    const publicUrl = supabaseAdmin.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
    return res.json({
      bucket: SUPABASE_STORAGE_BUCKET,
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl,
      mediaType,
      mediaName: fileName,
      mediaSize: size,
      mediaMimeType: mimeType,
    });
  } catch (error) {
    await reportBackendError({
      scope: 'uploads.signed_url',
      error,
      meta: { tenantId: getTokenPayload(req)?.tenantId || '' },
    });
    return res.status(500).json({ error: 'Erro ao preparar upload de midia.' });
  }
});

app.get('/api/tenantsSettings', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const tenant = await prisma.tenant.findUnique({ where: { id: payload.tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Agencia nao encontrada' });
    const plan = normalizeTenantPlan((tenant as any).plan, tenant.isPro);
    const hasActiveSubscription = isSubscriptionActiveStatus(tenant.stripeSubscriptionStatus);
    // FIX [ALTO]: Não expor IDs internos do Stripe ao frontend
    res.json({
      id: tenant.id,
      name: tenant.name,
      logoUrl: tenant.logoUrl,
      themeColor: tenant.themeColor,
      customDomain: tenant.customDomain,
      billingRequired: tenant.billingRequired,
      stripeSubscriptionStatus: tenant.stripeSubscriptionStatus,
      stripeCurrentPeriodEnd: tenant.stripeCurrentPeriodEnd,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      plan,
      isPro: plan === 'PRO',
      hasActiveSubscription,
      canAccessApp: canTenantAccessApp(tenant),
    });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar configuracoes da agencia' });
  }
});

app.patch('/api/tenantsSettings', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const { logoUrl, themeColor, customDomain, name } = req.body;
    const tenant = await prisma.tenant.findUnique({ where: { id: payload.tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Agencia nao encontrada' });

    if (typeof customDomain === 'string' && customDomain.trim() && !hasProAccess(tenant)) {
      return res.status(403).json({ error: 'Dominio personalizado disponivel apenas no plano Pro' });
    }

    const data: any = {};
    if (typeof logoUrl === 'string') data.logoUrl = logoUrl;
    if (typeof themeColor === 'string') data.themeColor = themeColor;
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (hasProAccess(tenant) && typeof customDomain === 'string') {
      data.customDomain = customDomain.trim();
    }

    const updated = await prisma.tenant.update({
      where: { id: payload.tenantId },
      data,
    });
    emitTenantDashboardUpdate(updated.id, 'tenant_settings_updated');
    const plan = normalizeTenantPlan((updated as any).plan, updated.isPro);
    const hasActiveSubscription = isSubscriptionActiveStatus(updated.stripeSubscriptionStatus);
    res.json({
      id: updated.id,
      name: updated.name,
      logoUrl: updated.logoUrl,
      themeColor: updated.themeColor,
      customDomain: updated.customDomain,
      billingRequired: updated.billingRequired,
      stripeSubscriptionStatus: updated.stripeSubscriptionStatus,
      stripeCurrentPeriodEnd: updated.stripeCurrentPeriodEnd,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      plan,
      isPro: plan === 'PRO',
      hasActiveSubscription,
      canAccessApp: canTenantAccessApp(updated),
    });
  } catch (error) {
    await reportBackendError({
      scope: 'tenant.settings_update',
      error,
      meta: { tenantId: getTokenPayload(req)?.tenantId || '' },
    });
    res.status(500).json({ error: 'Erro ao atualizar configuracoes da agencia' });
  }
});

app.post('/api/tenantsSettings/domain/verify', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { id: true, plan: true, isPro: true, customDomain: true },
    });
    if (!tenant) return res.status(404).json({ error: 'Agencia nao encontrada' });
    if (!hasProAccess(tenant)) return res.status(403).json({ error: 'Dominio personalizado disponivel apenas no plano Pro' });

    const rawDomain = typeof req.body?.customDomain === 'string' && req.body.customDomain.trim()
      ? req.body.customDomain.trim()
      : tenant.customDomain || '';

    const verification = await verifyDomainCname(rawDomain);
    return res.json({
      domain: normalizeHost(rawDomain),
      ...verification,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return res.status(500).json({ error: 'Erro ao verificar DNS do dominio.' });
  }
});

app.post('/api/billing/checkout-session', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const stripeClient = requireStripe();
    const planInterval = String(req.body?.interval || 'monthly') === 'yearly' ? 'yearly' : 'monthly';
    const requestedPlan = String(req.body?.plan || 'pro').toLowerCase() === 'starter' ? 'starter' : 'pro';
    const priceId = getStripePriceId(requestedPlan, planInterval);

    if (!priceId) {
      const missingPlan = requestedPlan === 'starter' ? 'Starter' : 'Pro';
      return res.status(500).json({ error: `Preco do Stripe nao configurado para o plano ${missingPlan}.` });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
    });
    if (!tenant) {
      return res.status(404).json({ error: 'Agencia nao encontrada.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true },
    });

    const createAndPersistCustomer = async () => {
      const customer = await stripeClient.customers.create({
        name: tenant.name || user?.name || undefined,
        email: user?.email || undefined,
        metadata: {
          tenantId: tenant.id,
        },
      });
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customer.id },
      });
      return customer.id;
    };

    let customerId = tenant.stripeCustomerId || null;
    if (!customerId) {
      customerId = await createAndPersistCustomer();
    } else {
      try {
        await stripeClient.customers.update(customerId, {
          name: tenant.name || user?.name || undefined,
          email: user?.email || undefined,
          metadata: {
            tenantId: tenant.id,
          },
        });
      } catch (error) {
        const stripeCode =
          typeof error === 'object' && error && 'code' in error
            ? String((error as { code?: string }).code || '')
            : '';
        if (stripeCode === 'resource_missing') {
          customerId = await createAndPersistCustomer();
        } else {
          throw error;
        }
      }
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/billing/cancelled`,
      allow_promotion_codes: true,
      metadata: {
        tenantId: tenant.id,
        targetPlan: requestedPlan.toUpperCase(),
      },
      client_reference_id: tenant.id,
    });

    if (!session.url) {
      return res.status(500).json({ error: 'Nao foi possivel iniciar checkout Stripe.' });
    }

    return res.json({ url: session.url });
  } catch (error) {
    await reportBackendError({
      scope: 'billing.checkout_session',
      error,
      meta: { tenantId: getTokenPayload(req)?.tenantId || '' },
    });
    if (error instanceof Error && error.message === 'STRIPE_NOT_CONFIGURED') {
      return res.status(500).json({ error: 'Stripe nao configurado no servidor.' });
    }
    return res.status(500).json({ error: 'Erro ao iniciar checkout da assinatura.' });
  }
});

app.post('/api/billing/portal-session', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const stripeClient = requireStripe();
    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { id: true, name: true, stripeCustomerId: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Agencia nao encontrada.' });
    }

    const createAndPersistCustomer = async () => {
      const customer = await stripeClient.customers.create({
        name: tenant.name || user?.name || undefined,
        email: user?.email || undefined,
        metadata: {
          tenantId: tenant.id,
        },
      });
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customer.id },
      });
      return customer.id;
    };

    let customerId = tenant.stripeCustomerId || null;
    if (!customerId) {
      customerId = await createAndPersistCustomer();
    } else {
      try {
        await stripeClient.customers.update(customerId, {
          name: tenant.name || user?.name || undefined,
          email: user?.email || undefined,
          metadata: {
            tenantId: tenant.id,
          },
        });
      } catch (error) {
        const stripeCode =
          typeof error === 'object' && error && 'code' in error
            ? String((error as { code?: string }).code || '')
            : '';
        if (stripeCode === 'resource_missing') {
          customerId = await createAndPersistCustomer();
        } else {
          throw error;
        }
      }
    }

    const portal = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/settings?billing=portal`,
    });

    return res.json({ url: portal.url });
  } catch (error) {
    await reportBackendError({
      scope: 'billing.portal_session',
      error,
      meta: { tenantId: getTokenPayload(req)?.tenantId || '' },
    });
    if (error instanceof Error && error.message === 'STRIPE_NOT_CONFIGURED') {
      return res.status(500).json({ error: 'Stripe nao configurado no servidor.' });
    }
    return res.status(500).json({ error: 'Erro ao abrir portal de cobranca.' });
  }
});

app.get('/api/billing/status', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: {
        id: true,
        plan: true,
        isPro: true,
        stripeSubscriptionStatus: true,
        stripeCurrentPeriodEnd: true,
        billingRequired: true,
      },
    });
    if (!tenant) return res.status(404).json({ error: 'Agencia nao encontrada.' });

    const normalizedPlan = normalizeTenantPlan(tenant.plan, tenant.isPro);
    const hasActiveSubscription = isSubscriptionActiveStatus(tenant.stripeSubscriptionStatus);

    // FIX [ALTO]: Não retornar IDs internos do Stripe ao frontend
    return res.json({
      tenantId: tenant.id,
      plan: normalizedPlan,
      isPro: normalizedPlan === 'PRO',
      billingRequired: Boolean(tenant.billingRequired),
      hasActiveSubscription,
      canAccessApp: canTenantAccessApp(tenant),
      stripeSubscriptionStatus: tenant.stripeSubscriptionStatus,
      stripeCurrentPeriodEnd: tenant.stripeCurrentPeriodEnd,
    });
  } catch (error) {
    await reportBackendError({
      scope: 'billing.status',
      error,
      meta: { tenantId: getTokenPayload(req)?.tenantId || '' },
    });
    return res.status(500).json({ error: 'Erro ao consultar status de assinatura.' });
  }
});

app.get('/api/posts', async (req, res) => {
  const payload = requireAuthPayload(req, res);
  if (!payload) return;

  try {
    const posts = await prisma.post.findMany({
      where: { tenantId: payload.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
        tasks: { orderBy: { createdAt: 'asc' } },
        approvalEvents: { orderBy: { createdAt: 'desc' } },
      },
    });
    res.json(posts);
  } catch (err) {
    console.error('[GET /api/posts] Prisma error:', err);
    res.status(500).json({ error: 'Erro ao buscar projetos.' });
  }
});

app.post('/api/posts', async (req, res) => {
  const payload = requireAuthPayload(req, res);
  if (!payload) return;

  const { title, channel, caption, imageUrl, clientName, slaHours } = req.body;
  const mediaType = normalizeMediaType(req.body?.mediaType);
  const mediaName = normalizeText(req.body?.mediaName) || null;
  const mediaMimeType = normalizeText(req.body?.mediaMimeType) || null;
  const mediaSize = Number.isFinite(Number(req.body?.mediaSize)) ? Math.max(0, Math.round(Number(req.body.mediaSize))) : null;
  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: { plan: true, isPro: true },
  });
  if (mediaType === 'VIDEO' && !hasProAccess(tenant)) {
    return res.status(403).json({ error: 'Projetos de video estao disponiveis apenas no plano Pro.' });
  }
  if (!clientName || !String(clientName).trim()) {
    return res.status(400).json({ error: 'Nome do cliente obrigatorio' });
  }
  if (!normalizeText(title)) return res.status(400).json({ error: 'Titulo obrigatorio.' });
  if (!normalizeText(channel)) return res.status(400).json({ error: 'Canal obrigatorio.' });
  if (!normalizeText(imageUrl)) return res.status(400).json({ error: 'Midia obrigatoria.' });

  const normalizedSlaHours = Number.isFinite(Number(slaHours)) ? Math.max(1, Number(slaHours)) : 48;
  const dueAt = new Date(Date.now() + normalizedSlaHours * 60 * 60 * 1000);
  const versionHash = buildPostVersionHash({ title, channel, caption, imageUrl, clientName, tenantId: payload.tenantId });

  const post = await prisma.post.create({
    data: {
      title: normalizeText(title),
      channel: normalizeText(channel),
      caption: normalizeText(caption),
      imageUrl: normalizeText(imageUrl),
      mediaType,
      mediaName,
      mediaSize,
      mediaMimeType,
      clientName: String(clientName).trim(),
      tenantId: payload.tenantId,
      slaHours: normalizedSlaHours,
      dueAt,
      version: 1,
      currentVersionHash: versionHash,
      approvalEvents: {
        create: {
          actorName: 'Agency',
          action: 'CREATED',
          postVersion: 1,
          versionHash,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || 'unknown',
          meta: { source: 'api/posts:create' },
        },
      },
    },
    include: {
      comments: true,
      tasks: true,
      approvalEvents: true,
    },
  });

  emitTenantDashboardUpdate(post.tenantId, 'post_created');
  res.status(201).json(post);
});

// FIX [CRÍTICO]: GET /api/posts/:id agora exige autenticação e verifica tenant
app.get('/api/posts/:id', async (req, res) => {
  try {
    const payload = requireAuthPayload(req, res);
    if (!payload) return;

    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
        tasks: { orderBy: { createdAt: 'asc' } },
        approvalEvents: { orderBy: { createdAt: 'desc' } },
        tenant: {
          select: { name: true, logoUrl: true, themeColor: true, customDomain: true, isPro: true, plan: true },
        },
      },
    });
    if (!post) return res.status(404).json({ error: 'Post nao encontrado' });
    if (post.tenantId !== payload.tenantId) {
      return res.status(403).json({ error: 'Sem permissao para acessar este projeto.' });
    }
    res.json(post);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar post' });
  }
});

app.get('/api/posts/:id/audit', async (req, res) => {
  try {
    const payload = requireAuthPayload(req, res);
    if (!payload) return;

    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: { tenantId: true },
    });
    if (!post) return res.status(404).json({ error: 'Post nao encontrado' });
    if (post.tenantId !== payload.tenantId) {
      return res.status(403).json({ error: 'Sem permissao para acessar esta trilha.' });
    }

    const events = await prisma.approvalEvent.findMany({
      where: { postId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar trilha de aprovacao' });
  }
});

app.patch('/api/posts/:id', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post nao encontrado' });
    if (post.tenantId !== payload.tenantId) {
      return res.status(403).json({ error: 'Sem permissao para editar este projeto.' });
    }
    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { plan: true, isPro: true },
    });

    const title = normalizeText(req.body?.title);
    const channel = normalizeText(req.body?.channel);
    const caption = normalizeText(req.body?.caption);
    const clientName = normalizeText(req.body?.clientName);
    const incomingImageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
    const imageUrl = incomingImageUrl || post.imageUrl;
    const mediaType = normalizeMediaType(req.body?.mediaType || (post as any).mediaType);
    const mediaName = normalizeText(req.body?.mediaName) || (post as any).mediaName || null;
    const mediaMimeType = normalizeText(req.body?.mediaMimeType) || (post as any).mediaMimeType || null;
    const mediaSize = Number.isFinite(Number(req.body?.mediaSize))
      ? Math.max(0, Math.round(Number(req.body.mediaSize)))
      : ((post as any).mediaSize ?? null);
    if (mediaType === 'VIDEO' && !hasProAccess(tenant)) {
      return res.status(403).json({ error: 'Projetos de video estao disponiveis apenas no plano Pro.' });
    }
    const actorName = normalizeText(req.body?.actorName) || 'Agency';

    if (!title) return res.status(400).json({ error: 'Titulo obrigatorio.' });
    if (!channel) return res.status(400).json({ error: 'Canal obrigatorio.' });
    if (!caption) return res.status(400).json({ error: 'Legenda obrigatoria.' });
    if (!clientName) return res.status(400).json({ error: 'Nome do cliente obrigatorio.' });
    if (!imageUrl) return res.status(400).json({ error: 'Midia obrigatoria.' });

    const normalizedSlaHours = Number.isFinite(Number(req.body?.slaHours))
      ? Math.max(1, Number(req.body.slaHours))
      : post.slaHours || 48;

    const hasContentChange =
      post.title !== title ||
      post.channel !== channel ||
      String(post.caption || '') !== caption ||
      String(post.clientName || '') !== clientName ||
      post.imageUrl !== imageUrl ||
      String((post as any).mediaType || 'IMAGE') !== mediaType ||
      String((post as any).mediaName || '') !== String(mediaName || '') ||
      String((post as any).mediaMimeType || '') !== String(mediaMimeType || '') ||
      Number((post as any).mediaSize || 0) !== Number(mediaSize || 0) ||
      Number(post.slaHours || 48) !== normalizedSlaHours;

    const nextVersion = hasContentChange ? post.version + 1 : post.version;
    const versionHash = buildPostVersionHash({
      title,
      channel,
      caption,
      imageUrl,
      clientName,
      tenantId: post.tenantId,
    });
    const dueAt = new Date(Date.now() + normalizedSlaHours * 60 * 60 * 1000);

    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: {
        title,
        channel,
        caption,
        clientName,
        imageUrl,
        mediaType,
        mediaName,
        mediaSize,
        mediaMimeType,
        slaHours: normalizedSlaHours,
        dueAt,
        status: hasContentChange ? 'PENDING' : post.status,
        version: nextVersion,
        currentVersionHash: versionHash,
        publishedAt: hasContentChange ? null : post.publishedAt,
      },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
        tasks: { orderBy: { createdAt: 'asc' } },
        approvalEvents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (hasContentChange) {
      await prisma.approvalEvent.create({
        data: {
          postId: post.id,
          actorName,
          action: 'EDITED',
          postVersion: nextVersion,
          versionHash,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || 'unknown',
          meta: { source: 'api/posts/:id:edit' },
        },
      });
    }

    emitTenantDashboardUpdate(post.tenantId, hasContentChange ? 'post_edited' : 'post_metadata_updated');
    return res.json(updatedPost);
  } catch {
    return res.status(500).json({ error: 'Erro ao editar projeto.' });
  }
});

// FIX [CRÍTICO]: PATCH /api/posts/:id/status agora exige autenticação — clientes usam /api/public/:token/status
app.patch('/api/posts/:id/status', async (req, res) => {
  try {
    const payload = requireAuthPayload(req, res);
    if (!payload) return;

    const { status, actorName } = req.body;
    const normalizedStatus = String(status || '').trim().toUpperCase();
    if (!['PENDING', 'APPROVED', 'ADJUSTMENT'].includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Status invalido.' });
    }

    const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Post nao encontrado' });
    if (existing.tenantId !== payload.tenantId) {
      return res.status(403).json({ error: 'Sem permissao para alterar este projeto.' });
    }

    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: { status: normalizedStatus },
    });

    await prisma.approvalEvent.create({
      data: {
        postId: post.id,
        actorName: normalizeText(actorName) || 'Agency',
        action: normalizedStatus,
        postVersion: post.version,
        versionHash: post.currentVersionHash,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        meta: { source: 'api/posts/:id/status', publicReview: false },
      },
    });

    emitTenantDashboardUpdate(post.tenantId, 'post_status_updated');
    res.json(post);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

app.post('/api/posts/:id/publish', async (req, res) => {
  const payload = requireAuthPayload(req, res);
  if (!payload) return;

  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Post nao encontrado' });
  if (post.tenantId !== payload.tenantId) {
    return res.status(403).json({ error: 'Sem permissao para publicar este projeto.' });
  }
  if (post.status !== 'APPROVED') {
    return res.status(409).json({ error: 'So e permitido publicar post aprovado' });
  }

  const published = await prisma.post.update({
    where: { id: post.id },
    data: { publishedAt: new Date() },
  });

  await prisma.approvalEvent.create({
    data: {
      postId: post.id,
      actorName: 'Agency',
      action: 'PUBLISHED',
      postVersion: post.version,
      versionHash: post.currentVersionHash,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      meta: { source: 'api/posts/:id/publish' },
    },
  });

  emitTenantDashboardUpdate(post.tenantId, 'post_published');
  res.json(published);
});

app.delete('/api/posts/:id', async (req, res) => {
  const payload = requireAuthPayload(req, res);
  if (!payload) return;

  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    select: { tenantId: true },
  });
  if (!post) return res.status(404).json({ error: 'Post nao encontrado' });
  if (post.tenantId !== payload.tenantId) {
    return res.status(403).json({ error: 'Sem permissao para excluir este projeto.' });
  }

  const deleted = await prisma.post.delete({ where: { id: req.params.id } });
  emitTenantDashboardUpdate(deleted.tenantId, 'post_deleted');
  res.status(204).send();
});

app.post('/api/posts/:id/comments', async (req, res) => {
  const payload = requireAuthPayload(req, res);
  if (!payload) return;

  const { text, author, action } = req.body;
  if (!author || !String(author).trim()) {
    return res.status(400).json({ error: 'Nome do aprovador e obrigatorio' });
  }
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Comentario obrigatorio' });
  }

  const normalizedText = String(text).trim().slice(0, 5000);
  const normalizedAuthor = String(author).trim().slice(0, 80);
  const normalizedAction = String(action || 'comment').trim().toUpperCase();
  if (!['COMMENT', 'APPROVED', 'ADJUSTMENT', 'CHANGES_REQUESTED'].includes(normalizedAction)) {
    return res.status(400).json({ error: 'Acao invalida.' });
  }

  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Post nao encontrado' });
  if (post.tenantId !== payload.tenantId) {
    return res.status(403).json({ error: 'Sem permissao para comentar neste projeto.' });
  }

  const comment = await prisma.comment.create({
    data: { text: normalizedText, author: normalizedAuthor, postId: req.params.id, actionType: normalizedAction },
  });

  const checklist = extractChecklistItems(normalizedText);
  if (checklist.length > 0) {
    await prisma.taskItem.createMany({
      data: checklist.map((title) => ({
        postId: req.params.id,
        title,
        sourceCommentId: comment.id,
      })),
    });
  }

  await prisma.approvalEvent.create({
    data: {
      postId: req.params.id,
      actorName: normalizedAuthor,
      action: 'COMMENT',
      postVersion: post.version,
      versionHash: post.currentVersionHash,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      meta: { source: 'api/posts/:id/comments', commentId: comment.id },
    },
  });

  emitTenantDashboardUpdate(post.tenantId, 'post_comment_created');
  res.status(201).json(comment);
});

app.patch('/api/tasks/:id', async (req, res) => {
  const payload = requireAuthPayload(req, res);
  if (!payload) return;

  const { done } = req.body;
  const existing = await prisma.taskItem.findUnique({
    where: { id: req.params.id },
    include: { post: { select: { tenantId: true } } },
  });
  if (!existing) return res.status(404).json({ error: 'Tarefa nao encontrada' });
  if (existing.post?.tenantId !== payload.tenantId) {
    return res.status(403).json({ error: 'Sem permissao para alterar esta tarefa.' });
  }

  const task = await prisma.taskItem.update({
    where: { id: req.params.id },
    data: { done: Boolean(done) },
    include: {
      post: {
        select: { tenantId: true },
      },
    },
  });
  emitTenantDashboardUpdate(task.post?.tenantId, 'task_updated');
  res.json({
    id: task.id,
    title: task.title,
    done: task.done,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    postId: task.postId,
  });
});

app.get('/api/sla/alerts', async (req, res) => {
  const payload = getTokenPayload(req);
  if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

  const now = new Date();
  const overdue = await prisma.post.findMany({
    where: {
      tenantId: payload.tenantId,
      status: { in: ['PENDING', 'ADJUSTMENT'] },
      dueAt: { not: null, lt: now },
      publishedAt: null,
    },
    orderBy: { dueAt: 'asc' },
    select: {
      id: true,
      title: true,
      clientName: true,
      dueAt: true,
      status: true,
    },
  });

  res.json({ alerts: overdue, total: overdue.length });
});

app.get('/api/approval-events/recent', async (req, res) => {
  const payload = getTokenPayload(req);
  if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

  const parsedLimit = Number(req.query.limit || 20);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 20;

  const events = await prisma.approvalEvent.findMany({
    where: {
      post: {
        tenantId: payload.tenantId,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      post: {
        select: {
          id: true,
          title: true,
          clientName: true,
          channel: true,
        },
      },
    },
  });

  res.json({
    events: events.map((event) => ({
      id: event.id,
      action: event.action,
      actorName: event.actorName,
      createdAt: event.createdAt,
      postVersion: event.postVersion,
      versionHash: event.versionHash,
      postId: event.postId,
      postTitle: event.post?.title || 'Sem titulo',
      clientName: event.post?.clientName || '',
      channel: event.post?.channel || '',
    })),
    total: events.length,
  });
});

async function dispatchSlaReminders() {
  const now = new Date();
  const threshold = new Date(now.getTime() - 60 * 60 * 1000);
  const overdue = await prisma.post.findMany({
    where: {
      status: { in: ['PENDING', 'ADJUSTMENT'] },
      publishedAt: null,
      dueAt: { not: null, lt: now },
      OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: threshold } }],
    },
    select: { id: true, tenantId: true, version: true, currentVersionHash: true },
    take: 100,
  });

  for (const post of overdue) {
    await prisma.post.update({
      where: { id: post.id },
      data: { lastReminderAt: now },
    });

    await prisma.approvalEvent.create({
      data: {
        postId: post.id,
        actorName: 'System',
        action: 'SLA_REMINDER_TRIGGERED',
        postVersion: post.version,
        versionHash: post.currentVersionHash,
        ipAddress: 'system',
        userAgent: 'scheduler',
        meta: { source: 'sla-dispatcher', timestamp: now.toISOString() },
      },
    });
    emitTenantDashboardUpdate(post.tenantId, 'sla_reminder_triggered');
  }
}

const PORT = Number(process.env.PORT || 3000);
httpServer.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

setInterval(() => {
  dispatchSlaReminders().catch((error) => {
    void reportBackendError({
      scope: 'jobs.sla_reminders',
      error,
      severity: 'warning',
    });
  });
}, 5 * 60 * 1000);

process.on('unhandledRejection', (reason) => {
  void reportBackendError({
    scope: 'process.unhandled_rejection',
    error: reason,
    severity: 'critical',
  });
});

process.on('uncaughtException', (error) => {
  void reportBackendError({
    scope: 'process.uncaught_exception',
    error,
    severity: 'critical',
  });
});
