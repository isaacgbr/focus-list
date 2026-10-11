# Documentação do Projeto

## 06. Arquitetura e Stack

Este documento registra a arquitetura adotada para o projeto e as
principais decisões técnicas definidas antes do desenvolvimento.

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
  Backend              Node.js + Express
  API                  REST
  ORM                  Prisma
  Banco de Dados       PostgreSQL
  Controle de Versão   Git + GitHub

------------------------------------------------------------------------

## Arquitetura

O projeto será organizado em formato **Monorepo**, separando claramente
frontend e backend.

``` text
to-do-list/

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

Arquitetura prevista:

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

**Versão:** 0.1
