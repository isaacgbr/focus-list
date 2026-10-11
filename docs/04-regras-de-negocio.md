# Documentação do Projeto

## 04. Regras de Negócio

Este documento define as regras que devem ser respeitadas durante o funcionamento do sistema.

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
- Ao concluir uma Tarefa, a data e hora da conclusão devem ser registradas automaticamente.
- Ao reabrir uma Tarefa, a data de conclusão deve ser removida.
- Uma Tarefa pode ser movida para outra Lista.
- Uma Tarefa pode ser duplicada.
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
- Cada Link deve armazenar uma URL válida.

------------------------------------------------------------------------

## Exclusão

- Exclusões devem solicitar confirmação ao usuário.
- A exclusão é permanente no MVP.

------------------------------------------------------------------------

**Versão:** 0.2