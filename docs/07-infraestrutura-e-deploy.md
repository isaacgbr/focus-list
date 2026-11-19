# Infraestrutura e deploy

## Topologia de produção

| Componente | Serviço |
| --- | --- |
| Frontend e PWA | Vercel CDN |
| API Express | Vercel Function com Fluid Compute |
| PostgreSQL | Supabase, acessado pelo Session Pooler |
| Avatares | Bucket privado do Supabase Storage |
| Recuperação de senha | Resend |

Frontend e API compartilham `https://focus-list-nine.vercel.app`. Essa topologia simplifica cookies, CORS e navegação autenticada.

## Vercel

`vercel.json` publica `frontend/dist`, encaminha API e `/health` para `api/focuslist.mjs` e entrega deep links React pelo `index.html`. Arquivos PWA são estáticos reais; assets inexistentes permanecem `404`.

A Function exporta o Express sem chamar `listen`. `@vercel/functions` integra o pool PostgreSQL ao runtime e fornece `waitUntil` para o envio de recuperação de senha. `server.ts` existe apenas para desenvolvimento e execução local.

## Supabase e Prisma

Prisma 7 usa `@prisma/adapter-pg` e a URI do Session Pooler. O build gera o Prisma Client; alterações versionadas do banco são aplicadas com `prisma migrate deploy`. A aplicação não usa `db push`, migrations de desenvolvimento ou filesystem persistente em produção.

O bucket de avatares permanece privado. `SUPABASE_SECRET_KEY` é usada somente no backend; URLs públicas não são salvas nem entregues ao cliente.

## Variáveis

| Ambiente | Variáveis configuráveis |
| --- | --- |
| Backend/produção | `DATABASE_URL`, `FRONTEND_ORIGIN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_STORAGE_BUCKET` |
| Desenvolvimento local | as anteriores, `PORT`, `HOST`, `FOCUSLIST_LAN_ORIGIN` quando necessário |
| Frontend local | `VITE_API_URL` opcional |

Produção não depende de `VITE_API_URL`, pois a API usa a mesma origem. Nenhum segredo utiliza prefixo `VITE_`.

## PWA e Offline

O service worker mantém uma lista fechada de recursos públicos: `offline.html`, `offline.css`, `offline.js` e a marca. Navegações da aplicação tentam a rede e usam `offline.html` apenas quando ela falha.

API, autenticação, uploads e dados privados nunca são armazenados ou servidos pelo service worker. Ao recuperar a conexão, a aplicação volta ao fluxo online normal.
