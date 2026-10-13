# Coollects — Visão de produto

Atualizado em 2026-10-13. Fonte: conversa de definição do produto e auditoria do repositório PHP original.

## O problema
Colecionadores guardam informações e fotos de itens em diferentes lugares e têm dificuldade de organizar, pesquisar e compartilhar coleções com outras pessoas.

## Proposta de valor
**Digitalize, organize e compartilhe suas coleções.** Coollects é uma aplicação prioritariamente para celular. Seu centro é o cadastro de itens com o mínimo de atrito; descoberta e compartilhamento agregam valor comunitário.

## Fluxos prioritários
1. Entrar na aplicação.
2. Fotografar item ou escolher imagem; obter sugestões por OCR/IA (com revisão antes de salvar) **ou** cadastrar manualmente.
3. Vincular o item a uma ou mais coleções.
4. Criar coleções com categoria, nome, cor, descrição e privacidade.
5. Compartilhar coleção pública por link.
6. Explorar coleções públicas e perfis de outros colecionadores.

## Princípios
- Mobile-first e PWA instalável.
- Não exigir IA para cadastrar um item; edição e fallback manual obrigatórios.
- Nunca apresentar identificação incerta como fato; não inventar modelo, ano ou fabricante.
- Privacidade por padrão, coleção privada até opção explícita de publicar.
- Funcionamento genérico para Hot Wheels, cartas, moedas, action figures etc.
- Interface simples, câmera como principal atalho, paleta histórica roxo/laranja.
- Custos e limites de leitura por IA controlados no servidor.

## MVP
Autenticação, itens com foto e campos, coleções com categoria/cor, vínculo N:N entre itens e coleções, compartilhamento, página pública, exploração e escaneamento assistido.

## Fora do MVP
Marketplace, pagamentos, negociação, chat, avaliações de preços, gamificação e rede social completa.

## Riscos abertos
- Qualidade da identificação depende da imagem, categoria, modelo e disponibilidade de serviço.
- OCR não identifica sempre o produto exato; exige confirmação humana.
- Armazenamento de fotos e IA precisam de limites para evitar custos inesperados.
- É necessário validar modelo de banco antigo e possibilidade de importação (dump SQL não encontrado).
