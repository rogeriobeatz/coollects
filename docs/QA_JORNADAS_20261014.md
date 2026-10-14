# Coollects — bateria de testes de integração e segurança
Data: 14/10/2026

## Escopo e integridade dos dados
Projeto Supabase: `zegjmrogiyyptccstofs`, ACTIVE_HEALTHY.
Versão de produção Vercel verificada: commit `f08b93e1095a2cff2ce7d4f712c38c4cc176ca68`, estado READY.
Os testes SQL usaram contas com endereços `.invalid` dentro de transações PostgreSQL `BEGIN/ROLLBACK`; **nenhuma conta ou dado fictício foi mantido**.

Contagem de referência (antes/depois): 1 usuário, 1 coleção, 1 item, 0 vínculos e 0 linhas de cota.

## Casos executados de fato

| Código | Cenário | Resultado |
|---|---|---|
| DB-01 | Usuário simulado cria coleção e item com vínculo pela RPC transacional | PASSOU; retorno de UUID real, transação revertida |
| RLS-01 | Conta B consulta coleção privada da A | PASSOU; 0 registros |
| RLS-02 | Conta B consulta item privado da A | PASSOU; 0 registros |
| RLS-03 | Conta B consulta vínculo privado da A | PASSOU; 0 registros |
| RLS-04 | Após despublicar, item anteriormente compartilhado não aparece para B | PASSOU; 0 registros |
| RLS-05 | B tenta alterar item pertencente a A | PASSOU; nome do item permaneceu inalterado |
| TX-01 | A tenta editar item vinculando coleção de B | PASSOU; operação rejeitada e nome original preservado |
| AI-01 | 11ª tentativa após dez consumos diários | PASSOU; `consume_scan_quota()` retornou false |
| CI-01 | CI da versão incorporada antes da bateria | PASSOU no PR de auditoria contextual; build, TypeScript, unit tests e testes móveis Chromium |
| PROD-01 | Último deployment consultado via integração Vercel | READY, apontando para a `main` |

Não interpretar testes executados pelo banco com identidades simuladas como equivalentes à autenticação de usuários pelo navegador.

## Ainda não executados: testes end-to-end críticos

| Código | Jornada | Situação |
|---|---|---|
| AUTH-01 | Cadastro → envio de e-mail → confirmação → login/logout | PENDENTE (exige fluxo real de Auth/SMTP) |
| AUTH-02 | Recuperação e alteração da senha por link expirado/válido | PENDENTE |
| FILE-01 | Upload real JPEG/PNG/WebP e reabertura em outro dispositivo | PENDENTE |
| FILE-02 | Troca/remoção de fotografia e limpeza do Storage | PENDENTE |
| SHARE-01 | Imagem de coleção pública acessível como visitante e privada inacessível após voltar a privada, inclusive URLs assinadas expiradas | PENDENTE |
| DELETE-01 | Exclusão definitiva de conta descartável com arquivo; conferir Auth, Storage e tabelas | PENDENTE |
| PWA-01 | Instalação standalone, safe-area, teclado, câmera e atualização em Safari iOS físico | PENDENTE |
| PWA-02 | Android físico, experiência offline e retorno de conexão | PENDENTE |
| IA-02 | Reconhecimento real via Gemini, consumo, erros e custos | PENDENTE (opcional, quando habilitado) |

## Avisos de segurança a resolver antes de público irrestrito
- `auth_leaked_password_protection`: habilitar verificação de senhas vazadas no Auth.
  https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- `authenticated_security_definer_function_executable`: revisar a exposição de `consume_scan_quota()` a contas autenticadas.
  https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- `rls_enabled_no_policy` para `scan_quotas`: intencional, impede acesso direto à tabela; RPC controla o consumo.
  https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Resultado de liberação
**NÃO APROVADO PARA DECLARAÇÃO DE 100% FUNCIONAL**. Os testes SQL realizados passaram, mas não comprovam entrega de e-mails, upload real, exclusão integral ou PWA instalada em aparelhos.
