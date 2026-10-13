# Diretrizes de Produto do FocusList

Este documento consolida a filosofia, os princípios de experiência do usuário e as decisões de interface já aprovadas para o FocusList. Ele deve orientar o planejamento, o design, a implementação e a revisão de todas as evoluções do produto.

## Filosofia do Produto

### Objetivo

O FocusList tem como objetivo ajudar pessoas a organizar tarefas e prioridades com clareza, foco e baixo esforço, tornando simples entender o que precisa ser feito e acompanhar o próprio progresso.

### Público-alvo

O produto é destinado a pessoas que buscam uma ferramenta direta, moderna e confiável para organizar suas atividades, sem a complexidade e a sobrecarga visual comuns em soluções com excesso de funcionalidades.

### Princípios do produto

- Colocar simplicidade acima da quantidade de funcionalidades.
- Manter uma interface limpa, moderna e objetiva.
- Priorizar a experiência do usuário em todas as decisões.
- Tornar cada funcionalidade fácil de compreender e usar.
- Introduzir novos recursos apenas quando contribuírem claramente para o propósito do produto.

## Princípios de UX

- Evitar poluição visual.
- Exibir apenas informações realmente necessárias para o contexto atual.
- Priorizar fluxos intuitivos, previsíveis e fáceis de aprender.
- Minimizar a quantidade de cliques sem comprometer a clareza das ações.
- Manter consistência de comportamento, linguagem e apresentação entre todas as telas.
- Oferecer feedback claro sobre ações, estados e resultados.

## Navegação

- Clicar em uma tarefa deve abrir sua tela de Detalhes.
- A edição de uma tarefa deve acontecer exclusivamente na tela de Detalhes.
- A listagem de tarefas deve servir apenas para navegação rápida e marcação de conclusão.
- Breadcrumbs devem representar de forma clara e fiel o contexto atual do usuário.

## Interface

- Evitar botões permanentes de editar e excluir.
- Priorizar menus contextuais (`⋯`) para ações secundárias.
- Botões devem permanecer desabilitados quando não puderem ser utilizados.
- Estados vazios devem orientar o usuário sobre o contexto e o próximo passo possível.
- Modais devem seguir um padrão único de estrutura, comportamento, linguagem e hierarquia de ações.

## Dashboard

- O FocusList deve oferecer um Dashboard Inteligente, com informações úteis e relevantes para o contexto do usuário.
- O Estado Vazio Inteligente deve explicar a ausência de dados e orientar o usuário para a próxima ação adequada.
- O Dashboard Completo deve utilizar dados reais e refletir corretamente o estado atual do produto.
- Não devem ser exibidas funcionalidades inexistentes, dados fictícios ou ações indisponíveis.

## Arquivados

### Conceito

Arquivados não representam uma lixeira. Eles representam itens preservados temporariamente, mantendo sua organização e seu contexto originais.

O arquivamento deve ser priorizado em vez da exclusão imediata. A exclusão definitiva deve estar disponível apenas para itens já arquivados.

### Hierarquia

A estrutura oficial do produto é:

**Área → Lista → Tarefa**

Essa hierarquia deve ser sempre preservada, inclusive durante o arquivamento, a visualização e a restauração de itens.

### Modo somente leitura

Todo item arquivado entra em modo somente leitura. Enquanto estiver arquivado, o item não poderá ser:

- Editado.
- Movido.
- Reorganizado.
- Alterado de qualquer forma.

As únicas ações permitidas para um item arquivado são:

- Visualizar.
- Restaurar.
- Excluir definitivamente.

Após a restauração, o item volta a permitir edição e demais operações normalmente.

### Organização dos itens arquivados

- Áreas arquivadas permanecem em uma Central de Arquivados.
- Listas arquivadas permanecem dentro da Área de origem.
- Tarefas arquivadas permanecem dentro da Lista de origem.
- O usuário nunca deve perder o contexto do item arquivado.

### Experiência

O objetivo dos Arquivados é preservar contexto e organização. A experiência deve permitir que o usuário compreenda facilmente:

- O que foi arquivado.
- De onde o item veio.
- O que será restaurado.

A interface, a linguagem e os fluxos devem evitar qualquer aparência ou interpretação de lixeira. Mensagens de confirmação devem descrever exatamente o comportamento e as consequências de cada ação.

## Visual

- Seguir fielmente os protótipos aprovados.
- Manter a identidade visual dark do FocusList.
- Evitar alterações criativas sem validação prévia.
- Priorizar a consistência visual entre todas as telas, incluindo cores, tipografia, espaçamentos, componentes e estados.

## Funcionalidades Futuras

Os itens abaixo representam apenas a visão futura do produto. Sua inclusão neste documento não significa que estejam implementados ou aprovados para desenvolvimento imediato:

- Landing Page.
- Onboarding.
- Kanban.
- Pesquisa.
- Dashboard da Área.
- Responsividade refinada.
- Microanimações.
- Logo oficial.

## Diretriz Final

Este documento é a principal referência para decisões de Produto, UX e Interface do FocusList.

Sempre que uma nova funcionalidade for implementada, ela deverá respeitar estas diretrizes.

Em caso de conflito entre uma implementação e este documento, as decisões registradas aqui deverão prevalecer até que sejam oficialmente revisadas.
