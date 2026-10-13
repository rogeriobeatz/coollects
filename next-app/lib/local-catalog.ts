// Protótipo offline: dados locais, nunca apresentados como conteúdo público sincronizado.
export type LocalCollection = { id:string; name:string; category:string; color:string; description:string; createdAt:string }
export type LocalItem = { id:string; name:string; category:string; brand:string; notes:string; collectionId:string; createdAt:string }
export const COLLECTION_KEY = 'coollects.collections.prototype.v1'
export const ITEM_KEY = 'coollects.items.prototype.v1'
export const UPDATE_EVENT = 'coollects:local-update'
export const CATEGORIES = [
  { name: 'Miniaturas', emoji: '🏎️', tone: 'orange' },
  { name: 'Cartas', emoji: '🃏', tone: 'purple' },
  { name: 'Tênis', emoji: '👟', tone: 'yellow' },
  { name: 'Games', emoji: '🎮', tone: 'blue' },
  { name: 'Quadrinhos', emoji: '💥', tone: 'pink' },
  { name: 'Discos', emoji: '💿', tone: 'mint' },
  { name: 'Action figures', emoji: '🦸', tone: 'lilac' },
  { name: 'Moedas', emoji: '🪙', tone: 'yellow' },
  { name: 'Outros', emoji: '✨', tone: 'purple' }
] as const
const isRecord = (value:unknown):value is Record<string, unknown> => typeof value==='object' && value!==null
function readEntries<T>(key:string, check:(value:unknown)=>value is T):T[] {
  if (typeof window==='undefined') return []
  try {
    const entries:unknown=JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(entries) ? entries.filter(check) : []
  } catch { return [] }
}
const isCollection = (x:unknown):x is LocalCollection => isRecord(x)&&typeof x.id==='string'&&typeof x.name==='string'&&typeof x.category==='string'&&typeof x.color==='string'
const isItem = (x:unknown):x is LocalItem => isRecord(x)&&typeof x.id==='string'&&typeof x.name==='string'&&typeof x.collectionId==='string'
export const getCollections = () => readEntries(COLLECTION_KEY,isCollection)
export const getItems = () => readEntries(ITEM_KEY,isItem)
function writeEntries<T>(key:string,entries:T[]):boolean {
  try { localStorage.setItem(key,JSON.stringify(entries));window.dispatchEvent(new Event(UPDATE_EVENT));return true } catch { return false }
}
export const saveCollections = (x:LocalCollection[]) => writeEntries(COLLECTION_KEY,x)
export const saveItems = (x:LocalItem[]) => writeEntries(ITEM_KEY,x)
export const categoryDetails = (name:string) => CATEGORIES.find(c=>c.name===name) || CATEGORIES[CATEGORIES.length-1]
export const safeColor = (color:string) => /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6125BF'
