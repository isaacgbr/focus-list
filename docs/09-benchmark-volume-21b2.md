# Etapa 21B.2 — desempenho por volume

Medições locais realizadas em 19/10/2026 exclusivamente no banco
`focuslist_benchmark`, após validação das proteções da 21B.1. Nenhum dado ou
arquivo de ambiente de desenvolvimento foi alterado.

## Método

- Perfis determinísticos Pequeno, Médio e Grande, com contagens conferidas após
  cada seed.
- API Express em porta local efêmera, usando a configuração protegida de
  benchmark.
- 3 aquecimentos e 20 amostras registradas por endpoint e por perfil.
- Uma requisição por vez (`requestConcurrency: 1`), sem carga concorrente.
- Payload medido como bytes do corpo da resposta.
- Média, mediana e p95 calculados sobre as 20 amostras.
- Os pacotes de página abaixo são derivados dos endpoints usados pelo frontend.
  A soma serial é uma comparação conservadora das medianas, não o tempo de
  renderização ou o tempo real de uma página no navegador.

## Datasets validados

| Perfil | Áreas | Listas | Tarefas | Checklists | Links |
|---|---:|---:|---:|---:|---:|
| Pequeno | 5 | 25 | 250 | 750 | 250 |
| Médio | 20 | 200 | 2.000 | 8.000 | 2.000 |
| Grande | 50 | 500 | 10.000 | 50.000 | 10.000 |

Cada perfil manteve 1 área, 1 lista e 1 tarefa arquivadas diretamente para
validar a Central de Arquivados.

## Tempos das APIs

Valores em `média / mediana / p95`, em milissegundos.

| Endpoint | Pequeno | Médio | Grande |
|---|---:|---:|---:|
| `GET /areas` | 1,14 / 1,02 / 1,50 | 1,14 / 1,08 / 1,48 | 1,80 / 1,55 / 2,50 |
| `GET /lists` | 1,30 / 1,26 / 1,53 | 2,88 / 2,81 / 3,41 | 5,43 / 5,25 / 6,40 |
| `GET /tasks` | 4,11 / 3,83 / 5,61 | 29,46 / 28,07 / 33,94 | 145,58 / 145,48 / 158,84 |
| `GET /checklist-items` | 5,70 / 5,31 / 7,42 | 47,72 / 45,91 / 54,71 | 285,80 / 275,66 / 283,58 |
| `GET /links` | 3,00 / 2,67 / 5,35 | 12,73 / 12,56 / 13,66 | 60,49 / 58,22 / 70,20 |
| `GET /areas/1` | 1,35 / 1,16 / 1,86 | 1,35 / 1,32 / 1,57 | 2,47 / 1,67 / 3,03 |
| `GET /lists/1` | 1,12 / 1,06 / 1,43 | 1,05 / 1,06 / 1,35 | 1,31 / 1,17 / 2,00 |
| `GET /tasks/1` | 1,20 / 1,15 / 1,51 | 1,18 / 1,16 / 1,45 | 1,34 / 1,24 / 1,69 |
| `GET /archived` | 2,28 / 2,23 / 2,59 | 2,79 / 2,53 / 3,05 | 4,88 / 4,22 / 7,45 |

## Payloads das APIs

Bytes do corpo da resposta; foram estáveis nas 20 amostras de cada endpoint.

| Endpoint | Pequeno | Médio | Grande | Crescimento P→G |
|---|---:|---:|---:|---:|
| `GET /areas` | 949 | 4.552 | 11.654 | 12,3× |
| `GET /lists` | 3.754 | 38.080 | 98.002 | 26,1× |
| `GET /tasks` | 57.445 | 583.394 | 3.013.248 | 52,5× |
| `GET /checklist-items` | 91.569 | 999.800 | 6.266.699 | 68,4× |
| `GET /links` | 36.785 | 299.787 | 1.497.789 | 40,7× |
| `GET /areas/1` | 236 | 238 | 236 | 1,0× |
| `GET /lists/1` | 196 | 198 | 196 | 1,0× |
| `GET /tasks/1` | 293 | 295 | 293 | 1,0× |
| `GET /archived` | 1.164 | 1.186 | 1.195 | 1,0× |

## Comparação por página

O payload agrega os endpoints efetivamente usados pelo componente e pela
Sidebar. A soma serial usa as medianas das APIs, sem executar fan-out paralelo.

