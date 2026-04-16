import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CircleDashed,
  Clock3,
  FileCheck2,
  Link2,
  ListChecks,
  MessageCircleMore,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
  Video,
  Wand2,
  Workflow,
} from 'lucide-react';

const painCards = [
  {
    icon: MessageCircleMore,
    title: 'Feedback perdido no WhatsApp',
    text: 'Mensagens importantes se perdem entre memes e audios. Aprovacoes ficam sem registro.',
  },
  {
    icon: CircleDashed,
    title: 'Audios sem contexto',
    text: 'Cliente manda audio sem referencia visual. Equipe tenta adivinhar o ajuste.',
  },
  {
    icon: Video,
    title: 'Prints confusos',
    text: 'Screenshots recortados com setas vermelhas. Ninguem sabe qual versao esta sendo comentada.',
  },
  {
    icon: Workflow,
    title: 'Retrabalho por versao errada',
    text: 'Equipe trabalha na V2 enquanto o cliente ja aprovou a V1. Resultado: horas desperdicadas.',
  },
];

const steps = [
  {
    icon: Link2,
    title: 'Passo 1',
    text: 'Cliente recebe link seguro para aprovar sem login.',
  },
  {
    icon: MessageCircleMore,
    title: 'Passo 2',
    text: 'Aprova ou pede ajuste com contexto visual.',
  },
  {
    icon: ListChecks,
    title: 'Passo 3',
    text: 'Feedback vira tarefa rastreavel automaticamente.',
  },
  {
    icon: Sparkles,
    title: 'Passo 4',
    text: 'Time acompanha SLA, versoes e historico em tempo real.',
  },
];

const featureCards = [
  {
    icon: ShieldCheck,
    title: 'Trilha juridica',
    text: 'Cada aprovacao gera data, hora, autor e versao aprovada.',
  },
  {
    icon: Workflow,
    title: 'Historico de versoes',
    text: 'V1, V2, V3 organizadas com comparacao visual clara.',
  },
  {
    icon: FileCheck2,
    title: 'Checklist automatico',
    text: 'Comentarios do cliente viram tarefas operacionais.',
  },
  {
    icon: Clock3,
    title: 'SLA com alertas',
    text: 'Lembretes automaticos para evitar gargalo de aprovacao.',
  },
  {
    icon: Wand2,
    title: 'White-label Pro real',
    text: 'Dominio e identidade visual da agencia em toda experiencia.',
  },
  {
    icon: MessageCircleMore,
    title: 'Centralizacao total',
    text: 'Tudo em um lugar: comentario, decisao e status final.',
  },
];

const metrics = [
  { value: '-70%', label: 'Retrabalho' },
  { value: '3x', label: 'Mais rapido para aprovar' },
  { value: '100%', label: 'Historico rastreavel' },
  { value: '+95%', label: 'Satisfacao dos clientes' },
];

const audiences = [
  { icon: Share2, label: 'Agencias de marketing' },
  { icon: Sparkles, label: 'Social media' },
  { icon: Wand2, label: 'Designers' },
  { icon: Video, label: 'Editoras de video' },
  { icon: UserRoundCheck, label: 'Times criativos' },
  { icon: Star, label: 'Freelas premium' },
];

const audienceBubblePositions = [
  { left: '20%', top: '42%', delay: '0s' },
  { left: '38%', top: '20%', delay: '0.35s' },
  { left: '50%', top: '50%', delay: '0.7s' },
  { left: '62%', top: '20%', delay: '1.05s' },
  { left: '80%', top: '42%', delay: '1.4s' },
  { left: '50%', top: '84%', delay: '1.75s' },
];

