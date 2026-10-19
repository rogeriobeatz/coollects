# Cards de item

A foto e os dados de identificação da miniatura formam a frente; a montadora, o modelo e os dados cadastrados do veículo formam o verso. O recorte do painel colorido e a sobreposição do baralho são adaptações das referências fornecidas pelo usuário, implementadas em HTML/CSS.

## Instâncias ativas

| Onde | Componente | Apresentação |
| --- | --- | --- |
| Home: últimos itens | `home-dashboard.tsx` → `CollectibleCard` | Mesmo card e mesma preferência do acervo |
| Meus itens | `item-library.tsx` → `CollectionView` → `CollectibleCard` | Grade ou Baralho; ações do proprietário |
| Coleção, inclusive pública | `public-collection.tsx` → `CollectionView` → `CollectibleCard` | Mesmo card; visitante não recebe ações de gerenciamento |
| Navegação no Baralho | `ItemDeck` → `CollectibleCard` | Faixa horizontal com até cinco cartas renderizadas e destaque central |
| Página do item | `item-showcase.tsx` → `ItemCardViewer` | O mesmo conteúdo do card, com título principal e ações contextuais |

Explorar e perfil público exibem coleções, não instâncias adicionais de cards de item. Capas de coleção continuam usando `CollectionCard`.

## Duas escolhas independentes

- **Grade / Baralho:** como navegar. A grade serve à localização rápida; o baralho à exploração. A lista anterior foi retirada.
- **Colecionador / Gearhead:** qual conteúdo priorizar. A preferência é salva no dispositivo e aplicada a todos os cards. Virar uma carta aberta é uma ação local e não muda a preferência geral.

O modo Gearhead não carrega fotografias nos cards da grade. Para itens que não são miniaturas, o verso é uma ficha geral, sem atribuir uma montadora ou dados automotivos.

## Interação

O Baralho usa rolagem horizontal nativa com encaixe da carta central, mantendo até cinco cartas renderizadas independentemente do tamanho do acervo. A carta central ocupa 70% da largura da faixa, limitada a 340 px. Os vizinhos ficam sobrepostos atrás dela, com redução de tamanho, deslocamento vertical e perspectiva proporcionais à distância do centro durante a rolagem. O espaço virtual preserva a posição de todas as cartas sem renderizar o acervo inteiro. Os controles, as setas do teclado e Home/End percorrem todos os resultados filtrados. O gesto vertical continua rolando a página.

Tocar ou clicar em qualquer carta abre diretamente a página do item, preservando o endereço de retorno à coleção. Arrastar com mouse ou toque percorre o baralho sem abrir o item. O encaixe horizontal para em cada carta, inclusive em gestos rápidos. Não há popup intermediário. A preferência por movimento reduzido elimina paralaxe, inclinação e transições, mantendo apenas o destaque estático da carta central.

Na página do item, frente e verso têm um controle explícito; o lado inativo fica fora da árvore de acessibilidade e não recebe foco. A altura compartilhada evita salto durante a virada.

## Dados e edição

`lib/item-presentation.ts` define e distingue os campos da miniatura e do veículo. `VehicleFields` reutiliza os campos opcionais no cadastro e na edição. O formato usa o JSON `items.details` e os RPCs com validação de propriedade existentes; não altera o esquema.

O ano da cartela (`year`) nunca preenche o ano do carro (`vehicleYear`). A ficha só mostra valores presentes. Motor, potência, torque, câmbio, tração e carroceria dependem de informação fornecida pelo colecionador; potência e torque mantêm as unidades informadas. Uma fonte opcional é mostrada como texto, sem interpretar HTML ou abrir URLs arbitrárias.

## Padrão visual

`CollectibleCard` e `ItemCardContent` são a única origem da arte dos cards. `ItemCardViewer` reutiliza as mesmas faces; não desenhe um card diferente para a página de detalhe. Os estilos ficam em `app/item-cards.css`. Fotos usam área 1:1 preenchida com `object-fit: cover` e recorte central; logos preservam proporção e somem quando o arquivo/campo não está disponível. As coleções mantêm seu padrão 5:3 separado.

A cor cadastrada em `details.color` define o fundo e a moldura de todas as instâncias, incluindo frente, verso e baralho. Textos e controles ajustam o contraste para cores claras e escuras. Sem cor reconhecida, o card usa o roxo padrão; a fotografia original é preservada.

O texto usa a tinta escura da marca, branco ou preto conforme o contraste calculado, com mínimo de 4,5:1 sobre o fundo. Metadados usam a mesma tinta, sem transparência que reduza o contraste. Textos informativos têm pelo menos 12 px mesmo em 320 px; títulos compactos têm pelo menos 16 px. No baralho, a página mantém rolagem vertical para acomodar as cartas ampliadas e seus controles.

Diálogos de edição, organização e confirmação usam `Modal`, baseado em `dialog` nativo: o fundo fica inerte, o foco inicia dentro do diálogo, Tab/Shift+Tab percorrem seus controles e Escape fecha quando não há operação pendente. Ao fechar, o foco retorna ao acionador ou ao controle contextual correspondente. Os testes `p1-accessibility.pw.ts` cobrem foco, retorno, cores e conteúdo longo nas larguras 320, 390 e 550 px.
