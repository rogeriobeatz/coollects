import {CarFront,Gamepad2,BookOpen,Disc3,Coins,Footprints,Layers3,Shapes,Sparkles} from 'lucide-react'
import {categoryDetails} from '@/lib/local-catalog'
const icons:Record<string,typeof CarFront>={Miniaturas:CarFront,Cartas:Layers3,'Tênis':Footprints,Games:Gamepad2,Quadrinhos:BookOpen,Discos:Disc3,'Action figures':Shapes,Moedas:Coins,Outros:Sparkles}
export function CategoryGlyph({category,size=22}:{category:string;size?:number}){const Icon=icons[category]||Sparkles;return <Icon size={size} strokeWidth={1.8} aria-hidden="true"/>}
export function CategoryArt({category,large=false}:{category:string;large?:boolean}){
 const {tone}=categoryDetails(category)
 const Icon=icons[category]||Sparkles
 return <div className={'category-art tone-'+tone+(large?' art-large':'')} aria-hidden="true"><span className="art-circle"/><span className="art-orbit"/><Icon className="category-symbol-svg" strokeWidth={1.7}/></div>
}
