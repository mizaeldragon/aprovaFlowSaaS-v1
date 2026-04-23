import { Link } from 'react-router-dom';

export default function Privacy() {
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
          <h1 className="text-3xl font-black text-white">Política de Privacidade</h1>
          <p className="mt-2 text-sm text-slate-400">Atualizado em 22 de abril de 2026</p>
        </header>

        <section className="space-y-4 text-sm leading-7 text-slate-300">
          <p>Coletamos dados necessários para autenticação, faturamento e operação da plataforma, como nome, e-mail, informações da empresa e dados técnicos de uso.</p>
          <p>Os pagamentos são processados pelo Stripe. O AprovaFlow não armazena dados completos de cartão. Utilizamos provedores terceiros para infraestrutura, envio de e-mails e monitoramento.</p>
          <p>Seus dados são usados para prestação do serviço, segurança, suporte e melhoria contínua do produto. Não vendemos dados pessoais.</p>
          <p>Você pode solicitar atualização ou remoção de dados conforme legislação aplicável, observando obrigações legais e retenções mínimas de segurança e auditoria.</p>
          <p>Adotamos medidas técnicas e organizacionais para proteger informações contra acesso não autorizado, alteração ou perda.</p>
        </section>
      </div>
    </main>
  );
}
