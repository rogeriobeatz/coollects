# Coollects — arquitetura

- Next.js 16 App Router, React e TypeScript em \`next-app/\`.
- Supabase Auth cookies com \`@supabase/ssr\`; refresh de sessão em \`proxy.ts\`, callback PKCE em \`app/auth/callback\`.
- Supabase PostgreSQL gerido por \`supabase/migrations/20261013_initial.sql\`.
- Tabelas \`profiles\`, \`collections\`, \`items\`, \`collection_items\`, \`scan_quotas\`.
- Collections N:N Items; apenas proprietário modifica; público só lê coleções publicadas e seus itens.
- Storage privado no bucket \`coollects-items\`, caminho \`<uuid-do-usuario>/<uuid-do-arquivo>.<ext>\`. Upload direto com sessão + RLS, download por URL assinada.
- Reconhecimento no backend \`app/api/recognize\`: chave privada Google Gemini, quota atômica 10/dia, verificação real do formato, validação Zod, confirmação humana.
- Explorar lê coleções \`is_public=true\` e perfis públicos (sem e-mails).
- UI preserva logo original e cores \`#6125BF\` / \`#F15700\`; ver \`DESIGN_SYSTEM.md\`.
- PWA registra service worker que armazena **somente** tela estática offline. Nenhuma sessão ou foto é armazenada no cache de service worker.
- Sem chave de serviço Supabase no frontend; as políticas RLS do banco e do Storage são parte fundamental da segurança.

Consulte \`DEPLOY_VERCEL.md\` para instalação e o checklist de testes integrados obrigatórios.
