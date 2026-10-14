# Visão Geral

## Produto

O FocusList é uma aplicação web de organização pessoal. Sua estrutura principal é:

```text
Área
└── Lista
    └── Tarefa
```

O produto busca oferecer clareza, foco e baixo esforço, sem excesso de funcionalidades ou poluição visual.

## Público-alvo

- estudantes;
- desenvolvedores e profissionais;
- pessoas que desejam organizar atividades pessoais e projetos.

## Escopo funcional atual

Estão implementados:

- Dashboard integrado a dados reais;
- CRUD de Áreas, Listas e Tarefas;
- conclusão e reabertura de Tarefas;
- prazo e prioridade;
- itens de checklist e links de referência;
- Central única de Arquivados;
- arquivamento de Área, Lista e Tarefa;
- edição de itens arquivados;
- restauração e exclusão definitiva de itens arquivados.

O backend persiste os dados em PostgreSQL e expõe uma API REST. O frontend React consome essa API.

## Decisões aprovadas com implementação pendente

- **Tela Sobre — Etapa 16:** visual aprovado com Hero, O que é, Como funciona, Recursos principais e Desenvolvido por.
- **Identidade Visual — Etapa 17:** Conceito A aprovado, com organização por camadas, visual 3D minimalista e azul como cor principal.
- **Visualização em Cards:** possui protótipo aprovado, mas a tela atual de Tarefas implementa somente a visualização em lista.

## Planejado para a V1

- implementar a tela Sobre aprovada;
- aplicar a identidade visual aprovada;
- implementar a Landing Page antes da publicação;
- concluir os itens de interface ainda pendentes e realizar o deploy.

## Fora do escopo atual

- login e cadastro;
- sincronização entre dispositivos;
- colaboração e compartilhamento;
- notificações;
- aplicativo mobile nativo;
- integrações externas.

## Princípios

- simplicidade acima da quantidade de recursos;
- interface limpa, moderna e consistente;
- organização por Área, Lista e Tarefa;
- desktop-first;
- evolução incremental com documentação atualizada.
