# AprovaFlow

## Visão geral

O AprovaFlow é um aplicativo funcional criado para resolver uma fricção real na rotina de agências de publicidade e times de marketing: a aprovação de criativos feita de forma dispersa, pouco rastreável e sujeita a retrabalho.

A proposta do produto é simples: permitir que uma peça seja cadastrada, compartilhada por link público e revisada sem necessidade de autenticação. A partir desse link, o aprovador consegue comentar, aprovar ou solicitar ajustes. Do lado interno, a equipe acompanha os posts em um painel com status, comentários, ações rápidas e paginação.

Mais do que um gerenciador de posts, o AprovaFlow foi pensado como um fluxo enxuto de validação entre criação e publicação.

---

## Problema identificado

Em muitas agências e equipes de marketing, a aprovação de criativos ainda acontece em canais paralelos:

- WhatsApp
- e-mail
- mensagens soltas
- reuniões rápidas
- arquivos com múltiplas versões

Esse cenário gera uma série de problemas práticos:

- feedback espalhado em vários lugares
- dificuldade para saber se a peça foi aprovada ou não
- retrabalho para consolidar comentários
- risco de publicar versão errada
- perda de tempo em tarefas operacionais

O problema não está apenas em “aprovar um post”, mas em organizar esse momento do processo de forma simples e objetiva.

---

## Por que esse problema importa

A aprovação é um gargalo operacional.

Quando esse ponto falha, toda a cadeia de produção atrasa: criação, revisão, atendimento, mídia e publicação. Mesmo quando a peça está pronta, o time ainda perde tempo tentando centralizar feedback, confirmar o status e entender se o material pode seguir.

Essa dor importa porque:

- acontece com frequência
- afeta diretamente a produtividade
- gera desgaste entre equipe e aprovador
- aumenta o retrabalho
- reduz a previsibilidade da operação

Resolver esse ponto melhora a clareza do processo e reduz fricção no dia a dia.

---

## Como cheguei na solução

A escolha da solução partiu de uma lógica de produto orientada por MVP.

Em vez de criar uma plataforma ampla para todo o fluxo de marketing, a decisão foi focar em um recorte específico, recorrente e fácil de validar: o momento entre a criação do criativo e sua aprovação.

A partir disso, algumas decisões guiaram o produto:

- escolher uma dor operacional real e frequente
- evitar autenticação para reduzir atrito
- criar um fluxo claro e demonstrável
- separar quem revisa de quem gerencia
- priorizar simplicidade e clareza sobre volume de features

O resultado foi o AprovaFlow: um app direto, funcional e pensado para uso real.

---

## Quem usa o app

### Usuários principais
- social media
- designer
- atendimento
- gestor de marketing

### Usuários secundários
- cliente final
- coordenador
- aprovador interno

---

## Quando o app é usado na rotina

O AprovaFlow entra no processo quando a peça já está pronta para validação.

Exemplo de uso real:

1. O social media ou designer finaliza uma peça
2. Cadastra o post no AprovaFlow com título, canal, legenda e imagem
3. Gera um link público de revisão
4. Envia esse link para o cliente ou gestor
5. O aprovador abre o link sem login
6. Comenta, aprova ou solicita ajustes
7. O time acompanha o retorno no painel e toma a próxima ação

Esse é exatamente o trecho da rotina onde hoje costuma haver mais ruído.

---

## Fluxo prático de uso

### 1. Criação do post
A equipe interna cria um novo post informando:
- título
- canal
- legenda
- imagem

### 2. Geração de link público
Após o cadastro, o sistema cria uma rota pública para revisão da peça.

### 3. Revisão sem autenticação
O aprovador acessa o link e pode:
- visualizar a peça
- ler a legenda
- comentar
- aprovar
- solicitar ajuste

### 4. Acompanhamento interno
No painel, a equipe consegue:
- visualizar todos os posts
- acompanhar o status de cada item
- consultar comentários
- abrir a página pública
- copiar o link de revisão
- editar ou excluir posts
- navegar pelos itens com paginação

---

## Funcionalidades do MVP

O MVP entregue inclui:

- criação de post
- upload de imagem
- geração de link público único
- página pública sem autenticação
- campo de comentário
- ação de aprovação
- ação de solicitação de ajuste
- atualização de status da peça
- painel interno com listagem de posts
- visualização de comentários do post selecionado
- menu de ações por item
- ação de copiar link
- ação de abrir página pública
- ação de editar post
- ação de excluir post
- paginação no painel de posts
- paginação na lista de comentários

---

## Decisões de produto

### Sem autenticação na revisão
A pessoa que aprova não precisa criar conta nem entrar no sistema. Isso reduz atrito e deixa o fluxo mais próximo da realidade de agências.

### Link público por peça
Cada criativo tem sua própria página de revisão. Isso ajuda a manter o contexto e evita confusão entre campanhas.

### Separação entre revisão e gestão
Quem abre o link público pode revisar a peça, mas a gestão do conteúdo continua no painel interno. Isso mantém controle operacional com a equipe.

### Edição e exclusão apenas no painel
Se o aprovador solicita ajuste, quem altera o conteúdo é o time interno. Essa separação evita inconsistência e reflete melhor a dinâmica real entre agência e cliente.

### Painel com paginação
A paginação foi adicionada para tornar o painel escalável e mais realista, principalmente em cenários com muitos posts e muitos comentários.

### Menu de ações por item
Em vez de expor muitos botões na listagem, as ações foram agrupadas em um dropdown, deixando a interface mais limpa e profissional.

---

## O que ficou de fora

Para manter o foco no MVP, algumas funcionalidades foram propositalmente deixadas de fora:

- autenticação e perfis de acesso
- múltiplos aprovadores por peça
- histórico de versões
- notificações por e-mail ou WhatsApp
- reabertura automática do fluxo após edição
- filtros avançados por status e canal
- dashboard analítico
- integração com ferramentas externas de comunicação
- assistente de copy com IA

Esses pontos podem fazer parte de versões futuras, mas não eram necessários para validar a dor principal.

---

## Stack utilizada

- React
- Vite
- Tailwind CSS
- React Router
- Supabase Database
- Supabase Storage

---

## Estrutura principal do produto

### Página de criação
Tela para cadastro do criativo com título, canal, legenda e imagem.

### Página pública de revisão
Tela pública, sem login, usada pelo aprovador para revisar e interagir com a peça.

### Painel interno
Tela de acompanhamento com listagem paginada de posts, comentários, status e menu de ações.

---

## Instruções de execução

### 1. Clone o repositório
```bash
git clone <https://github.com/mizaeldragon/aprovaFlow.git>
cd aprovaflow
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Rode o projeto
```bash
npm run dev
```

### 5. Configure o Supabase
Além das variáveis de ambiente, o projeto depende de:
s
- tabelas `posts` e `comments`
- bucket de storage para imagens
- policies para leitura, inserção e atualização conforme o fluxo do MVP

---

## Link de deploy

Aplicação em produção:  
**[(https://aprova-flow-beta.vercel.app/)]**

Repositório / projeto:  
**[https://github.com/mizaeldragon/aprovaFlow]**

---

## Considerações finais

O AprovaFlow foi desenvolvido como um case de produto enxuto: identificar uma fricção real, recortar um momento crítico da rotina e construir uma solução funcional com baixo atrito de uso.

A principal escolha não foi tecnológica, e sim de foco. Em vez de tentar resolver todo o processo de marketing, o produto ataca um gargalo recorrente e fácil de demonstrar: a validação de criativos.

O resultado é um app simples, claro e aplicável ao contexto real de uma agência ou time de marketing.
