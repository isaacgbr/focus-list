# Navegação

## Fluxo principal implementado

```text
Dashboard
└── Área
    └── Lista
        └── Detalhes da Tarefa
```

- O Dashboard é a rota inicial (`/`).
- Uma Área abre em `/areas/:areaId`.
- Uma Lista abre em `/areas/:areaId/listas/:listId`.
- Os detalhes de uma Tarefa abrem em modal, preservando o contexto da Lista.
- Criação e edição de entidades também usam modais.

## Central de Arquivados

A aplicação possui uma única entrada **Arquivados**, em `/arquivados`.

```text
Central de Arquivados
├── Área arquivada → /arquivados/areas/:areaId
├── Lista arquivada → /arquivados/listas/:listId
└── Tarefa arquivada → /arquivados/tarefas/:taskId
```

A central lista somente itens arquivados diretamente. Quando um pai está arquivado, seus filhos acompanham seu contexto e não aparecem como entradas independentes. Ao abrir um item, a aplicação reutiliza a experiência da entidade ativa, com aviso de modo arquivado e edição habilitada.

Restauração e exclusão definitiva são iniciadas na Central de Arquivados. Uma Lista só pode ser restaurada com sua Área ativa; uma Tarefa só pode ser restaurada com sua Lista e Área ativas.

## Fluxos de criação

```text
Dashboard ou sidebar → Nova Área → Área criada
Área → Nova Lista → Lista criada
Lista → Nova Tarefa → Tarefa criada como A fazer
```

## Dashboard

Enquanto não há Tarefas, o Dashboard orienta a criação da próxima entidade necessária. Quando existem Tarefas, apresenta indicadores e agrupamentos com dados reais. Uma Tarefa pode ser aberta diretamente pelo Dashboard.

## Rotas incompletas

- `/avulsas`: placeholder; não há fluxo funcional de Avulsas.
- `/configuracoes`: placeholder legado; a funcionalidade foi descartada da V1 e substituída pela Tela Sobre.
- Tela Sobre: aprovada, mas ainda sem rota ou implementação.
- Landing Page: planejada para a publicação da V1, ainda sem rota ou implementação.

## Modos de visualização

A lista de Tarefas possui atualmente apenas visualização em lista. O modo Cards tem protótipo aprovado, mas ainda não está implementado.
