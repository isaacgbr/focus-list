# Arquitetura e Stack

## Visão geral

O FocusList é um monorepo com frontend e backend independentes:

```text
React + Vite
      ↓ HTTP/JSON
Express REST API
      ↓
Controller → Service → Repository
      ↓
Prisma 7 → PostgreSQL
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
| Banco | PostgreSQL |
| Versionamento | Git e GitHub |

## Frontend

O frontend separa componentes, hooks, layouts, páginas, rotas e serviços de API. `VITE_API_URL` define a base da API e possui fallback para `http://localhost:3000`.

Rotas implementadas:

| Rota | Conteúdo |
|---|---|
| `/` | Dashboard |
| `/areas/:areaId` | Listas da Área |
| `/areas/:areaId/listas/:listId` | Tarefas da Lista |
| `/arquivados` | Central de Arquivados |
| `/arquivados/areas/:areaId` | Área arquivada e descendentes |
| `/arquivados/listas/:listId` | Lista em contexto arquivado e Tarefas |
| `/arquivados/tarefas/:taskId` | Tarefa em contexto arquivado |
| `/sobre` | Tela Sobre |

O estado de navegação permite abrir, a partir do Dashboard, a Tarefa dentro de sua Lista. Preferências locais de interface, como o tema da capa, usam `localStorage`; os dados do domínio permanecem no backend.

A responsividade é implementada em CSS com breakpoints para sidebar, Dashboard, grades, listas, Arquivados, Sobre e `TaskDetails`. A sidebar funciona como drawer em até 800 px. Isso descreve uma interface web responsiva, não uma PWA ou aplicação mobile validada.

## Backend

```text
Route → Controller → Service → Repository → Prisma → PostgreSQL
```

- Routes associam método e caminho.
- Controllers convertem parâmetros e respostas HTTP.
- Services aplicam validações e regras de negócio.
- Repositories concentram consultas Prisma.
- CORS e JSON estão habilitados globalmente.
- O middleware global responde erros com status `400` e `{ "message": "..." }`.
- `PORT` usa `3000` por padrão e a conexão usa `DATABASE_URL`.

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

## Estado de publicação

Não há deploy final. PWA, offline, validação Mobile/PWA Real, testes de carga, Landing Page e Área Demo não fazem parte da arquitetura implementada. A sequência planejada está no [Roadmap](07-roadmap.md).
