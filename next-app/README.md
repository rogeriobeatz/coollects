# Coollects Mobile — Next.js + TypeScript

Nova aplicação em \`next-app/\`. PHP original **preservado na raiz**.

## Executar
\`\`\`sh
cd next-app
npm install
npm run dev
\`\`\`
Visite http://localhost:3000

## Visual atual
Interface editorial mobile-first: logo original, roxo \`#6125BF\`, laranja \`#F15700\`, Work Sans, cards geométricos, microinterações, navegação inferior. Ver \`../docs/DESIGN_SYSTEM.md\`.

## O que funciona neste protótipo
- Criar, listar, filtrar e excluir coleções; dados no \`localStorage\`.
- Abrir câmera ou galeria em dispositivos compatíveis, visualizar a fotografia **sem upload**.
- Cadastrar nome, marca, categoria e observações de item, opcionalmente associando-o a uma coleção **local**. Foto não é persistida.
- Home exibe contagens reais do armazenamento local.
- Explorar permite filtrar **temas ilustrativos**, ainda sem usuários reais.

## O que não está pronto
Não há autenticação, banco, sincronização, upload persistente, IA/OCR, feed real ou compartilhamento de coleções. Não use a versão de demonstração para dados críticos; o navegador pode limpar o armazenamento local.

## Deploy Vercel
- Repositório \`rogeriobeatz/coollects\`
- Branch \`main\`
- Root Directory: **\`next-app\`**
- Framework: Next.js
- Node.js: 22.x
- Build: \`npm run build\`
- Install: \`npm install\`

## Documentação
- \`../docs/PRODUCT_VISION.md\`
- \`../docs/ARCHITECTURE.md\`
- \`../docs/DESIGN_SYSTEM.md\`
- \`../docs/ROADMAP.md\`
- \`../docs/CHANGELOG.md\`
