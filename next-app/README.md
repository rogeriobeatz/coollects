# Coollects — PWA Next.js + TypeScript

A nova aplicação fica em \`next-app/\`, mantendo intacto o PHP original na raiz do repositório.

## Tecnologias
Next.js 16, React 19, TypeScript, Supabase Auth/PostgreSQL/Storage e Gemini (opcional). Interface preserva logotipo PNG original, Work Sans, roxo \`#6125BF\` e laranja \`#F15700\`.

## Desenvolvimento
\`\`\`bash
cd next-app
cp .env.example .env.local
npm install
npm test
npm run typecheck
npm run dev
\`\`\`
Configure Supabase e aplique \`supabase/migrations/20261013_initial.sql\` antes de usar login e persistência.

## Vercel
Root Directory: **\`next-app\`**, Node 22.x. Leia \`../docs/DEPLOY_VERCEL.md\` antes de publicar.

## Funcionalidades implementadas em código
Cadastro/login, perfis, coleções privadas/públicas, itens com foto e várias coleções, compartilhamento e Explorar com dados reais, OCR/IA opcional, PWA básica e migração manual de protótipo local.

**Atenção:** não há ambiente Supabase configurado neste repositório. O código precisa passar por testes de integração no seu projeto Supabase, conforme checklist no DEPLOY_VERCEL.md.

## Documentação
Visão: \`../docs/PRODUCT_VISION.md\` · Arquitetura: \`../docs/ARCHITECTURE.md\` · Guia visual: \`../docs/DESIGN_SYSTEM.md\` · Roadmap: \`../docs/ROADMAP.md\` · Histórico: \`../docs/CHANGELOG.md\`.
