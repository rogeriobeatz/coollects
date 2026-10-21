# Rede social do Coollects

Implementação de 20/10/2026: colecionadores descobrem perfis e itens públicos, seguem pessoas, curtem peças e consultam sua atividade. O caminho é Home/Explorar → perfil ou item → Data API do Supabase com sessão → RLS → resposta e atualização da interface.

## Experiência

- A Home de contas conectadas mostra peças públicas próprias e de quem a pessoa segue, em ordem cronológica. Ao terminar, oferece novidades da comunidade, sem repetir peças já exibidas. Ambas as listas têm paginação, carregamento automático e botão de recuperação.
- `/u/[username]` mostra identidade, biografia, números públicos, conexões, coleções, peças publicadas e curtidas. `/perfil` abre esse mesmo componente para o proprietário; a edição fica em `/perfil/editar`.
- Seguir/deixar de seguir e curtir/descurtir respondem imediatamente. Falhas revertem o estado e deixam um erro disponível para nova tentativa. Listas dependentes são consultadas após a confirmação da escrita.
- Seguidores, perfis seguidos e pessoas que curtiram abrem em um modal com paginação, suporte a teclado e restauração de foco. Visitantes recebem um link para entrar e retornar à página; proprietários não recebem controles para seguir a si mesmos ou curtir suas próprias peças.
- `/notificacoes` mostra até 60 atividades recentes: novos seguidores e curtidas recebidas, agrupadas por data. São as relações atuais, não um histórico permanente: descurtir ou deixar de seguir remove a respectiva atividade. A leitura é local ao navegador, isolada por conta e marcada até o evento mais recente recebido. O sino consulta novidades na navegação e ao devolver foco à janela; não depende de Realtime, push ou e-mail.
- Cards de item usam `CollectibleCard`/`ItemCardContent`; coleções usam `CollectionCard` em 5:3. Galeria/Baralho e Colecionador/Gearhead continuam independentes. A Home oferece cadastro manual quando a IA não está habilitada.

## Banco e migração

`next-app/supabase/migrations/20261020183212_social_network_completion.sql` foi aplicada ao projeto Coollects (`zegjmrogiyyptccstofs`) e registrada com essa mesma versão no histórico remoto. Não executar novamente nesse projeto.

A migração consolidada inclui as funções dos scripts de origem `20261021090000_social_network.sql` e `20261022090000_home_feed.sql`, que já existiam no trabalho local. Os scripts são idempotentes e foram mantidos como origem da implementação; não é necessário aplicá-los separadamente ao banco atual. Funções anteriores são preservadas durante a transição de clientes publicados.

Tabelas: `user_follows` e `item_likes`, com chaves compostas, referências com exclusão em cascata e RLS. `anon` recebe apenas SELECT; `authenticated`, SELECT/INSERT/DELETE. UPDATE, TRUNCATE, REFERENCES e TRIGGER não são concedidos aos clientes. Uma pessoa só escreve relações próprias; seguir a si mesma e curtir peça própria são recusados.

As funções sociais usam SECURITY INVOKER, limites de página e permissões explícitas. `home_feed` e `my_social_activity` só podem ser executadas por contas autenticadas. Galerias, feeds e contadores públicos verificam a existência de uma coleção pública; tornar privada a última coleção pública remove o item das novas consultas sociais. Links assinados ou cópias de fotos já carregadas seguem a política de cache existente do aplicativo.

## Verificação reproduzível

Evidências de 20/10/2026:

- 103 testes unitários aprovados em 16 arquivos; TypeScript e build Next.js aprovados.
- 64 cenários gerais de navegador aprovados na suíte completa; 14 cenários sociais aprovados na execução final, incluindo erros de leitura/escrita, teclado, favoritos, paginação e confirmação das escritas.
- Smoke HTTP: 16 páginas e 404 aprovados. Revisão de Home/perfil em 320 px sem rolagem horizontal nem erros de JavaScript.
- Teste RLS executado com sucesso no banco real, antes e depois da migração, com rollback dos registros de teste.
- Smoke real da Data API aprovado: oito funções públicas disponíveis e duas funções pessoais negadas a visitantes.
- A versão do frontend foi preparada e testada localmente; não houve deploy nesta entrega.

Dentro de `next-app`:

```sh
npm test
npm run typecheck
npm run build
npm run start -- -p 3202
```

Em outro terminal, execute `npm run test:browser` e `node scripts/smoke-pages.mjs 3202`. Para testar um build local com URL real de Supabase, configure `PLAYWRIGHT_SUPABASE_URL` com a mesma URL pública do build; os testes interceptam as chamadas do navegador e não gravam em contas reais. No CI, os valores sintéticos existentes continuam sendo usados.

`npm run test:social-backend` testa, sem escrita, as oito funções públicas pela Data API real e confirma a recusa das duas funções pessoais para visitantes. Usa as variáveis públicas do ambiente ou de `.env.local`, sem exibir credenciais nem registros pessoais.

`supabase/tests/social_rls.sql` testa o banco real em BEGIN/ROLLBACK com duas identidades temporárias e o papel anônimo: seguir/desseguir, curtir/descurtir, titularidade, conexões, atividade, publicação/despublicação e ausência de itens privados nas respostas. Nenhum usuário ou item de teste é preservado.

O advisor após a migração não apresentou avisos nas funções/tabelas sociais. Permanecem os apontamentos anteriores, fora desta entrega: [quota de IA sem política de acesso direto](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [função privilegiada da quota](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [proteção contra senhas vazadas desativada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Os testes de navegador usam backend simulado; o SQL valida RLS no Supabase real e o smoke consulta sua API real anonimamente. Isso não comprova uma sessão completa com duas contas reais no domínio publicado nem substitui testes em aparelhos físicos. Esta entrega não inclui deploy do frontend, alteração de domínio, chat, comentários ou notificações push.
