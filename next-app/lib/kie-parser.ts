import {z} from 'zod'
const schema=z.object({name:z.string().max(90).optional().default(''),brand:z.string().max(70).optional().default(''),category:z.string().max(50).optional().default('Miniaturas'),notes:z.string().max(300).optional().default(''),visibleText:z.string().max(500).optional().default(''),confidence:z.enum(['low','medium','high']).optional().default('low')}).strip()
const prompt='Você cataloga colecionáveis brasileiros. Examine a foto de uma cartela ou embalagem e devolva SOMENTE JSON com name,brand,category,notes,visibleText,confidence (low,medium,high). Para Hot Wheels identifique nome do carro na faixa inferior, marca da MINIATURA, série, ano e numeração somente se realmente legíveis; coloque estes detalhes em notes. Exemplo: name Porsche 911 Carrera T; brand Hot Wheels; category Miniaturas. Não invente números nem edições. Transcreva apenas texto verificável em visibleText. Em caso de dúvida deixe campos vazios e confidence low. Categoria entre Miniaturas, Cartas, Tênis, Games, Quadrinhos, Discos, Action figures, Moedas, Outros.'
export function parseKieSuggestion(text:string){
 const cleaned=text.trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'')
 const start=cleaned.indexOf('{'),end=cleaned.lastIndexOf('}')
 if(start<0||end<=start)throw new Error('invalid-json')
 return schema.parse(JSON.parse(cleaned.slice(start,end+1)))
}
