import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock3,
  FileCheck2,
  ListTodo,
  MessageCircleMore,
  ShieldCheck,
  Star,
  Workflow,
  X,
} from 'lucide-react';

const featureCards = [
  {
    icon: MessageCircleMore,
    title: 'Aprovacao via WhatsApp sem login',
    description:
      'Seu cliente abre o link, aprova ou pede ajuste em um clique. Sem criar conta e sem atrito.',
  },
  {
    icon: ShieldCheck,
    title: 'Trilha de aprovacao com prova',
    description:
      'Guarde quem aprovou, quando aprovou e qual versao foi aprovada. Menos conflito e mais seguranca.',
  },
  {
    icon: ListTodo,
    title: 'Feedback vira tarefa automatica',
    description:
      'Comentario do cliente vira checklist operacional. Sua equipe para de copiar e colar ajuste.',
  },
  {
    icon: Clock3,
    title: 'SLA de aprovacao com lembrete',
    description:
      'Defina prazo por peca e receba alerta de gargalo. Evite campanha parada esperando retorno.',
  },
  {
    icon: FileCheck2,
    title: 'Publicacao segura anti-erro',
    description:
      'Controle interno para publicar apenas peca aprovada. Reduza erro humano e retrabalho.',
  },
  {
    icon: Workflow,
    title: 'White-label Pro real',
    description:
      'Dominio e identidade da sua agencia no fluxo de aprovacao. Cliente ve sua marca, nao ferramenta.',
  },
];

const switchItems = [
  'Sem login para o cliente aprovar',
  'Checklist automatico de ajustes por peca',
  'Historico de aprovacao com data, hora e versao',
  'Lembretes automaticos de pendencia',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050B14] text-slate-200 selection:bg-cyan-400/40">
      <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-[#050B14]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/apv-logo.png" alt="AprovaFlow" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500">
              Entrar
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 py-2 text-sm font-extrabold text-slate-950"
            >
              Teste Gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-200">
              Posicionamento para agencias brasileiras
            </p>
            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">
              Aprovacao de criativos feita para agencia: rapida, rastreavel e sem retrabalho.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-400">
              Seu cliente aprova em 1 clique. O feedback vira tarefa. E voce prova quem aprovou cada versao.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500 px-6 py-3 text-sm font-black uppercase tracking-wide text-slate-950"
              >
                Comecar teste gratis <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300">
                Ver painel
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {switchItems.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl border border-slate-800 bg-[#0B1221] p-3 text-sm font-semibold text-slate-300">
                  <Check size={16} className="mt-0.5 shrink-0 text-cyan-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0B1221] p-6 shadow-[0_24px_80px_-30px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-bold text-white">Por que trocar agora</h3>
            <p className="mt-2 text-sm text-slate-400">Pare de perder tempo com aprovacao espalhada em chat, audio e print.</p>

            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-300">Antes</p>
                <p className="mt-1 text-sm font-medium text-slate-300">Mensagem solta, feedback confuso, historico perdido e retrabalho.</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Depois</p>
                <p className="mt-1 text-sm font-medium text-slate-200">Fluxo unico, status claro, aprovacao documentada e operacao previsivel.</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1 text-amber-300">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <span className="ml-2 text-xs font-semibold text-slate-400">Foco em produtividade da agencia</span>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-800 bg-[#071124] py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-white md:text-4xl">Diferenciais para ganhar do concorrente</h2>
              <p className="mt-3 text-slate-400">Nao e mais uma ferramenta de comentario. E um sistema de aprovacao para agencia operar melhor.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-800 bg-[#0B1221] p-5">
                  <item.icon size={20} className="text-cyan-300" />
                  <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-white md:text-4xl">Planos para converter assinatura</h2>
            <p className="mt-3 text-slate-400">Comece no Free e avance para Pro quando quiser liberar dominio e operacao completa.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-[#0B1221] p-6">
              <h3 className="text-xl font-bold text-white">Free</h3>
              <p className="mt-1 text-sm text-slate-400">Para validar fluxo com poucos clientes.</p>
              <p className="mt-4 text-4xl font-black text-white">R$0</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-300" />Aprovacao por link</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-300" />Comentarios e status</li>
                <li className="flex items-center gap-2"><X size={16} className="text-rose-300" />Dominio personalizado</li>
              </ul>
              <Link to="/register" className="mt-6 inline-flex w-full justify-center rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200">
                Comecar gratis
              </Link>
            </div>

            <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-[#0D1E34] to-[#0B1221] p-6 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
              <p className="mb-2 inline-flex rounded-full bg-cyan-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200">
                Mais vendido
              </p>
              <h3 className="text-xl font-bold text-white">Pro</h3>
              <p className="mt-1 text-sm text-slate-300">Para agencia que precisa escalar com previsibilidade.</p>
              <p className="mt-4 text-4xl font-black text-white">R$97</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-200">
                <li className="flex items-center gap-2"><Check size={16} className="text-cyan-300" />Tudo do Free</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-cyan-300" />White-label completo</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-cyan-300" />Dominio personalizado</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-cyan-300" />Fluxo operacional com IA</li>
              </ul>
              <Link to="/register" className="mt-6 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 py-2.5 text-sm font-black text-slate-950">
                Assinar Pro
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-[#0B1221] p-6">
              <h3 className="text-xl font-bold text-white">Enterprise</h3>
              <p className="mt-1 text-sm text-slate-400">Para operacao com alto volume e equipe grande.</p>
              <p className="mt-4 text-4xl font-black text-white">R$297</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-300" />Tudo do Pro</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-300" />Onboarding assistido</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-300" />Suporte prioritario</li>
              </ul>
              <Link to="/register" className="mt-6 inline-flex w-full justify-center rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200">
                Falar com vendas
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800 bg-[#071124] py-16 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-black text-white md:text-4xl">
              Se o cliente aprova mais rapido, sua agencia fatura mais rapido.
            </h2>
            <p className="mt-4 text-slate-400">Teste gratis e mostre valor na primeira semana.</p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500 px-8 py-3 text-sm font-black uppercase tracking-wide text-slate-950"
            >
              Criar conta agora <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
