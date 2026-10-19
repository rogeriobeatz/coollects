# Diretrizes de produto e interface

Estas regras se aplicam a todo o projeto e devem orientar planos, implementações e revisões de interface. Instruções locais devem respeitar esta hierarquia de informação.

- Antes de mudar uma tela, identifique quem a utiliza, qual tarefa veio realizar e qual conteúdo precisa encontrar primeiro. Pense também no que essa pessoa procuraria e ainda não está disponível.
- Dê prioridade visual e espacial ao conteúdo e à tarefa principal. Apresentação, mensagens e controles de gerenciamento devem ocupar apenas o espaço necessário.
- Coloque ações secundárias em controles contextuais ou menus com nomes claros. Evite apresentar todas as possibilidades de uma vez e evite repetir títulos, descrições e instruções.
- Ajuste a prioridade ao contexto: uma coleção com itens deve destacar os itens; uma coleção vazia deve orientar a inclusão. Visitantes não devem receber controles exclusivos do proprietário.
- Reduzir interface não significa esconder funções essenciais ou substituir tudo por ícones. Use rótulos curtos quando o ícone sozinho for ambíguo; todo controle precisa de nome acessível, foco visível e alvo de toque confortável, preferencialmente de pelo menos 44 px.
- Preserve a identidade visual e reutilize componentes existentes. O logo deve permanecer centralizado nos headers; cards de coleções nas listagens compartilham o mesmo padrão visual e proporção 5:3. Banners de detalhe podem adaptar a altura para priorizar o conteúdo.
- Cards de ITEM usam sempre a mesma identidade e o mesmo conteúdo compartilhado: `CollectibleCard` nas listagens/Home e `ItemCardContent` no visualizador/detalhe. Não crie uma versão independente de card para outra página. Grade e Baralho mudam a navegação; Colecionador e Gearhead mudam o conteúdo. Mantenha esses conceitos separados.
- Separe dados da miniatura (marca, escala, série, ano da cartela) dos dados do veículo (montadora, modelo, ano do carro, motor, potência etc.). Não deduza dados técnicos a partir do nome ou da embalagem; campos ausentes não geram especificações inventadas. Outros tipos de colecionáveis continuam tendo ficha própria, sem campos automotivos.
- Efeitos de profundidade e frente/verso devem funcionar com toque, botões e teclado, respeitar movimento reduzido e devolver o foco ao ponto de origem. O baralho deve limitar as cartas renderizadas e manter a rolagem vertical da página utilizável.
- Mantenha ações destrutivas em segundo plano, com confirmação. Mostre feedback útil: avisos informativos e de sucesso podem desaparecer após cerca de 5 s; erros que exigem ação devem permanecer disponíveis.
- Verifique a experiência em telas pequenas, com nomes longos, sem fotos, em estados vazios e com erros. Confirme que o conteúdo principal aparece cedo e que as funções esperadas continuam encontráveis e funcionais.
