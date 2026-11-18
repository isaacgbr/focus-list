<p align="center">
  <img src="frontend/public/focuslist-mark.png" width="96" alt="Símbolo do FocusList" />
</p>

<h1 align="center">FocusList</h1>

<p align="center"><strong>Organização pessoal com foco no que realmente importa.</strong></p>

<p align="center">
    <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white" alt="Express 5" />
    <img src="https://img.shields.io/badge/Prisma_7-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma 7" />
    <img src="https://img.shields.io/badge/Supabase-181818?style=flat-square&logo=supabase&logoColor=3FCF8E" alt="Supabase" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <a href="https://focus-list-nine.vercel.app"><strong> Acessar o FocusList em produção</strong></a>
</p>

## Sobre

O **FocusList** é uma aplicação web responsiva para organizar atividades na hierarquia **Áreas → Listas → Tarefas**. A experiência combina planejamento direto, visão clara das prioridades e acompanhamento do progresso em uma interface dark minimalista para desktop, mobile e PWA.

## Destaques

- Dashboard responsivo com progresso, prioridades e próximos prazos;
- Áreas, Listas e Tarefas com checklist, links, visualizações e arquivamento;
- autenticação segura, recuperação de senha e isolamento entre usuários;
- modo Demonstração temporário, com opção de importar os dados ao criar uma conta;
- Perfil com preferências e avatar armazenado em bucket privado;
- PWA instalável com experiência Offline própria, sem cache de dados privados.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, React Router e CSS próprio |
| Backend | Node.js, Express 5 e arquitetura Route → Controller → Service → Repository |
| Dados | Prisma 7, PostgreSQL e Supabase Storage privado |
| Serviços | Resend para recuperação de senha |
| Produção | Vercel, com frontend estático e API Express na mesma origem |

## Documentação

A arquitetura, regras de negócio, fluxos e decisões de produto estão centralizados na [documentação oficial](docs/00-indice.md).

---

<p align="center">
  <img src="docs/assets/isaac-gabriel-avatar.png" alt="Isaac Gabriel" width="96" height="96">
  <br>
  <sub>Desenvolvido por</sub>
  <br>
  <strong>Isaac Gabriel</strong>
  <br><br>
  <a href="https://github.com/isaacgbr"><img src="https://img.shields.io/badge/GitHub-292D2D?style=flat&amp;logo=github&amp;logoColor=white" alt="GitHub de Isaac Gabriel" height="20"></a>
  <a href="https://www.linkedin.com/in/isaacgbr"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&amp;logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMC40NDcgMjAuNDUyaC0zLjU1NHYtNS41NjljMC0xLjMyOC0uMDI3LTMuMDM3LTEuODUyLTMuMDM3LTEuODUzIDAtMi4xMzYgMS40NDUtMi4xMzYgMi45Mzl2NS42NjdIOS4zNVY5aDMuNDE0djEuNTYxaC4wNDljLjQ3Ni0uOSAxLjYzNy0xLjg1IDMuMzctMS44NSAzLjYwMSAwIDQuMjY3IDIuMzcgNC4yNjcgNS40NTV2Ni4yODZaTTUuMzM3IDcuNDMzYTIuMDYyIDIuMDYyIDAgMSAxIDAtNC4xMjQgMi4wNjIgMi4wNjIgMCAwIDEgMCA0LjEyNFpNNy4xMTkgMjAuNDUySDMuNTU1VjloMy41NjR2MTEuNDUyWiIvPjwvc3ZnPg%3D%3D" alt="LinkedIn de Isaac Gabriel" height="20"></a>
</p>