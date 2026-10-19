/**
 * Small on-device copies of photos (IndexedDB), so cards show a picture
 * immediately on the next visit instead of an empty frame.
 * Only reduced thumbnails are kept, never originals. Cleared at sign-out.
 */
const DB_NAME='coollects-images'
const STORE='thumbs'
const MAX_ENTRIES=400
const THUMB_EDGE=480
const KEEP_AS_IS_BYTES=60_000

type Entry={blob:Blob;at:number}
let dbPromise:Promise<IDBDatabase|null>|null=null

function openDb():Promise<IDBDatabase|null>{
 if(dbPromise)return dbPromise
 dbPromise=new Promise(resolve=>{
  try{
   if(typeof indexedDB==='undefined')return resolve(null)
   const request=indexedDB.open(DB_NAME,1)
   request.onupgradeneeded=()=>{request.result.createObjectStore(STORE).createIndex('at','at')}
   request.onsuccess=()=>resolve(request.result)
   request.onerror=()=>resolve(null)
   request.onblocked=()=>resolve(null)
  }catch{resolve(null)}
 })
 return dbPromise
}

function run<T>(mode:IDBTransactionMode,work:(store:IDBObjectStore)=>IDBRequest<T>|void):Promise<T|null>{
 return openDb().then(db=>new Promise<T|null>(resolve=>{
  if(!db)return resolve(null)
  try{
   const tx=db.transaction(STORE,mode)
   const request=work(tx.objectStore(STORE))
   tx.oncomplete=()=>resolve(request?request.result:null)
   tx.onerror=()=>resolve(null)
   tx.onabort=()=>resolve(null)
  }catch{resolve(null)}
 }))
}

export async function getThumb(path:string):Promise<Blob|null>{
 const entry=await run<Entry|undefined>('readonly',store=>store.get(path))
 return entry?.blob instanceof Blob?entry.blob:null
}

async function putThumb(path:string,blob:Blob){
 await run('readwrite',store=>store.put({blob,at:Date.now()} satisfies Entry,path))
 await prune()
}

/** Keep only the most recently stored thumbnails. */
async function prune(){
 const count=await run<number>('readonly',store=>store.count())
 if(!count||count<=MAX_ENTRIES)return
 let excess=count-MAX_ENTRIES
 await run('readwrite',store=>{
  const cursor=store.index('at').openCursor()
  cursor.onsuccess=()=>{const c=cursor.result;if(!c||excess<=0)return;c.delete();excess--;c.continue()}
 })
}

export async function clearThumbs(){
 await run('readwrite',store=>store.clear())
}

async function shrink(blob:Blob):Promise<Blob>{
 if(blob.size<=KEEP_AS_IS_BYTES)return blob
 const bitmap=await createImageBitmap(blob)
 try{
  const scale=Math.min(1,THUMB_EDGE/Math.max(bitmap.width,bitmap.height))
  const canvas=document.createElement('canvas')
  canvas.width=Math.max(1,Math.round(bitmap.width*scale))
  canvas.height=Math.max(1,Math.round(bitmap.height*scale))
  canvas.getContext('2d')?.drawImage(bitmap,0,0,canvas.width,canvas.height)
  const out=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',0.72))
  return out&&out.size<blob.size?out:blob
 }finally{bitmap.close()}
}

// Background downloads run a few at a time so they never compete with the page.
const queue:(()=>Promise<void>)[]=[]
const queued=new Set<string>()
let active=0
function pump(){
 while(active<3&&queue.length){
  const job=queue.shift()!
  active++
  void job().finally(()=>{active--;pump()})
 }
}

export function rememberThumb(path:string,url:string){
 if(queued.has(path)||typeof window==='undefined')return
 queued.add(path)
 queue.push(async()=>{
  try{
   const response=await fetch(url)
   if(!response.ok)return
   await putThumb(path,await shrink(await response.blob()))
  }catch{/* A missing thumbnail only means the next visit loads from the network. */}
 })
 pump()
}
