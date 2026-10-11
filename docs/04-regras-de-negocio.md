# Documentação do Projeto

## 04. Regras de Negócio

Este documento define as regras que devem ser respeitadas durante o funcionamento do sistema.

------------------------------------------------------------------------

## Dashboard

- O Frontend MVP deve apresentar o Estado Vazio Inteligente enquanto não existir nenhuma Tarefa.
- O Estado Vazio Inteligente deve orientar o usuário para a próxima ação, sem se limitar a cards vazios ou estatísticas zeradas.
- Sem Áreas, o Dashboard deve incentivar a criação da primeira Área.
- Com Área, mas sem Listas, o Dashboard deve incentivar a criação da primeira Lista.
- Com Lista, mas sem Tarefas, o Dashboard deve incentivar a criação da primeira Tarefa.
- Após existir pelo menos uma Tarefa, o sistema deve exibir o Dashboard Completo.

------------------------------------------------------------------------

## Áreas

- Toda Área deve possuir um título.
- Uma Área pode possuir descrição, cor e ícone.
- Uma Área pode possuir várias Listas.
- Uma Área pode ser excluída apenas mediante confirmação do usuário.

------------------------------------------------------------------------

## Listas

- Toda Lista deve possuir um título.
- Toda Lista pertence obrigatoriamente a uma Área.
- Uma Lista pode possuir descrição.
- Uma Lista pode possuir várias Tarefas.
- Uma Lista pode ser excluída apenas mediante confirmação do usuário.

------------------------------------------------------------------------

## Tarefas

- Toda Tarefa deve possuir um título.
- Toda Tarefa pertence obrigatoriamente a uma Lista.
- Descrição, prazo e prioridade são opcionais.
- Checklist e Links são opcionais.
- Uma Tarefa pode ser marcada como concluída ou pendente.
- O backend aceita `completed` e `completedAt` na criação e na atualização; atualmente não preenche nem remove `completedAt` automaticamente.
- Uma Tarefa pode ser movida para outra Lista.
- O backend atual não possui operação específica para duplicar uma Tarefa.
- A exclusão de uma Tarefa remove também seus Checklists e Links.

------------------------------------------------------------------------

## Checklist

- Um Checklist pertence obrigatoriamente a uma Tarefa.
- Uma Tarefa pode existir sem Checklist.
- Cada item do Checklist pode ser marcado individualmente como concluído.

------------------------------------------------------------------------

## Links

- Um Link pertence obrigatoriamente a uma Tarefa.
- Uma Tarefa pode existir sem Links.
- Cada Link deve possuir título e URL não vazios na criação.

------------------------------------------------------------------------

## Exclusão

- Exclusões devem solicitar confirmação ao usuário.
- A exclusão é permanente no MVP.

------------------------------------------------------------------------

**Versão:** 0.4
