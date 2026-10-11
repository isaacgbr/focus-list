# Documentação do Projeto

## 06. Arquitetura e Stack

Este documento registra a arquitetura adotada, o fluxo do backend e a
estrutura atual da API do projeto.

------------------------------------------------------------------------

## Objetivo

Construir uma aplicação organizada, escalável e de fácil manutenção,
utilizando tecnologias amplamente adotadas pelo mercado.

------------------------------------------------------------------------

## Stack Oficial

  Camada               Tecnologia
  -------------------- -------------------
  Frontend             React + Vite
  Linguagem            TypeScript
  Estilização          Tailwind CSS
  Backend              Node.js + Express 5
  API                  REST
  ORM                  Prisma 7
  Banco de Dados       PostgreSQL
  Controle de Versão   Git + GitHub

------------------------------------------------------------------------

## Arquitetura

O projeto está organizado em formato **Monorepo**, separando claramente
frontend e backend.

``` text
FocusList/

├── frontend/
├── backend/
├── docs/
├── prototipos/
└── README.md
```

------------------------------------------------------------------------

## Comunicação

``` text
Frontend (React)
        │
        ▼
API REST (Express)
        │
        ▼
Prisma
        │
        ▼
PostgreSQL
```

O frontend nunca acessa o banco diretamente.

------------------------------------------------------------------------

## Frontend

Responsável por:

-   Interface do usuário;
-   Navegação;
-   Consumo da API;
-   Validações visuais;
-   Experiência do usuário.

------------------------------------------------------------------------

## Backend

Responsável por:

-   Regras de negócio;
-   Validação dos dados;
-   Comunicação com o banco;
-   Endpoints da API.

Arquitetura implementada:

``` text
Routes
    ↓
Controllers
    ↓
Services
    ↓
Repositories
    ↓
Prisma
    ↓
PostgreSQL
```

### Fluxo de uma requisição

``` text
Requisição HTTP
    ↓
Route seleciona o Controller
    ↓
Controller converte parâmetros e define a resposta HTTP
    ↓
Service valida regras e existência das relações
    ↓
Repository executa a operação pelo Prisma
    ↓
PostgreSQL persiste ou retorna os dados
```

Erros lançados pelas camadas são encaminhados ao middleware global, que
responde com status `400` e o corpo `{ "message": "..." }`.

------------------------------------------------------------------------

## Estrutura do Backend

``` text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
└── src/
    ├── config/
    ├── controllers/
    ├── middlewares/
    ├── repositories/
    ├── routes/
    ├── services/
    ├── app.ts
    └── server.ts
```

O servidor usa a porta definida em `PORT`, com fallback para `3000`, e
a conexão PostgreSQL usa `DATABASE_URL`. CORS e leitura de corpos JSON
estão habilitados globalmente.

------------------------------------------------------------------------

## API REST

Não há prefixo global de versão. Os módulos de Áreas, Listas, Tarefas,
Itens de Checklist e Links seguem o mesmo conjunto de operações:

| Método | Rota | Resultado em caso de sucesso |
|--------|------|------------------------------|
| GET | `/areas` | Lista todas as Áreas (`200`) |
| GET | `/areas/:id` | Consulta uma Área (`200`) |
| POST | `/areas` | Cria uma Área (`201`) |
| PUT | `/areas/:id` | Atualiza uma Área (`200`) |
| DELETE | `/areas/:id` | Exclui uma Área (`204`) |
| GET | `/lists` | Lista todas as Listas (`200`) |
| GET | `/lists/:id` | Consulta uma Lista (`200`) |
| POST | `/lists` | Cria uma Lista (`201`) |
| PUT | `/lists/:id` | Atualiza uma Lista (`200`) |
| DELETE | `/lists/:id` | Exclui uma Lista (`204`) |
| GET | `/tasks` | Lista todas as Tarefas (`200`) |
| GET | `/tasks/:id` | Consulta uma Tarefa (`200`) |
| POST | `/tasks` | Cria uma Tarefa (`201`) |
| PUT | `/tasks/:id` | Atualiza uma Tarefa (`200`) |
| DELETE | `/tasks/:id` | Exclui uma Tarefa (`204`) |
| GET | `/checklist-items` | Lista todos os Itens de Checklist (`200`) |
| GET | `/checklist-items/:id` | Consulta um Item de Checklist (`200`) |
| POST | `/checklist-items` | Cria um Item de Checklist (`201`) |
| PUT | `/checklist-items/:id` | Atualiza um Item de Checklist (`200`) |
| DELETE | `/checklist-items/:id` | Exclui um Item de Checklist (`204`) |
| GET | `/links` | Lista todos os Links (`200`) |
| GET | `/links/:id` | Consulta um Link (`200`) |
| POST | `/links` | Cria um Link (`201`) |
| PUT | `/links/:id` | Atualiza um Link (`200`) |
| DELETE | `/links/:id` | Exclui um Link (`204`) |

O endpoint `GET /health` retorna status `200` com o estado da API.

### Corpos de criação

| Recurso | Campos obrigatórios | Campos opcionais |
|---------|---------------------|------------------|
| Área | `title` | `description`, `color`, `icon` |
| Lista | `title`, `areaId` | `description` |
| Tarefa | `title`, `listId` | `description`, `dueDate`, `priority`, `completed`, `completedAt` |
| Item de Checklist | `title` ou `text`, `taskId` | `completed` |
| Link | `title`, `url`, `taskId` | — |

As atualizações usam os mesmos campos de forma opcional e podem alterar
a relação por `areaId`, `listId` ou `taskId`. O backend verifica a
existência do registro pai antes de criar ou mover um recurso. As
listagens são ordenadas por `title` em ordem crescente e retornam apenas
os campos do próprio recurso, sem inclusão automática das relações.

Na criação, títulos vazios são rejeitados em todos os módulos e a URL do
Link também não pode ser vazia. Não há validação de formato da URL. As
atualizações atuais não repetem as validações de conteúdo dos campos.

------------------------------------------------------------------------

## Banco de Dados

-   PostgreSQL desde o MVP.
-   Prisma como ORM.
-   Estrutura baseada no modelo de dados definido em
    `05-modelo-de-dados.md`.

------------------------------------------------------------------------

## Deploy

Frontend: - Vercel

Backend: - Render

Banco: - PostgreSQL

------------------------------------------------------------------------

## Decisões Técnicas

-   Desktop-first.
-   Responsividade como evolução contínua.
-   Sem login no MVP.
-   Persistência em banco desde a primeira versão.
-   Código em TypeScript.
-   Interface construída com Tailwind CSS.

------------------------------------------------------------------------

## Princípios

-   Simplicidade.
-   Organização em camadas.
-   Baixo acoplamento.
-   Código reutilizável.
-   Documentação atualizada.
-   Evolução incremental.

------------------------------------------------------------------------

**Versão:** 0.2
