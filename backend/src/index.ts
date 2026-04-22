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
import { prisma } from './prisma';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const DEV_JWT_SECRET = 'aprovaflow_super_secret_dev_key';
const JWT_SECRET = process.env.JWT_SECRET || (!IS_PRODUCTION ? DEV_JWT_SECRET : '');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET obrigatorio em producao.');
}

const frontendUrlFromEnv = String(process.env.FRONTEND_URL || '').trim();
if (IS_PRODUCTION && !frontendUrlFromEnv) {
  throw new Error('FRONTEND_URL obrigatorio em producao.');
}
const FRONTEND_URL = frontendUrlFromEnv || 'http://localhost:5173';
const STRIPE_SECRET_KEY = String(process.env.STRIPE_SECRET_KEY || '').trim();
const STRIPE_WEBHOOK_SECRET = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const STRIPE_PRICE_PRO_MONTHLY = String(process.env.STRIPE_PRICE_PRO_MONTHLY || '').trim();
const STRIPE_PRICE_PRO_YEARLY = String(process.env.STRIPE_PRICE_PRO_YEARLY || '').trim();
const CUSTOM_DOMAIN_CNAME_TARGET = String(process.env.CUSTOM_DOMAIN_CNAME_TARGET || 'lb.aprovaflow.com').trim().toLowerCase();
const OPS_ALERT_WEBHOOK_URL = String(process.env.OPS_ALERT_WEBHOOK_URL || '').trim();
const BOOTED_AT = new Date();

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })
  : null;

function requireStripe() {
  if (!stripe) throw new Error('STRIPE_NOT_CONFIGURED');
  return stripe;
}

function getStripeProPriceId(interval: 'monthly' | 'yearly' = 'monthly') {
  if (interval === 'yearly' && STRIPE_PRICE_PRO_YEARLY) return STRIPE_PRICE_PRO_YEARLY;
  return STRIPE_PRICE_PRO_MONTHLY;
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
const allowedOriginHosts = allowedOrigins
  .map((origin) => {
    try {
      return new URL(origin).hostname.toLowerCase();
    } catch {
      return '';
    }
  })
  .filter(Boolean);

const isOriginAllowed = (origin?: string) => {
  // Requests sem origin (health checks, backend-to-backend, curl) devem passar.
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const incomingHost = new URL(origin).hostname.toLowerCase();
    const hasVercelHostConfigured = allowedOriginHosts.some((host) => host.endsWith('.vercel.app'));
    if (hasVercelHostConfigured && incomingHost.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    return false;
  }

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
    stack: errorInfo.stack,
    meta: params.meta || {},
    ts: new Date().toISOString(),
    env: NODE_ENV,
  };
  console.error('[backend-error]', JSON.stringify(payload));

  // Alerta proativo focado em billing/webhook e falhas criticas.
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
app.use(cors(corsOptions));

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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

    const markTenantSubscription = async (params: {
      tenantId: string;
      isPro: boolean;
      customerId?: string | null;
      subscriptionId?: string | null;
      status?: string | null;
      priceId?: string | null;
      currentPeriodEnd?: Date | null;
    }) => {
      const data: any = {
        isPro: params.isPro,
        plan: params.isPro ? 'PRO' : 'STARTER',
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
            isPro: true,
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
            isPro: true,
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
        const isPro = subscription.status === 'active' || subscription.status === 'trialing';
        await markTenantSubscription({
          tenantId,
          isPro,
          customerId: typeof subscription.customer === 'string' ? subscription.customer : null,
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId: subscription.items?.data?.[0]?.price?.id || null,
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

app.use(express.json());
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

function getTokenPayload(req: express.Request): JwtPayload | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
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

io.use((socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token as string | undefined;
    const bearerToken = typeof authToken === 'string' && authToken.startsWith('Bearer ')
      ? authToken.slice(7)
      : authToken;
    const queryTenantId = String(socket.handshake.query.tenantId || '');

    if (bearerToken) {
      const payload = jwt.verify(bearerToken, JWT_SECRET) as JwtPayload;
      socket.data.tenantId = payload.tenantId;
      return next();
    }

    if (queryTenantId) {
      socket.data.tenantId = queryTenantId;
      return next();
    }

    return next();
  } catch {
    return next(new Error('socket auth failed'));
  }
});

io.on('connection', (socket) => {
  const tenantId = String(socket.data?.tenantId || socket.handshake.query.tenantId || '');
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
  if (!password || password.length < 6) {
    return { ok: false, error: 'A senha precisa ter no minimo 6 caracteres.' } as const;
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

function extractChecklistItems(text: string): string[] {
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
  });
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

    const tenant = await prisma.tenant.create({ data: { name: agencyName } });
    const user = await prisma.user.create({
      data: { name, email, passwordHash, tenantId: tenant.id },
    });

    const token = jwt.sign({ userId: user.id, tenantId: tenant.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
      tenantId: tenant.id,
    });
  } catch {
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

    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '7d' });
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

    res.json({ user: { id: user.id, name: user.name, email: user.email }, tenantId: user.tenantId });
  } catch {
    return res.status(401).json({ error: 'Token invalido' });
  }
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
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h

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

app.get('/api/tenantsSettings', async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) return res.status(401).json({ error: 'Nao autorizado' });

    const tenant = await prisma.tenant.findUnique({ where: { id: payload.tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Agencia nao encontrada' });
    const plan = normalizeTenantPlan((tenant as any).plan, tenant.isPro);
    res.json({ ...tenant, plan, isPro: plan === 'PRO' });
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
    res.json({ ...updated, plan, isPro: plan === 'PRO' });
  } catch (e) {
    console.error('ERRO NO PATCH TENANT:', e);
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
    const priceId = getStripeProPriceId(planInterval);

    if (!priceId) {
      return res.status(500).json({ error: 'Preco do Stripe nao configurado para o plano Pro.' });
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
    return res.status(500).json({ error: 'Erro ao iniciar checkout do plano Pro.' });
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
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripeSubscriptionStatus: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
      },
    });
    if (!tenant) return res.status(404).json({ error: 'Agencia nao encontrada.' });

    const normalizedPlan = normalizeTenantPlan(tenant.plan, tenant.isPro);
    return res.json({
      tenantId: tenant.id,
      plan: normalizedPlan,
      isPro: normalizedPlan === 'PRO',
      stripeCustomerId: tenant.stripeCustomerId,
      stripeSubscriptionId: tenant.stripeSubscriptionId,
      stripeSubscriptionStatus: tenant.stripeSubscriptionStatus,
      stripePriceId: tenant.stripePriceId,
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
  let tenantId = String(req.query.tenantId || '');

  if (!tenantId) {
    const payload = getTokenPayload(req);
    tenantId = payload?.tenantId || '';
  }

  if (!tenantId) return res.status(400).json({ error: 'tenantId obrigatorio' });

  const exists = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!exists) {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Agencia Teste (MVP)' } });
  }

  const posts = await prisma.post.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      comments: { orderBy: { createdAt: 'asc' } },
      tasks: { orderBy: { createdAt: 'asc' } },
      approvalEvents: { orderBy: { createdAt: 'desc' } },
    },
  });
  res.json(posts);
});

