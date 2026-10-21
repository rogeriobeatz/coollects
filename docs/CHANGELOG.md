## 2026-10-21 — Reconhecimento durante a navegação
- Rascunho e requisição de reconhecimento mantidos em um provider do layout, independentes da tela de cadastro.
- A pessoa pode navegar dentro do app e retomar fotos, ficha, campos revisados e coleções por um indicador flutuante acessível.
- Indicador pulsante durante a análise, estimativa de progresso e estados persistentes de conclusão/erro. Movimento reduzido desativa a pulsação.
- O resultado nunca salva automaticamente nem muda a tela atual. A conclusão orienta revisão e salvamento manual.
- Rascunho único por sessão; descartá-lo exige confirmação. Logout/troca de conta limpam fotos e estado e invalidam respostas tardias.
- Não há fila no servidor, persistência após recarregar nem garantia ao fechar/suspender o navegador. O aviso de saída da aba permanece ativo nas demais telas.
- Nenhuma migração ou dependência adicional. O endpoint de reconhecimento existente continua responsável pela análise.

## 2026-10-21 — Recuperação, descoberta e continuidade
- Cadastro distingue carregamento, vazio e erro; recupera coleções e usa a categoria contextual sem substituir a edição manual.
- Criação rápida de coleção privada na própria ficha; confirmação ao sair por links ou fechar/atualizar a página com alterações pendentes. Fechar o editor também permite cancelar o descarte.
- Criação parcial conserva a coleção já criada e retoma apenas a operação pendente, sem duplicar.
- Edição preserva fotos extras após falha e informa o salvamento parcial; nova tentativa mantém a foto principal já gravada.
- Explorar compacto, com busca pública paginada no servidor por coleção, categoria, descrição e autor, usando a Data API existente.
- Acervo, vínculos e coleções consultados em páginas estáveis; filtros IN e assinaturas de imagens divididos em lotes. Cards pessoais e de coleção renderizados progressivamente.
- Item privado orienta a publicação da coleção e compartilha o item original; visitantes sem origem voltam para Explorar.
- Abas do perfil com rótulos visíveis; contato oficial contato@coollects.com.br; textos de privacidade esclarecem múltiplas coleções públicas e cópias já recebidas.
- Importador ignora conflitos de itens existentes; indisponibilidade de localStorage não transforma importação concluída em falha.
- Baralho mantém a posição durante a estabilização do scroll-snap ao redimensionar.
- Documentação operacional reconciliada com abertura direta, KIE e validade de uma hora das imagens. Sem deploy ou migração nova nesta entrega.
- Validação local: 108 testes unitários e 95 cenários de navegador aprovados, mais 10 repetições sem falhas do redimensionamento do baralho, TypeScript/build e 16 rotas + 404 aprovados. Busca por autor/nome/categoria validada na Data API real somente com leitura. Primeira coleção do Explorar a 321 px em 320 px e 302 px em 390 px, sem overflow nas telas verificadas. SMTP, duas contas reais e aparelhos físicos continuam pendentes.

## 2026-10-20 — Conclusão da camada social
- Home com feed cronológico de peças públicas próprias e de perfis seguidos, descoberta da comunidade, paginação e recuperação de erros sem perder os posts.
- Perfil público e próprio compartilhando componentes: contadores, seguidores/seguindo, coleções, itens publicados e curtidos; edição em `/perfil/editar`.
- Seguir/desseguir, curtir/descurtir e listas de conexões com atualização imediata, reversão em falhas, teclado e retorno de foco. A atualização de feeds aguarda a confirmação do banco.
- Notificações de seguidores e curtidas em `/notificacoes`, com sino no header e leitura isolada por conta neste navegador.
- Migração consolidada `20261020183212_social_network_completion.sql` aplicada ao Supabase Coollects: funções sociais SECURITY INVOKER, feeds, índices e permissões mínimas das tabelas/RPCs. Clientes antigos preservados durante a transição.
- Testes SQL reais com identidades temporárias em BEGIN/ROLLBACK; smoke de leitura da Data API em `npm run test:social-backend`. Detalhes e limites em `docs/SOCIAL_NETWORK.md`.
- Política de privacidade atualizada para conexões e curtidas públicas. Cadastro manual disponível na Home sem chave de IA.

