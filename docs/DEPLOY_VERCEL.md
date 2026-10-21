# Coollects — Implantação na Vercel e Supabase

Atualizado em 21/10/2026. Consulte RELEASE_QA.md para os critérios atuais e SOCIAL_NETWORK.md para o histórico da integração social. Esta revisão não realiza deploy nem altera o ambiente remoto.

## Aplicação

- Repositório rogeriobeatz/coollects, branch main, Root Directory next-app.
- Next.js 16; Node.js 22.x no ambiente publicado.
- Instalação npm ci; build npm run build.
- NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY: URL e chave publicável/anon. Nunca colocar service-role em NEXT_PUBLIC_*.
- KIE_API_KEY: opcional, somente no servidor. Sem ela, cadastro manual permanece funcional.
- NEXT_PUBLIC_SITE_URL: endereço público canônico para prévias de compartilhamento.
- Variáveis novas exigem novo build/deploy.
- As páginas abrem diretamente. COOLLECTS_SITE_MODE deixou de controlar a aplicação.
- /api/health sinaliza disponibilidade do banco; não substitui testes de autenticação ou arquivos.

## Banco existente e ambientes novos

O projeto Coollects já possui migrações do núcleo e da rede social aplicadas. Não criar outro projeto nem reaplicar scripts automaticamente. Compare o histórico remoto antes de qualquer migração.

Em um ambiente novo, revisar todas as migrações necessárias em next-app/supabase/migrations e as instruções de consolidação em SOCIAL_NETWORK.md. Scripts sociais de origem se sobrepõem à migração consolidada; não tratá-los como instrução para reaplicação no banco existente.

Fotos ficam no bucket privado coollects-items. São preparadas localmente até 600 KB; há até cinco fotos por item. URLs assinadas duram até uma hora. RLS é responsável pela autorização real, não a interface.

## Auth e exclusão

Configure Site URL e Redirect URLs do Supabase para https://SEU-DOMINIO/auth/callback e as URLs locais necessárias. Configure SMTP e teste confirmação e recuperação com e-mails reais.

A Edge Function delete-account utiliza SUPABASE_SERVICE_ROLE_KEY apenas no ambiente da função. Essa chave não é necessária no frontend ou nas variáveis públicas da Vercel. A exclusão está disponível em Perfil → Editar perfil → Controle da conta, com confirmação de senha; validar remoção completa usando uma conta descartável.

## Validação e operação

Execute os checks locais e os cenários reais de RELEASE_QA.md antes da abertura pública. Auditorias históricas não comprovam a versão atualmente publicada. Os ajustes de experiência de 21/10 usam a Data API existente; não exigem migração nova.

- Atendimento e privacidade: contato@coollects.com.br; testar recebimento e definir o procedimento operacional.
- Validar limites do Storage, custos KIE, CAPTCHA/rate limits de cadastro, monitoramento e backups.
- Revisão jurídica permanece necessária; disponibilizar contato não certifica conformidade.
- PWA armazena apenas a página offline no service worker; miniaturas visuais ficam no IndexedDB e são apagadas no logout.
- Não usar credenciais do PHP legado. Revogar qualquer segredo antigo que tenha sido publicado no histórico.
