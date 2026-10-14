# Especificação Funcional

Este documento diferencia explicitamente o que está implementado, aprovado e planejado.

## Dashboard — implementado

- Consome Áreas, Listas e Tarefas reais da API.
- Exibe carregamento, erro com nova tentativa e Estado Vazio Inteligente.
- Sem Áreas, orienta criar a primeira Área.
- Com Área e sem Listas, orienta criar a primeira Lista.
- Com Lista e sem Tarefas, orienta criar a primeira Tarefa.
- Com Tarefas, exibe indicadores de vencidas, vencimento hoje e próximos sete dias, além de agrupamentos de pendentes.
- Permite abrir os detalhes de uma Tarefa.

## Áreas — implementado

- criar, consultar e editar;
- arquivar com confirmação;
- abrir suas Listas;
- editar também quando arquivada;
- restaurar ou excluir definitivamente pela Central de Arquivados.

Campos: título obrigatório; descrição, cor e ícone opcionais.

## Listas — implementado

- criar dentro de uma Área, consultar e editar;
- arquivar com confirmação;
- abrir suas Tarefas;
- editar também quando arquivada;
- restaurar ou excluir definitivamente pela Central de Arquivados.

Campos: título e Área obrigatórios; descrição opcional.

## Tarefas — implementado

- criar e editar título, descrição, prazo e prioridade;
- marcar como concluída ou reabrir;
- mover para outra Lista pela API;
- arquivar com confirmação;
- editar normalmente quando arquivada, incluindo status, prioridade, prazo, checklist e links;
- restaurar ou excluir definitivamente pela Central de Arquivados.

Os detalhes mostram datas de criação, última atualização e conclusão, quando existente. A interface preenche ou remove `completedAt` ao alternar a conclusão; a API também aceita atualização direta de `completed` e `completedAt`.

## Checklist — implementado

- adicionar, editar e remover itens;
- marcar ou desmarcar cada item;
- exibir progresso;
- recolher e expandir a seção.

## Links — implementado

- adicionar, editar e remover links;
- exibir o título como acesso ao endereço;
- recolher e expandir a seção.

## Central de Arquivados — implementado e aprovado

- central única para Área, Lista e Tarefa;
- ordenação por data de arquivamento, da mais recente para a mais antiga;
- cards com tipo, contexto, contagens aplicáveis e data;
- descendentes ocultos quando o pai está arquivado;
- visualização e edição do conteúdo arquivado;
- restauração que respeita a hierarquia;
- exclusão definitiva somente para itens arquivados.

Arquivar o pai não grava `archivedAt` nos filhos: eles ficam ocultos da organização ativa e são acessados pelo contexto do pai. Ao restaurar o pai, os filhos que não foram arquivados diretamente voltam a aparecer.

## Tela Sobre — aprovada, não implementada

Estrutura oficial da Etapa 16:

1. Hero;
2. O que é;
3. Como funciona;
4. Recursos principais;
5. Desenvolvido por.

Regras aprovadas:

- sem versão no Hero;
- versão somente no rodapé;
- descrições extremamente curtas em Recursos principais;
- autoria: Isaac Gabriel, Estudante de Análise e Desenvolvimento de Sistemas, GitHub e LinkedIn;
- visual definido em `PROTOTIPO_SOBRE_V1_APROVADO.png`.

## Identidade Visual — aprovada, aplicação pendente

A Etapa 17 aprovou o Conceito A: organização por camadas, visual 3D minimalista, azul como cor principal e aparência premium e moderna. Check, prancheta, calendário e lista não devem ser usados como símbolo principal.

## Não implementado

- Landing Page, planejada para a publicação da V1;
- visualização de Tarefas em Cards;
- fluxo de Avulsas;
- tela Sobre e aplicação final da nova identidade visual.
