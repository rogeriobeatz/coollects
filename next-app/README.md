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

Visitantes recebem uma tela de boas-vindas com acesso a cadastro, login e exploração pública. Contas conectadas abrem diretamente o acervo, com saudação pessoal e atalhos de cadastro. A animação original está em `public/brand/intro-anim.json`, recuperada do site anterior; o player é carregado somente na boas-vindas e respeita movimento reduzido.

O emoji personalizado é escolhido junto da cor na criação ou edição da coleção. A migração `supabase/migrations/20261018154621_collection_emoji.sql` adiciona o campo opcional `collections.emoji` e já foi aplicada ao projeto Coollects. Não a execute novamente nesse projeto. Valores nulos mantêm o emoji da categoria; o emoji escolhido acompanha a coleção na home, na biblioteca e nas páginas públicas.

Todos os cards de coleção usam `components/collection-card.tsx`, com proporção 5:3, cor, emoji e identificação de coleção. Esse componente também é usado na prévia do editor. Em Minhas coleções, a variante de estante ocupa a largura disponível e mostra até duas fotografias reais em degradê, priorizando a capa escolhida. As relações são consultadas apenas para as coleções do proprietário; as URLs privadas são assinadas em lote. Sem fotografias disponíveis, o card usa o emoji escolhido. Editar, excluir, alterar visibilidade e copiar o link ficam dentro da coleção. Excluir uma coleção preserva os itens; excluir um item preserva as coleções. O teste SQL `supabase/tests/collection_item_crud.sql` valida CRUD e isolamento entre contas em uma transação revertida.

`components/feedback-notice.tsx` apresenta avisos informativos e de sucesso por aproximadamente cinco segundos, com fechamento manual. Erros continuam visíveis até serem corrigidos ou dispensados.

A navegação principal segue Home, Itens, Adicionar (+), Coleções e Explorar. O perfil fica à direita do header compartilhado, com o logo centralizado. Meus itens oferece busca, filtros por categoria e coleção (incluindo peças sem coleção), ordenação e visualização em grade ou baralho, mantendo as ações de cadastro, edição e exclusão. Preferências antigas pelo modo lista voltam à grade.

Os cards de item compartilham a mesma identidade na Home, no acervo, nas coleções e no detalhe. Colecionador destaca foto, marca da miniatura, modelo, montadora, escala e numeração. Gearhead exibe a ficha do veículo sem fotografia; a preferência é local e acompanha a navegação. O baralho apresenta até cinco cartas selecionáveis (três em telas baixas), com profundidade em CSS, toque/gesto e botões. Abrir uma carta permite virá-la, navegar entre itens e retornar ao baralho com restauração de foco. Nenhuma biblioteca 3D adicional é necessária.

Dados do veículo são opcionais e editáveis no cadastro/edição, separados do ano da cartela. São gravados no JSON de detalhes pelos RPCs existentes; nenhuma migração é necessária. Motor, potência, torque e demais especificações não são inferidos pelo reconhecimento da miniatura. Veja o mapa de componentes e os critérios de interação em [Experiência dos cards de item](docs/ITEM_CARDS.md).

## Implantação Vercel

- Repositório `rogeriobeatz/coollects`, branch `main`
- Root Directory: `next-app`
- Node.js: 22
- `NEXT_PUBLIC_SUPABASE_URL` = endereço do projeto Coollects
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave publicável do projeto
- `GOOGLE_GENERATIVE_AI_API_KEY` = opcional; sem ela a interface de IA fica oculta

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
