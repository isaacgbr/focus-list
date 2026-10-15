# FocusList

Aplicação web desktop-first para organização pessoal em uma hierarquia simples de **Áreas → Listas → Tarefas**.

## Estado atual

O núcleo funcional da V1 está implementado, com frontend integrado à API para:

- Dashboard com dados reais e estados vazio, carregando e erro;
- criação e edição de Áreas, Listas e Tarefas;
- visualizações em Lista e Cards para Listas e Tarefas, com Pendentes e Concluídas;
- conclusão de Tarefas, prioridades, prazos, checklist e links;
- Central única de Arquivados para Áreas, Listas e Tarefas;
- edição, restauração e exclusão definitiva de itens arquivados;
- tela Sobre e identidade visual oficial aplicadas;
- navegação do Dashboard diretamente para os detalhes da Tarefa;
- breadcrumbs contextuais e modais com gerenciamento acessível de foco.

Tarefas Avulsas e Configurações não fazem parte da V1. As correções funcionais estão concluídas; permanecem como próximas etapas o refinamento visual completo, a Landing Page e o deploy/publicação final.

## Stack

- Frontend: React 19, TypeScript, Vite, React Router e Axios;
- Estilos: CSS próprio; Tailwind CSS está instalado no projeto;
- Backend: Node.js, Express 5 e TypeScript;
- Dados: PostgreSQL e Prisma 7;
- Arquitetura: monorepo com frontend e backend em camadas.

## Estrutura

```text
FocusList/
├── assets/
├── backend/
├── docs/
├── frontend/
├── prototipos/
├── .gitignore
└── README.md
```

## Documentação

O índice completo e o estado oficial do produto estão em [`docs/00-indice.md`](docs/00-indice.md). As decisões de Produto, UX e identidade visual estão em [`docs/PRODUCT_GUIDELINES.md`](docs/PRODUCT_GUIDELINES.md).

## Execução local

Frontend e backend possuem seus próprios `package.json`. O frontend usa `VITE_API_URL`, com fallback para `http://localhost:3000`; o backend usa `DATABASE_URL` e aceita `PORT`, com fallback para `3000`.

## Licença

A definir.
