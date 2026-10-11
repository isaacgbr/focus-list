# Documentação do Projeto

## 01. Visão Geral

Este documento apresenta uma visão geral do projeto, seu propósito,
público-alvo e o escopo da primeira versão (MVP).

------------------------------------------------------------------------

## Sobre o Projeto

O projeto é uma aplicação web de organização pessoal voltada para
gerenciamento de tarefas de forma simples, intuitiva e organizada.

A proposta é oferecer uma experiência moderna, focada em produtividade,
sem excesso de funcionalidades ou complexidade desnecessária.

------------------------------------------------------------------------

## Objetivo

Permitir que qualquer pessoa organize suas tarefas em uma estrutura
clara:

Área → Lista → Tarefa

Com isso, o usuário consegue separar diferentes contextos (estudos,
trabalho, pessoal, etc.) mantendo cada atividade organizada.

------------------------------------------------------------------------

## Público-alvo

-   Estudantes;
-   Desenvolvedores;
-   Profissionais;
-   Pessoas que desejam organizar tarefas do dia a dia.

------------------------------------------------------------------------

## Escopo do MVP

A primeira versão contempla:

-   Dashboard inicial;
-   Gerenciamento de Áreas;
-   Gerenciamento de Listas;
-   Gerenciamento de Tarefas;
-   Visualização em Lista;
-   Visualização em Cards;
-   Checklist por tarefa;
-   Links de referência;
-   Prazos;
-   Prioridades;
-   Arquivamento de tarefas concluídas.

------------------------------------------------------------------------

## Fora do Escopo (MVP)

Nesta primeira versão não fazem parte do projeto:

-   Login e cadastro;
-   Sincronização entre dispositivos;
-   Compartilhamento de tarefas;
-   Colaboração em tempo real;
-   Aplicativo mobile nativo;
-   Notificações;
-   Integrações externas.

Esses recursos poderão ser avaliados em versões futuras.

------------------------------------------------------------------------

## Princípios do Projeto

-   Simplicidade acima de quantidade de recursos.
-   Interface limpa e intuitiva.
-   Organização por Áreas, Listas e Tarefas.
-   Desktop como foco inicial.
-   Responsividade planejada para evolução futura.
-   Documentação clara e objetiva.

------------------------------------------------------------------------

## Tecnologias

O backend do MVP utiliza Node.js, Express, TypeScript, Prisma e
PostgreSQL. O frontend está planejado com React, Vite e Tailwind CSS.

------------------------------------------------------------------------

## Estado Atual

O backend do MVP possui os módulos de Áreas, Listas, Tarefas, Itens de
Checklist e Links implementados. Cada módulo disponibiliza operações de
criação, listagem, consulta por ID, atualização e exclusão por meio da
API REST.

Também estão implementados o endpoint de saúde da API, a persistência em
PostgreSQL, as relações entre as entidades e o tratamento global de
erros. Autenticação não faz parte do MVP.

------------------------------------------------------------------------

**Versão:** 0.2
