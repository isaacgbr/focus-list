# Roadmap

O roadmap separa entregas concluídas do trabalho futuro até a publicação.

## Histórico concluído

### Núcleo funcional da V1

- monorepo com frontend, API REST, PostgreSQL e Prisma;
- CRUD de Áreas, Listas, Tarefas, checklist e links;
- Dashboard integrado a dados reais e Estado Vazio Inteligente;
- modos Lista e Cards para Listas e Tarefas;
- prazo, prioridade, conclusão e abertura da Tarefa pelo Dashboard;
- Central de Arquivados com hierarquia, restauração e exclusão definitiva;
- tela Sobre e identidade visual;
- validações de backend, breadcrumbs e acessibilidade dos modais.

### Etapa 19C — concluída

- refinamento global de escala, densidade e aproveitamento do espaço;
- Dashboard refinado, com composição final e personalização da capa;
- experiência de Área e Listas refinada nos modos Lista e Cards;
- experiência de Tarefas refinada, incluindo separação, expansão e limites dos Cards;
- Central e contextos de Arquivados refinados;
- criação e `TaskDetails` refinados, incluindo proteção contra descarte na criação;
- maior consistência entre componentes, estados, espaçamentos e hierarquia visual;
- melhorias de acessibilidade e navegação por teclado;
- fechamento da experiência Desktop da V1.

## Estado atual

O núcleo funcional e a experiência Desktop estão concluídos. A aplicação possui interface web responsiva, mas ainda não passou pela etapa específica de Mobile/PWA Real em aparelho físico. Não há publicação final.

## Próximos passos

1. **Validação técnica e desempenho/escalabilidade básica** — revisar comportamento técnico, medir cenários essenciais e identificar limites iniciais.
2. **Microinterações e animações** — adicionar refinamentos de movimento sem prejudicar acessibilidade ou desempenho.
3. **Landing Page** — criar a apresentação pública do produto.
4. **Mobile/PWA Real em aparelho físico** — validar a interface em dispositivos reais e então decidir/implementar os requisitos de PWA e offline.
5. **Preparação para publicação e Área Demo** — finalizar conteúdo, ambiente e experiência demonstrável.
6. **Publicação/deploy e apresentação final no GitHub** — disponibilizar o produto e organizar sua apresentação pública.

Todos os itens acima são futuros. Não estão implementados hoje: testes de carga ou escalabilidade, novas microinterações, Landing Page, PWA, offline, Mobile/PWA Real, Área Demo, preparação final para publicação e deploy.

## Área Demo — conceito futuro

O planejamento prevê uma Área Demo completa para apresentar o produto. Conceitualmente:

- não interfere nas métricas nem nos dados do Dashboard;
- não aparece na Central de Arquivados;
- possui a ação específica **Ocultar demonstração**;
- não impede o usuário de criar seus próprios dados.

Detalhes técnicos de persistência, geração ou ciclo de vida ainda não foram definidos.
