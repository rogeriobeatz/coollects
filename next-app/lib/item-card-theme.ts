import type {CSSProperties} from 'react'
import type {ItemRow} from './catalog'

type Palette={frame:string;accent:string;ink:string;label:string}
const palettes:Record<string,Palette>={
 porsche:{frame:'#b01f35',accent:'#ffcf68',ink:'#fffaf4',label:'Porsche'},
 lamborghini:{frame:'#e1ac26',accent:'#373120',ink:'#201806',label:'Lamborghini'},
 ferrari:{frame:'#c52230',accent:'#ffd253',ink:'#fff9f0',label:'Ferrari'},
 bmw:{frame:'#286cca',accent:'#e8f2ff',ink:'#fff',label:'BMW'},
 mercedes:{frame:'#4b626c',accent:'#d1edf2',ink:'#fff',label:'Mercedes-Benz'},
 volkswagen:{frame:'#345ca2',accent:'#d9ebff',ink:'#fff',label:'Volkswagen'},
 ford:{frame:'#2764ae',accent:'#d9eaff',ink:'#fff',label:'Ford'},
 chevrolet:{frame:'#d59a32',accent:'#202c35',ink:'#171814',label:'Chevrolet'},
 nissan:{frame:'#5e616f',accent:'#e6e6eb',ink:'#fff',label:'Nissan'},
 toyota:{frame:'#bf2e3b',accent:'#ffe9e6',ink:'#fff',label:'Toyota'},
 peugeot:{frame:'#526b9d',accent:'#d8ebff',ink:'#fff',label:'Peugeot'},
 honda:{frame:'#c33c39',accent:'#fff0ee',ink:'#fff',label:'Honda'},
 dodge:{frame:'#923b30',accent:'#fbd6a0',ink:'#fff',label:'Dodge'},
 mazda:{frame:'#78485f',accent:'#ead4de',ink:'#fff',label:'Mazda'},
 hotwheels:{frame:'#e86125',accent:'#fff2bc',ink:'#fff',label:'Hot Wheels'}
}
const generic:Palette={frame:'#6035ae',accent:'#ffc174',ink:'#fff',label:'Coollects'}
export function itemCardPalette(item:Pick<ItemRow,'name'|'brand'|'category'|'details'>):Palette{
 const text=[item.details?.manufacturer,item.name,item.brand].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 const keys=Object.keys(palettes).filter(k=>k!=='hotwheels')
 const found=keys.find(key=>new RegExp('(?:^|[^a-z])'+key+'(?:$|[^a-z])').test(text))
 if(found)return palettes[found]
 if(/hot wheels/i.test(item.brand))return palettes.hotwheels
 return generic
}
export function itemCardStyle(item:Pick<ItemRow,'name'|'brand'|'category'|'details'>):CSSProperties{
 const p=itemCardPalette(item)
 return {'--deck-frame':p.frame,'--deck-accent':p.accent,'--deck-ink':p.ink} as CSSProperties
}
