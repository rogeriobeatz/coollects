import {createCipheriv,createECDH,createHmac,createPrivateKey,randomBytes,sign} from 'node:crypto'

export type SavedSubscription={endpoint:string;p256dh:string;auth:string;user_id:string}
export type PushMessage={title:string;body:string;url:string;tag:string}

export function validPushEndpoint(input:string){
 try{
  const url=new URL(input)
  if(url.protocol!=='https:'||url.username||url.password||url.port||input.length>2048)return false
  const host=url.hostname.toLowerCase()
  return host==='fcm.googleapis.com'||host==='updates.push.services.mozilla.com'
   ||host.endsWith('.push.apple.com')||host==='push.services.mozilla.com'
   ||host.endsWith('.notify.windows.com')||host.endsWith('.push.microsoft.com')
   ||host.endsWith('.googleapis.com')
 }catch{return false}
}
export function validSubscription(s:unknown):s is {endpoint:string;keys:{p256dh:string;auth:string}}{
 if(!s||typeof s!=='object')return false
 const v=s as {endpoint?:unknown;keys?:{p256dh?:unknown;auth?:unknown}}
 if(typeof v.endpoint!=='string'||!validPushEndpoint(v.endpoint)||!v.keys)return false
 const decode=(key:unknown,min:number,max:number)=>typeof key==='string'&&key.length<180&&Buffer.from(key,'base64url').length>=min&&Buffer.from(key,'base64url').length<=max
 return decode(v.keys.p256dh,65,65)&&decode(v.keys.auth,16,32)
}
function hkdf(ikm:Buffer,salt:Buffer,info:Buffer,length:number):Buffer{
 const prk=createHmac('sha256',salt).update(ikm).digest()
 let result=Buffer.alloc(0),last=Buffer.alloc(0),index=1
 while(result.length<length){last=createHmac('sha256',prk).update(Buffer.concat([last,info,Buffer.from([index++])])).digest();result=Buffer.concat([result,last])}
 return result.subarray(0,length)
}
/** RFC 8291: aes128gcm + authenticated sender key; no additional npm runtime. */
export function encryptPush(body:PushMessage,recipient:SavedSubscription):Buffer{
 const clientPublic=Buffer.from(recipient.p256dh,'base64url'),auth=Buffer.from(recipient.auth,'base64url')
 const sender=createECDH('prime256v1');sender.generateKeys()
 const senderPublic=sender.getPublicKey()
 const shared=sender.computeSecret(clientPublic)
 const ikm=hkdf(shared,auth,Buffer.concat([Buffer.from('WebPush: info\0'),clientPublic,senderPublic]),32)
 const salt=randomBytes(16)
 const cek=hkdf(ikm,salt,Buffer.from('Content-Encoding: aes128gcm\0'),16)
 const nonce=hkdf(ikm,salt,Buffer.from('Content-Encoding: nonce\0'),12)
 const cleartext=Buffer.concat([Buffer.from(JSON.stringify(body),'utf8'),Buffer.from([2])])
 const cipher=createCipheriv('aes-128-gcm',cek,nonce)
 const encrypted=Buffer.concat([cipher.update(cleartext),cipher.final(),cipher.getAuthTag()])
 const header=Buffer.alloc(21)
 salt.copy(header);header.writeUInt32BE(4096,16);header.writeUInt8(senderPublic.length,20)
 return Buffer.concat([header,senderPublic,encrypted])
}
function vapidToken(audience:string,publicKey:string,privateKey:string){
 const key=Buffer.from(publicKey,'base64url')
 if(key.length!==65)throw Error('Invalid VAPID key')
 const jwk={kty:'EC',crv:'P-256',x:key.subarray(1,33).toString('base64url'),y:key.subarray(33).toString('base64url'),d:privateKey}
 const keyObject=createPrivateKey({key:jwk,format:'jwk'})
 const encoded=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url')
 const input=encoded({typ:'JWT',alg:'ES256'})+'.'+encoded({aud:audience,exp:Math.floor(Date.now()/1000)+3600,sub:'mailto:push@coollects.rogerio.work'})
 return input+'.'+sign('sha256',Buffer.from(input),{key:keyObject,dsaEncoding:'ieee-p1363'}).toString('base64url')
}
export async function sendWebPush(subscription:SavedSubscription,message:PushMessage):Promise<'sent'|'expired'|'error'>{
 if(!validPushEndpoint(subscription.endpoint))return 'error'
 const publicKey=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,privateKey=process.env.VAPID_PRIVATE_KEY
 if(!publicKey||!privateKey)throw Error('Push keys not configured')
 const audience=new URL(subscription.endpoint).origin
 try{
  const payload=encryptPush(message,subscription)
  const res=await fetch(subscription.endpoint,{
   method:'POST',headers:{'Authorization':'vapid t='+vapidToken(audience,publicKey,privateKey)+', k='+publicKey,
    'TTL':'3600','Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream'},
   body:new Uint8Array(payload),signal:AbortSignal.timeout(9000),redirect:'error'
  })
  if(res.status===404||res.status===410)return 'expired'
  return res.ok?'sent':'error'
 }catch{return 'error'}
}
