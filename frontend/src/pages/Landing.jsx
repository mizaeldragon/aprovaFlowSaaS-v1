import { Link } from 'react-router-dom';
import { 
    CheckCircle2, 
    Zap, 
    Palette, 
    ArrowRight, 
    Star, 
    Check,
    X,
    LayoutDashboard,
    MessageSquare,
    Sparkles
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white pb-0">
      
      {/* Navbar Premium */}
      <nav className="flex items-center justify-between px-6 py-4 fixed w-full bg-slate-50/80 backdrop-blur-md z-50 border-b border-white/40 shadow-sm">
        <Link to="/" className="flex items-center opacity-90 hover:opacity-100 transition-opacity">
          <img src="/apv-logo.png" alt="AprovaFlow Logo" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Acessar Painel</Link>
          <Link to="/register" className="rounded-full px-5 py-2.5 shadow-emerald-500/20 shadow-lg text-sm bg-slate-900 hover:bg-emerald-600 border-none transition-all duration-300 font-bold text-white flex items-center hover:-translate-y-0.5">
            Começar Grátis
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-40 pb-20 px-6 max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center overflow-hidden">
        
        {/* Glow de fundo */}
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-emerald-300/30 blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-pulse pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-sky-300/30 blur-[120px] rounded-full mix-blend-multiply opacity-70 pointer-events-none"></div>

        {/* Hero Copy (Left) */}
        <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm text-emerald-600 font-bold text-xs uppercase tracking-wider border border-slate-100 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            A Revolução White-Label
          </div>
          
          <h1 className="text-5xl lg:text-6xl xl:text-[4.5rem] font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.05]">
            Nunca mais perca clientes pelos <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">feedbacks confusos</span> no Whats.
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-600 mb-10 max-w-xl leading-relaxed font-medium">
            Entregue suas artes em uma plataforma premium, com a SUA logo e cores. Encante clientes, zere os ruídos e feche aprovações em minutos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link to="/register" className="h-14 bg-slate-900 border-none text-white font-bold py-3 px-8 rounded-full shadow-2xl shadow-slate-900/20 hover:bg-emerald-600 hover:shadow-emerald-600/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-lg">
              Começar Agora Mesmo <ArrowRight size={20} />
            </Link>
          </div>
          
          <div className="mt-8 flex items-center gap-4 text-sm font-semibold text-slate-500">
             <div className="flex -space-x-3">
               <img src="https://i.pravatar.cc/150?u=1" className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" />
               <img src="https://i.pravatar.cc/150?u=2" className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" />
               <img src="https://i.pravatar.cc/150?u=3" className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" />
               <div className="w-10 h-10 rounded-full border-2 border-slate-50 bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shadow-sm">+5k</div>
             </div>
             <div>Agências já otimizaram<br/>suas aprovações.</div>
          </div>
        </div>

        {/* CSS Macbook Mockup (Right) */}
        <div className="relative z-10 w-full flex justify-center lg:justify-end mt-10 lg:mt-0 perspective-[1000px]">
           {/* Macbook Body */}
           <div className="relative w-full max-w-[800px] aspect-[16/10] bg-slate-800 rounded-t-3xl rounded-b-xl shadow-2xl border-[8px] border-slate-800 border-b-[24px] ring-1 ring-white/10 transform rotate-[-2deg] hover:rotate-0 hover:scale-[1.02] transition-all duration-700 ease-out origin-bottom">
              
              {/* Webcam */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full shadow-[0_0_0_2px_#334155]"></div>

              {/* Macbook Screen Content (AprovaFlow UI Mock) */}
              <div className="w-full h-full bg-slate-50 rounded-lg overflow-hidden flex flex-col">
                 
                 {/* Fake Screen Header */}
                 <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center px-4 shrink-0">
                    <img src="/apv-logo.png" className="h-4" alt="" />
                    <div className="flex items-center gap-3">
                       <div className="h-5 w-20 bg-slate-100 rounded-md"></div>
                       <div className="h-6 w-6 rounded-full bg-slate-900 border-2 border-emerald-500"></div>
                    </div>
                 </div>

                 {/* Fake Screen Body */}
                 <div className="flex-1 p-4 sm:p-6 bg-slate-50 overflow-hidden relative">
                    <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
                    
                    {/* Fake Table/List */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                       <div className="grid grid-cols-4 gap-4 p-3 border-b border-slate-100 bg-slate-50/50">
                          <div className="h-3 bg-slate-200 rounded w-16"></div>
                          <div className="h-3 bg-slate-200 rounded w-20"></div>
                          <div className="h-3 bg-slate-200 rounded w-14"></div>
                          <div className="h-3 bg-slate-200 rounded w-8 justify-self-end"></div>
                       </div>
                       {[1, 2, 3].map((i) => (
                         <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-slate-50 items-center">
                            <div className="h-8 w-12 bg-slate-100 rounded-md border border-slate-200"></div>
                            <div className="h-3 bg-slate-900 rounded w-24"></div>
                            <div className="h-6 w-24 bg-amber-100 rounded-full border border-amber-200 flex items-center justify-center">
                              <div className="h-1.5 w-16 bg-amber-500/30 rounded-full"></div>
                            </div>
                            <div className="h-6 w-6 bg-slate-100 rounded-md justify-self-end"></div>
                         </div>
                       ))}
                    </div>

                    {/* Floating Side Panel Mock */}
                    <div className="absolute right-6 top-6 bottom-6 w-1/3 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col p-4 animate-fade-in delay-500 hidden sm:flex">
                       <div className="h-4 w-20 bg-slate-200 rounded mb-4"></div>
                       <div className="flex-1 space-y-3">
                         <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                           <div className="h-2 w-12 bg-slate-300 rounded mb-2"></div>
                           <div className="h-2 w-full bg-slate-200 rounded mb-1"></div>
                           <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                         </div>
                         <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                           <div className="h-2 w-16 bg-emerald-400 rounded mb-2"></div>
                           <div className="h-2 w-full bg-emerald-300/50 rounded mb-1"></div>
                         </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Macbook Base Lip */}
              <div className="absolute -bottom-[24px] left-0 right-0 h-4 bg-slate-400 rounded-b-3xl"></div>
              <div className="absolute -bottom-[24px] left-1/2 -translate-x-1/2 h-2 w-20 bg-slate-500 rounded-b-xl"></div>
           </div>
        </div>
      </section>

      {/* Grid de Features (Vantagens) Premium */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Apresente como Profissional</h2>
             <p className="text-slate-600 font-medium max-w-2xl mx-auto text-lg">Saia do WhatsApp e chame seu cliente para a sua própria "sala VIP" de aprovação.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group">
              <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                 <Palette size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Marca Própria</h3>
              <p className="text-slate-600 leading-relaxed font-medium">As cores da sua agência e o seu logotipo. O seu cliente jamais saberá que o AprovaFlow existe.</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:border-sky-200 transition-all duration-300 group">
              <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-sky-500 mb-6 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                 <CheckCircle2 size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Clique & Aprove</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Acabou o "na imagem fina03-ok a letra ta torta". O cliente aponta, comenta e aprova em 1 clique.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:shadow-2xl hover:shadow-emerald-900/30 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
              <div className="h-16 w-16 rounded-2xl bg-slate-800 shadow-sm border border-slate-700 flex items-center justify-center text-emerald-400 mb-6 transition-colors">
                 <Sparkles size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Magia da IA</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Deixe a I.A gerar Copies envolventes e sugerir otimizações de conversão direto nas legendas dos posts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Depoimentos */}
      <section className="py-24 bg-slate-50 border-t border-slate-200/60">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Agências que Mudaram o Jogo</h2>
               <p className="text-slate-600 font-medium max-w-2xl mx-auto text-lg">Histórias reais de quem adotou o White-Label das aprovações.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               
               {/* Testimonial 1 */}
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-6">
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed italic mb-8">
                      "Antes meus designers enlouqueciam com áudios de 4 minutos no WhatsApp. Hoje o cliente clica no link VIP, comenta o que não gostou e pronto. Kanban mágico."
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                     <img src="https://i.pravatar.cc/150?u=a1" alt="Roberto" className="w-12 h-12 rounded-full ring-2 ring-emerald-500/20" />
                     <div>
                        <h4 className="font-bold text-slate-900 text-sm">Roberto C.</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase">CEO da Next Digital</p>
                     </div>
                  </div>
               </div>

               {/* Testimonial 2 */}
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-6">
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed italic mb-8">
                      "O fato do meu cliente abrir o celular e ver TUDO nas cores Laranja e Preto da minha agência, sentindo que o software é MEU... O valor agregado multiplicou por 10x."
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                     <img src="https://i.pravatar.cc/150?u=b2" alt="Camila" className="w-12 h-12 rounded-full ring-2 ring-emerald-500/20" />
                     <div>
                        <h4 className="font-bold text-slate-900 text-sm">Camila T.</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase">Diretora de Arte</p>
                     </div>
                  </div>
               </div>

               {/* Testimonial 3 */}
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-6">
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                       <Star size={20} fill="currentColor" />
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed italic mb-8">
                      "A queima de fogos quando eles clicam em Aprovar gerou até stories dos clientes agradecendo o capricho da agência! Ferramenta essencial pra escalabilidade."
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                     <img src="https://i.pravatar.cc/150?u=c3" alt="Felipe" className="w-12 h-12 rounded-full ring-2 ring-emerald-500/20" />
                     <div>
                        <h4 className="font-bold text-slate-900 text-sm">Felipe A.</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase">Co-founder Orbit Media</p>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-slate-900 text-white border-t-8 border-emerald-500 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none"></div>
         
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Escolha sua Arma</h2>
               <p className="text-slate-400 font-medium max-w-2xl mx-auto text-lg">Pague por valor entregue. Escale sem limites de equipe.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
               
               {/* Grátis */}
               <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 h-[fit-content]">
                  <h3 className="text-2xl font-bold mb-2">Freelancer</h3>
                  <p className="text-slate-400 text-sm font-medium mb-6">Perfeito para quem trabalha sozinho e quer testar as águas.</p>
                  <div className="text-5xl font-extrabold mb-6">R$0<span className="text-lg text-slate-500 font-medium">/mês</span></div>
                  
                  <ul className="space-y-4 mb-8">
                     <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Até 5 Projetos Ativos</li>
                     <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Aprovações Ilimitadas</li>
                     <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Sem White-Label</li>
                     <li className="flex gap-3 items-center text-slate-500 font-medium opacity-50"><X size={20} className="shrink-0"/> Inteligência Artificial</li>
                  </ul>
                  
                  <Link to="/register" className="block text-center w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-all">
                     Começar Grátis
                  </Link>
               </div>

               {/* Agência Pro (Destaque) */}
               <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-1 lg:scale-105 shadow-2xl relative shadow-emerald-900/20">
                  <div className="absolute top-0 right-8 transform -translate-y-1/2">
                     <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg">
                        Mais Popular
                     </div>
                  </div>
                  <div className="bg-slate-800 rounded-[22px] p-8 h-full border border-slate-700/50">
                     <h3 className="text-2xl font-bold mb-2">Agência Pro</h3>
                     <p className="text-slate-400 text-sm font-medium mb-6">Para equipes que precisam de personalização e organização absoluta.</p>
                     <div className="text-5xl font-extrabold mb-6">R$97<span className="text-lg text-slate-500 font-medium">/mês</span></div>
                     
                     <ul className="space-y-4 mb-8">
                        <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Projetos Ilimitados</li>
                        <li className="flex gap-3 items-center text-slate-100 font-bold"><Check size={20} className="text-emerald-500 shrink-0"/> White-label Completo (Cores e Logo)</li>
                        <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Uploads de Alto Desempenho</li>
                        <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Geração de Copy via IA</li>
                     </ul>
                     
                     <Link to="/register" className="block text-center w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                        Assinar Agora
                     </Link>
                  </div>
               </div>

               {/* Enterprise */}
               <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 h-[fit-content]">
                  <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                  <p className="text-slate-400 text-sm font-medium mb-6">A agência em outro patamar de maturidade.</p>
                  <div className="text-5xl font-extrabold mb-6">R$297<span className="text-lg text-slate-500 font-medium">/mês</span></div>
                  
                  <ul className="space-y-4 mb-8">
                     <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Tudo do Plano Pro</li>
                     <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Domínio Customizado (aprova.suaagencia)</li>
                     <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Faturamento via CNPJ</li>
                     <li className="flex gap-3 items-center text-slate-300 font-medium"><Check size={20} className="text-emerald-500 shrink-0"/> Gerente de Contas</li>
                  </ul>
                  
                  <Link to="/register" className="block text-center w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-all">
                     Falar com Vendas
                  </Link>
               </div>

            </div>
         </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-white text-center">
         <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Pronto para impressionar?</h2>
            <p className="text-xl text-slate-600 font-medium mb-10">Junte-se às milhares de agências que estão abandonando o método antigo e escalando sua operação criativa.</p>
            <Link to="/register" className="inline-flex h-16 bg-slate-900 border-none text-white font-bold py-4 px-10 rounded-full shadow-2xl shadow-slate-900/20 hover:bg-emerald-600 hover:shadow-emerald-600/30 hover:-translate-y-1 transition-all duration-300 items-center justify-center gap-2 text-xl">
              Crie Sua Conta Grátis <ArrowRight />
            </Link>
         </div>
      </section>

      {/* Footer minimalista Premium */}
      <footer className="py-12 px-6 border-t bg-slate-50 border-slate-200">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-bold tracking-tight text-slate-900 text-xl">
               <img src="/apv-logo.png" className="h-6" alt="AprovaFlow" />
            </div>
            <div className="flex gap-8 text-sm font-bold text-slate-500">
               <Link to="#" className="hover:text-slate-900 transition-colors">Termos de Uso</Link>
               <Link to="#" className="hover:text-slate-900 transition-colors">Privacidade</Link>
               <Link to="/login" className="hover:text-slate-900 transition-colors">Acessar Painel</Link>
            </div>
            <p className="text-slate-400 text-sm font-medium">© 2026 AprovaFlow. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
}
