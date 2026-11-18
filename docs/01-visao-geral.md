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

O produto possui um núcleo funcional integrado a dados reais: Dashboard, gerenciamento de Áreas, Listas e Tarefas, modos Lista e Cards, prazos e prioridades, checklist, links e uma Central de Arquivados. Autenticação, recuperação de senha, Demo temporária, Perfil e avatar privado completam a V1.

A interface é responsiva e possui composições próprias para mobile, incluindo Dashboard compacto, navegação adaptável e modais adequados a telas menores. Como PWA, oferece instalação e uma tela Offline própria; dados e tarefas continuam dependendo de conexão e não são armazenados offline.

O detalhamento das funcionalidades existentes está na [Especificação Funcional](03-especificacao-funcional.md). As regras obrigatórias estão em [Regras de Negócio](04-regras-de-negocio.md).

## Limites atuais

Não fazem parte da V1:

- Tarefas Avulsas;
- Configurações;
- colaboração e compartilhamento;
- notificações e integrações externas;
- aplicativo mobile nativo.

O FocusList está publicado na Vercel em uma única origem. O frontend estático e a Function Express usam PostgreSQL e Storage privado no Supabase; a recuperação de senha usa Resend. O service worker guarda somente o shell Offline/PWA e nunca respostas da API ou dados do usuário. Há benchmarks históricos, anteriores ao fluxo autenticado atual.

## Princípios de escopo

- toda Tarefa pertence a uma Lista, e toda Lista pertence a uma Área;
- o Dashboard representa apenas dados ativos e reais;
- arquivar preserva conteúdo sem confundir arquivamento com exclusão;
- o produto evolui de forma incremental, com documentação coerente com o código;
- referências visuais antigas orientam conceitos, mas não substituem o estado atual da implementação.
