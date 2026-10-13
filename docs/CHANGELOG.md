## 2026-10-13 — Correção de contraste da marca
- Identificado que o logotipo original é branco com fundo transparente (arquivo correto no repositório).
- Corrigido o cabeçalho, antes branco, para o roxo oficial `#6125BF` e preservado o logotipo sem nenhuma edição.
- Ajustada a proporção da imagem para 566 × 125 e estilos de foco no menu.

# Diário de desenvolvimento

## 2026-10-13 — Identidade oficial e primeiro fluxo de coleções
- Reutilizado o logo PNG e fontes Work Sans da versão PHP original (sem recriação).
- Fixados roxo `#6125BF` e laranja `#F15700` no tema.
- Implementado primeiro fluxo interativo de criação de coleções: categoria → nome → cor → descrição.
- Implementados lista, exclusão e persistência **somente no localStorage** para teste do fluxo no dispositivo.
- Adicionado `docs/BRAND_GUIDELINES.md` como contrato de marca.
- **Limitação**: essas coleções ainda NÃO são sincronizadas no Supabase nem públicas. Sem conta/autenticação ou upload de itens. localStorage pode ser removido pelo navegador.

## 2026-10-13 — Início da nova versão mobile
**Decisão:** reconstruir a partir do PHP original, usando Next.js + TypeScript com foco PWA e deploy Vercel. Não retomar a arquitetura da antiga Coollects V2 como base.

**Auditoria do PHP:** início/login/cadastro, pre-home com 4 atalhos, criação de coleções em formulário multietapas, categorias, cores e listagem; scripts de itens referenciados mas ausentes.

**Implementado na primeira entrega:** shell mobile-first, navegação inferior, páginas de início, coleções, explorar e cadastrar; manifest PWA; preparação de projeto Next.js e documentação.

**Ainda não implementado:** autenticação, banco, persistência remota, câmera, OCR/IA, dados públicos e sincronização. Interface sinaliza recursos ainda indisponíveis e não fabrica coleções.

**Segurança legado:** `config.php` possui credenciais e scripts usam SQL concatenado/MD5; não reutilizar. Evitar vazamento de dados/segredos nos commits.

**Próxima etapa:** validar build e implementar Supabase Auth, banco e primeiro CRUD completo de coleções/itens.
