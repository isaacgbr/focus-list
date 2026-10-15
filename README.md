# FocusList

Aplicação web desktop-first para organização pessoal em uma hierarquia simples de **Áreas → Listas → Tarefas**.

## Estado atual

O núcleo funcional da V1 está em desenvolvimento e já possui frontend integrado à API para:

- Dashboard com dados reais e estados vazio, carregando e erro;
- criação e edição de Áreas, Listas e Tarefas;
- conclusão de Tarefas, prioridades, prazos, checklist e links;
- Central única de Arquivados para Áreas, Listas e Tarefas;
- edição, restauração e exclusão definitiva de itens arquivados.

A tela Sobre e a identidade visual oficial estão aprovadas em protótipo, mas ainda não foram implementadas. A Landing Page também não foi implementada e permanece planejada para a publicação da V1.

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