| Página | Payload P / M / G | Soma serial mediana P / M / G | API dominante no Grande |
|---|---:|---:|---|
| Dashboard | 191.451 / 1.930.165 / 10.899.046 B | 15,11 / 91,51 / 487,71 ms | checklist (275,66 ms) |
| Área | 62.384 / 626.264 / 3.123.140 B | 7,27 / 33,28 / 153,95 ms | tarefas (145,48 ms) |
| Lista | 187.180 / 1.887.969 / 10.789.822 B | 15,05 / 90,00 / 483,75 ms | checklist (275,66 ms) |
| Detalhes de Tarefa, carga incremental | 128.354 / 1.299.587 / 7.764.488 B | 7,98 / 58,47 / 333,88 ms | checklist (275,66 ms) |
| Arquivo Central | 2.113 / 5.738 / 12.849 B | 3,25 / 3,61 / 5,77 ms | arquivados (4,22 ms) |

## Erros e degradação

- 540 requisições registradas (180 por perfil), todas HTTP 200; nenhum erro de
  API ou variação de payload. Os 81 aquecimentos também concluíram.
- O nível Médio não apresentou critério de interrupção: p95 máximo de 54,71 ms,
  payload individual máximo de 999.800 B e nenhum erro. Por isso o Grande foi
  executado.
- De Pequeno para Grande, a mediana de checklist cresceu 51,9×, a de tarefas
  38,0× e a de links 21,8×. As rotas de detalhe por ID ficaram próximas de
  1–2 ms e com payload constante.
- O Dashboard passou de 191.451 B para 10.899.046 B (56,9×); Lista, de 187.180 B
  para 10.789.822 B (57,6×); e a carga incremental de Detalhes de Tarefa, de
  128.354 B para 7.764.488 B (60,5×).
- O Arquivo Central permaneceu pequeno porque o dataset possui três registros
  diretamente arquivados por perfil; este resultado não caracteriza uma Central
  com quantidade crescente de itens diretamente arquivados.

## Gargalos confirmados

1. `GET /checklist-items` foi a resposta mais lenta e volumosa em todos os
   perfis. No Grande: mediana 275,66 ms, p95 283,58 ms e 6.266.699 B.
2. `GET /tasks` foi o segundo maior custo medido no Grande: mediana 145,48 ms,
   p95 158,84 ms e 3.013.248 B.
3. `GET /links` chegou a mediana 58,22 ms, p95 70,20 ms e 1.497.789 B.
4. Os resultados confirmam gargalo nas coleções completas e no volume
   transferido/serializado. Esta etapa não instrumentou banco, ORM e serialização
   separadamente, portanto não atribui o custo a uma camada interna específica.

## Observações de frontend

O tempo de renderização, uso de memória e responsividade do navegador não foram
mensurados. Pela implementação inspecionada, Dashboard, Área, Lista e o modal de
Tarefa recebem coleções completas e fazem filtros no cliente. Assim, os payloads
de página acima são diretamente sustentados pelas respostas medidas, mas não são
uma medição de Web Vitals ou do tempo visual da interface. O frontend usa
`Promise.all` em algumas páginas; essa simultaneidade normal não foi exercitada
para manter a 21B.2 sem teste de concorrência.

## Arquivos do benchmark

Criados:

- `backend/src/benchmark/profiles.ts`
- `backend/src/benchmark/seed.ts`
- `backend/src/benchmark/measure.ts`
- `docs/benchmark-results/21b2-small.json`
- `docs/benchmark-results/21b2-medium.json`
- `docs/benchmark-results/21b2-large.json`
- `docs/09-benchmark-volume-21b2.md`

Alterados:

- `backend/package.json`
- `backend/src/benchmark/seed-small.ts`

Não houve alteração em `.env`, migrations, schema, queries funcionais ou código
de produto. Não houve otimização, teste concorrente, commit ou push.

## Estado do Git ao finalizar

`git status --short`:

```text
 M backend/package.json
 M backend/src/benchmark/seed-small.ts
?? backend/src/benchmark/measure.ts
?? backend/src/benchmark/profiles.ts
?? backend/src/benchmark/seed.ts
?? docs/09-benchmark-volume-21b2.md
?? docs/benchmark-results/
```

`git diff --stat` (por definição, não inclui os arquivos ainda não rastreados):

```text
 backend/package.json                |   7 +-
 backend/src/benchmark/seed-small.ts | 140 +-----------------------------------
 2 files changed, 9 insertions(+), 138 deletions(-)
```
