# Arquitetura e Stack

## Visão geral

O FocusList é um monorepo publicado em uma única origem na Vercel:

```text
Vercel CDN → React + Vite (estático/PWA)
      ↓ mesma origem
Vercel Function → Express REST API
      ↓
Controller → Service → Repository
      ↓
Prisma 7 → Supabase Session Pooler → PostgreSQL
```

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript e Vite 6 |
| Navegação | React Router 7 |
| Cliente HTTP | Axios |
| Ícones | Lucide React |
| Estilos | CSS próprio; Tailwind CSS 4 instalado |
| Backend | Node.js, Express 5 e TypeScript |
| ORM | Prisma 7 com adapter PostgreSQL |
| Banco | PostgreSQL no Supabase |
| Arquivos | Supabase Storage privado |
| E-mail | Resend |
| Produção | Vercel: CDN estática + Function Node.js |
| Versionamento | Git e GitHub |

## Frontend

O frontend separa componentes, hooks, layouts, páginas, rotas e serviços de API. Em produção, usa a mesma origem da página; em desenvolvimento, `VITE_API_URL` pode definir a API e possui fallback para `http://localhost:3000`.

Rotas implementadas:

| Rota | Conteúdo |
|---|---|
| `/` | Landing Page |
| `/app` | Dashboard |
| `/app/areas/:areaId` | Listas da Área |
| `/app/areas/:areaId/listas/:listId` | Tarefas da Lista |
| `/app/arquivados` | Central de Arquivados |
| `/app/arquivados/areas/:areaId` | Área arquivada e descendentes |
| `/app/arquivados/listas/:listId` | Lista em contexto arquivado e Tarefas |
| `/app/arquivados/tarefas/:taskId` | Tarefa em contexto arquivado |
| `/app/sobre` | Tela Sobre |
| `/app/perfil` | Perfil da conta REAL |
| `/login`, `/cadastro` | Autenticação |
| `/recuperar-senha`, `/redefinir-senha` | Recuperação |
| `/demo`, `/demo/dados` | Encerramento e decisão de importação da Demo |

O estado de navegação permite abrir, a partir do Dashboard, a Tarefa dentro de sua Lista. Preferências locais de interface, como o tema da capa, usam `localStorage`; os dados do domínio permanecem no backend.

A responsividade é implementada em CSS com breakpoints e composições específicas para sidebar, Dashboard, autenticação, listas, tarefas, Arquivados, Sobre e `TaskDetails`. A sidebar funciona como drawer em até 800 px.

Manifest, ícones e service worker permitem instalação como PWA. O service worker disponibiliza apenas o shell da tela Offline e arquivos públicos necessários; não cacheia API, autenticação ou dados do usuário. O FocusList continua exigindo conexão para operar.

## Backend

```text
Route → Controller → Service → Repository → Prisma → PostgreSQL
```

- Routes associam método e caminho.
- Controllers convertem parâmetros e respostas HTTP.
- Services aplicam validações e regras de negócio.
- Repositories concentram consultas Prisma.
- CORS e JSON estão habilitados globalmente.
- O middleware global preserva os status de domínio, trata JSON inválido/payload excessivo e responde falhas inesperadas com `500` genérico e log sanitizado.
- `PORT` usa `3000` por padrão somente no servidor local; a Function é exportada por `api/focuslist.mjs` na Vercel.
- Prisma usa `DATABASE_URL` com o Session Pooler do Supabase e integra o pool ao runtime da Vercel.
- Avatares são objetos JPEG no bucket privado indicado por `SUPABASE_STORAGE_BUCKET`; somente `avatarKey` fica no PostgreSQL.
- Recuperação de senha usa Resend e `waitUntil` para concluir o envio após a resposta HTTP.

Para Área, Lista e Tarefa, os Services protegem vínculos com pais ativos, conclusão, restauração e exclusão definitiva. Checklist e Link usam busca irrestrita da Tarefa (`findAnyById`), por isso suas operações também funcionam quando a Tarefa está arquivada.

## API REST

Não existe prefixo global de versão.

### Recursos principais

| Método | Rota | Resultado |
|---|---|---|
| `GET` | `/health` | Saúde da API |
| `GET/POST` | `/areas` | Listar/criar Áreas ativas |
| `GET/PUT/DELETE` | `/areas/:id` | Consultar/editar/excluir Área |
| `PATCH` | `/areas/:id/archive` | Arquivar Área |
| `PATCH` | `/areas/:id/restore` | Restaurar Área |
| `GET/POST` | `/lists` | Listar/criar Listas ativas |
| `GET/PUT/DELETE` | `/lists/:id` | Consultar/editar/excluir Lista |
| `PATCH` | `/lists/:id/archive` | Arquivar Lista |
| `PATCH` | `/lists/:id/restore` | Restaurar Lista |
| `GET/POST` | `/tasks` | Listar/criar Tarefas ativas |
| `GET/PUT/DELETE` | `/tasks/:id` | Consultar/editar/excluir Tarefa |
| `PATCH` | `/tasks/:id/archive` | Arquivar Tarefa |
| `PATCH` | `/tasks/:id/restore` | Restaurar Tarefa |
| `GET/POST` | `/checklist-items` | Listar/criar itens de checklist |
| `GET/PUT/DELETE` | `/checklist-items/:id` | Consultar/editar/excluir item |
| `GET/POST` | `/links` | Listar/criar links |
| `GET/PUT/DELETE` | `/links/:id` | Consultar/editar/excluir link |

### Leitura de arquivados

| Método | Rota | Resultado |
|---|---|---|
| `GET` | `/archived` | Itens diretamente arquivados |
| `GET` | `/archived/areas/:id` | Área arquivada e descendentes |
| `GET` | `/archived/lists/:id` | Lista em contexto arquivado e Tarefas |
| `GET` | `/archived/tasks/:id` | Tarefa arquivada, checklist e links |

Os `DELETE` de Área, Lista e Tarefa exigem arquivamento prévio. Exclusões de checklist e link permanecem operações comuns de edição.

## Produção

A Vercel é a hospedagem oficial. `vercel.json` separa arquivos estáticos, rotas da Function, deep links da SPA e arquivos PWA. API e respostas privadas usam `no-store`; assets com hash podem receber cache imutável da plataforma.

Autenticação, recuperação, Demo e Perfil estão documentados em [08-autenticacao.md](08-autenticacao.md), [09-demo.md](09-demo.md) e [10-perfil.md](10-perfil.md). Benchmarks públicos são apenas um resumo histórico em [11-benchmarks.md](11-benchmarks.md).
