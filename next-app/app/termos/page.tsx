import Link from 'next/link'
import type { Metadata } from 'next'
export const metadata:Metadata={title:'Termos de uso'}
export default function TermsPage(){
 return <main className="legal-page">
  <Link href="/">← Voltar ao Coollects</Link>
  <h1>Termos de uso</h1>
  <p>O Coollects permite organizar e compartilhar acervos de itens colecionáveis. Ao usar a plataforma, você concorda em fornecer informações adequadas e respeitar os direitos das outras pessoas.</p>
  <h2>Seu conteúdo</h2>
  <p>Você é responsável pelas fotografias e descrições que publica. Envie apenas conteúdo que tenha direito de compartilhar; não divulgue dados pessoais de terceiros nem conteúdo ilegal, abusivo ou que viole direitos autorais.</p>
  <h2>Privacidade e compartilhamento</h2>
  <p>Novas coleções são privadas por padrão. Quando você escolhe tornar uma coleção pública, seus itens associados e respectivas imagens e descrições poderão ser vistos por visitantes.</p>
  <h2>Identificação de itens</h2>
  <p>O reconhecimento automático, quando disponível, produz sugestões e pode errar. Cabe a você conferir marcas, modelos, anos e edições antes de salvar.</p>
  <h2>Uso responsável</h2>
  <p>É proibido tentar acessar acervos privados, comprometer contas de terceiros ou usar a plataforma de forma automatizada para prejudicar o serviço. Conteúdo que infrinja essas condições poderá ter seu acesso restringido.</p>
  <h2>Limites do serviço</h2>
  <p>O Coollects não realiza compra, venda ou pagamento de colecionáveis e não garante preços, autenticidade ou raridade. A disponibilidade do serviço pode variar por motivos de manutenção ou falhas externas.</p>
  <p>Última atualização: 14 de outubro de 2026.</p>
 </main>
}
