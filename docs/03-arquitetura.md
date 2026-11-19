# Arquitetura

## Visão geral

```text
Navegador
├── Vercel CDN → React 19 + Vite 6 + React Router
└── Vercel Function → Express 5
                         ↓
              Controller → Service → Repository
                         ↓
                 Prisma 7 + PostgreSQL
                    ├── Supabase Storage
                    └── Resend
```

Frontend e API compartilham a mesma origem em produção. Em desenvolvimento, Vite e Express executam separadamente.

## Organização do repositório

| Caminho | Responsabilidade |
| --- | --- |
| `frontend/` | SPA, PWA, páginas, componentes e serviços HTTP |
| `backend/src/routes` | Métodos e caminhos HTTP |
| `backend/src/controllers` | Conversão entre HTTP e casos de uso |
| `backend/src/services` | Regras, validações e transações |
| `backend/src/repositories` | Persistência Prisma e Storage |
| `backend/prisma` | Schema e migrations PostgreSQL |
| `api/focuslist.mjs` | Entrada da Function na Vercel |
| `vercel.json` | Build, arquivos estáticos e roteamento |

## Backend

O Express registra `/health`, autenticação e Demo antes do middleware de sessão. Perfil, Dashboard, Arquivados e os recursos do domínio são privados. Rotas inexistentes retornam JSON `404`; erros inesperados são sanitizados pelo middleware global.

Services verificam ownership, vínculos com pais ativos, regras de arquivamento e consistência transacional. Repositories concentram Prisma e a integração HTTP com o bucket privado de avatares.

## Frontend

React Router controla Landing, autenticação, recuperação e as rotas de `/app`. Os serviços Axios usam a origem da página em produção e `VITE_API_URL` opcionalmente no desenvolvimento.

Deep links da SPA são direcionados para `index.html`; caminhos de API, `/health`, arquivos PWA e assets nunca recebem fallback HTML indevido. Rotas legadas de Área chegam à SPA apenas em navegação HTML e são convertidas para os caminhos canônicos de `/app`.

## Cache

- respostas privadas e API: `Cache-Control: no-store` e `Vercel-CDN-Cache-Control: no-store`;
- HTML da SPA: `no-store`;
- service worker, manifest e arquivos Offline: `no-cache`;
- assets com hash: cache público imutável;
- requisições inexistentes de assets: `404`, sem fallback da SPA.
