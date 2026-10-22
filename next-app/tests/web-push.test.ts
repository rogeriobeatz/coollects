import {describe,expect,it} from 'vitest'
import {createDecipheriv,createECDH,createHmac,randomBytes} from 'node:crypto'
import {encryptPush,validPushEndpoint,validSubscription} from '../lib/push-server'

function derive(ikm:Buffer,salt:Buffer,info:Buffer,length:number){
 const prk=createHmac('sha256',salt).update(ikm).digest()
 return createHmac('sha256',prk).update(Buffer.concat([info,Buffer.from([1])])).digest().subarray(0,length)
}

describe('Web Push RFC8291 encryption',()=>{
 it('roundtrips an encrypted push message with independently computed receiver keys',()=>{
  const receiver=createECDH('prime256v1');receiver.generateKeys()
  const auth=randomBytes(16)
  const data={title:'Coollects',body:'Você recebeu uma curtida!',url:'/notificacoes',tag:'like:test'}
  const content=encryptPush(data,{
   user_id:'test',endpoint:'https://fcm.googleapis.com/fcm/send/test',
   p256dh:receiver.getPublicKey().toString('base64url'),auth:auth.toString('base64url')
  })
  const salt=content.subarray(0,16),recordSize=content.readUInt32BE(16)
  expect(recordSize).toBe(4096)
  expect(content[20]).toBe(65)
  const senderPublic=content.subarray(21,86)
  const ikm=derive(receiver.computeSecret(senderPublic),auth,
   Buffer.concat([Buffer.from('WebPush: info\0'),receiver.getPublicKey(),senderPublic]),32)
  const cek=derive(ikm,salt,Buffer.from('Content-Encoding: aes128gcm\0'),16)
  const nonce=derive(ikm,salt,Buffer.from('Content-Encoding: nonce\0'),12)
  const ciphertext=content.subarray(86,-16),tag=content.subarray(-16)
  const decipher=createDecipheriv('aes-128-gcm',cek,nonce)
  decipher.setAuthTag(tag)
  const plaintext=Buffer.concat([decipher.update(ciphertext),decipher.final()])
  expect(plaintext[plaintext.length-1]).toBe(2)
  expect(JSON.parse(plaintext.subarray(0,-1).toString())).toEqual(data)
 })
 it('rejects unsafe subscription endpoints and credentials',()=>{
  expect(validPushEndpoint('http://localhost:8000')).toBe(false)
  expect(validPushEndpoint('https://example.com/hook')).toBe(false)
  expect(validPushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
  expect(validSubscription({endpoint:'https://example.com',keys:{p256dh:'abc',auth:'abc'}})).toBe(false)
 })
})
