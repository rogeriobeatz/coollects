/** One emoji, including joined families, skin tones, flags and keycaps. */
export function isCollectionEmoji(value: string): boolean {
 const emoji = value.trim()
 if (!emoji || [...emoji].length > 32) return false
 const segments = [...new Intl.Segmenter('pt-BR', { granularity: 'grapheme' }).segment(emoji)]
 return segments.length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(emoji)
}
