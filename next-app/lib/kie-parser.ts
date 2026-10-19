import {z} from 'zod'
export const collectibleDetailsSchema=z.object({
 manufacturer:z.string().max(80).nullish().transform(value=>value??''),
 series:z.string().max(90).nullish().transform(value=>value??''),
 seriesNumber:z.string().max(25).nullish().transform(value=>value??''),
 collectionNumber:z.string().max(25).nullish().transform(value=>value??''),
 year:z.union([z.number().int().min(1900).max(2100),z.null()]).optional().default(null),
 scale:z.string().max(25).nullish().transform(value=>value??''),
 color:z.string().max(50).nullish().transform(value=>value??''),
 condition:z.string().max(50).nullish().transform(value=>value??'')
})
const schema=z.object({name:z.string().max(90).nullish().transform(value=>value??''),brand:z.string().max(70).nullish().transform(value=>value??''),category:z.string().max(50).optional().default('Miniaturas'),notes:z.string().max(300).nullish().transform(value=>value??''),visibleText:z.string().max(500).nullish().transform(value=>value??''),confidence:z.enum(['low','medium','high']).optional().default('low'),details:collectibleDetailsSchema.nullish().transform(value=>collectibleDetailsSchema.parse(value??{}))}).strip()
// Short prompt with a fixed JSON template: fewer tokens in and out means a
// faster answer, and the model fills keys instead of inventing a structure.
export const prompt=[
 'Você identifica um colecionável a partir de UMA foto. Leia primeiro os textos impressos (cartela, caixa, etiqueta, base).',
 'Responda apenas com este objeto JSON, sem markdown e sem texto extra:',
 '{"name":"","brand":"","category":"","notes":"","visibleText":"","confidence":"low","details":{"manufacturer":"","series":"","seriesNumber":"","collectionNumber":"","year":null,"scale":"","color":"","condition":""}}',
 'Regras:',
 '- name: nome do modelo como impresso. Ex.: \'85 Honda City Turbo II.',
 '- brand: fabricante do colecionável (Hot Wheels, Matchbox, Panini, Nike…), não a montadora.',
 '- category: exatamente uma de Miniaturas, Cartas, Tênis, Games, Quadrinhos, Discos, Action figures, Moedas, Outros.',
 '- details apenas para Miniaturas (outras categorias: deixe vazio). manufacturer = montadora do carro real (ex.: Honda); series = nome da série (ex.: Compact Kings); seriesNumber = posição na série (ex.: 4/10); collectionNumber = numeração geral (ex.: 105/250); year = número só se o ano estiver impresso, senão null; scale, color e condition só se visíveis com certeza.',
 '- visibleText: os textos legíveis mais importantes, até 200 caracteres.',
 '- notes: vazio, exceto informação relevante que não cabe nos outros campos (ex.: Treasure Hunt). Não repita outros campos.',
 '- confidence: high se o nome foi lido na embalagem; medium se reconhecido pelo visual; low se incerto.',
 '- Nunca invente: sem evidência na foto, use "" (ou null em year). Não deduza ano, edição ou raridade por conhecimento geral.'
].join('\n')
export function parseKieSuggestion(text:string){
 const cleaned=text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')
 let candidate:unknown
 try{candidate=JSON.parse(cleaned)}catch{candidate=undefined}
 if(typeof candidate==='string')return parseKieSuggestion(candidate)
 if(candidate&&typeof candidate==='object'&&!Array.isArray(candidate))return schema.parse(candidate)
 const start=cleaned.indexOf('{'),end=cleaned.lastIndexOf('}')
 if(start<0||end<=start)throw new Error('invalid-json')
 return schema.parse(JSON.parse(cleaned.slice(start,end+1)))
}
