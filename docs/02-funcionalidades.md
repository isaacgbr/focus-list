# Funcionalidades

## Organização e Dashboard

| Recurso | Comportamento |
| --- | --- |
| Áreas | Agrupam contextos e possuem título, descrição, cor e ícone opcionais |
| Listas | Pertencem a uma Área ativa e agrupam Tarefas |
| Tarefas | Possuem descrição, prioridade, prazo, conclusão, checklist e links |
| Dashboard | Resume progresso, pendências, vencimentos e atividades em andamento |
| Arquivados | Centraliza itens arquivados, restauração e exclusão definitiva |

O Dashboard possui estados de carregamento, erro e vazio orientado. No desktop, combina atenção, andamento, prazos, visão geral e Áreas; no mobile, usa uma composição exclusiva com saudação e progresso compactos, métricas em grade e listas de tarefas adequadas ao toque.

Áreas, Listas e Tarefas podem ser exibidas em Lista ou Cards. A preferência inicial de contas reais vem do Perfil, sem impedir alternância local em cada tela.

## Tarefas, checklist e links

- Toda Tarefa pertence a uma Lista e toda Lista pertence a uma Área.
- Prioridade aceita `LOW`, `MEDIUM` ou `HIGH`.
- Concluir define `completedAt`; reabrir remove esse valor.
- Checklist e links permanecem editáveis enquanto a Tarefa existir, inclusive quando arquivada.
- Links exigem título e URL HTTP ou HTTPS válida.
- A criação de Tarefa protege campos preenchidos contra descarte acidental.

## Arquivamento

Arquivar remove o item da organização ativa sem apagar seus dados. Somente itens arquivados diretamente aparecem na Central de Arquivados; descendentes permanecem dentro do contexto do pai.

- Restaurar uma Lista exige sua Área ativa.
- Restaurar uma Tarefa exige Lista e Área ativas.
- Restaurar um pai não restaura filhos arquivados diretamente.
- Área, Lista e Tarefa só podem ser excluídas definitivamente depois de arquivadas.
- Exclusões de pais removem descendentes pelas relações de cascata do banco.

## Conta, Demo e Perfil

- Cadastro, login, logout e recuperação de senha.
- Sessão persistente por cookie seguro.
- Demo isolada por 24 horas, com importação opcional ao criar uma conta.
- Perfil para nome, e-mail, senha, visualização padrão e avatar privado.
- Conta DEMO não acessa Perfil nem operações exclusivas de conta REAL.

## Navegação e interface

As rotas principais são `/`, `/app`, `/app/areas/:areaId`, `/app/areas/:areaId/listas/:listId`, `/app/arquivados`, `/app/perfil` e `/app/sobre`. Landing, autenticação, recuperação e Demo são públicas; o espaço `/app` exige sessão.

Em telas menores, a sidebar se torna drawer, breadcrumbs profundos são condensados e formulários/modais consideram teclado e safe areas. Modais contêm o foco, fecham por `Escape` quando permitido e restauram o foco anterior.

## PWA e conexão

O FocusList pode ser instalado como PWA. Quando não há rede, a aplicação mostra uma tela Offline própria e permite tentar novamente. Não existem sincronização offline, cache de API ou armazenamento local de tarefas.
