# Validações técnicas

## Cobertura automatizada

| Área | Verificações principais |
| --- | --- |
| Autenticação | cadastro, login, cookies, expiração, revogação e rate limit |
| Isolamento | acesso cruzado a Áreas, Listas, Tarefas, checklist, links, Dashboard e Arquivados |
| Recuperação | neutralidade, token único, concorrência, rollback, Resend e `waitUntil` |
| Demo | expiração, CRUD isolado, importação, descarte e concorrência |
| Perfil | dados públicos, e-mail, senha, preferências e isolamento |
| Avatar | validação, Storage simulado, substituição, remoção e rollback |
| Produção Vercel | `/health`, SPA, rotas legadas, API JSON, PWA, cache e assets `404` |
| Frontend | prontidão da API, Offline, foco dos modais, temas, Perfil e filtros de prazo |

Suítes PostgreSQL controladas criam fixtures próprias e recusam execução sem a autorização explícita `FOCUSLIST_AUTH_TESTS=LOCAL_CONTROLLED`. Elas não devem ser apontadas para produção.

## Verificações de entrega

```text
Frontend: TypeScript + Vite build
Backend:  TypeScript build
Testes:   node:test
Higiene:  git diff --check
```

Validações de interface incluem desktop e larguras mobile, overflow horizontal, teclado, foco, alvos de toque, safe areas e `prefers-reduced-motion`.

## Referência de carga

Os benchmarks locais registraram respostas HTTP sem erro nos cenários avaliados. Coleções grandes de checklist e Tarefas foram o principal custo, indicando paginação ou consultas mais específicas como estratégias de escala. Testes concorrentes mostraram aumento de latência sem ganho proporcional de vazão em cargas elevadas.

Essas medições são referência de engenharia, não uma estimativa da latência atual da Vercel ou do Supabase. Scripts, datasets e resultados detalhados permanecem fora do repositório público.
