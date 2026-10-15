# Diretrizes de Produto do FocusList

Este documento é a fonte oficial para decisões de Produto, UX e identidade visual. Em caso de divergência, deve ser atualizado junto da decisão aprovada antes de orientar uma implementação.

## Filosofia

O FocusList ajuda pessoas a organizar tarefas e prioridades com clareza, foco e baixo esforço.

- simplicidade acima da quantidade de funcionalidades;
- interface limpa, moderna e objetiva;
- fluxos previsíveis e fáceis de aprender;
- informações apenas quando relevantes ao contexto;
- feedback claro para ações, estados e resultados;
- consistência de linguagem, comportamento e apresentação.

## Hierarquia do produto

```text
Área
└── Lista
    └── Tarefa
```

Essa hierarquia deve permanecer compreensível na navegação, nos breadcrumbs, no arquivamento e na restauração.

## Navegação e interface

- Clicar em uma Tarefa abre seus Detalhes.
- A edição da Tarefa acontece nos Detalhes.
- A listagem prioriza navegação e marcação rápida de conclusão.
- Ações secundárias usam menus contextuais quando isso reduz ruído visual.
- Botões indisponíveis permanecem desabilitados.
- Estados vazios explicam o contexto e indicam o próximo passo.
- Modais seguem estrutura, comportamento, linguagem e hierarquia consistentes.
- Modais contêm o foco do teclado, fecham por `Escape` e restauram o foco ao serem fechados.
- Breadcrumbs representam a hierarquia e o contexto da rota atual.
- Dados fictícios ou ações inexistentes não devem aparecer como funcionalidades reais.

## Dashboard

- O Dashboard usa dados reais.
- O Estado Vazio Inteligente orienta a criação de Área, Lista ou Tarefa conforme o estado atual.
- O Dashboard Completo apresenta informações relevantes sem sobrecarga visual.

## Arquivados — fluxo aprovado e implementado

### Conceito

Arquivar remove um item da organização principal sem perder seu conteúdo. Não bloqueia edição, não transforma o item em somente leitura e não equivale a uma lixeira.

Existe uma única **Central de Arquivados**, destinada a:

- localizar itens arquivados;
- abrir e editar normalmente;
- restaurar;
- excluir definitivamente.

Não existem centrais separadas por Área ou Lista. A exclusão definitiva de Área, Lista e Tarefa só fica disponível após o arquivamento.

### Hierarquia

- Área arquivada: somente a Área aparece na central; suas Listas e Tarefas ficam dentro desse contexto.
- Lista arquivada com Área ativa: somente a Lista aparece; suas Tarefas ficam dentro desse contexto.
- Tarefa arquivada com pais ativos: somente a Tarefa aparece.
- Filhos nunca aparecem separadamente enquanto um pai está arquivado.

Arquivar um pai não arquiva diretamente cada filho. Ao restaurar o pai, descendentes sem arquivamento próprio retornam à organização principal. Um filho arquivado diretamente permanece arquivado.

### Conteúdo e ações

Os cards apresentam contexto suficiente:

- Área: nome, quantidade de Listas e Tarefas e data de arquivamento;
- Lista: nome, Área de origem, quantidade de Tarefas e data;
- Tarefa: nome, Área, Lista e data.

Área, Lista e Tarefa podem ser editadas normalmente quando arquivadas. Para Tarefas, isso inclui título, descrição, status, prioridade, prazo, checklist e links.

O modo arquivado exibe discretamente:

> Arquivado
>
> Este item não aparece na organização principal.

Restauração respeita a hierarquia: primeiro a Área, depois a Lista e então a Tarefa, quando cada uma tiver sido arquivada diretamente. Mensagens de confirmação devem explicar precisamente as consequências.

## Tela Sobre — Etapa 16 aprovada e implementada

Sua estrutura oficial é:

1. Hero;
2. O que é;
3. Como funciona;
4. Recursos principais;
5. Desenvolvido por.

Decisões obrigatórias:

- remover a versão do Hero;
- manter a versão apenas no rodapé;
- usar descrições extremamente curtas em Recursos principais;
- apresentar “Isaac Gabriel”;
- apresentar “Estudante de Análise e Desenvolvimento de Sistemas”;
- disponibilizar GitHub e LinkedIn;
- seguir o visual de `PROTOTIPO_SOBRE_V1_APROVADO.png`.

## Identidade Visual — Etapa 17 aprovada e aplicada

O conceito oficial é o **Conceito A**:

- organização por camadas;
- visual 3D minimalista;
- azul como cor principal;
- identidade premium e moderna;
- sem check como símbolo principal;
- sem prancheta;
- sem calendário;
- sem lista.

O protótipo oficial é `PROTOTIPO_LOGO_CONCEITO_A_APROVADO.png` e orienta a identidade aplicada ao frontend.

## Direção visual

- preservar a identidade oficial aplicada;
- seguir fielmente protótipos aprovados;
- manter consistência de cores, tipografia, espaçamentos, componentes e estados;
- evitar mudanças criativas sem validação.

## Landing Page

A Landing Page **não está implementada**. Ela permanece planejada para depois do refinamento visual completo e antes do deploy/publicação final, e não deve ser apresentada como funcionalidade atual.

## Possibilidades futuras

Tarefas Avulsas e Configurações não fazem parte da V1. Possibilidades futuras não são funcionalidades implementadas nem autorização automática para desenvolvimento.
