# Diretrizes de Produto do FocusList

Esta é a fonte oficial para princípios de Produto, UX, identidade e padrões visuais. O código atual e estas diretrizes prevalecem sobre protótipos antigos.

## Princípios

- simplicidade acima da quantidade de funcionalidades;
- interface limpa, moderna e objetiva;
- foco no próximo passo e nas informações relevantes ao contexto;
- fluxos previsíveis, feedback claro e linguagem consistente;
- dados reais no lugar de conteúdo fictício;
- acessibilidade e responsividade tratadas como qualidades transversais;
- evolução incremental sem apresentar planejamento como funcionalidade pronta.

## Hierarquia e navegação

```text
Área
└── Lista
    └── Tarefa
```

- A hierarquia deve permanecer clara na sidebar, nos breadcrumbs, no arquivamento e na restauração.
- Clicar em uma Tarefa abre seus Detalhes; a edição acontece em `TaskDetails`.
- Listagens priorizam navegação, leitura rápida e conclusão.
- Ações secundárias usam menus contextuais quando isso reduz ruído.
- Estados vazios explicam o contexto e indicam o próximo passo.
- Botões indisponíveis permanecem desabilitados.
- A criação de Tarefa protege dados preenchidos antes de descartá-los.

## Dashboard

- Usa apenas dados ativos e reais.
- O Estado Vazio Inteligente orienta a criação de Área, Lista ou Tarefa.
- A composição deve oferecer visão de atenção, andamento, próximos prazos, progresso e Áreas sem sobrecarga.
- Listas resumidas podem aplicar limites e controles de expansão para preservar densidade.
- A capa pode usar tema Automático, Manhã, Tarde ou Noite; o modo Automático acompanha o período atual e a escolha é persistida localmente.

## Lista, Cards e densidade

- Listas e Tarefas oferecem modos Lista e Cards quando ambos ajudam a leitura.
- Tarefas permanecem separadas em Pendentes e Concluídas.
- Concluídas iniciam recolhidas para manter foco no trabalho pendente.
- Cards usam limite inicial e controles **Ver mais/Recolher** quando a quantidade comprometer a leitura.
- A interface deve equilibrar densidade, respiro, hierarquia tipográfica e aproveitamento da tela.

## Arquivados

Arquivar remove um item da organização ativa sem apagar seu conteúdo. Não equivale a lixeira nem transforma automaticamente todo conteúdo em somente leitura.

Existe uma única **Central de Arquivados** para localizar itens diretamente arquivados, abri-los, restaurá-los e excluí-los definitivamente.

### Hierarquia

- Área arquivada: somente a Área aparece na central; Listas e Tarefas ficam dentro do contexto.
- Lista arquivada com Área ativa: somente a Lista aparece; Tarefas ficam dentro do contexto.
- Tarefa arquivada com pais ativos: somente a Tarefa aparece.
- Filhos não aparecem como entradas independentes enquanto um pai está arquivado.
- Restaurar um pai recupera descendentes sem arquivamento próprio; filhos diretamente arquivados permanecem arquivados.

### Apresentação e edição

- Área e Lista arquivadas exibem o indicador **Arquivada** integrado ao cabeçalho, sem banner genérico separado.
- `TaskDetails` possui tratamento visual próprio para Tarefa arquivada.
- Área arquivada permite editar título e descrição, mas não oferece a edição completa de cor e ícone do fluxo ativo.
- Lista arquivada permite editar título e descrição.
- Tarefa arquivada mantém as edições oferecidas por `TaskDetails`, inclusive status, prioridade, prazo, checklist e links.
- Checklist e links podem ser adicionados, alterados e removidos em Tarefas arquivadas, conforme permitido pela implementação.
- Restauração e exclusão definitiva permanecem ações da Central de Arquivados.

## Responsividade e acessibilidade

- O produto atual é uma **interface web responsiva**, desktop-first.
- Em larguras menores, a sidebar se torna drawer e o conteúdo reorganiza grades, ações e detalhes.
- Drawer e modais contêm o foco, fecham por `Escape` quando permitido e devolvem o foco anterior.
- Componentes interativos devem possuir nome acessível, estado exposto e foco visível.
- O movimento deve respeitar `prefers-reduced-motion`.
- Não denominar o estado atual como aplicativo mobile, PWA ou experiência mobile validada em aparelho real.

## Identidade visual

A identidade deriva do **Conceito A**:

- organização por camadas;
- visual 3D minimalista;
- azul como cor principal;
- aparência premium e moderna;
- sem check, prancheta, calendário ou lista como símbolo principal.

Cores, tipografia, espaçamentos, componentes e estados devem permanecer consistentes com a interface refinada na Etapa 19C.

## Tela Sobre

A estrutura é Hero, O que é, Como funciona, Recursos principais e Desenvolvido por. A versão não aparece no Hero; fica somente no rodapé. A autoria apresenta Isaac Gabriel, Estudante de Análise e Desenvolvimento de Sistemas, com GitHub e LinkedIn.

## Uso dos protótipos

Protótipos em `prototipos/` registram decisões históricas e bases conceituais. Refinamentos posteriores de escala, densidade, composição, responsividade, Arquivados e `TaskDetails` os superaram parcialmente. Eles não devem ser usados como representação exata da interface atual.

## Trabalho futuro

PWA, offline, Mobile/PWA Real, microinterações adicionais, Landing Page, Área Demo, testes de carga/escalabilidade, preparação para publicação e deploy ainda não estão implementados.

A futura Área Demo deverá ser completa, não afetar métricas ou dados do Dashboard, não aparecer na Central de Arquivados, oferecer **Ocultar demonstração** e preservar a liberdade de criação dos próprios dados. Detalhes técnicos ainda não estão decididos.

Tarefas Avulsas e Configurações não fazem parte da V1.
