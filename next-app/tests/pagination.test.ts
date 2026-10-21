import {expect,it,vi} from 'vitest'
import {readAll,readChunks} from '../lib/pagination'
import {searchPattern} from '../lib/discovery'

it('continua após um limite menor do servidor e não perde o último registro',async()=>{
 const source=Array.from({length:407},(_,id)=>({id}))
 const page=vi.fn(async(from:number,to:number)=>({data:source.slice(from,Math.min(to+1,from+75)),count:source.length,error:null}))
 const rows=await readAll(page)
 expect(rows).toEqual(source)
 expect(page).toHaveBeenCalledTimes(6)
})
it('não transforma falha de uma página posterior em resultado completo',async()=>{
 let calls=0
 await expect(readAll(async()=>++calls===1?{data:Array(200).fill({id:1}),error:null}:{data:null,error:new Error('offline')})).rejects.toThrow('offline')
})
it('divide filtros IN sem repetir identificadores',async()=>{
 const ids=Array.from({length:405},(_,i)=>String(i))
 const load=vi.fn(async(chunk:string[])=>chunk)
 expect(await readChunks([...ids,ids[0]],load)).toEqual(ids)
 expect(load.mock.calls.map(([chunk])=>chunk.length)).toEqual([200,200,5])
})
it('protege a gramática da busca e mantém curingas do usuário literais',()=>{
 const quoted=searchPattern('  a,b(%)"_  ')
 expect(JSON.parse(quoted)).toBe('%a,b(\\%)"\\_%')
})
