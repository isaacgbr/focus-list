# Etapa 21B.3 — teste de concorrência

Medição local realizada em 19/10/2026 exclusivamente no banco
`focuslist_benchmark`, já preparado no perfil Grande. O teste reutilizou as
proteções, a API local e o dataset das etapas 21B.1/21B.2, sem recriar o seed ou
repetir o benchmark de volume.

## Método

- Progressão planejada: 1 → 5 → 10 → 25 → 50 fluxos concorrentes.
- Pelo menos 20 amostras lógicas por cenário e nível.
- Dashboard: `/areas` duas vezes (página e Sidebar), `/lists`, `/tasks`,
  `/checklist-items` e `/links`, disparados juntos por fluxo.
- No Dashboard, os tempos representam a conclusão do fluxo; req/s e erros
  contam as seis requisições HTTP de cada fluxo.
- Timeout por requisição: 30 s.
- Interrupção: qualquer erro/timeout, p95 de 10 s, ou p95 de 10× o nível 1
  acompanhado de queda de req/s para 75% ou menos do nível anterior.

## Resultados

Degradação é o fator do p95 em relação à concorrência 1 do mesmo cenário.

| Cenário | Conc. | Média (ms) | Mediana (ms) | p95 (ms) | req/s | Erros | Degradação p95 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/checklist-items` | 1 | 285,47 | 274,73 | 287,12 | 3,50 | 0 | 1,00× |
| `/checklist-items` | 5 | 1.305,49 | 1.305,81 | 1.324,25 | 3,79 | 0 | 4,61× |
| `/checklist-items` | 10 | 2.565,08 | 2.569,40 | 2.628,36 | 3,82 | 0 | 9,15× |
| `/checklist-items` | 25 | 5.958,05 | 6.466,83 | 6.535,73 | 3,82 | 0 | 22,76× |
| `/tasks` | 1 | 141,49 | 140,98 | 147,30 | 7,07 | 0 | 1,00× |
| `/tasks` | 5 | 657,04 | 651,43 | 676,39 | 7,52 | 0 | 4,59× |
| `/tasks` | 10 | 1.318,66 | 1.318,25 | 1.346,63 | 7,48 | 0 | 9,14× |
| `/tasks` | 25 | 3.295,61 | 3.293,73 | 3.332,65 | 7,49 | 0 | 22,62× |
| `/links` | 1 | 57,54 | 54,82 | 63,81 | 17,38 | 0 | 1,00× |
| `/links` | 5 | 269,55 | 268,79 | 280,96 | 18,24 | 0 | 4,40× |
| `/links` | 10 | 519,70 | 518,18 | 540,43 | 18,79 | 0 | 8,47× |
| `/links` | 25 | 1.314,12 | 1.313,97 | 1.348,18 | 18,49 | 0 | 21,13× |
| Dashboard + Sidebar | 1 | 471,68 | 463,93 | 513,11 | 12,72 | 0 | 1,00× |
| Dashboard + Sidebar | 5 | 2.065,88 | 2.067,94 | 2.304,25 | 12,71 | 0 | 4,49× |
| Dashboard + Sidebar | 10 | 4.127,53 | 4.274,25 | 5.229,49 | 12,28 | 0 | 10,19× |
| Dashboard + Sidebar | 25 | 8.022,35 | 8.259,41 | 11.291,24 | 13,27 | 0 | 22,01× |
| Todos | 50 | — | — | — | — | — | não executado |

## Primeiro ponto relevante de degradação

Na concorrência 5, o p95 aumentou entre 4,40× e 4,61× nos quatro cenários,
enquanto o throughput ficou entre 1,00× e 1,08× o nível 1. A fila aumentou a
latência quase proporcionalmente à concorrência sem ganho material de vazão.

## Erros e interrupção

Todas as 765 requisições HTTP medidas responderam 200. Não houve erro nem
timeout. A progressão foi interrompida depois da concorrência 25 porque o p95 do
Dashboard chegou a 11.291,24 ms, ultrapassando o critério severo de 10.000 ms;
por isso a concorrência 50 não foi executada.

## Conclusão

No perfil Grande, a concorrência elevou fortemente a latência sem aumentar de
forma relevante a vazão. `/checklist-items` permaneceu o endpoint individual
mais lento, e a composição do Dashboard foi o primeiro cenário a atingir o
critério de interrupção.

