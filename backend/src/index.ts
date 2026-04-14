import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import { prisma } from './prisma';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Segredo do JWT que vai estar no .env no servidor real da net
const JWT_SECRET = process.env.JWT_SECRET || 'aprovaflow_super_secret_dev_key';

// Rota de Teste Simples
app.get('/', (req, res) => {
  res.json({ message: 'AprovaFlow SaaS API online! 🚀' });
});

// ==========================================
// -------------- AUTHENTICATION ------------
// ==========================================

// Criar Conta da Agência e do Primeiro Dono
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, agencyName } = req.body;
    
    if (!email || !password || !agencyName) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email já cadastrado' });

    // Criptografa a senha para o Postgres
    const passwordHash = await bcrypt.hash(password, 10);

    // Cria a agência e o usuário ao mesmo tempo interligados
    const tenant = await prisma.tenant.create({ data: { name: agencyName } });
    const user = await prisma.user.create({
      data: { name, email, passwordHash, tenantId: tenant.id }
    });

    // Emite o "Cartão de Acesso"
    const token = jwt.sign({ userId: user.id, tenantId: tenant.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token, tenantId: tenant.id });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Fazer Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token, tenantId: user.tenantId });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

// Validar se usuário existe pelo Token (Quando reabre o navegador)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string, tenantId: string };
    
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    
    res.json({ user: { id: user.id, name: user.name, email: user.email }, tenantId: user.tenantId });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
});
// ==========================================
// -------------- AI MAGIC ------------------
// ==========================================

app.post('/api/ai/improve-copy', async (req, res) => {
  const { caption, tone } = req.body;
  if (!caption) return res.status(400).json({ error: 'Texto original é obrigatório' });
  
  // Gatilho Fantasma: Se o .env não tiver a chave real, devolvemos uma simulação para o Frontend não quebrar sua UI.
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('sua-chave')) {
    await new Promise(r => setTimeout(r, 2000)); // simula "I.A pensando"
    const simulacao = `✨ Texto Otimizado por IA Fantasma ✨\n\nEssa é uma simulação de Copy otimizada para o tom [${tone || 'Neutro'}].\nPara ligar os neurônios de verdade, precisamos colocar a OPENAI_API_KEY no arquivo .env!\n\nSeu texto base era: "${caption}"`;
    return res.json({ improvedCopy: simulacao });
  }

  try {
    const openai = new OpenAI();
    let systemPrompt = 'Você é um redator publicitário experiente. Melhore a legenda a seguir para posts de redes sociais.';
    if (tone === 'persuasive') systemPrompt += ' Use gatilhos mentais e seja altamente persuasivo.';
    if (tone === 'formal') systemPrompt += ' Seja formal e profissional.';
    if (tone === 'short') systemPrompt += ' Seja muito direto, curto e engajador.';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: caption }
      ],
      temperature: 0.7,
    });

    res.json({ improvedCopy: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar texto com IA' });
  }
});
// ==========================================
// -------------- TENANTS & POSTS -----------
// ==========================================

// Criar Agência Isolada
app.post('/api/tenants', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const tenant = await prisma.tenant.create({ data: { name } });
  res.status(201).json(tenant);
});

app.get('/api/tenantsSettings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'aprovaflow_super_secret_dev_key') as any;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId }
    });
    res.json(tenant);
  } catch(e) {
    res.status(500).json({ error: 'Erro ao buscar configurações da agência' });
  }
});

// Atualizar o White-Label da Agência (Rota Protegida JWT)
app.patch('/api/tenantsSettings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'aprovaflow_super_secret_dev_key') as any;
    
    const { logoUrl, themeColor } = req.body;
    const updated = await prisma.tenant.update({
      where: { id: payload.tenantId },
      data: { logoUrl, themeColor }
    });
    res.json(updated);
  } catch(e) {
    console.error("ERRO NO PATCH TENANT:", e);
    res.status(500).json({ error: 'Erro ao atualizar configurações da agência' });
  }
});

// Buscar todos os posts (Dashboard da Agência)
app.get('/api/posts', async (req, res) => {
  // OBS: Como essa rota NÃO TEM o Middleware "Auth" ainda para ser rápido o MVP, 
  // nós vamos injetar ele do Frontend. O certo será tirar daqui e puxar do TOKEN.
  const { tenantId } = req.query;
  if (!tenantId) return res.status(400).json({ error: 'tenantId obrigatório' });
  
  const exists = await prisma.tenant.findUnique({ where: { id: String(tenantId) } });
  if (!exists) {
    await prisma.tenant.create({ data: { id: String(tenantId), name: "Agência Teste (MVP)" } });
  }

  const posts = await prisma.post.findMany({
    where: { tenantId: String(tenantId) },
    orderBy: { createdAt: 'desc' },
    include: { comments: true }
  });
  res.json(posts);
});

// Criar um novo post
app.post('/api/posts', async (req, res) => {
  const { title, channel, caption, imageUrl, tenantId, clientName } = req.body;
  if (!tenantId) return res.status(400).json({ error: 'tenantId obrigatório' });

  const post = await prisma.post.create({
    data: { title, channel, caption, imageUrl, clientName, tenantId }
  });
  res.status(201).json(post);
});

// Buscar um Post específico para a Página de Aprovação Pública (com dados Visuais da Agência inclusos!)
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: { 
        comments: { orderBy: { createdAt: 'asc' } },
        tenant: {
          select: { name: true, logoUrl: true, themeColor: true }
        }
      }
    });
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar post' });
  }
});

// Mudar status (Aprovar/Reprovar)
app.patch('/api/posts/:id/status', async (req, res) => {
  const { status } = req.body;
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json(post);
});

// Excluir Post
app.delete('/api/posts/:id', async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ==========================================
// -------------- COMMENTS ------------------
// ==========================================
app.post('/api/posts/:id/comments', async (req, res) => {
  const { text, author } = req.body;
  const comment = await prisma.comment.create({
    data: { text, author, postId: req.params.id }
  });
  res.status(201).json(comment);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 API: Módulo de Autenticação INJETADO. Servidor rodando na porta ${PORT}!`);
});
