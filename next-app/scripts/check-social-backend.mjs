import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// Read-only smoke of the real Data API. Never creates accounts or social rows.
const envFile=new URL('../.env.local',import.meta.url)
if(existsSync(envFile))process.loadEnvFile(envFile)
const url=process.env.NEXT_PUBLIC_SUPABASE_URL
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
assert.ok(url&&key,'Configure as variáveis públicas do Supabase para executar este smoke.')
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
const id=randomUUID()
const publicCalls=[
 ['profile_social_summary',{p_profile_id:id}],
 ['item_social_summary',{p_item_ids:[]}],
 ['profile_connections',{p_profile_id:id,p_direction:'followers',p_limit:1,p_offset:0}],
 ['item_likers',{p_item_id:id,p_limit:1,p_offset:0}],
 ['profile_public_items',{p_profile_id:id,p_limit:1,p_offset:0}],
 ['profile_liked_items',{p_profile_id:id,p_limit:1,p_offset:0}],
 ['suggested_collectors',{p_limit:1}],
 ['community_feed',{p_limit:1,p_offset:0}]
]
for(const [name,args] of publicCalls){
 const {data,error}=await db.rpc(name,args)
 assert.equal(error,null,name+': '+(error?.code??'erro'))
 assert.ok(Array.isArray(data),name+': resposta inválida')
 console.log('✓',name)
}
for(const [name,args] of [['home_feed',{p_limit:1,p_offset:0}],['my_social_activity',{p_limit:1}]]){
 const {error}=await db.rpc(name,args)
 assert.equal(error?.code,'42501',name+': execução anônima precisa ser negada')
 console.log('✓',name,'nega execução anônima')
}
