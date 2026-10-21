import { describe, it, expect } from 'vitest'
import { avatarTone, countLabel, formatCount, initials, mergeById, relativeTime, signInHref, toProfileSocial, EMPTY_PROFILE_SOCIAL } from '../lib/social'

describe('social helpers',()=>{
 it('formats counters for compact icons',()=>{
  expect(formatCount(0)).toBe('0')
  expect(formatCount(999)).toBe('999')
  expect(formatCount(1200)).toBe('1,2 mil')
  expect(formatCount(-3)).toBe('0')
  expect(formatCount(Number.NaN)).toBe('0')
 })
 it('uses singular and plural in accessible labels',()=>{
  expect(countLabel(1,'seguidor','seguidores')).toBe('1 seguidor')
  expect(countLabel(0,'seguidor','seguidores')).toBe('0 seguidores')
  expect(countLabel(2,'curtida','curtidas')).toBe('2 curtidas')
 })
 it('describes time in short Portuguese',()=>{
  const now=Date.parse('2026-10-20T12:00:00Z')
  expect(relativeTime('2026-10-20T11:59:40Z',now)).toBe('agora')
  expect(relativeTime('2026-10-20T11:45:00Z',now)).toBe('15 min')
  expect(relativeTime('2026-10-20T09:00:00Z',now)).toBe('3 h')
  expect(relativeTime('2026-10-18T12:00:00Z',now)).toBe('2 d')
  expect(relativeTime('não é data',now)).toBe('')
 })
 it('builds initials without emoji or punctuation',()=>{
  expect(initials('Rogério Silva')).toBe('RS')
  expect(initials('ana')).toBe('A')
  expect(initials('🚗 Garagem do Zé!')).toBe('GZ')
  expect(initials('')).toBe('C')
 })
 it('keeps the same avatar color for the same collector',()=>{
  expect(avatarTone('abc')).toBe(avatarTone('abc'))
 })
 it('returns visitors to where they were after signing in',()=>{
  expect(signInHref('/u/ana')).toBe('/entrar?next=%2Fu%2Fana')
 })
 it('merges pages without duplicates',()=>{
  expect(mergeById([{id:'a'},{id:'b'}],[{id:'b'},{id:'c'},{id:'c'}]).map(x=>x.id)).toEqual(['a','b','c'])
 })
 it('reads the summary row safely',()=>{
  expect(toProfileSocial(null)).toEqual(EMPTY_PROFILE_SOCIAL)
  expect(toProfileSocial([{followers:'3',following:1,likes_received:2,likes_given:0,public_items:4,public_collections:1,followed_by_me:true,follows_me:false}]))
   .toEqual({followers:3,following:1,likes_received:2,likes_given:0,public_items:4,public_collections:1,followed_by_me:true,follows_me:false})
 })
})
