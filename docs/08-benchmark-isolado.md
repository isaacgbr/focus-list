# Ambiente isolado de benchmark

Esta configuração prepara o perfil **pequeno** sem usar o banco normal do FocusList.
Nenhum comando de benchmark usa `DATABASE_URL` como fallback.

## Proteções obrigatórias

Os comandos só prosseguem quando todas as condições abaixo são verdadeiras:

1. `BENCHMARK_DATABASE_URL` foi informada;
2. o nome do banco termina em `_benchmark`;
3. `BENCHMARK_CONFIRMATION` vale exatamente `FOCUSLIST_BENCHMARK_ONLY`;
4. o alvo não coincide com o `DATABASE_URL` do `.env` de desenvolvimento;
5. o PostgreSQL confirma o mesmo nome por `current_database()`.

A recriação limpa tabelas inteiras somente depois dessas verificações. Isso evita
usar prefixos ou outros filtros frágeis para decidir quais registros apagar.

## Preparação local (sem versionar credenciais)

1. Crie no PostgreSQL um banco separado cujo nome termine em `_benchmark`, por
   exemplo `focuslist_benchmark`. Não reutilize o banco de desenvolvimento.
2. Copie `backend/.env.benchmark.example` para
   `backend/.env.benchmark.local`. O arquivo local é ignorado pelo Git.
3. Preencha `BENCHMARK_DATABASE_URL` apenas no arquivo local. Não coloque a URL
   real no exemplo, na documentação ou em commits.
4. A partir de `backend`, valide e prepare:

   ```powershell
   npm run benchmark:check
   npm run benchmark:prepare:small
   npm run benchmark:baseline
   ```

`benchmark:prepare:small` aplica as migrations existentes no banco dedicado e
recria o seed. `benchmark:seed:small` recria somente os dados, para quando as
migrations já estiverem aplicadas. Ambos repetem a proteção antes de qualquer
alteração. A recriação usa uma transação e reinicia as sequências de IDs; uma
falha durante a geração desfaz também a limpeza.

## Perfil pequeno

O seed determinístico usa datas fixas, títulos prefixados com
`[BENCH-SMALL]` e URLs no domínio reservado `benchmark.invalid`:

- 5 Áreas (1 arquivada);
- 25 Listas (1 arquivada diretamente);
- 250 Tarefas (62 concluídas e 1 arquivada diretamente);
- 750 itens de checklist (3 por tarefa);
- 250 Links (1 por tarefa).

A baseline é somente leitura. Ela sobe a API numa porta local efêmera e verifica
`/health`, as cinco coleções usadas pelo Dashboard, a hierarquia
Área → Lista → Tarefa, checklist, links e os três tipos da Central de Arquivados.
Ela não mede tempo, não cria concorrência e não executa carga.
