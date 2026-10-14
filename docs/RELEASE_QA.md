# Coollects — Auditoria de lançamento

Data: 14/10/2026. Solicitada validação de todas as rotas, remoção de rastros de desenvolvimento e proibição de um lançamento incompleto.

## Critério de publicação
**Não declarar o Coollects pronto** enquanto qualquer condição crítica não estiver verificada na **Vercel publicada**, com duas contas reais e navegadores reais.

A aplicação usa **fail closed**: `COOLLECTS_SITE_MODE` ausente ou diferente de `open`, ou chaves de acesso ausentes ⇒ página de espera institucional. Isso impede o aparecimento de alertas de configuração ao público.

## Auditoria de código e interfaces (CI)
- [x] Identificada mensagem “Configure o Supabase” em AuthGate e mensagem “Conecte o Supabase” na Home.
- [x] Localizadas e removidas mensagens equivalentes no login, recuperação de acesso, Explorar, rota de coleção e API de IA.
- [x] Substituídos erros crus do banco por estados amigáveis nos fluxos principais.
- [x] Interface de IA oculta quando a credencial opcional não estiver habilitada.
- [x] Páginas 404, erro inesperado e carregamento com estilo da marca.
- [x] Políticas de privacidade e termos sem avisos de desenvolvimento.
- [x] Health endpoint para sinalizar 503 quando lançamento não liberado ou banco indisponível.
- [x] Teste de cópia para impedir regressão de mensagens internas.
- [x] Script CI de smoke HTTP de todas as rotas sem autenticação (depende de build verde).
- [x] URLs de imagens assinadas reduzidas de 30 minutos para 2 minutos, reduzindo exposição de URLs antigas após tornar uma coleção privada.

## Rotas cobertas pelo smoke HTTP
`/`, `/entrar`, `/registrar`, `/recuperar`, `/redefinir`, `/colecoes`, `/cadastrar`, `/explorar`, `/itens`, `/perfil`, `/privacidade`, `/termos`, `/u/[username]`, `/colecao/[id]`, 404 e modo manutenção.

Esses testes confirmam a renderização HTTP, **não** a operação completa das interações com dados reais.

## Itens ainda bloqueantes para lançamento (QA real)
- [ ] Conectar Vercel ao projeto Supabase Coollects (verificando `Root Directory=next-app` e variáveis de ambiente) e confirmar o deployment Ready.
- [ ] Acessar a URL de produção e comparar commit, versão carregada, console e recursos (sem login).
- [ ] `/api/health` deve responder **200** após configurar `COOLLECTS_SITE_MODE=open` somente em ambiente controlado.
- [ ] Cadastrar conta A e B, validar e-mails, login, logout, recuperação e troca de senha.
- [ ] Conta A cria coleção privada; conta B **não** acessa conteúdo por URL, API ou arquivos.
- [ ] Criar/editar/excluir itens com foto persistente e vínculos entre coleções.
- [ ] Publicar e despublicar uma coleção, testar o link com navegador anônimo e URLs de imagem expiradas.
- [ ] Testar exclusão e reimportação voluntária de dados locais sem perda/duplicação.
- [ ] Testar reconhecimento IA caso ativado; qualidade das sugestões, erros e limite de uso.
- [ ] Testar em Safari iOS, Chrome Android, desktop, telas pequenas, teclado, leitores de tela e modo PWA.
- [ ] Validar ícones de instalação, estados offline e fallback após restauração de conexão.
- [ ] Informar operador responsável, e-mail de atendimento e procedimento de exclusão de conta; revisar LGPD/termos e política de moderação.
- [ ] Configurar SMTP com domínio, proteções antiabuso, limites de custo, monitoramento e backups.
- [ ] Auditoria de segurança real com autenticação e usuários distintos; o CI não cobre isso.

## Regras operacionais
- Nunca colocar service-role key em `NEXT_PUBLIC_*`.
- `NEXT_PUBLIC_SUPABASE_URL`: `https://zegjmrogiyyptccstofs.supabase.co`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave publicável do projeto Coollects, colocada apenas em Vercel.
- `COOLLECTS_SITE_MODE`: manter `maintenance` até aprovar todos os bloqueios; somente então passar a `open`.
- `GOOGLE_GENERATIVE_AI_API_KEY`: opcional, somente no servidor.
- Não usar “100% testado”, “lançado” ou “aprovado” sem relatório de QA real, evidência e data.
