# Roadmap — Coollects

## Etapa 0 — Fundamentação (iniciada)
- [x] Inspecionar fluxo PHP original e registrar funcionalidades confirmadas
- [x] Documentar visão, arquitetura e decisões
- [x] Criar shell Next.js/TypeScript mobile-first em `next-app/`
- [x] Criar navegação Início / Explorar / Cadastrar / Coleções
- [x] Incluir manifest básico de PWA
- [ ] Verificar instalação, typecheck e build no CI
- [ ] Incluir ícones de instalação e funcionamento PWA completo

## Etapa 1 — Dados e autenticação
- [ ] Criar projeto Supabase e migrations SQL versionadas
- [ ] Implementar signup/login/logout e sessão
- [ ] Criar perfis e políticas RLS
- [ ] Validar isolamento entre usuários

## Etapa 2 — Catálogo essencial
- [ ] CRUD de coleções (categoria/nome/cor/descrição/privacidade)
- [ ] CRUD de itens (campos, upload de imagem, categoria)
- [ ] Vincular/desvincular itens e coleções, busca e filtros
- [ ] Fluxo mobile com estados de erro/vazio/carregamento

## Etapa 3 — Comunidade
- [ ] Página pública de coleção e perfil
- [ ] Compartilhamento por link
- [ ] Explorar coleções públicas, categoria e busca
- [ ] Privacidade e validação de autorização

## Etapa 4 — Digitalização inteligente
- [ ] Permissão câmera e upload
- [ ] OCR/IA através do servidor com limites por usuário
- [ ] Exibir campos reconhecidos com nível de confiança
- [ ] Salvar apenas após confirmação; cadastro manual sempre disponível

## Etapa 5 — Publicação
- [ ] Testes E2E mobile/desktop e acessibilidade
- [ ] Segurança, termos e privacidade LGPD
- [ ] PWA: ícones, service worker e testes de instalação
- [ ] Deploy Vercel + domínio + observabilidade + beta de usuários

## Regras de conclusão
- Cada fase exige build verde, demonstração utilizável e documentação atualizada.
- Não chamar funcionalidade de pronta se houver apenas tela de apresentação.
