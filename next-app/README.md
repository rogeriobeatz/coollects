# Coollects — Nova aplicação mobile

Esta é a fundação Next.js + TypeScript, **não** uma versão funcional completa. O PHP original permanece preservado na raiz do repositório.

## Desenvolvimento local
```bash
cd next-app
npm install
npm run dev
```

Abra http://localhost:3000

## Vercel
- Importar repositório `rogeriobeatz/coollects`
- Branch: `main` após merge da implementação
- **Root Directory: `next-app`**
- Framework: Next.js
- Install: `npm install`
- Build: `npm run build`
- Node.js: 22.x

## O que existe
Interface mobile com navegação e páginas institucionais para iniciar o MVP. O manifest inclui metadados de instalação, mas **PWA completo ainda precisa de ícones e service worker**.

## Documentação
Leia `../docs/PRODUCT_VISION.md`, `../docs/ARCHITECTURE.md`, `../docs/ROADMAP.md` e `../docs/CHANGELOG.md`.

## Avisos
As páginas de digitalização, coleções e explorar ainda são telas iniciais, sem persistência e sem integração com a câmera ou com IA. Não devem ser tratadas como funções entregues.
