# Regras de Negócio

## Hierarquia

- Uma Área pode possuir várias Listas.
- Toda Lista pertence a uma Área.
- Uma Lista pode possuir várias Tarefas.
- Toda Tarefa pertence a uma Lista.
- Uma Tarefa pode possuir itens de checklist e links.

## Validações

- Área, Lista, Tarefa e item de checklist exigem título não vazio na criação.
- Link exige título e URL não vazios na criação; o backend não valida o formato da URL.
- Lista só pode ser criada ou movida para uma Área ativa.
- Tarefa só pode ser criada ou movida para uma Lista ativa.
- Prioridade aceita `LOW`, `MEDIUM` ou `HIGH`.
- Na atualização, títulos de Área, Lista, Tarefa e item de checklist continuam obrigatórios quando enviados.
- Na atualização de Link, título e URL continuam obrigatórios quando enviados; o backend não valida o formato da URL.
- Checklist e Link só podem ser criados ou movidos para uma Tarefa ativa.

## Conclusão de Tarefas

- Uma Tarefa pode estar A fazer ou Concluída.
- `completed` inicia como `false`.
- Ao receber uma mudança em `completed`, o backend define `completedAt` com a data atual ao concluir e remove o valor ao reabrir.
- `completedAt` enviado isoladamente é ignorado pelo backend, preservando a consistência com `completed`.

## Arquivamento

- Área, Lista e Tarefa podem ser arquivadas.
- Arquivar remove o item da organização principal sem apagar seus dados.
- Existe somente uma Central de Arquivados.
- Itens arquivados continuam editáveis; arquivamento não significa somente leitura.
- Apenas itens arquivados diretamente aparecem na central.
- Se uma Área está arquivada, suas Listas e Tarefas ficam ocultas como entradas independentes.
- Se uma Lista está arquivada, suas Tarefas ficam ocultas como entradas independentes.
- Arquivar um pai não altera o `archivedAt` dos filhos.

## Restauração

- Restaurar uma Área torna novamente visíveis seus descendentes que não tenham sido arquivados diretamente.
- Uma Lista não pode ser restaurada enquanto sua Área estiver arquivada.
- Uma Tarefa não pode ser restaurada enquanto sua Lista ou Área estiver arquivada.
- Um filho arquivado diretamente permanece arquivado mesmo após a restauração do pai.

## Exclusão

- Área, Lista e Tarefa só podem ser excluídas definitivamente depois de arquivadas.
- A interface solicita confirmação e informa que a exclusão não pode ser desfeita.
- A exclusão definitiva de um pai remove seus descendentes por cascata.
- Itens de checklist e links podem ser removidos durante a edição da Tarefa, inclusive quando ela está arquivada.

## Dashboard

- Entidades arquivadas não participam dos dados ativos do Dashboard.
- Sem Tarefas, o Estado Vazio Inteligente deve orientar a próxima criação necessária.
- Com Tarefas, o Dashboard deve usar dados reais e não apresentar métricas fictícias.

## Interface e acessibilidade

- A tela Sobre segue a estrutura e o conteúdo aprovados na Etapa 16.
- A identidade oficial segue o Conceito A aprovado na Etapa 17.
- A versão não aparece no Hero da tela Sobre; aparece apenas no rodapé.
- Os breadcrumbs devem representar a hierarquia e o contexto da rota atual.
- Modais devem conter o foco do teclado enquanto abertos, fechar por `Escape` e devolver o foco ao elemento anterior.
- A Landing Page permanece planejada para depois do refinamento visual completo e não deve ser descrita como implementada.
