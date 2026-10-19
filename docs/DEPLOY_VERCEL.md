# Coollects — Implantação na Vercel + Supabase

**Atualizado em 13/10/2026.** Os componentes foram implementados em código, mas **ainda não existe ambiente de produção conectado pelo assistente**. Não convide usuários a registrar dados reais sem executar os testes abaixo.

## 1. Supabase
1. Crie um projeto Supabase com PostgreSQL.
2. No **SQL Editor**, execute o arquivo \`next-app/supabase/migrations/20261013_initial.sql\` (verifique antes de aplicar). Ele cria perfis, coleções, itens, vínculos, quotas, triggers, políticas RLS e um bucket **privado** \`coollects-items\`.
3. Em Authentication → URL Configuration, defina Site URL como sua URL Vercel e inclua Redirect URLs:
   - \`https://SEU-DOMINIO.vercel.app/auth/callback\`
   - \`http://localhost:3000/auth/callback\` para ambiente local
   Pode manter confirmação de e-mail ativada; SMTP precisa ser configurado para produção.
4. Em Project Settings → API, copie Project URL e chave publicável/anon. A chave publicável **pode** ser usada no navegador; **NUNCA** publique uma chave service_role.

## 2. Vercel
- Repositório: \`rogeriobeatz/coollects\`
- Production branch: \`main\`
- **Root Directory: \`next-app\`** (a raiz contém apenas documentação)
- Framework Preset: Next.js
- Node.js: 22.x
- Install Command: \`npm install\`
- Build Command: \`npm run build\`
- Adicione em Settings → Environment Variables (Production, Preview conforme necessidade):
  - \`NEXT_PUBLIC_SUPABASE_URL\` = https://PROJECT_ID.supabase.co
  - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` = chave publicável/anon
  - `KIE_API_KEY` = opcional para reconhecimento por IA (somente servidor)
- Depois de alterar variáveis, faça novo deploy.
- Não defina \`SUPABASE_SERVICE_ROLE_KEY\`; o MVP não precisa dela.
- Atenção: usuários sem cadastro não terão dados de acervos pessoais na Home.

## 3. Autenticação
- Cadastro com e-mail e senha (mínimo 8 caracteres), confirmação por e-mail quando habilitada.
- A trigger cria o perfil público com username automático \`colecionador_...\`.
- Perfil permite personalizar nome de usuário, nome e biografia.
- Sessão em cookies via \`@supabase/ssr\`; \`proxy.ts\` atualiza tokens no Next.js 16.
- Não use credenciais do PHP legado; revogue/rotacione qualquer senha de banco que esteja no histórico público do repositório.

## 4. Testes de aceitação OBRIGATÓRIOS
- [ ] Configurar Supabase/SQL e verificar nenhuma falha no editor.
- [ ] Cadastrar conta A, confirmar e-mail, entrar e sair.
- [ ] Criar coleção privada A; garantir que conta B e navegador anônimo NÃO a veem.
- [ ] Criar item com foto (JPG/PNG/WebP até 5 MB), verificar foto após atualizar e em outro dispositivo.
- [ ] Associar um item a duas coleções; editar e remover vínculos.
- [ ] Marcar coleção pública e conferir link no navegador anônimo, perfil e feed Explorar.
- [ ] Tornar a coleção privada novamente e verificar que o link deixa de mostrar itens e fotos. URLs temporárias já emitidas podem continuar válidas até seu vencimento; mantenha TTL curto.
- [ ] Testar importação de dados locais antigos voluntariamente; sem repetir importação.
- [ ] Verificar que o usuário B não consegue editar/excluir itens de A mesmo via chamadas diretas à API.
- [ ] Verificar que bucket não permite upload fora da pasta do próprio usuário.
- [ ] Testar reconhecimento com IA (imagem legível, imagem ilegível, limite de 10/dia), sem gravar sugestões automaticamente.
- [ ] Testar falta de chave IA e falta de conexão sem travar cadastro manual.
- [ ] Testar instalação PWA Android/desktop e abertura sem internet; iOS poderá exigir ícone PNG dedicado.
- [ ] Testar em Chrome Android, Safari iOS, 320px, acessibilidade e controle por teclado.
- [ ] Configurar canal de suporte e revisar textos legais LGPD e moderação antes do beta.
- [ ] Monitorar limites do Supabase Storage e API KIE, adicionar CAPTCHA/rate limit de criação de conta antes de tráfego público.

## 5. Privacidade e segurança
- Coleções são privadas por padrão.
- Quando públicas, fotos, nome, marca, categoria e observações dos itens vinculados ficam visíveis a visitantes; não registre dados sensíveis nesses campos.
- Fotos no bucket privado são exibidas por URLs assinadas (30min) após verificação de política.
- O endpoint \`/api/recognize\` exige sessão válida, usa chave somente no servidor, verifica o tipo real da imagem e consome uma cota atômica no banco (10 análises/dia).
- Política de armazenamento restringe upload/exclusão ao diretório do próprio usuário.
- Service worker só armazena página offline estática — sem sessões nem fotos privadas.
- O cliente nunca deve confiar nas regras apenas da interface; o SQL RLS é obrigatório.

## 6. Limitações para o beta
- Ainda **não foram realizados testes integrados com um Supabase real**. O CI só valida unidade, tipos e build.
- OCR é obtido pela leitura multimodal do Gemini, não por um mecanismo OCR determinístico offline.
- Reconhecimento depende de uma chave KIE; pode ter custo e erros.
- Falta revisão jurídica e um canal de contato real antes de um lançamento aberto.
- A migração automática do banco PHP não está incluída (SQL dump original não foi localizado); importador apenas migra o antigo armazenamento local.

## Recuperação de senha
Inclua o redirect `https://SEU-DOMINIO.vercel.app/auth/callback` na configuração do Supabase. O link de recuperação abre a rota `/redefinir` após autenticação PKCE. Teste validade e expiração do link.

## Observação sobre exclusão da conta
Antes do lançamento aberto, crie um canal de suporte e um procedimento operacional de exclusão integral da conta e dos arquivos privados (incluindo a exclusão do usuário no Auth). O MVP ainda não oferece exclusão autônoma de conta. Não afirme conformidade LGPD definitiva sem auditoria.

## Proteção adicional de lançamento (14/10/2026)
O banco Supabase do Coollects **já foi criado** em São Paulo e duas migrações foram aplicadas. Não é preciso criar outro projeto nem reaplicar automaticamente as migrações.

**Obrigatório na Vercel:** `COOLLECTS_SITE_MODE=maintenance` (padrão). O sistema mostra apenas uma página institucional se a aplicação não for liberada ou se as chaves públicas estiverem ausentes.

Para o beta de QA, configurar `NEXT_PUBLIC_SUPABASE_URL=https://zegjmrogiyyptccstofs.supabase.co`, chave publicável do projeto, redirecionamentos de Auth e SMTP. Só mudar `COOLLECTS_SITE_MODE=open` quando a equipe tiver concluído os cenários do `RELEASE_QA.md`.

O endpoint `/api/health` retorna 503 enquanto fechado e só responde 200 quando a liberação está habilitada **e** a consulta pública ao banco funciona. Esse teste não substitui autenticação com duas contas e upload real.
