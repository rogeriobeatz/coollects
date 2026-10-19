import type { ItemRow } from './catalog'

export type ItemFocus = 'collector' | 'gearhead'
export const VEHICLE_FIELDS = [
 {key:'vehicleModel',label:'Modelo do veículo',placeholder:'Ex.: 911 Carrera RS 2.7',maxLength:90},
 {key:'vehicleYear',label:'Ano do veículo',placeholder:'Ex.: 1973',maxLength:20},
 {key:'engine',label:'Motor',placeholder:'Ex.: 6 cilindros, 2.7 L',maxLength:80},
 {key:'power',label:'Potência',placeholder:'Informe a unidade, ex.: 210 cv',maxLength:40},
 {key:'torque',label:'Torque',placeholder:'Informe a unidade, ex.: 255 Nm',maxLength:40},
 {key:'transmission',label:'Câmbio',placeholder:'Ex.: Manual, 5 marchas',maxLength:60},
 {key:'drivetrain',label:'Tração',placeholder:'Ex.: Traseira',maxLength:40},
 {key:'bodyStyle',label:'Carroceria',placeholder:'Ex.: Coupé',maxLength:50},
 {key:'vehicleSource',label:'Fonte dos dados',placeholder:'Livro, fabricante ou referência consultada',maxLength:200},
] as const
export const MINI_FIELDS = [
 ['scale','Escala'],['series','Série'],['seriesNumber','Na série'],
 ['collectionNumber','Na coleção'],['year','Ano da cartela'],['color','Cor da mini'],['condition','Condição'],
] as const
export function itemValue(value:unknown):string {
 if(typeof value!=='string'&&typeof value!=='number')return ''
 const text=String(value).trim()
 return /^(?:marca|montadora|n\/?a|nenhum[a]?|não informad[oa]|nao informad[oa]|null|undefined|-+)$/i.test(text)?'':text
}
export function miniatureSpecs(item:Pick<ItemRow,'details'>){
 return MINI_FIELDS.flatMap(([key,label])=>{const value=itemValue(item.details?.[key]);return value?[{key,label,value}]:[]})
}
export function vehicleSpecs(item:Pick<ItemRow,'details'>){
 return VEHICLE_FIELDS.filter(field=>!['vehicleModel','vehicleSource'].includes(field.key)).flatMap(field=>{
  const value=itemValue(item.details?.[field.key]);return value?[{key:field.key,label:field.label,value}]:[]
 })
}
