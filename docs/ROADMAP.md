# Coollects — Roadmap do MVP

## Código implementado (validar integração em produção)
- [x] Next.js 16 + TypeScript, identidade visual original e design mobile editorial
- [x] Supabase Auth (cadastro, login, sessão, perfil)
- [x] Schema PostgreSQL com RLS e coleção privada por padrão
- [x] CRUD de coleções com links públicos, categorias, cores e descrições
- [x] CRUD de itens e vínculos a várias coleções
- [x] Storage privado com upload de fotografias e URLs assinadas
- [x] Explorar coleções públicas reais e perfil de usuário
- [x] Leitura multimodal OCR/IA opcional com revisão e cota diária
- [x] Importador voluntário do protótipo local
- [x] Estrutura básica PWA com manifest, ícone SVG e página offline
- [x] Documentação e configuração CI (npm install, testes, tipos, build)

## Infraestrutura e lançamento — bloqueado até configuração e validação
- [ ] Criar e conectar **projeto real Supabase**; executar migração SQL
- [ ] Configurar URL/redirect de Auth e SMTP de e-mails
- [ ] Adicionar variáveis de ambiente na Vercel e chave de IA se desejada
- [ ] Testar ponta a ponta com dois usuários (RLS, storage e compartilhamento)
- [ ] Testar Android, iOS e PWA instalada; ícone PNG dedicado para iOS se necessário
- [ ] Configurar rate limits por IP/CAPTCHA de cadastro, prevenção contra abuso e observabilidade de custos
- [ ] Canal de suporte, política de privacidade/termos completos e revisão de LGPD
- [ ] Migração do PHP/MySQL histórico, se houver dump utilizável (não encontrado no repositório)
- [ ] Beta controlado → correções → lançamento público

## Regra permanente
- Não afirmar que o app foi lançado sem infraestrutura conectada e testes de aceitação.
- Não alterar a marca, logotipo oficial nem os tons institucionais.
- Documentar cada implementação e decisão em \`docs/CHANGELOG.md\`.

## Incrementos posteriores ao primeiro ciclo de testes
- [x] Recuperação de senha por e-mail
- [x] Substituição e remoção de fotografias no editor de itens
- [x] Auditoria npm bloqueando falhas de severidade alta/crítica
