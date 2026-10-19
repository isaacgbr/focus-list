# FocusList

Aplicação web responsiva, desktop-first, para organização pessoal na hierarquia **Áreas → Listas → Tarefas**. O FocusList combina um Dashboard orientado a prioridades com fluxos diretos para planejar, acompanhar, concluir e arquivar atividades.

## Principais recursos

- Dashboard com dados reais, prazos, progresso, resumo por Área e capa personalizável;
- criação e edição de Áreas, Listas e Tarefas;
- visualizações em Lista e Cards para Listas e Tarefas;
- prioridade, prazo, conclusão, checklist e links de referência;
- Central de Arquivados com restauração e exclusão definitiva;
- interface web responsiva, sidebar adaptável e modais com tratamento de foco;
- tela Sobre e identidade visual própria.

## Stack e arquitetura

- **Frontend:** React 19, TypeScript, Vite, React Router, Axios e CSS próprio;
- **Backend:** Node.js, Express 5 e TypeScript;
- **Dados:** PostgreSQL e Prisma 7;
- **Organização:** monorepo com frontend e backend independentes; a API segue as camadas Route → Controller → Service → Repository.

## Execução local

Pré-requisitos: Node.js, npm e uma instância PostgreSQL.

1. Configure `DATABASE_URL` no ambiente do backend. `PORT` é opcional e usa `3000` por padrão.
2. Em um terminal, execute o backend:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. Em outro terminal, execute o frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

O frontend usa `VITE_API_URL` quando definida e, caso contrário, acessa `http://localhost:3000`.

## Estado atual

O núcleo funcional da V1 e o refinamento final da experiência desktop estão concluídos. A interface se adapta a larguras menores, mas **Mobile/PWA Real ainda não foi validado em aparelho físico**. PWA, offline, Landing Page, Área Demo, testes de carga, preparação para publicação e deploy permanecem futuros.

Tarefas Avulsas e Configurações não fazem parte da V1.

## Documentação

Consulte o [índice da documentação](docs/00-indice.md) para visão geral, navegação, especificação funcional, regras de negócio, modelo de dados, arquitetura e roadmap. As decisões de UX e identidade estão nas [Diretrizes de Produto](docs/PRODUCT_GUIDELINES.md).

## Licença

A definir.
