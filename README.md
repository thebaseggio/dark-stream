# Dark Stream

Plataforma de streaming de conteúdo investigativo e true crime — [darkstream.tv](https://darkstream.tv).

Frontend em React + Vite, backend em Supabase (auth, banco, storage e edge functions), deploy na Vercel.

## Stack

- **Frontend:** React 18, Vite 6, Tailwind CSS, Framer Motion, React Router
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Upload de vídeo:** tus-js-client (upload resumível)
- **Deploy:** Vercel (SPA)

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- Conta no [Supabase](https://supabase.com/)
- Conta na [Vercel](https://vercel.com/) (para deploy)

## Setup local

```bash
git clone https://github.com/thebaseggio/dark-stream.git
cd dark-stream
npm install
cp .env.example .env
```

Edite o `.env` com as credenciais do seu projeto Supabase (Settings → API):

| Variável | Onde encontrar |
|----------|----------------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon / public key |

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 5173) |
| `npm run lint` | Verificação estática com ESLint |
| `npm test` | Testes unitários com Jest |
| `npm run check` | Lint, testes e build em sequência |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Preview local do build |

> Para rodar `npm run build` localmente, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env`.

## Supabase

### Projeto linkado

Se ainda não linkou o CLI ao projeto remoto:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
```

O `project-ref` aparece na URL do dashboard: `https://supabase.com/dashboard/project/<project-ref>`.

### Edge Function: formulário de parceiros

A página `/seja-um-parceiro` chama a function `send-partner-application`, que envia e-mail via [Resend](https://resend.com/).

Configure os secrets no Supabase (Dashboard → Edge Functions → Secrets, ou via CLI):

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxx
npx supabase secrets set TO_EMAIL_ADDRESS=seu-email@exemplo.com
```

| Secret | Descrição |
|--------|-----------|
| `RESEND_API_KEY` | API key do Resend |
| `TO_EMAIL_ADDRESS` | E-mail que recebe as candidaturas de parceiros |

Deploy da function:

```bash
npx supabase functions deploy send-partner-application
```

A function valida campos, escapa HTML nos e-mails, limita a 3 envios por hora por IP e retorna erro genérico em falhas internas.

## Segurança (RLS)

Políticas recomendadas estão em `supabase/migrations/`. **Revise no Dashboard antes de aplicar** — o banco remoto pode já ter políticas equivalentes.

```bash
# Exportar schema real (requer senha do banco)
npx supabase db pull

# Revisar e aplicar políticas recomendadas
# SQL Editor no Dashboard ou: npx supabase db push
```

Consulte `supabase/migrations/README.md` para o checklist completo de auditoria RLS.

## Upload de vídeos

O formulário de upload valida os arquivos antes de enviar para o Supabase:

| Arquivo | Formatos aceitos | Limite |
|---------|------------------|--------|
| Vídeo | `video/mp4`, `video/webm` | 2 GB |
| Thumbnail | `image/jpeg`, `image/png`, `image/webp` | 5 MB |

Ao substituir o arquivo de um vídeo existente, o banco só é atualizado depois que o novo upload termina com sucesso.

## Deploy na Vercel

1. Importe o repositório [thebaseggio/dark-stream](https://github.com/thebaseggio/dark-stream) na Vercel.
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Em **Settings → Environment Variables**, adicione:

| Variável | Ambiente |
|----------|----------|
| `VITE_SUPABASE_URL` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview, Development |

6. Configure o domínio customizado (`darkstream.tv`) em **Settings → Domains**.

O `vercel.json` já inclui o rewrite SPA para o React Router.

## Estrutura do projeto

```
src/
  App.jsx              # Rotas e auth global
  supabase.js          # Cliente Supabase
  contexts/            # Providers (upload, notificações)
  pages/               # Páginas da aplicação
  components/          # Componentes reutilizáveis
  worker.js            # Web Worker para upload TUS
public/                # Assets estáticos (imagens, áudio)
supabase/
  functions/           # Edge Functions
  config.toml          # Configuração do Supabase CLI
```

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/casos`, `/explorar` | Explorar conteúdo |
| `/video/:id`, `/caso/:id` | Player de vídeo |
| `/parceiro/:id` | Perfil público do parceiro |
| `/meu-perfil` | Dashboard (parceiro) ou perfil (visitante) |
| `/seja-um-parceiro` | Formulário de candidatura |
| `/login`, `/inscrever-se` | Autenticação |

## Links

- Repositório: https://github.com/thebaseggio/dark-stream
- Preview Vercel: https://dark-stream.vercel.app
- Site: https://darkstream.tv
