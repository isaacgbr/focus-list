# Documentação do Projeto

## 03. Especificação Funcional

Este documento descreve o comportamento esperado das principais funcionalidades do sistema.

------------------------------------------------------------------------

## Dashboard

### Objetivo

Servir como ponto inicial da aplicação.

### Funcionalidades

- Exibir Áreas existentes.
- Exibir Área "Avulsas".
- Acesso rápido às Áreas.
- Criar uma nova Área.

------------------------------------------------------------------------

## Áreas

### Objetivo

Organizar diferentes contextos do usuário.

### Funcionalidades

- Criar Área.
- Editar Área.
- Excluir Área.
- Abrir Área.

Cada Área pode possuir várias Listas.

------------------------------------------------------------------------

## Listas

### Objetivo

Agrupar tarefas relacionadas.

### Funcionalidades

- Criar Lista.
- Editar Lista.
- Excluir Lista.
- Alternar entre visualização em Lista e Cards.
- Abrir Lista.

Cada Lista pertence obrigatoriamente a uma Área e pode possuir várias Tarefas.

------------------------------------------------------------------------

## Tarefas

### Objetivo

Representar uma atividade que o usuário deseja realizar ou acompanhar.

### Funcionalidades

- Criar.
- Editar.
- Concluir.
- Reabrir.
- Duplicar.
- Mover para outra Lista.
- Excluir.

Cada Tarefa:

- pertence obrigatoriamente a uma Lista;
- possui Título obrigatório;
- pode possuir Descrição;
- pode possuir Prazo;
- pode possuir Prioridade;
- pode possuir Checklist;
- pode possuir Links de referência.

A data e hora da conclusão devem ser registradas automaticamente ao concluir uma tarefa.

------------------------------------------------------------------------

## Checklist

### Objetivo

Dividir uma tarefa em pequenas etapas.

### Funcionalidades

- Adicionar itens.
- Editar itens.
- Remover itens.
- Marcar como concluído.
- Exibir progresso (% e itens concluídos).
- Recolher/expandir.
- Rolagem interna quando necessário.

O Checklist é opcional.

------------------------------------------------------------------------

## Links

### Objetivo

Relacionar materiais de apoio à tarefa.

### Funcionalidades

- Adicionar links.
- Editar links.
- Remover links.
- Exibir apenas o título.
- Recolher/expandir.
- Rolagem interna quando necessário.

Os Links são opcionais.

------------------------------------------------------------------------

## Visualização

### Lista

Exibe as tarefas em formato de linhas, priorizando leitura e organização.

### Cards

Exibe as mesmas tarefas em formato de cartões, priorizando visualização.

Ambas apresentam exatamente as mesmas informações.

------------------------------------------------------------------------

## Detalhes da Tarefa

A edição ocorre em um modal.

Permite alterar:

- Título.
- Descrição.
- Prazo.
- Prioridade.
- Checklist.
- Links.

Também exibe:

- Data de criação.
- Data da última atualização.
- Data de conclusão (quando existir).

------------------------------------------------------------------------

## Modais

O sistema utiliza modais para:

- Nova Área.
- Nova Lista.
- Nova Tarefa.
- Detalhes da Tarefa.

Todos seguem o mesmo padrão visual e mantêm o contexto da tela principal.

------------------------------------------------------------------------

**Versão:** 0.2