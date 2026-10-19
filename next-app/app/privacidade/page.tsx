import Link from 'next/link'
import type { Metadata } from 'next'
export const metadata:Metadata={title:'Privacidade'}
export default function PrivacyPage(){
 return <main className="legal-page">
  <Link href="/">← Voltar ao Coollects</Link>
  <h1>Sua privacidade importa</h1>
  <p>O Coollects utiliza seus dados para permitir o acesso à conta, o cadastro de itens e a organização e descoberta de coleções. Esta página explica quais informações são usadas.</p>
  <h2>Informações da conta</h2>
  <p>Utilizamos e-mail para autenticação e recuperação de acesso; ele não aparece em seu perfil público. Nome de exibição, nome de usuário e biografia são visíveis em páginas de perfil.</p>
  <h2>Coleções e fotografias</h2>
  <p>Coleções são privadas por padrão. Ao torná-las públicas, os nomes, fotos, marcas, categorias e observações dos itens vinculados poderão ser visualizados por outras pessoas. Você pode alterar a visibilidade ou excluir itens e coleções a qualquer momento.</p>
  <h2>Serviços usados</h2>
  <p>Utilizamos serviços de autenticação, banco de dados e armazenamento fornecidos pelo Supabase. Se você optar por identificar um item com inteligência artificial, somente a foto principal será enviada à KIE (kie.ai), que a processa com o modelo Google Gemini para produzir sugestões que você deverá revisar antes de salvar. Em alguns casos, a KIE pode armazenar a imagem temporariamente para concluir a análise.</p>
  <p>Para os cards aparecerem mais rápido, o app guarda no seu navegador cópias reduzidas das fotos que você visualiza. Elas ficam apenas neste aparelho e são apagadas quando você sai da conta.</p>
  <h2>Segurança e controle</h2>
  <p>Fotos de coleções privadas são mantidas em armazenamento com regras de acesso, e coleções compartilhadas podem gerar links temporários para exibição das imagens. Recomendamos não inserir informações sensíveis em nomes, fotografias ou descrições públicas.</p>
  <h2>Seus direitos</h2>
  <p>Você pode editar ou excluir seus itens e coleções nas respectivas páginas. Você pode solicitar a exclusão permanente da conta em Perfil → Controle da conta, mediante confirmação de senha. Para os demais direitos relacionados aos seus dados, utilize o canal de atendimento oficial do Coollects.</p>
  <p>Última atualização: 14 de outubro de 2026.</p>
 </main>
}
