'use client'

import { useId } from 'react'
import { categoryDetails } from '@/lib/local-catalog'
import { isCollectionEmoji } from '@/lib/collection-emoji'

const choices = [
 ['🏎️','Carro de corrida'], ['🚗','Carro'], ['🏍️','Moto'], ['✈️','Avião'],
 ['🃏','Carta'], ['🎮','Controle'], ['👟','Tênis'], ['🦸','Super-herói'],
 ['💿','Disco'], ['🎸','Guitarra'], ['📚','Livros'], ['🪙','Moeda'],
 ['🧸','Ursinho'], ['🤖','Robô'], ['🚀','Foguete'], ['🦖','Dinossauro'],
 ['⚽','Bola'], ['⌚','Relógio'], ['📷','Câmera'], ['💎','Diamante'],
 ['⭐','Estrela'], ['❤️','Coração'], ['🌈','Arco-íris'], ['✨','Brilhos']
] as const

export function CollectionEmojiPicker({value,category,onChange}:{value:string;category:string;onChange:(emoji:string)=>void}) {
 const id=useId()
 const invalid=Boolean(value.trim())&&!isCollectionEmoji(value)
 return <fieldset className="collection-emoji-picker">
  <legend>Emoji da coleção</legend>
  <div className="collection-emoji-options">
   {choices.map(([emoji,label])=><button type="button" key={emoji} aria-label={'Usar emoji '+label} aria-pressed={value===emoji} onClick={()=>onChange(emoji)}><span aria-hidden="true">{emoji}</span></button>)}
  </div>
  <label htmlFor={id} className="field-label">Ou use outro emoji
   <input id={id} className="collection-emoji-input" value={value} onChange={event=>onChange(event.target.value)} maxLength={64} placeholder={categoryDetails(category).emoji} autoComplete="off" spellCheck={false} aria-invalid={invalid} aria-describedby={id+'-hint'}/>
  </label>
  <p id={id+'-hint'} className={invalid?'collection-emoji-error':'collection-emoji-hint'}>{invalid?'Escolha apenas um emoji.':'Cole um emoji ou use o teclado de emojis do seu dispositivo.'}</p>
  <button type="button" className="text-btn" onClick={()=>onChange('')} disabled={!value}>Usar emoji da categoria <span aria-hidden="true">{categoryDetails(category).emoji}</span></button>
 </fieldset>
}
