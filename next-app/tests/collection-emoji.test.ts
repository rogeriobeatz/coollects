import { describe, expect, it } from 'vitest'
import { isCollectionEmoji } from '../lib/collection-emoji'

describe('Emoji de coleção', () => {
 it.each(['🚀','🏎️','❤️','👍🏽','👨‍👩‍👧‍👦','🇧🇷','1️⃣',' 🧸 '])('aceita um emoji completo: %s', value => {
  expect(isCollectionEmoji(value)).toBe(true)
 })
 it.each(['','   ','Meu acervo','🚀🎮','abc🚀','123','<img src=x>','a'.repeat(100)])('rejeita texto e múltiplos emojis: %s', value => {
  expect(isCollectionEmoji(value)).toBe(false)
 })
})
