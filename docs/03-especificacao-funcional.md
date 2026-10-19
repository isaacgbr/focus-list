# Especificação Funcional

Esta é a fonte principal das funcionalidades presentes no código atual.

## Dashboard

- carrega Áreas, Listas, Tarefas, checklist e links da API;
- possui estados de carregamento, erro com nova tentativa e Estado Vazio Inteligente;
- orienta criar Área, Lista ou Tarefa conforme a próxima lacuna da hierarquia;
- apresenta Tarefas vencidas, com vencimento hoje e nos próximos sete dias;
- mostra até três Tarefas em **Em andamento** e até três em **Próximos prazos**;
- apresenta visão geral de Tarefas e resumo de até seis Áreas, expansível quando necessário;
- abre uma Tarefa navegando à Lista de origem e aos seus detalhes;
- permite personalizar a capa com tema Automático, Manhã, Tarde ou Noite; a preferência fica no armazenamento local do navegador;
- no modo Automático, saudação e capa acompanham o período do dia.

## Áreas

- criar com título obrigatório e descrição, cor e ícone opcionais;
- consultar, editar e arquivar com confirmação;
- acessar as Listas da Área;
- alternar Listas entre os modos Lista e Cards;
- exibir contagens de Tarefas e progresso nos Cards;
- limitar a seis Áreas visíveis inicialmente na sidebar, com **Ver todas/Recolher** quando aplicável.

Em uma Área arquivada, o estado **Arquivada** aparece integrado ao cabeçalho. É possível navegar pelas Listas e editar apenas título e descrição da Área nessa tela; cor e ícone não estão disponíveis nesse fluxo. Restauração e exclusão definitiva são feitas pela Central de Arquivados.

## Listas

- criar dentro de uma Área ativa, com título obrigatório e descrição opcional;
- consultar, editar e arquivar com confirmação;
- acessar as Tarefas da Lista;
- apresentar resumo de Tarefas nos modos Lista e Cards.

Em uma Lista arquivada, o estado **Arquivada** aparece integrado ao cabeçalho. É possível navegar pelas Tarefas e editar título e descrição. Restauração e exclusão definitiva são feitas pela Central de Arquivados.

## Tarefas

- criar com título obrigatório e descrição, prazo e prioridade opcionais;
- proteger contra descarte acidental durante a criação quando houver campos preenchidos;
- abrir e editar título, descrição, status, prioridade e prazo em `TaskDetails`;
- concluir ou reabrir, com atualização automática da data de conclusão;
- arquivar com confirmação;
- mover para outra Lista pela API;
- mostrar datas de criação, atualização e, quando aplicável, conclusão;
- apresentar resumo de checklist e links nos itens da Lista e no Dashboard quando disponível.

### Modos Lista e Cards

- Tarefas são separadas em Pendentes e Concluídas nos dois modos.
- No modo Lista, Pendentes ficam visíveis e Concluídas iniciam recolhidas.
- No modo Cards, o layout usa composição em board; Pendentes mostram inicialmente até 12 Cards e Concluídas iniciam recolhidas.
- Cada grupo com mais de 12 Cards oferece **Ver mais** e **Recolher**.

### Tarefa arquivada

`TaskDetails` aplica tratamento visual próprio ao estado arquivado e não mostra a ação de arquivar novamente. As edições disponibilizadas nos detalhes permanecem funcionais, inclusive conclusão/reabertura, título, descrição, prioridade, prazo, checklist e links. A restauração e a exclusão definitiva continuam centralizadas em Arquivados.

## Checklist

- listar os itens da Tarefa;
- adicionar, editar e remover;
- marcar e desmarcar cada item;
- exibir contagem e progresso;
- recolher e expandir a seção.

Essas operações também são permitidas em Tarefas arquivadas, pois a implementação valida a existência da Tarefa sem exigir que ela esteja ativa.

## Links

- listar links da Tarefa;
- adicionar, editar e remover;
- abrir o endereço pelo título;
- recolher e expandir a seção.

Essas operações também são permitidas em Tarefas arquivadas pela mesma regra de existência aplicada ao checklist.

## Central de Arquivados

- reúne Área, Lista e Tarefa em uma única tela;
- ordena os itens diretamente arquivados do mais recente para o mais antigo;
- exibe tipo, contexto, contagens aplicáveis e data de arquivamento;
- oculta descendentes como entradas independentes quando o pai está arquivado;
- abre o conteúdo preservando a hierarquia disponível;
- restaura respeitando as dependências entre Área, Lista e Tarefa;
- permite exclusão definitiva apenas de Área, Lista ou Tarefa previamente arquivada.

Arquivar um pai não grava `archivedAt` nos filhos. Ao restaurá-lo, descendentes sem arquivamento próprio reaparecem; descendentes arquivados diretamente permanecem arquivados.

## Tela Sobre e identidade

A tela Sobre contém Hero, O que é, Como funciona, Recursos principais e Desenvolvido por. A versão aparece somente no rodapé. A identidade deriva do Conceito A — camadas, visual 3D minimalista e azul como cor principal — e foi refinada na implementação posterior aos protótipos.

## Responsividade e acessibilidade

- interface web responsiva com reorganização do Dashboard, grades, listas, Arquivados, Sobre e Detalhes da Tarefa;
- sidebar em drawer até 800 px, com backdrop, foco contido, fechamento por `Escape` e restauração do foco;
- breadcrumbs adaptáveis com truncamento em larguras menores;
- modais com papéis e nomes acessíveis, foco inicial, contenção de foco, `Escape` e restauração do foco;
- botões de alternância expõem estados com `aria-pressed` ou `aria-expanded`;
- menus e confirmações possuem rótulos e papéis apropriados;
- estilos respeitam `prefers-reduced-motion`.

Responsividade web não significa PWA nem validação mobile real. Esses trabalhos permanecem no [Roadmap](07-roadmap.md).