## 2026-10-19 — Compartilhamento, fluidez e ilustrações
- Compartilhar abre a folha nativa do celular (coleção, item e perfil); sem ela, janela própria com copiar link, WhatsApp, Telegram e e-mail.
- Seletor público/privado na coleção. Coleção privada guia a publicação antes de compartilhar; item privado leva ao seletor de coleções.
- Prévias de link com imagem gerada (foto, nome, dono, quantidade de itens).
- Cópias reduzidas das fotos no aparelho e carregamento em lote: cards aparecem na hora; animação de espera em vez de quadro vazio; URLs assinadas de 2 min para 1 h.
- "Salvar e cadastrar outro" no cadastro; edição com detalhes agrupados e gestão de fotos extras; remover item da coleção usa modal do app.
- Ilustrações SVG animadas nos estados vazios.

## 2026-10-19 — Cadastro de item e limpeza do legado
- Cadastro de item: carregamento guiado de ~20 s durante a análise da IA, tarefas paralelas (fotos extras, coleções, observações), campos preenchidos pela IA destacados e formulário enxuto.
- Até 5 fotos por item; somente a principal passa pela IA. Nova coluna `items.gallery_paths` e RPC `create_item_with_gallery` (migration `20261019150000_item_gallery.sql`).
- Prompt de reconhecimento mais curto, com modelo JSON fixo. Imagem enviada inline com `reasoning_effort` baixo e fallback automático para o upload na KIE.
- Sistema PHP/MySQL legado removido do repositório (recuperável pelo histórico do git). A senha do banco antigo continua no histórico e deve ser trocada/desativada na Hostinger.

## 2026-10-15 — OCR local no cadastro de itens
- Motor Tesseract.js 6 com idiomas inglês + português, executado no navegador após o usuário selecionar uma fotografia e acionar **Ler textos da foto (OCR)**.
- Reconhecimento sem chave Gemini e sem enviar o conteúdo da fotografia a uma API de IA generativa; o navegador baixa o motor/idiomas na primeira utilização. A foto continua sendo enviada ao Supabase Storage apenas quando o usuário decide salvar o item.
- Sugestões cautelosas de marca (Hot Wheels, Matchbox, MINI GT, Kaido House e outras) e nome de veículo com pistas textuais; sem inventar numeração, raridade, ano ou versão.
- Não sobrescreve nome ou marca já preenchidos. Os textos encontrados ficam disponíveis para inspeção e toda a ficha exige revisão humana.
- Progresso de leitura, estados de erro compreensíveis e cadastro manual funcionando sem OCR.
- Testes unitários do interpretador, mais pipeline de typecheck/build/navegação. Falta validar OCR ótico de ponta a ponta em fotografias reais no iPhone/Android, inclusive reflexos e cartelas com fontes pequenas.
- Esta entrega NÃO inclui identificação inequívoca por catálogo, scanner de código de barras ou leitura totalmente offline na primeira instalação.

## Auditoria contextual — 14/10/2026
- Verificadas rotas de navegação, fluxo Home → Coleções → Coleção → Item e retorno, navegação principal e os estados de ausência de coleção.
- Corrigido acesso direto à edição de item a partir da coleção: `/itens?editar=UUID&voltar=UUID`, incluindo link de retorno.
- Criado atalho visível `Todos os itens` logo no topo das coleções; anteriormente o único atalho ficava no rodapé.
- A seta da tela de coleção agora retorna para `/colecoes` em vez de mandar o usuário à Home.
- Ao tornar uma coleção indisponível, a interface limpa os dados antigos antes de mostrar o estado vazio.
- Adicionados testes de regressão para URLs internas literais, links de edição/retorno e para evitar exclusão acidental de itens.
- Verificação SQL no Supabase real com dados existentes dentro de `BEGIN/ROLLBACK` comprovou que o proprietário consegue vincular e desvincular item de coleção sem alterar os dados persistentes.
- Limites: verificação visual/mobile automatizada não substitui execução completa com conta e dados reais em navegador/dispositivo físico. A plataforma não recebe certificação de 100% por esses testes.

## 2026-10-14 — Coleções como centro da experiência (mobile-first)
- A tela de uma coleção permite procurar itens já vinculados, cadastrar item novo com vínculo contextual e adicionar diversos itens existentes em lote.
- A opção “Remover desta coleção” remove somente a associação, preservando o item no acervo geral.
- Cadastro com query param `?colecao=UUID` pré-seleciona a coleção, mantendo-a ao cadastrar outro item.
- Navegação principal simplificada para quatro destinos, com botão flutuante global de cadastro.
- Tratamento de safe areas, scroll horizontal e fonte de inputs ≥16 px para evitar zoom automático involuntário no iOS sem bloquear a ampliação acessível.
- Manifest orientado à experiência standalone; PWA continua com cache restrito à página offline.
- Teste automatizado de navegação da barra e tamanho de fonte.
- Ações de vínculo são protegidas por RLS do Supabase, não excluem registros de itens.

