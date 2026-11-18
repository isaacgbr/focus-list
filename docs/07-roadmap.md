# Roadmap

O roadmap registra o fechamento da V1 e melhorias posteriores que não bloqueiam a publicação.

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

Implementados: núcleo funcional, microinterações, Landing Page, autenticação e
isolamento multiusuário, recuperação de senha, Demo temporária com importação,
Perfil com avatar/preferências, PWA/Offline e experiência mobile refinada. A Vercel
é a produção oficial, com PostgreSQL e Storage privado no Supabase e e-mails pelo Resend.

## Próximos passos não bloqueantes

- concluir o README e a apresentação pública;
- acompanhar limites gratuitos e métricas de produção;
- definir uma rotina operacional para limpeza física de Demos expiradas;
- revisar benchmarks quando houver mudanças relevantes de volume ou arquitetura.

A Demo atual usa identidade isolada de 24h, inicia vazia e permite importar
os dados ao criar conta. O conceito antigo de Área Demo oculta no Dashboard
foi substituído por esse fluxo; consulte [09-demo.md](09-demo.md).
