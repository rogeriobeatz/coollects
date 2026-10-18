# Coollects — Sistema de design v2

Fonte: *Coollects — Relatório técnico de design*, 18/10/2026. Implementação em branch paralela, **não publicada**.

## Estrutura

- TopBar 52px: marca na Home; título contextual nas outras telas. Seta somente em detalhes, edição e cadastro.
- Acervo: aba principal com controle real **Itens | Coleções**. Rotas antigas `/itens` e `/colecoes` permanecem acessíveis como atalhos.
- BottomNav com quatro destinos (**Início, Acervo, Explorar, Perfil**) mais a ação central **+** que abre a folha de criação.
- Cadastro: **Foto → Revisar**, detalhes do modelo recolhíveis, salvar visível no rodapé. A análise Kie.ai e RPCs existentes não foram substituídos.
- Perfil: visão pública/estatísticas em `/perfil`, edição em `/perfil/editar`, conta e exclusão em `/configuracoes`.

## Tokens (em `app/globals.css`)

| Token | Valor | Finalidade |
| --- | --- | --- |
| `--ux-purple` | `#5b21b6` | marca, navegação, controles selecionados |
| `--ux-orange` | `#f15700` | ação primária, com texto escuro |
| `--ux-ink` | `#14101f` | texto principal |
| `--ux-secondary` | `#524c60` | texto secundário |
| `--ux-paper` | `#fffefa` | tela |
| `--ux-white` | `#fff` | cartões |
| `--ux-line` | `#d9d3e3` | borda de 1 px |
| `--ux-radius-field` | `12px` | inputs, chips |
| `--ux-radius-card` | `16px` | cards |
| `--ux-s1,2,3,4,6,8` | 4,8,12,16,24,32 px | espaçamento |

Cor de moldura por carro permanece disponível na ficha completa, **não nos cards de grade**. Dados do usuário continuam inalterados.

## Componentes

- `CollectibleCard`: item padrão (Home, Acervo, Coleção), foto 4:5 com cover, nome de até duas linhas, um metadado e ações contextuais.
- `CollectionCard`: mosaico de até 4 fotos, nome, quantidade e estado Pública/Privada; a coleção vazia usa placeholder neutro.
- `CollectionView`: Grade e Lista; preferência lembrada no dispositivo. **Baralho removido** conforme o novo relatório.
- `EmptyState`, `CardSkeleton`: feedback acessível reutilizável.
- `MobileNav`: folha de criação (Novo item, Galeria, Nova coleção).
- `Screen`: topbar compacto, sem texto decorativo.

## Vocabulário

**Acervo** = total de itens do usuário; **item** = objeto individual; **coleção** = agrupamento; **Adicionar item** = ação; **Salvar** = conclusão; **Pública / Privada** = visibilidade.

## Release checklist (antes de qualquer merge)

1. Rodar TypeScript, testes, build, smoke HTTP e browser 320/390px.
2. Testar fluxo Kie.ai autenticado, edição e criação de coleção em iPhone Safari / Android.
3. Executar e verificar a migração `supabase/migrations/20261018_public_identity_ux.sql` **em ambiente de teste antes da produção**, validando colisões de usernames e redirects dos antigos handles.
4. Auditar RLS de aliases e bucket de avatar; upload/delete somente do dono.
5. Validar WCAG AA com Lighthouse/axe, teclado, leitor de tela, zoom 200% e movimento reduzido.
6. Validar foto ausente, coleção com 0/1/100+ itens, busca/erro/offline e navegação com teclado.
7. Conferir consistência de contadores e fotos públicas sem vazar itens privados.

## Fora do redesign visual inicial

As propostas de futura rede social (seguir, curtir, Quero, Troco, denúncia/moderação e curadoria editorial) exigem schema, regras de privacidade e política de moderação próprios. Este PR **não finge que esses recursos estão prontos**, nem publica coleções de terceiros artificialmente.