## 2026-10-14 — Auditoria real de banco, transações e ciclo de vida da conta
- Corrigida recursão de políticas RLS que impedia leitura e escrita de vínculos de itens.
- Corrigida colisão sistemática de usernames automáticos; verificação contra dois UUIDs de mesmo prefixo.
- Testes SQL no Supabase real com duas contas simuladas, testes de isolamento de dados públicos/privados e rollback.
- Criação e edição atômica de itens+associações, impedindo perda parcial de vínculos.
- Nova experiência de exclusão da conta e Edge Function `delete-account` implantada com JWT obrigatório (requer validação de ponta a ponta com conta real antes do lançamento).
- Verificação de assinatura mágica em uploads de imagens, além de MIME e tamanho. CI verde: 26 testes unitários, 8 testes Chromium, 14 rotas HTTP, build e auditoria npm.
- Proteção do importador local contra sobrescrita de registros de nuvem.

## 2026-10-14 — Auditoria de rastros de desenvolvimento e liberação protegida
- Identificadas mensagens técnicas do Supabase e outros estados não apropriados para usuários.
- Implementada página institucional de espera por padrão até liberação explícita `COOLLECTS_SITE_MODE=open` e configuração de acesso.
- Removidos textos internos e erros crus de múltiplas telas; estados 404/erro/loading com marca.
- IA exibida apenas quando houver configuração; atualização dos termos/privacidade sem placeholders de desenvolvimento.
- Testes automatizados de texto, smoke HTTP com 14 rotas, modo manutenção e 404, mais 8 testes Playwright em Chromium nas larguras 320/390 px (todos aprovados no CI do PR #7).
- Health endpoint para readiness, bloqueio de indexação durante manutenção, URLs assinadas com validade de 2 minutos.
- Documentado checklist com bloqueios de lançamento em `docs/RELEASE_QA.md`.
- Nota: validação de UI interativa e autenticação/armazenamento na Vercel ainda exige acesso e ambiente real.

# Diário de desenvolvimento do Coollects

## 2026-10-13 — Integração de todas as frentes do MVP (em validação)
- Cliente/servidor Supabase SSR com cookies, refresh via Next 16 proxy, signup/login/logout e callback seguro.
- Migrations PostgreSQL de perfis, itens, coleções, junção N:N, RLS, bucket privado e quotas de IA.
- Coleções em nuvem: CRUD, privacidade pública/privada, links compartilháveis e filtros.
- Itens em nuvem: cadastro/edição/exclusão, foto persistida em bucket privado, associação a múltiplas coleções.
- Explorar coleções públicas reais, perfil de colecionador e páginas de coleções por URL.
- Reconhecimento visual por IA (Gemini), OCR multimodal, limite de 10 leituras/dia e revisão dos campos antes de salvar.
- Importação manual opcional das antigas coleções/itens do localStorage para conta Supabase, sem exclusão de dados locais.
- PWA: SVG do ícone com PNG oficial incorporado (sem redesenhar logotipo), manifest, service worker com página offline estática.
- Testes automatizados de funções essenciais e guia de deploy/testes no repositório.
- Preservação: PHP original intacto, Work Sans, logo original, \`#6125BF\` e \`#F15700\`.
- **Pendente:** configuração de projeto Supabase e chave Gemini, testes reais de privacidade e fluxos em aparelhos, revisão jurídica/LGPD. Não considerar lançamento público concluído.

## Histórico anterior
Ver commits e pull requests #1–#4 do repositório \`rogeriobeatz/coollects\`. Eles registram fundação do Next.js, guia de identidade, protótipo local, redesign editorial e correção do contraste do logotipo.

### 2026-10-13 — Ajustes finais do MVP
- Recuperação de senha via e-mail e atualização de senha dentro de sessão autenticada.
- Edição de fotos de itens com substituição e remoção no armazenamento privado.
- Auditoria npm adicionada ao CI; pacote de testes atualizado para Vitest 5 + Vite 8, sem vulnerabilidades reportadas nessa combinação.
- Navegação de perfil com estado ativo e links para privacidade e termos.
- Pendência crítica: integração com Supabase real e teste de autenticação/row-level security antes do lançamento.
