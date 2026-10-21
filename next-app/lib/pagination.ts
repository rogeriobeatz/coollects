/** Read metadata in bounded requests, including servers with a smaller row cap. */
export async function readAll<T>(page:(from:number,to:number)=>PromiseLike<{data:unknown;error:unknown;count?:number|null}>):Promise<T[]>{
 const rows:T[]=[]
 for(;;){
  const {data,error,count}=await page(rows.length,rows.length+199)
  if(error)throw error
  const batch=(data||[]) as T[]
  if(!batch.length)return rows
  rows.push(...batch)
  if(typeof count==='number'?rows.length>=count:batch.length<200)return rows
 }
}

/** Keep IN filters short enough for browsers, proxies and PostgREST. */
export async function readChunks<T>(ids:string[],load:(ids:string[])=>Promise<T[]>):Promise<T[]>{
 const result:T[]=[]
 const unique=[...new Set(ids)]
 for(let offset=0;offset<unique.length;offset+=200)result.push(...await load(unique.slice(offset,offset+200)))
 return result
}
