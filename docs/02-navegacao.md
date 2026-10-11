# Documentação do Projeto

## 02. Navegação

Este documento descreve como o usuário navega pela aplicação e como as
principais telas se conectam.

------------------------------------------------------------------------

## Fluxo Principal

``` text
Dashboard
    ↓
Selecionar Área
    ↓
Selecionar Lista
    ↓
Gerenciar Tarefas
    ↓
Abrir Detalhes da Tarefa
```

------------------------------------------------------------------------

## Fluxos Secundários

### Criar uma Área

``` text
Dashboard
    ↓
Nova Área
    ↓
Área criada
```

### Criar uma Lista

``` text
Área
    ↓
Nova Lista
    ↓
Lista criada
```

### Criar uma Tarefa

``` text
Lista
    ↓
Nova Tarefa
    ↓
Tarefa criada (Status: A fazer)
```

### Editar uma Tarefa

``` text
Lista
    ↓
Detalhes da Tarefa
    ↓
Salvar alterações automaticamente
```

------------------------------------------------------------------------

## Modos de Visualização

Cada Lista pode ser exibida de duas formas:

-   Visualização em Lista
-   Visualização em Cards

A troca de visualização não altera os dados da Lista.

------------------------------------------------------------------------

## Área Especial

Existe uma Área especial chamada **Avulsas**.

Ela é destinada a tarefas rápidas ou temporárias, mantendo a mesma
estrutura de Listas e Tarefas das demais Áreas.

------------------------------------------------------------------------

## Modais

Os seguintes processos utilizam modais:

-   Nova Área
-   Nova Lista
-   Nova Tarefa
-   Detalhes da Tarefa

Ao abrir um modal:

-   O conteúdo ao fundo permanece visível.
-   O fundo recebe um leve desfoque.
-   O foco permanece no modal até seu fechamento.

------------------------------------------------------------------------

## Navegação Geral

-   Dashboard é o ponto inicial.
-   Toda Lista pertence a uma Área.
-   Toda Tarefa pertence a uma Lista.
-   Os detalhes são acessados sem sair da Lista, por meio de um modal.

------------------------------------------------------------------------

## Convenções

-   Evitar mudanças de tela desnecessárias.
-   Priorizar ações rápidas.
-   Manter o contexto do usuário durante a navegação.
-   Utilizar modais sempre que possível para ações de criação e edição.

------------------------------------------------------------------------

**Versão:** 0.1
