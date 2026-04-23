import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <main className="min-h-screen bg-[#0C131D] px-6 py-14 text-slate-200">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <img src="/apv-logo.png" alt="AprovaFlow" className="h-10 w-auto" />
          <Link to="/" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            Voltar ao site
          </Link>
        </div>

        <header>
          <h1 className="text-3xl font-black text-white">Termos de Uso</h1>
          <p className="mt-2 text-sm text-slate-400">Atualizado em 22 de abril de 2026</p>
        </header>

        <section className="space-y-4 text-sm leading-7 text-slate-300">
          <p>Ao utilizar o AprovaFlow, você concorda com estes termos. O serviço é destinado à gestão de aprovações criativas, com histórico de decisões e colaboração entre equipes e clientes.</p>
          <p>Você é responsável pelas credenciais de acesso, pelo conteúdo enviado à plataforma e pelo uso adequado da conta da sua empresa. É proibido usar o sistema para atividades ilícitas, abuso de infraestrutura ou violação de direitos de terceiros.</p>
          <p>Os planos pagos são cobrados conforme a assinatura ativa no Stripe. Cancelamentos seguem as regras do ciclo vigente. Em caso de inadimplência, o acesso pode ser suspenso até regularização.</p>
          <p>Podemos atualizar funcionalidades, limites e integrações para manter segurança e evolução do produto. Alterações relevantes de contrato serão publicadas nesta página.</p>
          <p>Para dúvidas contratuais, entre em contato pelo canal oficial informado no site.</p>
        </section>
      </div>
    </main>
  );
}
