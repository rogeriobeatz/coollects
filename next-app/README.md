# Coollects — Aplicação mobile-first

O aplicativo Next.js 16 fica em `next-app/`. O sistema PHP original foi removido em 2026-10-19 e pode ser recuperado pelo histórico do git.

## Desenvolvimento local

```sh
cd next-app
cp .env.example .env.local
npm ci
npm test
npm run dev
```

A aplicação abre diretamente, sem etapa de liberação ou modo de manutenção. Configure a URL e a chave publicável do projeto Supabase em `.env.local` para usar contas e salvar coleções. Rode as migrações documentadas quando necessário.

Visitantes recebem uma tela de boas-vindas com acesso a cadastro, login e exploração pública. Contas conectadas abrem o feed com peças públicas próprias e de quem seguem, saudação pessoal e atalhos de cadastro. A animação original está em `public/brand/intro-anim.json`, recuperada do site anterior; o player é carregado somente na boas-vindas e respeita movimento reduzido.

O emoji personalizado é escolhido junto da cor na criação ou edição da coleção. A migração `supabase/migrations/20261018154621_collection_emoji.sql` adiciona o campo opcional `collections.emoji` e já foi aplicada ao projeto Coollects. Não a execute novamente nesse projeto. Valores nulos mantêm o emoji da categoria; o emoji escolhido acompanha a coleção na home, na biblioteca e nas páginas públicas.

Todos os cards de coleção usam `components/collection-card.tsx`, com proporção 5:3, cor, emoji e identificação de coleção. Esse componente também é usado na prévia do editor. Em Minhas coleções, a variante de estante ocupa a largura disponível e mostra até duas fotografias reais em degradê, priorizando a capa escolhida. As relações são consultadas apenas para as coleções do proprietário; as URLs privadas são assinadas em lote. Sem fotografias disponíveis, o card usa o emoji escolhido. Editar, excluir, alterar visibilidade e copiar o link ficam dentro da coleção. Excluir uma coleção preserva os itens; excluir um item preserva as coleções. O teste SQL `supabase/tests/collection_item_crud.sql` valida CRUD e isolamento entre contas em uma transação revertida.

`components/feedback-notice.tsx` apresenta avisos informativos e de sucesso por aproximadamente cinco segundos, com fechamento manual. Erros continuam visíveis até serem corrigidos ou dispensados.

A navegação principal segue Home, Itens, Adicionar (+), Coleções e Perfil. Explorar fica acessível pela Home; o sino de notificações fica à direita do header compartilhado, com o logo centralizado. Meus itens oferece busca, filtros por categoria e coleção (incluindo peças sem coleção), ordenação e visualização em grade ou baralho, mantendo as ações de cadastro, edição e exclusão. Preferências antigas pelo modo lista voltam à grade.

A camada social permite seguir colecionadores, curtir itens públicos, consultar seguidores/seguindo e receber atividade recente. O perfil próprio reutiliza `/u/[username]`; a edição fica em `/perfil/editar`. A migração consolidada `20261020183212_social_network_completion.sql` já foi aplicada ao Supabase Coollects. Consulte [Rede social](../docs/SOCIAL_NETWORK.md) para regras de privacidade, testes e limites. `npm run test:social-backend` verifica a API real sem gravar dados.

Os cards de item compartilham a mesma identidade na Home, no acervo, nas coleções e no detalhe. Colecionador destaca foto, marca da miniatura, modelo, montadora, escala e numeração. Gearhead exibe a ficha do veículo sem fotografia; a preferência é local e acompanha a navegação. O baralho apresenta até cinco cartas selecionáveis (três em telas baixas), com profundidade em CSS, toque/gesto e botões. Abrir uma carta permite virá-la, navegar entre itens e retornar ao baralho com restauração de foco. Nenhuma biblioteca 3D adicional é necessária.

Dados do veículo são opcionais e editáveis no cadastro/edição, separados do ano da cartela. São gravados no JSON de detalhes pelos RPCs existentes; nenhuma migração é necessária. Motor, potência, torque e demais especificações não são inferidos pelo reconhecimento da miniatura. Veja o mapa de componentes e os critérios de interação em [Experiência dos cards de item](docs/ITEM_CARDS.md).

