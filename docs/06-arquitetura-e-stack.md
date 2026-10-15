# Arquitetura e Stack

## Visão geral

O FocusList é um monorepo com aplicações independentes de frontend e backend.

```text
React + Vite
      ↓ HTTP/JSON
Express REST API
      ↓
Services
      ↓
Repositories
      ↓
Prisma 7
      ↓
PostgreSQL
```

## Tecnologias atuais

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Navegação | React Router 7 |
| Cliente HTTP | Axios |
| Ícones | Lucide React |
| Estilos | CSS próprio; Tailwind CSS 4 instalado |
| Backend | Node.js, Express 5, TypeScript |
| ORM | Prisma 7 com adapter PostgreSQL |
| Banco | PostgreSQL |
| Controle de versão | Git e GitHub |

## Frontend

O frontend separa componentes, layouts, páginas, rotas e serviços de API. `VITE_API_URL` define a base da API; o fallback é `http://localhost:3000`.

Rotas implementadas:

| Rota | Estado |
|---|---|
| `/` | Dashboard funcional |
| `/areas/:areaId` | Listas da Área |
| `/areas/:areaId/listas/:listId` | Tarefas da Lista |
| `/arquivados` | Central de Arquivados |
| `/arquivados/areas/:areaId` | Área arquivada |
| `/arquivados/listas/:listId` | Lista arquivada |
| `/arquivados/tarefas/:taskId` | Tarefa arquivada |
| `/sobre` | Tela Sobre |

Não há rota de Configurações, pois a funcionalidade não faz parte da V1. A Landing Page ainda não integra esta aplicação.

O estado de navegação permite que o Dashboard encaminhe à Lista de origem e abra diretamente os detalhes da Tarefa. O layout mantém breadcrumbs contextuais. Os modais compartilham gerenciamento de foco para foco inicial, contenção pelo teclado, fechamento por `Escape` e restauração do foco.

## Backend

```text
Route → Controller → Service → Repository → Prisma → PostgreSQL
```

- Routes definem método e caminho.
- Controllers convertem parâmetros e respostas HTTP.
- Services aplicam validações e regras de negócio.
- Repositories concentram consultas Prisma.
- O middleware global responde erros com status `400` e `{ "message": "..." }`.
- CORS e JSON estão habilitados globalmente.
- `PORT` possui fallback para `3000`; a conexão usa `DATABASE_URL`.

As validações de serviço rejeitam títulos vazios também nas atualizações, validam título e URL de Links, impedem vínculos com pais inexistentes ou arquivados, sincronizam `completedAt` com `completed` e protegem restauração e exclusão definitiva conforme a hierarquia.

## API REST

Não existe prefixo global de versão.

### Recursos principais

| Método | Rota | Resultado |
|---|---|---|
| `GET` | `/health` | saúde da API |
| `GET/POST` | `/areas` | listar/criar Áreas ativas |
| `GET/PUT/DELETE` | `/areas/:id` | consultar/editar/excluir Área |
| `PATCH` | `/areas/:id/archive` | arquivar Área |
| `PATCH` | `/areas/:id/restore` | restaurar Área |
| `GET/POST` | `/lists` | listar/criar Listas ativas |
| `GET/PUT/DELETE` | `/lists/:id` | consultar/editar/excluir Lista |
| `PATCH` | `/lists/:id/archive` | arquivar Lista |
| `PATCH` | `/lists/:id/restore` | restaurar Lista |
| `GET/POST` | `/tasks` | listar/criar Tarefas ativas |
| `GET/PUT/DELETE` | `/tasks/:id` | consultar/editar/excluir Tarefa |
| `PATCH` | `/tasks/:id/archive` | arquivar Tarefa |
| `PATCH` | `/tasks/:id/restore` | restaurar Tarefa |
| `GET/POST` | `/checklist-items` | listar/criar itens |
| `GET/PUT/DELETE` | `/checklist-items/:id` | consultar/editar/excluir item |
| `GET/POST` | `/links` | listar/criar links |
| `GET/PUT/DELETE` | `/links/:id` | consultar/editar/excluir link |

### Leitura de arquivados

| Método | Rota | Resultado |
|---|---|---|
| `GET` | `/archived` | central com itens arquivados diretamente |
| `GET` | `/archived/areas/:id` | Área arquivada e descendentes |
| `GET` | `/archived/lists/:id` | Lista em contexto arquivado e Tarefas |
| `GET` | `/archived/tasks/:id` | Tarefa em contexto arquivado, checklist e links |

Os `DELETE` de Área, Lista e Tarefa somente aceitam registros previamente arquivados. As exclusões de checklist e link permanecem operações de edição da Tarefa.

## Deploy

Ainda não realizado. O planejamento atual considera Vercel para o frontend, Render para o backend e PostgreSQL para persistência.