const testimonials = [
  {
    quote: 'Reduzimos retrabalho e agora aprovamos em minutos, nao em dias.',
    author: 'Mariana Costa',
    role: 'Diretora Criativa, Agencia Pulso',
  },
  {
    quote: 'A operacao ficou profissional e os clientes perceberam o nivel.',
    author: 'Rafael Torres',
    role: 'CEO, Studio RT',
  },
  {
    quote: 'Saiu o caos do WhatsApp, entrou processo com prova de aprovacao.',
    author: 'Juliana Mendes',
    role: 'Head de Marketing, Grupo Nex',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 'R$ 97',
    period: '/mes',
    description: 'Para freelancers e pequenas operacoes.',
    featured: false,
    cta: 'Comecar Starter',
    items: [
      'Ate 5 projetos ativos',
      'Aprovacao por link sem login',
      'Comentarios e checklist',
      'Historico de versoes',
    ],
  },
  {
    name: 'Pro',
    price: 'R$ 197',
    period: '/mes',
    description: 'Plano ideal para agencias em crescimento.',
    featured: true,
    cta: 'Assinar Pro',
    items: [
      'Projetos ilimitados',
      'White-label + dominio proprio',
      'SLA com alertas automaticos',
      'Trilha juridica completa',
      'Suporte prioritario',
    ],
  },
  {
    name: 'Scale',
    price: 'R$ 397',
    period: '/mes',
    description: 'Para times com alto volume e operacao robusta.',
    featured: false,
    cta: 'Falar com vendas',
    items: [
      'Tudo do Pro',
      'Multi-equipe e permissoes',
      'Onboarding assistido',
      'Atendimento dedicado',
      'Roadmap e integracoes sob demanda',
    ],
  },
];

