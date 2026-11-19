# Demo e perfil

## Demonstração

`POST /auth/demo` cria uma identidade `DEMO` e uma sessão isolada com expiração absoluta de 24 horas. A Demo inicia vazia e utiliza os mesmos endpoints, regras de domínio e verificações de ownership de uma conta real.

Uma sessão REAL ativa não é substituída por uma Demo. Encerrar a experiência revoga a sessão temporária e remove o cookie; expiração lógica é verificada em toda requisição, independentemente da limpeza física dos registros.

### Importação ao criar uma conta

O cadastro originado da Demo cria uma conta REAL e associa a capacidade de importação exclusivamente à nova sessão por `DemoTransfer`. Nenhum ID da Demo ou token adicional é aceito do cliente.

Na importação, uma transação:

1. bloqueia e revalida sessão e identidade DEMO;
2. transfere o ownership das Áreas para a conta REAL;
3. preserva IDs e todos os descendentes;
4. revoga sessões DEMO e resolve o vínculo.

Também é possível descartar o vínculo sem transferir dados. Concorrência, expiração e falhas produzem rollback ou respostas controladas. Demos expiradas podem ser removidas em lotes pelo comando `npm run demo:cleanup`.

## Perfil

O Perfil é exclusivo de contas REAL e permite:

- alterar nome e e-mail;
- trocar a senha com confirmação da senha atual;
- escolher Lista ou Cards como visualização padrão;
- enviar, substituir ou remover o avatar;
- encerrar a sessão.

Trocas de e-mail exigem a senha atual e invalidam recuperações pendentes. Trocas de senha usam o mesmo scrypt do login, preservam a sessão atual e revogam as demais sessões da conta.

## Avatar privado

O frontend aceita JPG, PNG ou WebP de até 5 MB e 20 megapixels, permite recorte e gera um JPEG de 256 × 256. O backend limita o payload processado, valida assinatura e dimensões e gera uma chave UUID.

O objeto fica no bucket privado do Supabase Storage; somente `avatarKey` é persistido. O frontend lê a imagem exclusivamente pelo endpoint autenticado `/profile/avatar`.

Substituição e remoção seguem ordem segura:

- upload novo antes de atualizar o banco;
- remoção do novo objeto se a atualização falhar;
- exclusão do objeto antigo somente depois do novo vínculo persistir;
- desvinculação no banco antes de excluir um avatar removido.

Falhas tardias de limpeza são registradas de forma sanitizada e não desfazem um Perfil já consistente.
