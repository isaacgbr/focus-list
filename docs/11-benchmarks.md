# Benchmarks históricos

O FocusList possui medições locais realizadas em outubro de 2026, antes da arquitetura atual de autenticação e produção na Vercel. Elas servem como registro de engenharia, não como promessa de desempenho atual.

## Resumo

- O teste por volume registrou 540 requisições HTTP 200, sem erro de integridade.
- No perfil Médio, o maior p95 observado foi de aproximadamente 55 ms.
- No perfil Grande, as coleções de checklist e tarefas dominaram custo e payload: cerca de 276 ms de mediana para checklist e 145 ms para tarefas.
- O teste concorrente registrou 765 respostas HTTP 200, sem erro ou timeout até concorrência 25.
- A partir de concorrência 5, a latência aumentou quase proporcionalmente sem ganho material de vazão; o perfil Grande atingiu o critério de interrupção antes da etapa 50.

## Interpretação

Os resultados indicam que coleções amplas e fan-out de dados merecem paginação ou consultas mais específicas caso o volume cresça. Para a V1 de portfólio, os testes confirmaram estabilidade funcional nos cenários avaliados, mas não substituem métricas da produção atual nem medem renderização do navegador.

Scripts, datasets, relatórios integrais e JSONs foram preservados somente em `.local/benchmarks/`, fora do Git. Novos benchmarks devem usar ambiente isolado e nunca credenciais ou dados de produção.
