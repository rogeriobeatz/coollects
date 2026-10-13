# Diário de desenvolvimento

## 2026-10-13 — Início da nova versão mobile
**Decisão:** reconstruir a partir do PHP original, usando Next.js + TypeScript com foco PWA e deploy Vercel. Não retomar a arquitetura da antiga Coollects V2 como base.

**Auditoria do PHP:** início/login/cadastro, pre-home com 4 atalhos, criação de coleções em formulário multietapas, categorias, cores e listagem; scripts de itens referenciados mas ausentes.

**Implementado na primeira entrega:** shell mobile-first, navegação inferior, páginas de início, coleções, explorar e cadastrar; manifest PWA; preparação de projeto Next.js e documentação.

**Ainda não implementado:** autenticação, banco, persistência, câmera, OCR/IA, dados públicos e sincronização. Interface sinaliza recursos ainda indisponíveis e não fabrica coleções.

**Segurança legado:** `config.php` possui credenciais e scripts usam SQL concatenado/MD5; não reutilizar. Evitar vazamento de dados/segredos nos commits.

**Próxima etapa:** validar build e implementar Supabase Auth, banco e primeiro CRUD completo de coleções/itens.
