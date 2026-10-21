# Coollects — arquitetura

- Next.js 16 App Router, React e TypeScript em \`next-app/\`.
- Supabase Auth cookies com \`@supabase/ssr\`; refresh de sessão em \`proxy.ts\`, callback PKCE em \`app/auth/callback\`.
- Supabase PostgreSQL gerido por \`supabase/migrations/20261013_initial.sql\`.
- Tabelas \`profiles\`, \`collections\`, \`items\`, \`collection_items\`, \`scan_quotas\`.
- Collections N:N Items; apenas proprietário modifica; público só lê coleções publicadas e seus itens.
- Storage privado no bucket \`coollects-items\`, caminho \`<uuid-do-usuario>/<uuid-do-arquivo>.<ext>\`. Upload direto com sessão + RLS, download por URL assinada.
- Reconhecimento no backend \`app/api/recognize\`: chave privada KIE (modelo Google Gemini, imagem enviada inline com fallback para upload na KIE), quota atômica 10/dia, verificação real do formato, validação Zod, confirmação humana.
- Explorar lê coleções \`is_public=true\` e perfis públicos (sem e-mails).
- UI preserva logo original e cores \`#6125BF\` / \`#F15700\`; ver \`DESIGN_SYSTEM.md\`.
- PWA registra service worker que armazena **somente** tela estática offline. Nenhuma sessão ou foto é armazenada no cache de service worker.
- Cópias reduzidas das fotos (até 480 px, máx. 400 itens) ficam no IndexedDB do navegador (`lib/image-cache.ts`) para os cards aparecerem na hora; são apagadas em qualquer saída da conta. URLs assinadas duram 1 h.
- Prévias de link (WhatsApp/redes): `generateMetadata` + `opengraph-image` em `/colecao/[id]` e `/item/[id]`, lendo só dados públicos (`lib/og.tsx`). WebP é convertido para JPEG com `sharp`.
- Sem chave de serviço Supabase no frontend; as políticas RLS do banco e do Storage são parte fundamental da segurança.

Consulte \`DEPLOY_VERCEL.md\` para instalação e o checklist de testes integrados obrigatórios.

## Sessão de cadastro — 21/10/2026

CaptureProvider, no layout raiz, mantém estado, arquivos preparados, URLs locais e requisição de reconhecimento enquanto as rotas trocam. ScanWorkspace apresenta essa sessão; CaptureIndicator permite retomá-la de outras telas. O progresso é uma estimativa temporal, não telemetria do provedor. Somente o comando de salvar grava o item.

Logout/troca de conta invalidam a geração da análise, cancelam a requisição e liberam as URLs locais. Preparação de fotos e respostas antigas não podem atualizar a sessão seguinte. Um novo atalho de coleção não substitui silenciosamente o contexto de um rascunho em andamento.

O estado existe apenas na memória desta aba: não promete sobreviver a recarga, fechamento ou suspensão do processo pelo sistema operacional. O endpoint /api/recognize e suas quotas permanecem os mesmos; não há job persistente ou nova migração.
