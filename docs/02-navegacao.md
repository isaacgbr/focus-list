# Navegação

## Estrutura principal

```text
Dashboard
└── Área
    └── Lista
        └── Detalhes da Tarefa
```

| Rota | Destino |
|---|---|
| `/` | Dashboard |
| `/areas/:areaId` | Listas de uma Área |
| `/areas/:areaId/listas/:listId` | Tarefas de uma Lista |
| `/arquivados` | Central de Arquivados |
| `/arquivados/areas/:areaId` | Conteúdo de uma Área arquivada |
| `/arquivados/listas/:listId` | Conteúdo de uma Lista em contexto arquivado |
| `/arquivados/tarefas/:taskId` | Detalhes de uma Tarefa arquivada |
| `/sobre` | Tela Sobre |

Os detalhes de uma Tarefa ativa abrem em modal e preservam o contexto da Lista. Ao selecionar uma Tarefa no Dashboard, a aplicação navega à Lista de origem e abre diretamente seus detalhes. Criação e edição também usam modais, e os breadcrumbs representam a rota e a hierarquia atuais.

## Fluxos de criação

```text
Dashboard ou sidebar → Nova Área
Área → Nova Lista
Lista → Nova Tarefa → Tarefa criada como A fazer
```

Ao tentar fechar a criação de uma Tarefa com algum campo preenchido, a aplicação solicita confirmação antes de descartar os dados. O fluxo é acionado pelo botão de fechar, Cancelar, clique no backdrop ou tecla `Escape`.

## Central de Arquivados

```text
Central de Arquivados
├── Área arquivada → indicador integrado no cabeçalho da Área
├── Lista arquivada → indicador integrado no cabeçalho da Lista
└── Tarefa arquivada → tratamento próprio nos Detalhes da Tarefa
```

A central lista apenas itens arquivados diretamente. Quando um pai está arquivado, seus descendentes permanecem acessíveis dentro desse contexto e não aparecem como entradas independentes.

- Área arquivada permite editar nome e descrição; a tela não oferece a edição completa de cor e ícone disponível para Áreas ativas.
- Lista arquivada permite editar nome e descrição.
- Tarefa arquivada usa o próprio `TaskDetails`, com estado visual arquivado, e mantém as edições disponibilizadas ali, inclusive status, prioridade, prazo, checklist e links.

Restauração e exclusão definitiva começam na Central de Arquivados. Uma Lista depende de sua Área ativa para ser restaurada; uma Tarefa depende de Lista e Área ativas.

## Visualizações e expansão

- Na Área, Listas alternam entre Lista e Cards.
- Na Lista, Tarefas alternam entre Lista e Cards e são separadas em Pendentes e Concluídas.
- Em Lista, a seção Concluídas inicia recolhida e pode ser expandida.
- Em Cards, Pendentes exibem inicialmente até 12 itens; Concluídas iniciam recolhidas e, quando abertas, também exibem inicialmente até 12. Controles **Ver mais/Recolher** ajustam o limite.
- Dashboard e sidebar mostram inicialmente até seis Áreas e oferecem expansão quando há mais itens.
- As seções **Em andamento** e **Próximos prazos** do Dashboard exibem até três Tarefas cada.

## Navegação responsiva

Em larguras de até 800 px, a sidebar fixa se transforma em drawer acionado pelo cabeçalho, com backdrop. Enquanto aberto, o drawer contém o foco, fecha por `Escape` e devolve o foco anterior. Breadcrumbs e conteúdo se adaptam; grades, cabeçalhos, cards e detalhes da Tarefa reorganizam-se em breakpoints próprios.

Esse comportamento constitui uma **interface web responsiva**. A validação Mobile/PWA Real em aparelho físico permanece futura.

Não existem rotas de Configurações, Landing Page ou Área Demo na aplicação atual.
