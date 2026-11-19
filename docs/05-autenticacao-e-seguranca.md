# Autenticação e segurança

## Senhas e sessões

Senhas usam `scrypt` assíncrono com salt aleatório, `N=131072`, `r=8`, `p=1` e chave de 64 bytes. A comparação é feita em tempo constante; conta ausente e senha incorreta executam trabalho criptográfico equivalente.

Cada login cria um token aleatório de 256 bits. Apenas seu SHA-256 é persistido em `Session`. O token é enviado em cookie com:

| Propriedade | Produção |
| --- | --- |
| Nome | `__Host-focuslist_session` |
| Duração | 7 dias |
| `HttpOnly` | Sim |
| `Secure` | Sim |
| `SameSite` | `Lax` |
| `Path` | `/` |
| `Domain` | Ausente |

Cada requisição privada revalida hash, expiração, revogação e tipo de usuário no banco. Logout revoga a sessão atual; trocas sensíveis podem revogar outras sessões conforme o fluxo.

## Autorização e isolamento

O middleware injeta `userId`, `sessionId` e tipo a partir da sessão válida. Controllers e Services não aceitam `userId` do cliente como propriedade.

Leituras, escritas, movimentações, arquivamento, restauração e exclusão verificam ownership em toda a árvore do domínio. O mesmo vale para Dashboard, Arquivados, checklist, links e Perfil. Acesso a recurso alheio é tratado como não encontrado, evitando enumeração por ID.

## Proteções HTTP

- origem exata por `FRONTEND_ORIGIN`, HTTPS em produção e credenciais CORS controladas;
- rejeição de requisições `cross-site` e corpos de escrita fora de `application/json`;
- limite global de JSON de 32 KiB e limite específico para avatar;
- erros inesperados genéricos e logs sem SQL, stack, credenciais ou dados pessoais;
- respostas autenticadas com `no-store`;
- rate limit em memória de 30 tentativas por IP a cada 15 minutos, complementado pelo Vercel Firewall nas rotas sensíveis.

## Recuperação de senha

`/auth/forgot-password` responde de forma neutra para contas existentes e ausentes. Para uma conta REAL, cria um token aleatório, persiste somente seu hash e envia um link pelo Resend. O link permanece válido por 30 minutos e pode ser usado uma vez.

Consumo do token, troca da senha e revogação das sessões acontecem na mesma transação. Emissões e redefinições concorrentes são serializadas; trocar o e-mail invalida recuperações pendentes. A Vercel mantém o envio assíncrono após a resposta HTTP por meio de `waitUntil`.

Tokens, cookies, hashes, chaves do Supabase e credenciais do Resend nunca são retornados ao frontend ou registrados em logs.
