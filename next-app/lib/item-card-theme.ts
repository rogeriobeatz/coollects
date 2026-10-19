import type {CSSProperties} from 'react'
import type {ItemRow} from './catalog'

type Palette={frame:string;accent:string;ink:string;label:string}
const defaultPalette:Palette={frame:'#6035ae',accent:'#ffd08a',ink:'#ffffff',label:'Coollects'}

const colors:Record<string,string>={
 preto:'#22232b',black:'#22232b',
 branco:'#f2f0e9',white:'#f2f0e9',offwhite:'#eee8db',
 prata:'#a3abb5',silver:'#a3abb5',cinza:'#707887',gray:'#707887',grey:'#707887',
 grafite:'#414955',chumbo:'#414955',
 vermelho:'#d63238',red:'#d63238',vinho:'#772d47',bordo:'#772d47',
 laranja:'#ef742b',orange:'#ef742b',
 amarelo:'#f4c83f',yellow:'#f4c83f',dourado:'#bb9145',gold:'#bb9145',
 azul:'#286ac2',blue:'#286ac2',marinho:'#243c79',navy:'#243c79',
 verde:'#318567',green:'#318567',oliva:'#707940',olive:'#707940',
 roxo:'#7041ac',purple:'#7041ac',lilas:'#ac8bd1',lilac:'#ac8bd1',
 rosa:'#df79a3',pink:'#df79a3',magenta:'#bf347e',
 bege:'#d6bb91',beige:'#d6bb91',creme:'#e9d8ad',cream:'#e9d8ad',
 marrom:'#7b5544',brown:'#7b5544',cobre:'#a96b49',copper:'#a96b49',
 turquesa:'#299eaa',turquoise:'#299eaa',ciano:'#289ec3',cyan:'#289ec3'
}
function normalize(text:string){
 return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
}
function rgb(hex:string){
 const value=hex.slice(1)
 return [0,2,4].map(i=>parseInt(value.slice(i,i+2),16))
}
function luminance(hex:string){
 const channels=rgb(hex).map(channel=>{
  const c=channel/255
  return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)
 })
 return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722
}
function resolveColor(value:unknown):string|null{
 if(typeof value!=='string')return null
 const normalized=normalize(value)
 if(!normalized||normalized.length>80||/[();{}:]/.test(normalized))return null
 if(/^#[0-9a-f]{6}$/.test(normalized))return normalized
 if(/^#[0-9a-f]{3}$/.test(normalized))return '#'+normalized.slice(1).split('').map(x=>x+x).join('')
 // Accept color descriptions such as "azul metálico", "vermelho brilhante" and "preto fosco".
 // Unknown/freeform color descriptions deliberately fall back to the Coollects palette.
 const words=normalized.replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(Boolean)
 for(let index=0;index<words.length;index++){
  const compound=words[index]+(words[index+1]||'')
  if(colors[compound])return colors[compound]
  if(colors[words[index]])return colors[words[index]]
 }
 return null
}
export function itemCardPalette(item:Pick<ItemRow,'name'|'brand'|'category'|'details'>):Palette{
 const frame=resolveColor(item.details?.color)
 const label=typeof item.details?.manufacturer==='string'&&item.details.manufacturer.trim()
  ?item.details.manufacturer.trim()
  :item.brand||item.category||'Coollects'
 if(!frame)return {...defaultPalette,label}
 const light=luminance(frame)
 // Preserve the brand's dark ink when it passes; black covers middle tones
 // where neither the purple ink nor white reaches 4.5:1.
 const darkContrast=(light+.05)/(luminance('#211827')+.05)
 const whiteContrast=1.05/(light+.05)
 const ink=darkContrast>=4.5?'#211827':whiteContrast>=4.5?'#ffffff':'#000000'
 return {frame,accent:ink==='#ffffff'?'#fff0b5':'#34213f',ink,label}
}
export function itemCardStyle(item:Pick<ItemRow,'name'|'brand'|'category'|'details'>):CSSProperties{
 const p=itemCardPalette(item)
 return {'--deck-frame':p.frame,'--deck-accent':p.accent,'--deck-ink':p.ink} as CSSProperties
}
