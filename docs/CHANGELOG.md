# Diário de desenvolvimento

## 2026-10-13 — Redesign editorial e interações mobile
- Implementadas telas redesenhadas: Início, Coleções, Cadastrar e Explorar, além de uma tela inicial de Perfil.
- Mantido logotipo oficial branco original em cabeçalhos roxos \`#6125BF\`; laranja institucional \`#F15700\`; fonte Work Sans original.
- Novo sistema visual: hero editorial, botão grande de digitalização, cards coloridos, arte geométrica, filtros, estados vazios, navegação inferior 5 itens, transições e modo de movimento reduzido.
- Coleções: preservada compatibilidade com o armazenamento local antigo; nova aparência do wizard de quatro etapas e listagem filtrável.
- Home: contagem de coleções e itens lida do armazenamento local, nunca dados fictícios.
- Cadastrar: câmera/galeria via entrada do dispositivo com prévia; cadastro manual de metadados com vínculo a uma coleção local; foto **não persistida**, IA/OCR **não conectados**.
- Explorar: temas ilustrativos filtráveis; nenhum perfil, número de seguidores ou coleção de usuário inventados.
- Criado \`docs/DESIGN_SYSTEM.md\` com regras visuais e limites de funcionalidade.
- Integração Supabase, usuários reais, persistência de fotos, IA e compartilhamento público seguem pendentes.

## 2026-10-13 — Correção de contraste da marca
- Identificado que o logotipo original é branco com fundo transparente.
- Corrigido o cabeçalho para roxo oficial \`#6125BF\` e preservado o logotipo sem edição.
- Ajustada a proporção do PNG para 566 × 125.

## 2026-10-13 — Identidade oficial e primeiro fluxo de coleções
- Reutilizado o logo PNG e fontes Work Sans da versão PHP original.
- Fixados roxo \`#6125BF\` e laranja \`#F15700\` no tema.
- Implementado fluxo de criação de coleções em quatro etapas e armazenamento apenas no navegador.
- Adicionado \`docs/BRAND_GUIDELINES.md\`.

## 2026-10-13 — Início da nova versão mobile
- Decisão: reconstruir a partir do PHP original, usando Next.js + TypeScript/PWA e Vercel, mantendo legado intacto.
- Auditoria do PHP: cadastro/login, pre-home, categorias, coleções e lacunas na implementação de itens.
- Criados app shell, navegação, manifesto inicial e documentação.
- Risco histórico: credenciais expostas no \`config.php\`, SQL concatenado e MD5 no legado. Nunca reutilizar essas credenciais/senhas.
