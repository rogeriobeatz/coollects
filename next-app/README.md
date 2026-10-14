# Coollects — Aplicação mobile-first

O aplicativo Next.js 16 fica em `next-app/`. O código PHP original permanece na raiz.

## Desenvolvimento local

```sh
cd next-app
cp .env.example .env.local
npm install
npm test
npm run dev
```

Configure a URL e a chave publicável do projeto Supabase. Rode as migrações documentadas. O modo padrão é **manutenção**, por segurança: nenhuma tela de cadastro parcialmente configurada é apresentada ao visitante.

Para liberar o aplicativo **somente em ambiente de QA**, após configurar o banco e verificar os fluxos, defina `COOLLECTS_SITE_MODE=open`.

## Implantação Vercel

- Repositório `rogeriobeatz/coollects`, branch `main`
- Root Directory: `next-app`
- Node.js: 22
- `NEXT_PUBLIC_SUPABASE_URL` = endereço do projeto Coollects
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave publicável do projeto
- `COOLLECTS_SITE_MODE` = `maintenance` até a validação
- `GOOGLE_GENERATIVE_AI_API_KEY` = opcional; sem ela a interface de IA fica oculta

O servidor verifica configuração e liberação a cada requisição. `/api/health` retorna 503 quando o serviço não está liberado ou o banco não responde.

Leia `../docs/RELEASE_QA.md` e `../docs/DEPLOY_VERCEL.md` antes da abertura pública.

## Testes

- `npm test`: testes de código e detecção de textos internos na interface.
- `npm run typecheck`: tipos.
- `npm run build`: build.
- O CI sobe um servidor Next.js e valida todas as rotas públicas, o 404 e a página de manutenção.
- Isso **não substitui testes reais** de contas e dados privados com o Supabase, upload, IA, privacidade, nem testes de UI nos navegadores iOS/Android.

## Estado do hardening de dados
O banco real Coollects possui migrações `20261014_release_integrity.sql`, `20261014_username_entropy.sql` e `20261014_item_transactions.sql`, com testes SQL em transações revertidas. **Não execute novamente migrações já aplicadas.** A Edge Function `delete-account` está ativa no Supabase e requer JWT. Consulte `../docs/RELEASE_INTEGRITY_AUDIT.md` para os cenários bloqueantes antes de disponibilizar ao público.
