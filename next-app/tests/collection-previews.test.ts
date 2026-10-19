import { describe,expect,it } from 'vitest'
import { collectionPreviewItems,type PreviewLink } from '../lib/collection-previews'
import type { CollectionRow } from '../lib/catalog'

const collection:CollectionRow={id:'collection',owner_id:'owner',name:'Garagem',category:'Miniaturas',color:'#6125BF',description:'',is_public:false,created_at:'2026-01-01'}
const link=(id:string,path:string|null):PreviewLink=>({collection_id:'collection',item_id:id,items:{id,name:id,photo_path:path}})

describe('Prévia fotográfica das coleções',()=>{
 it('conta os itens sem foto e escolhe apenas as duas primeiras fotos reais',()=>{
  const result=collectionPreviewItems([collection],[link('empty',null),link('a','owner/a.jpg'),link('b','owner/b.jpg'),link('c','owner/c.jpg')])
  expect(result.counts.collection).toBe(4)
  expect(result.previews.collection.map(item=>item.id)).toEqual(['a','b'])
 })
 it('prioriza a capa escolhida sem duplicar a foto',()=>{
  const result=collectionPreviewItems([{...collection,cover_item_id:'c'}],[link('a','owner/a.jpg'),link('b','owner/b.jpg'),link('c','owner/c.jpg')])
  expect(result.previews.collection.map(item=>item.id)).toEqual(['c','a'])
 })
 it('ignora relações de outras coleções e suporta relações ausentes ou em array',()=>{
  const photo={id:'a',name:'A',photo_path:'owner/a.jpg'}
  const result=collectionPreviewItems([collection],[{...link('other','owner/other.jpg'),collection_id:'other'},{collection_id:'collection',item_id:'missing',items:null},{collection_id:'collection',item_id:'a',items:[photo]}])
  expect(result.counts).toEqual({collection:2})
  expect(result.previews.collection).toEqual([photo])
 })
})
