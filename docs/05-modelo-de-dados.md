# Documentação do Projeto

## 05. Modelo de Dados

Este documento descreve o modelo conceitual de dados do projeto. Seu
objetivo é definir quais informações o sistema precisa armazenar e como
elas se relacionam, independentemente da tecnologia utilizada.

------------------------------------------------------------------------

## Visão Geral

``` text
Área
    │
    └── possui várias Listas
            │
            └── possui várias Tarefas
                    ├── pode possuir vários Itens de Checklist
                    └── pode possuir vários Links
```

------------------------------------------------------------------------

## Área

### Objetivo

Representar um contexto de organização (ex.: Faculdade, Trabalho,
Pessoal).

### Campos

  Campo        Obrigatório
  ----------- -------------
  Nome             ✅
  Descrição   
  Ícone       

------------------------------------------------------------------------

## Lista

### Objetivo

Agrupar tarefas relacionadas dentro de uma Área.

### Campos

  Campo        Obrigatório
  ----------- -------------
  Nome             ✅
  Descrição   
  Ícone       

### Relação

-   Pertence a uma Área.

------------------------------------------------------------------------

## Tarefa

### Objetivo

Representar uma atividade.

### Campos

  Campo                      Obrigatório
  ----------------- ------------------------------
  Nome                            ✅
  Descrição         
  Status             ✅ *(inicia como "A fazer")*
  Prioridade        
  Prazo             
  Data de criação         ✅ *(automática)*
  Última edição           ✅ *(automática)*

### Relação

-   Pertence a uma Lista.

------------------------------------------------------------------------

## Item de Checklist

### Objetivo

Representar uma etapa da tarefa.

### Campos

  Campo        Obrigatório
  ----------- -------------
  Texto            ✅
  Concluído        ✅

### Relação

-   Pertence a uma Tarefa.

------------------------------------------------------------------------

## Link

### Objetivo

Relacionar materiais de apoio à tarefa.

### Campos

  Campo     Obrigatório
  -------- -------------
  Título        ✅
  URL           ✅

### Relação

-   Pertence a uma Tarefa.

------------------------------------------------------------------------

## Relações

-   Uma Área possui várias Listas.
-   Uma Lista pertence a uma Área.
-   Uma Lista possui várias Tarefas.
-   Uma Tarefa pertence a uma Lista.
-   Uma Tarefa pode possuir vários Itens de Checklist.
-   Uma Tarefa pode possuir vários Links.

------------------------------------------------------------------------

## Área Avulsas

A Área **Avulsas** segue o mesmo modelo das demais Áreas.

Internamente, ela possui uma **Lista Avulsas** (oculta), utilizada
apenas para manter a estrutura do sistema consistente.

O usuário interage apenas com a Área Avulsas e suas tarefas.

------------------------------------------------------------------------

## Observações

Este documento representa o modelo conceitual do projeto. A
implementação em banco de dados será definida posteriormente na
documentação de arquitetura.

------------------------------------------------------------------------

**Versão:** 0.1
