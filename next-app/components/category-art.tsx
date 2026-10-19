import { categoryDetails } from '@/lib/local-catalog'
import { isCollectionEmoji } from '@/lib/collection-emoji'
export function CategoryArt({category,emoji:customEmoji,large=false}:{category:string;emoji?:string|null;large?:boolean}) {
 const {emoji:defaultEmoji,tone}=categoryDetails(category)
 const emoji=customEmoji&&isCollectionEmoji(customEmoji)?customEmoji.trim():defaultEmoji
 return <div className={'category-art tone-'+tone+(large?' art-large':'')} aria-hidden="true">
  <span className="art-circle"/><span className="art-orbit"/><span className="art-flash">✳</span><span className="art-emoji">{emoji}</span>
 </div>
}
