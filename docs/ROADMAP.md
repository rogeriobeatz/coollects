# Roadmap — Coollects

## Etapa 0 — Base visual e histórica
- [x] Analisar fluxos de colecionismo do PHP original e preservar seu código
- [x] Documentar visão, arquitetura, decisões e histórico
- [x] Criar aplicação Next.js + TypeScript mobile-first em \`next-app/\`
- [x] Reutilizar logo original, Work Sans e cores exatas \`#6125BF\` / \`#F15700\`
- [x] Redesenhar Home, Coleções, Cadastrar e Explorar com microinterações
- [x] Criar navegação inferior de 5 ações e telas de estado vazio
- [x] Fluxo local de criação, filtro, listagem e exclusão de coleções
- [x] Entrada de câmera/galeria com prévia, cadastro manual local de item e vínculo local à coleção
- [ ] Adicionar ícones instaláveis completos e service worker da PWA

## Etapa 1 — Dados e autenticação
- [ ] Conectar Supabase e versionar migrations PostgreSQL
- [ ] Criar login/cadastro/logout e perfis privados/públicos
- [ ] Aplicar RLS a toda tabela de usuário e armazenamento
- [ ] Migrar coleções e itens locais mediante consentimento do usuário
- [ ] Implementar CRUD persistente de coleções e itens com imagens
- [ ] Automatizar testes de permissão e isolamento de dados

## Etapa 2 — Comunidade
- [ ] Coleções públicas/privadas, URLs compartilháveis
- [ ] Explorar coleções **reais**, filtros, pesquisa, perfis
- [ ] Seguir favoritos (opcional depois do feed inicial)
- [ ] Blindar endpoints públicos contra exposição de dados privados

## Etapa 3 — Digitalização inteligente
- [ ] Persistir fotos com compressão e validação de arquivo
- [ ] Backend OCR + IA com limites/rate limits e custo controlado
- [ ] Mostrar confiança e confirmação humana antes de salvar

## Etapa 4 — Publicação
- [ ] Testar PWA e instalação iOS/Android
- [ ] Testes E2E, acessibilidade e desempenho em celulares reais
- [ ] Privacidade, LGPD, observabilidade, Vercel e domínio
- [ ] Beta com usuários e melhoria guiada por uso

## Atenção
- Não chamar protótipo local de sistema online/sincronizado.
- Não representar temas ilustrativos como coleções ou perfis reais.
- Mudanças de identidade visual dependem de aprovação explícita.
- Cada etapa exige build e documentação atualizados.
