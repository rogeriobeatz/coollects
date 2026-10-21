import { afterEach,describe,it,expect,vi } from 'vitest'
import { hasUnread,lastSeenActivity,markActivitySeen } from '../lib/notifications'
import { activityGroup } from '../lib/social'

describe('notificações',()=>{
 afterEach(()=>vi.unstubAllGlobals())
 it('isola contas e não retrocede a leitura quando outra aba responde atrasada',()=>{
  const values=new Map<string,string>([['coollects-activity-seen','2099-01-01T00:00:00Z']])
  vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)})
  vi.stubGlobal('window',{dispatchEvent:vi.fn()})
  markActivitySeen('conta-a','2026-10-20T12:00:00Z')
  markActivitySeen('conta-a','2026-10-20T11:00:00Z')
  expect(lastSeenActivity('conta-a')).toBe('2026-10-20T12:00:00Z')
  expect(lastSeenActivity('conta-b')).toBeNull()
  expect(hasUnread('2026-10-20T12:01:00Z',lastSeenActivity('conta-a'))).toBe(true)
 })
 it('mostra o ponto só quando há atividade depois da última visita',()=>{
  expect(hasUnread(null,null)).toBe(false)
  expect(hasUnread('2026-10-20T10:00:00Z',null)).toBe(true)
  expect(hasUnread('2026-10-20T10:00:00Z','2026-10-20T11:00:00Z')).toBe(false)
  expect(hasUnread('2026-10-20T12:00:00Z','2026-10-20T11:00:00Z')).toBe(true)
  expect(hasUnread('não é data','2026-10-20T11:00:00Z')).toBe(false)
 })
 it('agrupa em Hoje, Esta semana e Anteriores',()=>{
  const now=new Date(2026,9,20,15,0).getTime()
  expect(activityGroup(new Date(2026,9,20,8,0).toISOString(),now)).toBe('Hoje')
  expect(activityGroup(new Date(2026,9,17,8,0).toISOString(),now)).toBe('Esta semana')
  expect(activityGroup(new Date(2026,9,1,8,0).toISOString(),now)).toBe('Anteriores')
 })
})