function FloatingDots({ amount = 24, seed = 1, className = '' }) {
  const dots = Array.from({ length: amount }, (_, i) => {
    const base = i + seed * 13;
    return {
      id: `${seed}-${i}`,
      left: `${(base * 37) % 100}%`,
      size: 3 + (base % 3),
      delay: `${(base % 9) * 0.85}s`,
      duration: `${9 + (base % 7)}s`,
      opacity: 0.38 + ((base % 5) / 10),
    };
  });

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="absolute rounded-full bg-[#00E5FF]"
          style={{
            left: dot.left,
            bottom: '-30px',
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            opacity: dot.opacity,
            filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.95))',
            animation: `riseDot ${dot.duration} linear ${dot.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowHeader(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0C131D] text-slate-200 selection:bg-cyan-400/35"
      style={{ '--brand-color': '#00E5FF', '--brand-color-light': '#7DEBFF', '--brand-rgb': '0, 229, 255' }}
    >
      <style>{`
        html, body, #root { background: #0C131D !important; }
        @keyframes riseDot {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: .75; }
          100% { transform: translateY(-115vh); opacity: 0; }
        }
        @keyframes cardSweep {
          0% { transform: translateX(-110%); opacity: 0; }
          10% { opacity: .95; }
          70% { opacity: .95; }
          100% { transform: translateX(110%); opacity: 0; }
        }
        @keyframes audienceFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes audienceOrbitSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .card-sweep {
          position: relative;
          overflow: hidden;
        }
        .card-sweep::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 48%;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(0,229,255,0), rgba(0,229,255,1), rgba(0,229,255,0));
          filter: drop-shadow(0 0 8px rgba(0,229,255,0.9));
          animation: cardSweep 3.2s ease-in-out infinite;
          animation-delay: var(--sweep-delay, 0s);
        }
        .audience-bubble {
          position: relative;
          animation: audienceFloat 4.6s ease-in-out infinite;
          animation-delay: var(--float-delay, 0s);
        }
        .audience-orbit {
          position: absolute;
          inset: -2px;
          border-radius: 999px;
          pointer-events: none;
          animation: audienceOrbitSpin 5.8s linear infinite;
          animation-delay: var(--orbit-delay, 0s);
        }
        .audience-orbit::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          border: 2px solid transparent;
          border-top-color: #00E5FF;
          border-right-color: rgba(0,229,255,0.85);
          filter: drop-shadow(0 0 8px rgba(0,229,255,0.92));
        }
      `}</style>

      <div className="fixed inset-0 -z-20 bg-[#0C131D]" />
      <div className="fixed inset-0 -z-10 bg-transparent" />

      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
          showHeader ? 'top-4' : 'top-0'
        }`}
      >
        <div
          className={`mx-auto flex items-center justify-between px-6 transition-all duration-500 ${
            showHeader ? 'max-w-7xl rounded-2xl py-4' : 'max-w-[1400px] py-5'
          }`}
          style={
            showHeader
              ? {
                  background: 'rgba(12,19,29,0.72)',
                  backdropFilter: 'blur(14px)',
                  boxShadow: '0 10px 28px -24px rgba(0,229,255,0.35)',
                }
              : {
                  background: 'transparent',
                }
          }
        >
          <Link to="/" className="flex items-center gap-3">
            <img src="/apv-logo.png" alt="AprovaFlow" className="h-10 w-auto md:h-12" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#recursos" className="hover:text-[#00E5FF]">Recursos</a>
            <a href="#como-funciona" className="hover:text-[#00E5FF]">Como funciona</a>
            <a href="#planos" className="hover:text-[#00E5FF]">Planos</a>
            <a href="#depoimentos" className="hover:text-[#00E5FF]">Depoimentos</a>
            <a href="#contato" className="hover:text-[#00E5FF]">Contato</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-[rgba(9,28,46,0.9)] px-4 py-2 text-sm font-bold text-slate-100 hover:text-[#00E5FF]"
              style={{ outline: '1px solid rgba(0,229,255,0.18)' }}
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="rounded-xl px-4 py-2 text-sm font-black"
              style={{
                backgroundImage: 'linear-gradient(135deg,#00E5FF 0%,#00E5FF 100%)',
                color: '#052231',
              }}
            >
              Teste Gratis
            </Link>
          </div>
        </div>
      </header>

      <main style={{ backgroundColor: "#0C131D" }}>
        <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-32 lg:grid-cols-[1.05fr_1fr] lg:pt-40">
          <FloatingDots amount={26} seed={2} className="z-0" />
          <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-[260px] w-[72%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(0,229,255,0.24),rgba(0,229,255,0.09)_38%,transparent_74%)] blur-2xl" />

          <div className="relative z-10">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-[rgba(8,34,50,0.8)] px-4 py-1.5 text-xs font-bold tracking-[0.08em] text-[#7DEBFF]">
              <span className="h-2 w-2 rounded-full bg-[#00E5FF]" /> Plataforma de aprovacao criativa
            </p>

            <h1 className="text-3xl font-black leading-[0.96] tracking-[-0.02em] text-[#f4f9ff] md:text-4xl xl:text-[52px]">
              A forma profissional
              <br />
              de aprovar <span className="text-[#00E5FF]">artes,</span>
              <br />
              <span className="text-[#00E5FF]">videos e conteudos</span>
              <br />
              com clientes.
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#9eb1c8] md:text-xl lg:text-2xl">
              Centralize aprovacao, comentarios, ajustes, versoes e historico em um unico fluxo elegante.
            </p>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-[#9eb1c8]">
              Elimine o caos do WhatsApp e transforme feedback em produtividade.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-black"
                style={{
                  backgroundImage: 'linear-gradient(135deg,#00E5FF 0%,#00E5FF 100%)',
                  color: '#042433',
                  boxShadow: '0 20px 48px -26px rgba(0,229,255,0.92)',
                }}
              >
                Solicitar demonstracao
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-2xl bg-[rgba(8,29,45,0.8)] px-7 py-3.5 text-sm font-bold text-slate-100 hover:text-[#00E5FF]"
                style={{ outline: '1px solid rgba(0,229,255,0.2)' }}
              >
                Ver como funciona
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-[#7DEBFF]">
              <span className="inline-flex items-center gap-2"><Check size={14} /> Setup em 5 min</span>
              <span className="inline-flex items-center gap-2"><Check size={14} /> Sem cartao de credito</span>
              <span className="inline-flex items-center gap-2"><Check size={14} /> White-label</span>
            </div>
          </div>

          <div className="relative z-10">
            <div
              className="card-sweep relative mx-auto max-w-[650px] rounded-[24px] bg-[#0a131e] p-3 shadow-[0_0_0_1px_rgba(0,229,255,0.34),0_0_70px_-14px_rgba(0,229,255,0.72)]"
              style={{ '--sweep-delay': '0.05s' }}
            >
              <div className="rounded-[16px] bg-[#060f18] p-2 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
                <img
                  src="/mac-aprova.png"
                  alt="Preview AprovaFlow"
                  className="h-[340px] w-full rounded-[12px] object-cover object-top md:h-[420px]"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h2 className="text-2xl font-black leading-tight tracking-[-0.01em] text-white md:text-4xl">
            O caos da aprovacao criativa custa <span className="text-[#00E5FF]">tempo e dinheiro.</span>
          </h2>
          <p className="mt-3 text-base md:text-lg text-[#9eb1c8]">Se voce trabalha com conteudo criativo, ja viveu isso:</p>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {painCards.map((item, index) => (
              <article
                key={item.title}
                className="card-sweep rounded-3xl bg-[rgba(8,27,43,0.9)] p-6 text-left"
                style={{ outline: '1px solid rgba(61,73,90,0.15)', '--sweep-delay': `${index * 0.18}s` }}
              >
                <item.icon className="mb-4 h-9 w-9 rounded-lg bg-[#00E5FF]/12 p-2 text-[#00E5FF]" />
                <h3 className="text-xl font-bold leading-tight text-white">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-[#9eb1c8]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h2 className="text-2xl font-black tracking-[-0.01em] text-white md:text-4xl">
            Como <span className="text-[#00E5FF]">funciona</span>
          </h2>
          <p className="mt-3 text-base md:text-lg text-[#9eb1c8]">Quatro passos para transformar caos em processo.</p>

          <div className="mt-14 grid gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-[58%] top-7 hidden h-[2px] w-[88%] bg-[#00E5FF]/30 md:block" />
                )}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#00E5FF]/12 text-[#00E5FF] shadow-[0_0_24px_rgba(0,229,255,0.52)]">
                  <step.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-base text-[#9eb1c8]">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h2 className="text-2xl font-black tracking-[-0.01em] text-white md:text-4xl">
            Diferenciais que fazem a <span className="text-[#00E5FF]">diferenca</span>
          </h2>
          <p className="mt-3 text-base md:text-lg text-[#9eb1c8]">Tudo para sua agencia aprovar com previsibilidade.</p>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((item, index) => (
              <article
                key={item.title}
                className="card-sweep rounded-3xl bg-[rgba(8,27,43,0.88)] p-6 text-left"
                style={{ outline: '1px solid rgba(61,73,90,0.15)', '--sweep-delay': `${index * 0.16}s` }}
              >
                <item.icon className="mb-4 h-9 w-9 rounded-lg bg-[#00E5FF]/12 p-2 text-[#00E5FF]" />
                <h3 className="text-[24px] font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-[#9eb1c8]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h2 className="text-2xl font-black tracking-[-0.01em] text-white md:text-4xl">
            Resultados que <span className="text-[#00E5FF]">impressionam</span>
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((m, index) => (
              <div
                key={m.value + m.label}
                className="card-sweep rounded-2xl bg-[rgba(8,27,43,0.88)] px-6 py-7"
                style={{ outline: '1px solid rgba(61,73,90,0.15)', '--sweep-delay': `${index * 0.14}s` }}
              >
                <p className="text-3xl font-black text-[#2ad9f5]">{m.value}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.06em] text-[#9eb1c8]">{m.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h2 className="text-2xl font-black tracking-[-0.01em] text-white md:text-4xl">
            Para <span className="text-[#00E5FF]">quem</span> e o AprovaFlow
          </h2>

          <div className="relative mt-10 hidden h-[620px] md:block">
            {audiences.map((a, index) => (
              <div
                key={a.label}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: audienceBubblePositions[index].left, top: audienceBubblePositions[index].top }}
              >
                <div
                  className="audience-bubble flex h-24 w-24 items-center justify-center rounded-full bg-[rgba(8,27,43,0.92)] shadow-[0_0_0_1px_rgba(0,229,255,0.28),0_0_32px_-16px_rgba(0,229,255,0.85)]"
                  style={{ '--float-delay': audienceBubblePositions[index].delay }}
                >
                  <span className="audience-orbit" style={{ '--orbit-delay': audienceBubblePositions[index].delay }} />
                  <a.icon className="h-7 w-7 text-[#00E5FF]" />
                </div>
                <p className="mt-2 w-[150px] text-center text-sm font-semibold leading-tight text-slate-100">{a.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:hidden">
            {audiences.map((a, index) => (
              <div key={a.label} className="flex flex-col items-center">
                <div
                  className="audience-bubble flex h-22 w-22 items-center justify-center rounded-full bg-[rgba(8,27,43,0.92)] shadow-[0_0_0_1px_rgba(0,229,255,0.26),0_0_28px_-14px_rgba(0,229,255,0.85)]"
                  style={{ '--float-delay': `${index * 0.2}s` }}
                >
                  <span className="audience-orbit" style={{ '--orbit-delay': `${index * 0.2}s` }} />
                  <a.icon className="h-7 w-7 text-[#00E5FF]" />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-100">{a.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="depoimentos" className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h2 className="text-2xl font-black tracking-[-0.01em] text-white md:text-4xl">
            Quem usa, <span className="text-[#00E5FF]">recomenda</span>
          </h2>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.map((t, index) => (
              <article
                key={t.author}
                className="card-sweep rounded-3xl bg-[rgba(8,27,43,0.88)] p-6 text-left"
                style={{ outline: '1px solid rgba(61,73,90,0.15)', '--sweep-delay': `${index * 0.2}s` }}
              >
                <div className="mb-4 flex gap-1 text-[#00E5FF]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-lg leading-relaxed text-slate-100">"{t.quote}"</p>
                <p className="mt-5 text-base font-bold text-white">{t.author}</p>
                <p className="text-sm text-[#9eb1c8]">{t.role}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="planos" className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h2 className="text-2xl font-black tracking-[-0.01em] text-white md:text-4xl">
            Planos para cada fase da sua <span className="text-[#00E5FF]">agencia</span>
          </h2>
          <p className="mt-3 text-base md:text-lg text-[#9eb1c8]">
            Comece simples e escale sem trocar de plataforma.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <article
                key={plan.name}
                className={`card-sweep rounded-3xl p-6 text-left ${
                  plan.featured
                    ? 'bg-[rgba(8,27,43,0.96)] shadow-[0_0_0_1px_rgba(0,229,255,0.35),0_0_40px_-22px_rgba(0,229,255,0.8)]'
                    : 'bg-[rgba(8,27,43,0.88)]'
                }`}
                style={{ outline: '1px solid rgba(61,73,90,0.15)', '--sweep-delay': `${index * 0.16}s` }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {plan.featured && (
                    <span className="rounded-full bg-[#00E5FF]/15 px-3 py-1 text-xs font-bold text-[#00E5FF]">
                      Mais escolhido
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-[#9eb1c8]">{plan.description}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="pb-1 text-sm text-[#9eb1c8]">{plan.period}</span>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-[#c8d4e6]">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check size={15} className="mt-0.5 shrink-0 text-[#00E5FF]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-black"
                  style={{
                    backgroundImage: plan.featured
                      ? 'linear-gradient(135deg,#00E5FF 0%,#00E5FF 100%)'
                      : 'linear-gradient(135deg,rgba(0,229,255,0.22) 0%,rgba(0,229,255,0.12) 100%)',
                    color: plan.featured ? '#052231' : '#dff8ff',
                  }}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section
          className="relative overflow-hidden bg-[linear-gradient(180deg,#0C131D_0%,#0C131D_100%)] py-16 text-center"
          id="contato"
        >
          <FloatingDots amount={30} seed={6} />
          <div className="relative z-10 mx-auto max-w-5xl px-6">
            <h2 className="text-3xl font-black leading-tight tracking-[-0.01em] text-white md:text-5xl">
              Transforme aprovacao em um
              <br />
              processo <span className="text-[#00E5FF]">escalavel.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[#a9bdd3] md:text-lg">
              Pare de perder tempo com retrabalho. Comece agora a profissionalizar seu fluxo de aprovacao.
            </p>

            <Link
              to="/register"
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 text-lg font-black"
              style={{
                backgroundImage: 'linear-gradient(135deg,#00E5FF 0%,#00E5FF 100%)',
                color: '#042433',
                boxShadow: '0 20px 48px -26px rgba(26,210,236,0.92)',
              }}
            >
              Agendar demonstracao <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#0C131D] py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a3648] text-base font-bold text-[#2ad9f5]">A</div>
              <p className="text-2xl font-extrabold text-white">AprovaFlow</p>
            </div>
            <p className="mt-4 max-w-sm text-lg text-[#a0acc0]">A forma profissional de aprovar conteudos criativos.</p>
          </div>

          <div>
            <h4 className="text-sm font-black text-white">Produto</h4>
            <ul className="mt-4 space-y-2 text-base text-[#a0acc0]">
              <li>Recursos</li>
              <li>Integracoes</li>
              <li>Changelog</li>
              <li>Roadmap</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black text-white">Recursos</h4>
            <ul className="mt-4 space-y-2 text-base text-[#a0acc0]">
              <li>Blog</li>
              <li>Guias</li>
              <li>Templates</li>
              <li>API Docs</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black text-white">Empresa</h4>
            <ul className="mt-4 space-y-2 text-base text-[#a0acc0]">
              <li>Precos</li>
              <li>Contato</li>
              <li>Sobre</li>
              <li>Carreiras</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black text-white">Legal</h4>
            <ul className="mt-4 space-y-2 text-base text-[#a0acc0]">
              <li>Termos de uso</li>
              <li>Privacidade</li>
              <li>Cookies</li>
              <li>LGPD</li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-7xl items-center justify-between border-t border-slate-800/70 px-6 pt-8 text-sm text-[#8394ab]">
          <span>© 2026 AprovaFlow. Todos os direitos reservados.</span>
          <div className="flex gap-5">
            <span>Termos</span>
            <span>Privacidade</span>
          </div>
        </div>
      </footer>
    </div>
  );
}






















