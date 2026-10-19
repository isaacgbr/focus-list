# Regras de Negócio

Este documento registra apenas invariantes funcionais e validações obrigatórias. A descrição das telas está na [Especificação Funcional](03-especificacao-funcional.md).

## Hierarquia e vínculos

- Uma Área pode possuir várias Listas.
- Toda Lista pertence a exatamente uma Área.
- Uma Lista pode possuir várias Tarefas.
- Toda Tarefa pertence a exatamente uma Lista.
- Uma Tarefa pode possuir itens de checklist e links.
- Lista só pode ser criada ou movida para uma Área ativa.
- Tarefa só pode ser criada ou movida para uma Lista ativa.

## Validações

- Área, Lista, Tarefa e item de checklist exigem título não vazio na criação.
- Quando enviados em uma atualização, esses títulos também não podem ficar vazios.
- Link exige título e URL não vazios na criação e quando esses campos são atualizados.
- O backend não valida o formato da URL.
- Prioridade de Tarefa aceita `LOW`, `MEDIUM` ou `HIGH`.

## Conclusão de Tarefas

- Uma Tarefa inicia com `completed = false`.
- Ao concluir, o backend define `completedAt` com a data atual.
- Ao reabrir, o backend remove `completedAt`.
- Um valor enviado isoladamente para `completedAt` é ignorado; o campo deriva da mudança de `completed`.

## Checklist e links

- Checklist e links dependem de uma Tarefa existente.
- Criar, editar, mover ou remover checklist e links não exige que a Tarefa esteja ativa.
- Portanto, essas operações também são válidas para Tarefas arquivadas enquanto a Tarefa existir.

## Arquivamento

- Área, Lista e Tarefa podem ser arquivadas.
- Arquivar remove o item da organização ativa sem apagar seus dados.
- Somente itens arquivados diretamente aparecem na Central de Arquivados.
- Quando uma Área está arquivada, suas Listas e Tarefas ficam ocultas como entradas independentes.
- Quando uma Lista está arquivada, suas Tarefas ficam ocultas como entradas independentes.
- Arquivar um pai não altera o `archivedAt` dos filhos.
- Arquivamento não torna Tarefas somente leitura; as operações disponíveis em `TaskDetails`, incluindo checklist e links, continuam permitidas.
- A edição de uma Área arquivada na interface atual é limitada a título e descrição; não se presume edição completa de cor e ícone.

## Restauração

- Restaurar uma Área torna visíveis novamente os descendentes que não tenham arquivamento próprio.
- Uma Lista não pode ser restaurada enquanto sua Área estiver arquivada.
- Uma Tarefa não pode ser restaurada enquanto sua Lista ou Área estiver arquivada.
- Um filho arquivado diretamente permanece arquivado após a restauração do pai.

## Exclusão definitiva

- Área, Lista e Tarefa só podem ser excluídas definitivamente depois de arquivadas.
- A exclusão definitiva de um pai remove seus descendentes por cascata.
- A interface exige confirmação e informa que a ação não pode ser desfeita.
- Remover checklist ou link é uma operação de edição da Tarefa, inclusive quando arquivada, e não depende do fluxo de exclusão definitiva.

## Dashboard

- Entidades arquivadas não participam dos dados ativos do Dashboard.
- O Estado Vazio Inteligente orienta a próxima criação necessária na hierarquia.
- Indicadores e agrupamentos usam dados reais, sem métricas fictícias.

## Consistência de interface

- Breadcrumbs representam a hierarquia e o contexto da rota atual.
- Modais contêm o foco enquanto abertos, fecham por `Escape` quando a ação permite e devolvem o foco ao elemento anterior.
- A criação de Tarefa exige confirmação antes de descartar campos preenchidos.
