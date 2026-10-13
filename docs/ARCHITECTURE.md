# Arquitetura e decisões (ADR 001)

## Estado
Aceita para fundação; integrações de backend ainda **não implementadas**.

## Origem do código
Repositório `rogeriobeatz/coollects` contém o legado PHP na raiz. A nova implementação fica em `next-app/`, **sem alterar os arquivos PHP**.

## Stack alvo
- Next.js (App Router), React, TypeScript, hospedagem Vercel
- PostgreSQL e autenticação gerenciada via Supabase
- Storage de fotos Supabase, imagens privadas e públicas segundo políticas
- PWA com manifest, ícones e service worker a completar
- OCR / visão via rota server-side (não expor chaves em cliente)
- RLS/escopo por usuário em todas as consultas

## Entidades propostas
- `profiles`: id (auth.users), username, display_name, avatar, bio
- `categories`: id, name, slug, icon
- `items`: id, owner_id, category_id, name, description, brand, model, year, condition, image_path, created_at
- `collections`: id, owner_id, category_id, title, description, color, visibility (private/public), created_at
- `collection_items`: collection_id, item_id, added_at, PK composta

## Regras de segurança
- Um item é sempre propriedade de um usuário.
- Apenas proprietário altera item e coleção.
- Adicionar item a coleção exige que ambos pertençam ao mesmo proprietário.
- Feed público mostra apenas coleções com `visibility='public'`, e itens vinculados a essas coleções.
- Não devolver e-mails, valores pessoais ou chaves privadas nos endpoints públicos.
- Fotos recebem políticas de leitura consistentes com privacidade.

## Migração
Legado: `usuarios`, `categorias`, `collections`, scripts de cadastro/listagem. Ausentes do repositório: `novo-item.php` e `listar-item.php`; o SQL do legado não foi encontrado.
**Não importar senha MD5** para nova autenticação e **rotacionar credenciais** expostas no `config.php` legado.

## Deploy
Importar este repositório na Vercel com Root Directory `next-app`; branch de produção depois de merge: `main`.
As variáveis de ambiente e conexão com Supabase ainda serão documentadas/implementadas nas fases seguintes.