## Implantação Vercel

- Repositório `rogeriobeatz/coollects`, branch `main`
- Root Directory: `next-app`
- Node.js: 22
- `NEXT_PUBLIC_SUPABASE_URL` = endereço do projeto Coollects
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave publicável do projeto
- `KIE_API_KEY` = opcional; sem ela a interface de IA fica oculta

`/api/health` verifica a conexão com o banco e retorna 503 quando faltam credenciais ou o banco não responde. Isso não bloqueia a abertura das páginas.

Leia `../docs/RELEASE_QA.md` e `../docs/DEPLOY_VERCEL.md` antes da abertura pública.

## Testes

- `npm test`: testes de código e detecção de textos internos na interface.
- `npm run typecheck`: tipos.
- `npm run build`: build.
- O CI sobe um servidor Next.js e valida todas as rotas públicas e o 404, sem bloqueio de manutenção.
- Isso **não substitui testes reais** de contas e dados privados com o Supabase, upload, IA, privacidade, nem testes de UI nos navegadores iOS/Android.

## Estado do hardening de dados
O banco real Coollects possui migrações `20261014_release_integrity.sql`, `20261014_username_entropy.sql` e `20261014_item_transactions.sql`, com testes SQL em transações revertidas. **Não execute novamente migrações já aplicadas.** A Edge Function `delete-account` está ativa no Supabase e requer JWT. Consulte `../docs/RELEASE_INTEGRITY_AUDIT.md` para os cenários bloqueantes antes de disponibilizar ao público.

## Build reproduzível
O arquivo `package-lock.json` foi obtido de uma execução aprovada do GitHub Actions. Use `npm ci` para instalar as versões testadas; não atualize dependências sem executar auditoria npm, testes unitários, smoke HTTP, TypeScript, build e Playwright.

## Ajustes de experiência — 21/10/2026

Cadastro cria coleções privadas sem sair da ficha e permite continuar manualmente durante a análise. Falhas de vínculo e galeria podem ser retomadas sem duplicação ou descarte das fotos selecionadas. O Explorar consulta nomes, descrições, categorias e autores no servidor e pagina as coleções públicas; a área pessoal lê metadados em páginas e apresenta cards/fotos progressivamente. Nenhuma migração nova é necessária. Ajuda e privacidade: contato@coollects.com.br. Consulte ../docs/RELEASE_QA.md para validação e limites.

## Reconhecimento enquanto você navega

O cadastro mantém um rascunho por conta na sessão aberta do app. Após escolher a foto, é possível navegar entre as páginas: o indicador flutuante mostra a análise em andamento (progresso estimado), a conclusão para revisão ou uma falha recuperável. Retomar não envia a mesma foto outra vez; campos editados manualmente continuam protegidos. Fotos, ficha e coleções permanecem no provider do layout até salvar, descartar ou sair da conta. O app não salva o item automaticamente.

Essa continuidade vale para navegação interna na mesma aba. Atualizar, fechar a aba ou o navegador suspender o processo pode interromper a sessão; o aviso de saída da aba ajuda a evitar descarte involuntário. Não há fila durável no backend nem migração nova.


## Push notifications (PWA)

A instalação é opcional. No iOS, o usuário deve abrir o PWA pela Tela de Início antes de permitir push. No Android, o botão de instalação utiliza `beforeinstallprompt` quando disponível.

Configure as três variáveis na Vercel (Preview e Production): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. A chave privada VAPID e a service role nunca devem usar prefixo `NEXT_PUBLIC_` nem ser commitadas.

A migração `supabase/migrations/20261022093000_web_push_subscriptions.sql` cria as inscrições por dispositivo e os registros de deduplicação de notificações. Ative as notificações em `/notificacoes` e teste com duas contas distintas: seguir um perfil e curtir um item público. A entrega exige nova compilação depois de adicionar variáveis de ambiente.
