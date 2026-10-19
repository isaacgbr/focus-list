# Documentação do FocusList

Este índice reúne as fontes oficiais do projeto. Cada assunto possui um documento principal para reduzir duplicidade e divergências.

## Documentos

| Documento | Fonte principal para |
|---|---|
| [`README.md`](../README.md) | Apresentação rápida, stack, execução e acesso à documentação |
| [`01-visao-geral.md`](01-visao-geral.md) | Objetivo, proposta, escopo e limites atuais |
| [`02-navegacao.md`](02-navegacao.md) | Rotas, fluxos e comportamento de navegação |
| [`03-especificacao-funcional.md`](03-especificacao-funcional.md) | Funcionalidades existentes e comportamento da interface |
| [`04-regras-de-negocio.md`](04-regras-de-negocio.md) | Regras obrigatórias do domínio |
| [`05-modelo-de-dados.md`](05-modelo-de-dados.md) | Entidades, campos e relações persistidas |
| [`06-arquitetura-e-stack.md`](06-arquitetura-e-stack.md) | Arquitetura, tecnologias e API REST |
| [`07-roadmap.md`](07-roadmap.md) | Histórico relevante, estado atual e próximos passos |
| [`PRODUCT_GUIDELINES.md`](PRODUCT_GUIDELINES.md) | Princípios de Produto, UX, identidade e padrões visuais |

## Referências visuais

Os arquivos em `prototipos/` registram decisões e direções anteriores. Eles são **referências históricas ou bases conceituais** e não devem ser tratados como reprodução exata da interface atual. A implementação foi refinada depois desses materiais, especialmente na Etapa 19C.

| Referência | Classificação atual |
|---|---|
| `Tela-01-Dashboard.png` a `Tela-08-Nova-Tarefa.png` | Base conceitual, parcialmente superada pelos refinamentos posteriores |
| `PROTOTIPO_ARQUIVADOS_V2_APROVADO.png` | Referência histórica do fluxo de Arquivados |
| `PROTOTIPO_SOBRE_V1_APROVADO.png` | Base conceitual da tela Sobre |
| `PROTOTIPO_LOGO_CONCEITO_A_APROVADO.png` | Base conceitual da identidade visual |

Em caso de divergência, prevalecem o código atual e as [`Diretrizes de Produto`](PRODUCT_GUIDELINES.md) atualizadas.

## Convenções

- **Implementado:** presente no código atual.
- **Planejado:** incluído no roadmap, sem implementação atual.
- Títulos de entidades do produto usam inicial maiúscula: Área, Lista e Tarefa.
- **Central de Arquivados** é o nome da área única de conteúdo arquivado.
- A documentação não mantém numeração própria de versão; o histórico Git registra sua evolução.