app.post('/api/posts', async (req, res) => {
  const { title, channel, caption, imageUrl, tenantId, clientName, slaHours } = req.body;
  if (!tenantId) return res.status(400).json({ error: 'tenantId obrigatorio' });
  if (!clientName || !String(clientName).trim()) {
    return res.status(400).json({ error: 'Nome do cliente obrigatorio' });
  }

  const normalizedSlaHours = Number.isFinite(Number(slaHours)) ? Math.max(1, Number(slaHours)) : 48;
  const dueAt = new Date(Date.now() + normalizedSlaHours * 60 * 60 * 1000);
  const versionHash = buildPostVersionHash({ title, channel, caption, imageUrl, clientName, tenantId });

  const post = await prisma.post.create({
    data: {
      title,
      channel,
      caption,
      imageUrl,
      clientName: String(clientName).trim(),
      tenantId,
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

app.get('/api/posts/:id', async (req, res) => {
  try {
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
    res.json(post);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar post' });
  }
});

app.get('/api/posts/:id/audit', async (req, res) => {
  try {
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

    const title = normalizeText(req.body?.title);
    const channel = normalizeText(req.body?.channel);
    const caption = normalizeText(req.body?.caption);
    const clientName = normalizeText(req.body?.clientName);
    const incomingImageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
    const imageUrl = incomingImageUrl || post.imageUrl;
    const actorName = normalizeText(req.body?.actorName) || 'Agency';

    if (!title) return res.status(400).json({ error: 'Titulo obrigatorio.' });
    if (!channel) return res.status(400).json({ error: 'Canal obrigatorio.' });
    if (!caption) return res.status(400).json({ error: 'Legenda obrigatoria.' });
    if (!clientName) return res.status(400).json({ error: 'Nome do cliente obrigatorio.' });
    if (!imageUrl) return res.status(400).json({ error: 'Imagem obrigatoria.' });

    const normalizedSlaHours = Number.isFinite(Number(req.body?.slaHours))
      ? Math.max(1, Number(req.body.slaHours))
      : post.slaHours || 48;

    const hasContentChange =
      post.title !== title ||
      post.channel !== channel ||
      String(post.caption || '') !== caption ||
      String(post.clientName || '') !== clientName ||
      post.imageUrl !== imageUrl ||
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

app.patch('/api/posts/:id/status', async (req, res) => {
  const { status, actorName } = req.body;
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status },
  });

  await prisma.approvalEvent.create({
    data: {
      postId: post.id,
      actorName: String(actorName || 'Agency'),
      action: status,
      postVersion: post.version,
      versionHash: post.currentVersionHash,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      meta: { source: 'api/posts/:id/status' },
    },
  });

  emitTenantDashboardUpdate(post.tenantId, 'post_status_updated');
  res.json(post);
});

app.post('/api/posts/:id/publish', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Post nao encontrado' });
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
  const deleted = await prisma.post.delete({ where: { id: req.params.id } });
  emitTenantDashboardUpdate(deleted.tenantId, 'post_deleted');
  res.status(204).send();
});

app.post('/api/posts/:id/comments', async (req, res) => {
  const { text, author, action } = req.body;
  if (!author || !String(author).trim()) {
    return res.status(400).json({ error: 'Nome do aprovador e obrigatorio' });
  }
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Comentario obrigatorio' });
  }

  const normalizedText = String(text).trim();
  const normalizedAuthor = String(author).trim();
  const normalizedAction = String(action || 'comment').toUpperCase();

  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Post nao encontrado' });

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
      action: normalizedAction,
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
  const { done } = req.body;
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
