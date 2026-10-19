# Visão Geral

## Objetivo e proposta

O FocusList é uma aplicação web de organização pessoal baseada em uma hierarquia curta:

```text
Área
└── Lista
    └── Tarefa
```

Seu objetivo é tornar prioridades e próximos passos visíveis com pouco esforço. A proposta favorece foco, previsibilidade e baixa carga visual em vez de acumular recursos.

O público inclui estudantes, profissionais, desenvolvedores e pessoas que organizam atividades pessoais ou projetos individuais.

## Escopo atual

O produto possui um núcleo funcional integrado a dados reais: Dashboard, gerenciamento de Áreas, Listas e Tarefas, modos Lista e Cards, prazos e prioridades, checklist, links e uma Central de Arquivados. A Etapa 19C concluiu o refinamento da experiência desktop e consolidou consistência visual e acessibilidade.

A interface web é responsiva e inclui sidebar adaptável, reorganização de conteúdo e modais adequados a larguras menores. Isso não equivale a um aplicativo mobile, PWA ou experiência mobile validada em aparelho físico.

O detalhamento das funcionalidades existentes está na [Especificação Funcional](03-especificacao-funcional.md). As regras obrigatórias estão em [Regras de Negócio](04-regras-de-negocio.md).

## Limites atuais

Não fazem parte da V1:

- Tarefas Avulsas;
- Configurações;
- autenticação e contas;
- colaboração e compartilhamento;
- notificações e integrações externas;
- aplicativo mobile nativo.

Também ainda não estão implementados PWA, funcionamento offline, Mobile/PWA Real, Landing Page, Área Demo, microinterações futuras, testes de carga ou escalabilidade, preparação final para publicação e deploy.

## Princípios de escopo

- toda Tarefa pertence a uma Lista, e toda Lista pertence a uma Área;
- o Dashboard representa apenas dados ativos e reais;
- arquivar preserva conteúdo sem confundir arquivamento com exclusão;
- o produto evolui de forma incremental, com documentação coerente com o código;
- referências visuais antigas orientam conceitos, mas não substituem o estado atual da implementação.
