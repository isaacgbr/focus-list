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
| `/` | Landing Page |
| `/app` | Dashboard |
| `/app/areas/:areaId` | Listas de uma Área |
| `/app/areas/:areaId/listas/:listId` | Tarefas de uma Lista |
| `/app/arquivados` | Central de Arquivados |
| `/app/arquivados/areas/:areaId` | Conteúdo de uma Área arquivada |
| `/app/arquivados/listas/:listId` | Conteúdo de uma Lista em contexto arquivado |
| `/app/arquivados/tarefas/:taskId` | Detalhes de uma Tarefa arquivada |
| `/app/sobre` | Tela Sobre |

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
- O seletor Pendentes/Concluídas mostra um estado por vez. Em Cards, cada estado começa com até 12 itens e oferece **Ver mais/Recolher**. A visualização padrão Lista/Cards vem do Perfil REAL.
- No desktop, Dashboard e sidebar mostram inicialmente até seis Áreas e oferecem expansão quando há mais itens; no mobile, o Dashboard prioriza progresso, métricas e tarefas.
- As seções **Em andamento** e **Próximos prazos** do Dashboard exibem até três Tarefas cada.

## Navegação responsiva

Em larguras de até 800 px, a sidebar fixa se transforma em drawer acionado pelo cabeçalho, com backdrop. Enquanto aberto, o drawer contém o foco, fecha por `Escape` e devolve o foco anterior. Breadcrumbs e conteúdo se adaptam; grades, cabeçalhos, cards e detalhes da Tarefa reorganizam-se em breakpoints próprios.

Esse comportamento constitui uma **interface web responsiva e PWA instalável**. No mobile, Header, Dashboard, autenticação, listas, tarefas e modais possuem ajustes próprios de densidade, toque, teclado e safe areas.

Sem conexão, a aplicação substitui o conteúdo por uma tela Offline. Essa experiência não libera leitura ou escrita de tarefas: ao recuperar a rede, o usuário retorna ao fluxo online normal.

Rotas públicas: `/`, `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/demo` e `/demo/dados`. `/app` exige sessão; `/app/perfil` é exclusivo de conta REAL. Os caminhos antigos de Áreas, Arquivados e Sobre redirecionam para `/app`. Não há rota de Configurações.
