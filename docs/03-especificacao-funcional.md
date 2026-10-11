# Documentação do Projeto

## 03. Especificação Funcional

Este documento descreve o comportamento esperado das principais
funcionalidades do sistema.

------------------------------------------------------------------------

## Dashboard

### Objetivo

Servir como ponto inicial da aplicação.

### Funcionalidades

-   Exibir Áreas existentes.
-   Exibir Área "Avulsas".
-   Acesso rápido às Áreas.
-   Criar uma nova Área.

------------------------------------------------------------------------

## Áreas

### Objetivo

Organizar diferentes contextos do usuário.

### Funcionalidades

-   Criar Área.
-   Editar Área.
-   Excluir Área.
-   Abrir Área.

Cada Área pode possuir várias Listas.

------------------------------------------------------------------------

## Listas

### Objetivo

Agrupar tarefas relacionadas.

### Funcionalidades

-   Criar Lista.
-   Editar Lista.
-   Excluir Lista.
-   Alternar entre visualização em Lista e Cards.
-   Abrir Lista.

Cada Lista pertence a apenas uma Área.

------------------------------------------------------------------------

## Tarefas

### Objetivo

Representar uma atividade a ser realizada.

### Funcionalidades

-   Criar.
-   Editar.
-   Duplicar.
-   Mover.
-   Arquivar.
-   Excluir.

Cada tarefa pode conter:

-   Descrição.
-   Prazo.
-   Prioridade.
-   Checklist.
-   Links de referência.

------------------------------------------------------------------------

## Checklist

### Objetivo

Dividir uma tarefa em pequenas etapas.

### Funcionalidades

-   Adicionar itens.
-   Editar itens.
-   Marcar como concluído.
-   Exibir progresso (% e itens concluídos).
-   Recolher/expandir.
-   Rolagem interna quando necessário.

------------------------------------------------------------------------

## Links

### Objetivo

Relacionar materiais de apoio à tarefa.

### Funcionalidades

-   Adicionar links.
-   Editar links.
-   Remover links.
-   Exibir apenas o título.
-   Recolher/expandir.
-   Rolagem interna quando necessário.

------------------------------------------------------------------------

## Visualização

### Lista

Exibe as tarefas em formato de linhas, priorizando leitura e
organização.

### Cards

Exibe as mesmas tarefas em formato de cartões, priorizando visualização.

Ambas apresentam exatamente as mesmas informações.

------------------------------------------------------------------------

## Detalhes da Tarefa

A edição ocorre em um modal.

Permite alterar:

-   Nome.
-   Descrição.
-   Prazo.
-   Prioridade.
-   Checklist.
-   Links.

Também exibe:

-   Histórico.
-   Informações da tarefa.

------------------------------------------------------------------------

## Modais

O sistema utiliza modais para:

-   Nova Área.
-   Nova Lista.
-   Nova Tarefa.
-   Detalhes da Tarefa.

Todos seguem o mesmo padrão visual e mantêm o contexto da tela
principal.

------------------------------------------------------------------------

**Versão:** 0.1
