# Documentação do Projeto

## 04. Regras de Negócio

Este documento reúne as principais regras que definem o funcionamento do
sistema, independentemente da tecnologia utilizada.

------------------------------------------------------------------------

## Organização

-   Toda Lista pertence a uma única Área.
-   Toda Tarefa pertence a uma única Lista.
-   A Área **Avulsas** é uma Área especial destinada a tarefas rápidas
    ou temporárias.

------------------------------------------------------------------------

## Tarefas

-   O nome da tarefa é obrigatório.
-   Toda nova tarefa inicia com o status **A fazer**.
-   Os demais campos são opcionais.
-   Uma tarefa pode ser movida entre Listas.
-   Uma tarefa pode ser duplicada.
-   Uma tarefa pode ser arquivada.
-   Uma tarefa pode ser excluída.

------------------------------------------------------------------------

## Prioridade

A prioridade possui três níveis:

-   Alta
-   Média
-   Baixa

Sua função é indicar a importância da tarefa.

------------------------------------------------------------------------

## Prazo

O prazo é opcional.

Quando existir:

-   O sistema poderá indicar proximidade do vencimento.
-   O sistema poderá indicar tarefas vencidas.

------------------------------------------------------------------------

## Checklist

-   O checklist é opcional.
-   Cada tarefa pode possuir vários itens.
-   O progresso é calculado automaticamente.
-   O progresso é exibido em porcentagem (%) e quantidade de itens
    concluídos.
-   O checklist pode ser recolhido ou expandido.
-   Quando necessário, utiliza rolagem interna.

------------------------------------------------------------------------

## Links

-   Os links são opcionais.
-   Cada tarefa pode possuir vários links.
-   A interface exibe apenas o título do link.
-   A URL completa é utilizada apenas durante a edição.
-   A lista de links pode ser recolhida ou expandida.
-   Quando necessário, utiliza rolagem interna.

------------------------------------------------------------------------

## Visualização

Uma Lista pode ser visualizada em:

-   Lista
-   Cards

A troca de visualização não altera os dados.

------------------------------------------------------------------------

## Modais

As operações de criação e edição utilizam modais.

Durante sua exibição:

-   O fundo permanece visível.
-   É aplicado um leve desfoque.
-   O foco permanece no modal.

------------------------------------------------------------------------

## Concluídas

As tarefas concluídas permanecem na Lista.

Por padrão:

-   São exibidas em uma seção recolhida.
-   Podem ser expandidas pelo usuário.

------------------------------------------------------------------------

## Responsividade

O projeto possui foco inicial em desktop.

A adaptação para dispositivos móveis faz parte da evolução do projeto.

------------------------------------------------------------------------

## Convenções

-   Priorizar simplicidade.
-   Evitar excesso de informações na interface.
-   Manter consistência visual entre todas as telas.
-   Toda nova funcionalidade deve respeitar estas regras antes de ser
    implementada.

------------------------------------------------------------------------

**Versão:** 0.1
