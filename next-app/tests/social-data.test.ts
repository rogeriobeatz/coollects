import { expect,it,vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { loadItemSocial } from '../lib/social-data'

it('carrega curtidas de um feed com mais de 200 itens sem perder os últimos cards',async()=>{
 const ids=Array.from({length:241},(_,index)=>String(index))
 const rpc=vi.fn(async(_name:string,{p_item_ids}:{p_item_ids:string[]})=>({
  data:p_item_ids.map(item_id=>({item_id,likes:'2',liked_by_me:true})),error:null
 }))
 const result=await loadItemSocial({rpc} as unknown as SupabaseClient,[...ids,ids[0]])
 expect(rpc.mock.calls.map(call=>call[1].p_item_ids.length)).toEqual([200,41])
 expect(result.size).toBe(241)
 expect(result.get('240')).toEqual({likes:2,liked:true})
})
