# Diário de desenvolvimento do Coollects

## 2026-10-13 — Integração de todas as frentes do MVP (em validação)
- Cliente/servidor Supabase SSR com cookies, refresh via Next 16 proxy, signup/login/logout e callback seguro.
- Migrations PostgreSQL de perfis, itens, coleções, junção N:N, RLS, bucket privado e quotas de IA.
- Coleções em nuvem: CRUD, privacidade pública/privada, links compartilháveis e filtros.
- Itens em nuvem: cadastro/edição/exclusão, foto persistida em bucket privado, associação a múltiplas coleções.
- Explorar coleções públicas reais, perfil de colecionador e páginas de coleções por URL.
- Reconhecimento visual por IA (Gemini), OCR multimodal, limite de 10 leituras/dia e revisão dos campos antes de salvar.
- Importação manual opcional das antigas coleções/itens do localStorage para conta Supabase, sem exclusão de dados locais.
- PWA: SVG do ícone com PNG oficial incorporado (sem redesenhar logotipo), manifest, service worker com página offline estática.
- Testes automatizados de funções essenciais e guia de deploy/testes no repositório.
- Preservação: PHP original intacto, Work Sans, logo original, \`#6125BF\` e \`#F15700\`.
- **Pendente:** configuração de projeto Supabase e chave Gemini, testes reais de privacidade e fluxos em aparelhos, revisão jurídica/LGPD. Não considerar lançamento público concluído.

## Histórico anterior
Ver commits e pull requests #1–#4 do repositório \`rogeriobeatz/coollects\`. Eles registram fundação do Next.js, guia de identidade, protótipo local, redesign editorial e correção do contraste do logotipo.

### 2026-10-13 — Ajustes finais do MVP
- Recuperação de senha via e-mail e atualização de senha dentro de sessão autenticada.
- Edição de fotos de itens com substituição e remoção no armazenamento privado.
- Auditoria npm adicionada ao CI; pacote de testes atualizado para Vitest 5 + Vite 8, sem vulnerabilidades reportadas nessa combinação.
- Navegação de perfil com estado ativo e links para privacidade e termos.
- Pendência crítica: integração com Supabase real e teste de autenticação/row-level security antes do lançamento.
