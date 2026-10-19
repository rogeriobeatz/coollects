# Coollects — Design system editorial mobile
Data: 2026-10-13. Implementado inicialmente na branch de redesign, Next.js em \`next-app/\`.

## Regra inviolável: preservar a marca
- Logotipo: usar **o PNG oficial branco** em \`next-app/public/brand/coollects.png\`. Cabeçalhos roxos mantêm contraste.
- Roxo principal: \`#6125BF\` (token \`--purple\`).
- Laranja institucional: \`#F15700\` (token \`--orange\`).
- Fonte: Work Sans Light e Bold **do legado**. Não substituir o wordmark por texto genérico.
- Paleta complementar permitida para categorias: amarelo \`#FFDA4B\`, mint \`#98E6D5\`, lavanda \`#EEE4FF\` e azul-claro — **nunca substituindo os dois tons principais**.

## Direção visual
Interface de colecionismo como produto cultural/editorial: tipografia forte, cartões em cores chapadas, assimetria controlada, formas geométricas, estrelas, círculos, orbitais e destaque para os objetos colecionáveis. Evitar dashboards corporativas monocromáticas.
- Tela inicial: herói roxo forte + CTA laranja para escanear + contadores locais reais + cards de coleções reais.
- Coleções: grid 2 colunas mobile, filtros interativos, cartões coloridos com arte tipográfica/geometria, wizard em 4 etapas.
- Escanear: área escura estilo câmera, moldura de enquadramento, ação circular, importação/arquivo e formulário de revisão.
- Explorar: manifesto social, tópicos visuais por categoria; **não** apresentar exemplos como perfis ou coleções de usuários reais.
- Perfil: explicar indisponibilidade até autenticação em vez de construir avatar/seguidores falsos.
- Navegação: barra inferior com 5 ações, botão central de adição destacado.

## Interações
- Transições discretas em cards, chips, botão de câmera, step progressivo, navegação.
- Foco de teclado claramente visível, \`aria-label\` nos botões apenas com ícone.
- \`prefers-reduced-motion: reduce\` interrompe efeitos.
- Touch targets generosos, safe area no rodapé, layout estreito mobile + apresentação desktop centralizada.

## Dados e design honesto
- Contagens na Home vêm do armazenamento local, não números inventados.
- Criação/edição inicial mantém o mesmo \`localStorage\` das entregas anteriores.
- Foto selecionada é apenas prévia no navegador; **não** é enviada, salva ou reconhecida por IA ainda.
- Item salvo nesta etapa é um registro local simples; foto ainda não persiste.
- Galeria de Explorar é inspiração de categorias, com aviso de que não há dados públicos reais.

## Próximas fases
1. Supabase Auth e banco + políticas de acesso.
2. Armazenamento de imagem e vínculo item-coleção com backend.
3. Público/perfis verdadeiros e feed.
4. OCR/IA com revisão humana, rate limit e custos protegidos.
5. Assets fotográficos para categorias obtidos com direitos e autorização; não substituir logo nem imagens oficiais.
