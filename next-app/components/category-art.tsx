import { categoryDetails } from '@/lib/local-catalog'
export function CategoryArt({category,large=false}:{category:string;large?:boolean}) {
 const {emoji,tone}=categoryDetails(category)
 return <div className={'category-art tone-'+tone+(large?' art-large':'')} aria-hidden="true">
  <span className="art-circle"/><span className="art-orbit"/><span className="art-flash">✳</span><span className="art-emoji">{emoji}</span>
 </div>
}
