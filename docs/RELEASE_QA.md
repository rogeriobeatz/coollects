# Coollects — Critérios de validação

Atualizado em 21/10/2026. Este documento descreve a aplicação atual; auditorias datadas em outros arquivos são registros históricos.

## Funcionamento atual

- As páginas abrem diretamente. Não existe bloqueio por COOLLECTS_SITE_MODE.
- Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para autenticação e persistência.
- KIE_API_KEY habilita a assistência de IA, exclusivamente no servidor. Cadastro manual continua disponível.
- /api/health responde 200 quando a consulta ao banco funciona e 503 quando faltam credenciais ou há falha. Isso não comprova Auth, Storage ou IA.
- Coleções são privadas por padrão. Um item permanece público enquanto estiver em qualquer coleção pública.
- URLs assinadas de fotos duram até uma hora. Despublicação não revoga cópias já recebidas; miniaturas locais são apagadas ao sair da conta.
- Ajuda e privacidade: contato@coollects.com.br. A existência do endereço informado não comprova entrega de e-mails ou SLA.

## Verificação local

Dentro de next-app: npm test, npm run typecheck, npm run build. Inicie npm run start -- -p 3202 e execute npm run test:browser e node scripts/smoke-pages.mjs 3202.

Quando o build usa a URL real do Supabase, defina PLAYWRIGHT_SUPABASE_URL com a mesma URL pública. Os testes interceptam as chamadas do navegador e usam dados simulados; nunca use credenciais reais como fixtures. A chave KIE não é utilizada nos testes simulados.

## Cenários de aceitação

- Falha ao consultar coleções não aparece como vazio nem salva silenciosamente sem o vínculo esperado.
- Criar coleção dentro do cadastro preserva ficha e fotos. Categoria contextual respeita edição manual.
- Repetir vínculo após criação parcial não cria outra coleção.
- Falha de galeria mantém fotos selecionadas e permite repetir o salvamento.
- Leituras de perfil e coleção permitem nova tentativa.
- Busca pública inclui coleções além das primeiras 60, com filtro de categoria, autor e paginação.
- Conteúdo público aparece cedo em 320 e 390 px; não há rolagem horizontal.
- Compartilhar item privado orienta a publicação da coleção e conserva o link do item original.
- Cadastro manual pode continuar durante a análise da IA, sem resposta tardia sobrescrever a ficha.
- Navegar durante o reconhecimento conserva fotos, ficha e coleções; indicador permite retomar sem nova requisição, tanto durante quanto após a análise.
- Conclusão em outra tela não muda a navegação nem salva automaticamente; erros continuam recuperáveis com a mesma foto.
- Logout/descartar invalidam respostas tardias. Atualizar a aba avisa sobre o rascunho em memória; não há continuidade garantida após fechamento/suspensão do navegador.
- Busca no acervo considera todas as páginas de metadados; cards e fotos são apresentados progressivamente.
- Reimportação não sobrescreve itens ou fotografias já existentes.
- Baralho conserva seleção ao redimensionar e permite rolagem vertical, teclado e movimento reduzido.

## Ainda exigem ambiente real e aparelhos

- [ ] Cadastro de duas contas, confirmação por e-mail, logout e recuperação por link válido/expirado.
- [ ] Isolamento RLS e Storage entre contas A/B e visitante, inclusive por chamada direta.
- [ ] Upload real, troca/remoção de fotos e reabertura em outro dispositivo.
- [ ] Publicação/despublicação e expiração real das URLs já emitidas.
- [ ] Exclusão de conta descartável em Perfil → Editar perfil → Controle da conta; conferir Auth, tabelas e arquivos.
- [ ] Reconhecimento real, quota e custos de IA quando habilitada.
- [ ] Safari iOS e Chrome Android físicos: câmera, teclado, instalação PWA, offline e retorno de conexão.
- [ ] SMTP, atendimento pelo endereço oficial, proteções antiabuso, monitoramento e backups.
- [ ] Revisão jurídica dos textos e procedimento de atendimento; não declarar conformidade definitiva pela aprovação do CI.

Nunca declarar todas as jornadas aprovadas apenas porque os testes locais passaram. Não reaplicar migrações já registradas no projeto existente.
