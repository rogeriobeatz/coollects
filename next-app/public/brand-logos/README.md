# Logotipos dos cards Coollects

Salve os arquivos PNG transparentes em duas subpastas:
- `/public/brand-logos/miniaturas/` — marcas das miniaturas, por exemplo `hot-wheels.png`, `matchbox.png`.
- `/public/brand-logos/montadoras/` — montadoras, por exemplo `porsche.png`, `volkswagen.png`, `lamborghini.png`.

Use nomes minúsculos, sem acentos, separados por hífen. Exemplo de URL pública: `/brand-logos/montadoras/porsche.png`.

Na frente do card, a marca da miniatura aparece sobre a foto e acompanha a identificação textual. No verso Gearhead, o logo da montadora ganha destaque junto do modelo e da ficha técnica. Todos os locais usam `BrandLogoSlot` e as faces compartilhadas do card. Campos vazios, valores genéricos como “Montadora” e arquivos indisponíveis não exibem badge. A imagem só aparece depois de carregar; não há caixa vazia nem texto de substituição.

Recomendado: PNG transparente, sem margens transparentes excessivas e com altura visual uniforme, idealmente 256 × 128 px, respeitando as marcas comerciais. Os arquivos são exibidos por inteiro, sem recorte ou distorção.
