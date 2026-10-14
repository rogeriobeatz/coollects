# Auditoria de integridade e privacidade — 14/10/2026

## Correções aplicadas ao banco Supabase Coollects
1. `20261014_release_integrity.sql`: remove recursão de políticas RLS entre `items` e `collection_items`, cria funções internas que retornam apenas verificações booleanas, e substitui vínculos de forma atômica.
2. `20261014_username_entropy.sql`: corrige colisões da geração automática de usernames com hash SHA-256 do UUID completo; nomes inválidos enviados pela API caem no padrão seguro.
3. `20261014_item_transactions.sql`: cadastrar e editar itens e seus vínculos na mesma transação PostgreSQL, com controle de acesso RLS e validação do proprietário das coleções.

## Verificação em SQL no Supabase real
Executado com **duas identidades simuladas dentro de BEGIN/ROLLBACK**, sem criar usuários persistentes:
- [x] Insert em `auth.users` cria automaticamente os dois perfis.
- [x] Itens e links privados da conta A **não** são visíveis à conta B.
- [x] Itens e links públicos da conta A podem ser vistos pela conta B.
- [x] Uma conta não pode atualizar item de outra conta por RPC.
- [x] Uma edição tentando vincular coleção de outra pessoa falha **sem alterar metadados nem os vínculos originais**.
- [x] UUIDs com mesmo prefixo que antes geravam usernames duplicados agora geram usernames distintos.
- [x] Nenhuma conta/coleção de QA foi preservada, graças ao rollback.

## Mudanças na aplicação
- [x] Cadastro de itens chama `create_item_with_collections`; upload é removido se a transação falhar.
- [x] Edição usa `update_item_with_collections`; a fotografia antiga só é removida depois do commit.
- [x] Importação legada não sobrescreve dados existentes.
- [x] Verifica assinaturas mágicas reais JPG, PNG e WebP e limites de tamanho.
- [x] Exclusão de conta com confirmação e reautenticação; função privilegiada separada do frontend. A função deve ser testada com conta descartável **antes** do lançamento.
- [x] Credenciais administrativas não são versionadas nem expostas ao navegador.

## Bloqueios restantes, sem os quais o lançamento não recebe status "Ready"
- [ ] Teste de ponta a ponta via HTTP com duas contas Supabase reais e uploads reais (não apenas SQL).
- [ ] Teste da Edge Function `delete-account` com conta de teste e fotografias.
- [ ] SMTP, entrega de e-mails e recuperação real de senha.
- [ ] Segurança de uploads concorrentes, rate limits, e monitoramento de custos.
- [ ] Teste Safari iOS, Chrome Android e PWA instalada em aparelho físico.
- [ ] Dados reais do operador, canal de suporte e revisão jurídica LGPD.
- [ ] Configuração final e monitoramento do ambiente de hospedagem.

As verificações do GitHub Actions (testes, build, Playwright, auditoria npm e smoke HTTP) não substituem esses cenários. Não afirmar 100% pronto sem eles.
