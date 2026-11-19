# Visão geral

O FocusList é uma aplicação web de organização pessoal construída em torno de uma hierarquia curta:

```text
Área
└── Lista
    └── Tarefa
```

A proposta é tornar prioridades, prazos e próximos passos visíveis com baixa carga visual. O produto atende organização pessoal, estudos e projetos individuais sem adicionar colaboração, notificações ou estruturas paralelas à hierarquia principal.

## Experiência

- Dashboard orientado a atenção, andamento e progresso.
- Fluxos diretos para criar, concluir, arquivar, restaurar e excluir.
- Modos Lista e Cards para diferentes densidades de leitura.
- Interface dark responsiva, com composições próprias para desktop e mobile.
- PWA instalável com tela Offline; dados do usuário continuam dependentes de conexão.
- Landing pública, Demonstração temporária e conta persistente.

## Princípios

- simplicidade acima da quantidade de recursos;
- dados reais e feedback claro em todos os estados;
- hierarquia consistente na navegação e no arquivamento;
- acessibilidade, foco visível e suporte a `prefers-reduced-motion`;
- segurança e isolamento aplicados no backend, nunca inferidos pelo cliente.

Áreas, Listas e Tarefas formam o núcleo do domínio. Dashboard, Arquivados, Demo e Perfil são diferentes formas de operar ou visualizar essa mesma estrutura.
