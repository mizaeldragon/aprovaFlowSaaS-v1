"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const openai_1 = __importDefault(require("openai"));
const crypto_1 = __importDefault(require("crypto"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const prisma_1 = require("./prisma");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: true,
        credentials: true,
    },
});
const JWT_SECRET = process.env.JWT_SECRET || 'aprovaflow_super_secret_dev_key';
function emitTenantDashboardUpdate(tenantId, reason = 'updated') {
    if (!tenantId)
        return;
    io.to(`tenant:${tenantId}`).emit('dashboard:update', {
        tenantId,
        reason,
        at: new Date().toISOString(),
    });
}
function getTokenPayload(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return null;
        const token = authHeader.split(' ')[1];
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
io.use((socket, next) => {
    try {
        const authToken = socket.handshake.auth?.token;
        const bearerToken = typeof authToken === 'string' && authToken.startsWith('Bearer ')
            ? authToken.slice(7)
            : authToken;
        const queryTenantId = String(socket.handshake.query.tenantId || '');
        if (bearerToken) {
            const payload = jsonwebtoken_1.default.verify(bearerToken, JWT_SECRET);
            socket.data.tenantId = payload.tenantId;
            return next();
        }
        if (queryTenantId) {
            socket.data.tenantId = queryTenantId;
            return next();
        }
        return next();
    }
    catch {
        return next(new Error('socket auth failed'));
    }
});
io.on('connection', (socket) => {
    const tenantId = String(socket.data?.tenantId || socket.handshake.query.tenantId || '');
    if (tenantId) {
        socket.join(`tenant:${tenantId}`);
    }
});
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string')
        return forwarded.split(',')[0].trim();
    return req.ip || 'unknown';
}
function buildPostVersionHash(input) {
    const raw = JSON.stringify({
        title: input.title || '',
        channel: input.channel || '',
        caption: input.caption || '',
        imageUrl: input.imageUrl || '',
        clientName: input.clientName || '',
        tenantId: input.tenantId || '',
    });
    return crypto_1.default.createHash('sha256').update(raw).digest('hex');
}
function extractChecklistItems(text) {
    const normalized = text
        .replace(/\r/g, '\n')
        .split(/\n|\.\s+|;\s+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 6);
    const dedup = new Set();
    for (const item of normalized) {
        const cleaned = item.replace(/^[-*\d.)\s]+/, '').trim();
        if (cleaned.length >= 6)
            dedup.add(cleaned);
    }
    return Array.from(dedup).slice(0, 10);
}
app.get('/', (req, res) => {
    res.json({ message: 'AprovaFlow SaaS API online!' });
});
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, agencyName } = req.body;
        if (!email || !password || !agencyName) {
            return res.status(400).json({ error: 'Preencha todos os campos obrigatorios' });
        }
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return res.status(400).json({ error: 'Email ja cadastrado' });
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const tenant = await prisma_1.prisma.tenant.create({ data: { name: agencyName } });
        const user = await prisma_1.prisma.user.create({
            data: { name, email, passwordHash, tenantId: tenant.id },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, tenantId: tenant.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email },
            token,
            tenantId: tenant.id,
        });
    }
    catch {
        res.status(500).json({ error: 'Erro ao registrar usuario' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ error: 'Credenciais invalidas' });
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid)
            return res.status(401).json({ error: 'Credenciais invalidas' });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ user: { id: user.id, name: user.name, email: user.email }, token, tenantId: user.tenantId });
    }
    catch {
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
});
app.get('/api/auth/me', async (req, res) => {
    try {
        const payload = getTokenPayload(req);
        if (!payload)
            return res.status(401).json({ error: 'Nao autorizado' });
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(401).json({ error: 'Usuario nao encontrado' });
        res.json({ user: { id: user.id, name: user.name, email: user.email }, tenantId: user.tenantId });
    }
    catch {
        return res.status(401).json({ error: 'Token invalido' });
    }
});
app.post('/api/ai/improve-copy', async (req, res) => {
    const { caption, tone } = req.body;
    if (!caption)
        return res.status(400).json({ error: 'Texto original e obrigatorio' });
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('sua-chave')) {
        await new Promise((r) => setTimeout(r, 1200));
        const simulacao = `Texto otimizado para tom [${tone || 'neutro'}]. Defina OPENAI_API_KEY para usar IA real.`;
        return res.json({ improvedCopy: simulacao });
    }
    try {
        const openai = new openai_1.default();
        let systemPrompt = 'Voce e um redator publicitario experiente. Melhore a legenda para redes sociais.';
        if (tone === 'persuasive')
            systemPrompt += ' Use gatilhos mentais e seja persuasivo.';
        if (tone === 'formal')
            systemPrompt += ' Seja formal e profissional.';
        if (tone === 'short')
            systemPrompt += ' Seja curto e direto.';
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: caption },
            ],
            temperature: 0.7,
        });
        res.json({ improvedCopy: response.choices[0].message.content });
    }
    catch {
        res.status(500).json({ error: 'Erro ao gerar texto com IA' });
    }
});
app.get('/api/tenantsSettings', async (req, res) => {
    try {
        const payload = getTokenPayload(req);
        if (!payload)
            return res.status(401).json({ error: 'Nao autorizado' });
        const tenant = await prisma_1.prisma.tenant.findUnique({ where: { id: payload.tenantId } });
        res.json(tenant);
    }
    catch {
        res.status(500).json({ error: 'Erro ao buscar configuracoes da agencia' });
    }
});
app.patch('/api/tenantsSettings', async (req, res) => {
    try {
        const payload = getTokenPayload(req);
        if (!payload)
            return res.status(401).json({ error: 'Nao autorizado' });
        const { logoUrl, themeColor, customDomain } = req.body;
        const tenant = await prisma_1.prisma.tenant.findUnique({ where: { id: payload.tenantId } });
        if (!tenant)
            return res.status(404).json({ error: 'Agencia nao encontrada' });
        if (typeof customDomain === 'string' && customDomain.trim() && !tenant.isPro) {
            return res.status(403).json({ error: 'Dominio personalizado disponivel apenas no plano Pro' });
        }
        const data = { logoUrl, themeColor };
        if (tenant.isPro && typeof customDomain === 'string') {
            data.customDomain = customDomain.trim();
        }
        const updated = await prisma_1.prisma.tenant.update({
            where: { id: payload.tenantId },
            data,
        });
        emitTenantDashboardUpdate(updated.id, 'tenant_settings_updated');
        res.json(updated);
    }
    catch (e) {
        console.error('ERRO NO PATCH TENANT:', e);
        res.status(500).json({ error: 'Erro ao atualizar configuracoes da agencia' });
    }
});
app.post('/api/billing/upgrade-pro', async (req, res) => {
    try {
        const payload = getTokenPayload(req);
        if (!payload)
            return res.status(401).json({ error: 'Nao autorizado' });
        const updated = await prisma_1.prisma.tenant.update({
            where: { id: payload.tenantId },
            data: { isPro: true },
        });
        emitTenantDashboardUpdate(updated.id, 'billing_upgraded_pro');
        res.json({ message: 'Plano Pro ativado com sucesso', tenant: updated });
    }
    catch {
        res.status(500).json({ error: 'Erro ao ativar plano Pro' });
    }
});
app.get('/api/posts', async (req, res) => {
    let tenantId = String(req.query.tenantId || '');
    if (!tenantId) {
        const payload = getTokenPayload(req);
        tenantId = payload?.tenantId || '';
    }
    if (!tenantId)
        return res.status(400).json({ error: 'tenantId obrigatorio' });
    const exists = await prisma_1.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!exists) {
        await prisma_1.prisma.tenant.create({ data: { id: tenantId, name: 'Agencia Teste (MVP)' } });
    }
    const posts = await prisma_1.prisma.post.findMany({
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
    if (!tenantId)
        return res.status(400).json({ error: 'tenantId obrigatorio' });
    if (!clientName || !String(clientName).trim()) {
        return res.status(400).json({ error: 'Nome do cliente obrigatorio' });
    }
    const normalizedSlaHours = Number.isFinite(Number(slaHours)) ? Math.max(1, Number(slaHours)) : 48;
    const dueAt = new Date(Date.now() + normalizedSlaHours * 60 * 60 * 1000);
    const versionHash = buildPostVersionHash({ title, channel, caption, imageUrl, clientName, tenantId });
    const post = await prisma_1.prisma.post.create({
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
        const post = await prisma_1.prisma.post.findUnique({
            where: { id: req.params.id },
            include: {
                comments: { orderBy: { createdAt: 'asc' } },
                tasks: { orderBy: { createdAt: 'asc' } },
                approvalEvents: { orderBy: { createdAt: 'desc' } },
                tenant: {
                    select: { name: true, logoUrl: true, themeColor: true, customDomain: true, isPro: true },
                },
            },
        });
        if (!post)
            return res.status(404).json({ error: 'Post nao encontrado' });
        res.json(post);
    }
    catch {
        res.status(500).json({ error: 'Erro ao buscar post' });
    }
});
app.get('/api/posts/:id/audit', async (req, res) => {
    try {
        const events = await prisma_1.prisma.approvalEvent.findMany({
            where: { postId: req.params.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json(events);
    }
    catch {
        res.status(500).json({ error: 'Erro ao buscar trilha de aprovacao' });
    }
});
app.patch('/api/posts/:id/status', async (req, res) => {
    const { status, actorName } = req.body;
    const post = await prisma_1.prisma.post.update({
        where: { id: req.params.id },
        data: { status },
    });
    await prisma_1.prisma.approvalEvent.create({
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
    const post = await prisma_1.prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post)
        return res.status(404).json({ error: 'Post nao encontrado' });
    if (post.status !== 'APPROVED') {
        return res.status(409).json({ error: 'So e permitido publicar post aprovado' });
    }
    const published = await prisma_1.prisma.post.update({
        where: { id: post.id },
        data: { publishedAt: new Date() },
    });
    await prisma_1.prisma.approvalEvent.create({
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
    const deleted = await prisma_1.prisma.post.delete({ where: { id: req.params.id } });
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
    const post = await prisma_1.prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post)
        return res.status(404).json({ error: 'Post nao encontrado' });
    const comment = await prisma_1.prisma.comment.create({
        data: { text: normalizedText, author: normalizedAuthor, postId: req.params.id, actionType: normalizedAction },
    });
    const checklist = extractChecklistItems(normalizedText);
    if (checklist.length > 0) {
        await prisma_1.prisma.taskItem.createMany({
            data: checklist.map((title) => ({
                postId: req.params.id,
                title,
                sourceCommentId: comment.id,
            })),
        });
    }
    await prisma_1.prisma.approvalEvent.create({
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
    const task = await prisma_1.prisma.taskItem.update({
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
    if (!payload)
        return res.status(401).json({ error: 'Nao autorizado' });
    const now = new Date();
    const overdue = await prisma_1.prisma.post.findMany({
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
async function dispatchSlaReminders() {
    const now = new Date();
    const threshold = new Date(now.getTime() - 60 * 60 * 1000);
    const overdue = await prisma_1.prisma.post.findMany({
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
        await prisma_1.prisma.post.update({
            where: { id: post.id },
            data: { lastReminderAt: now },
        });
        await prisma_1.prisma.approvalEvent.create({
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
const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
});
setInterval(() => {
    dispatchSlaReminders().catch(() => {
        // Mantem o processo online mesmo se houver falha pontual no job.
    });
}, 5 * 60 * 1000);
