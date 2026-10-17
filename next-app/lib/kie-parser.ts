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
export const prompt='Você cataloga colecionáveis brasileiros. Examine a foto, principalmente textos legíveis na cartela. Responda SOMENTE JSON válido com name, brand (fabricante da MINIATURA, como Hot Wheels), category, notes (apenas observações adicionais realmente importantes), visibleText, confidence (low,medium,high), details (objeto). Para category Miniaturas, details deve conter manufacturer (montadora do veículo, como Honda), series (ex: Compact Kings), seriesNumber (ex: 4/10), collectionNumber (ex: 105/250), year (número se a cartela explicitamente informa o ano, senão null), scale (somente se comprovada), color (somente se inequívoca), condition (somente se visível). Deixe campos não confirmados vazios, sem preencher por conhecimento geral. name representa o nome do modelo tal como na cartela. NÃO copie os campos estruturados para notes. Exemplos: name \'85 Honda City Turbo II, brand Hot Wheels, details {manufacturer: Honda,series: Compact Kings,seriesNumber: 4/10,collectionNumber:105/250,year:null}. Não invente edições, ano ou raridade. Categorias permitidas: Miniaturas, Cartas, Tênis, Games, Quadrinhos, Discos, Action figures, Moedas, Outros.'
export function parseKieSuggestion(text:string){
 const cleaned=text.trim().replace(/^```(?:json)?\\s*/i,'').replace(/\\s*```$/,'')
 let candidate:unknown
 try{candidate=JSON.parse(cleaned)}catch{candidate=undefined}
 if(typeof candidate==='string')return parseKieSuggestion(candidate)
 if(candidate&&typeof candidate==='object'&&!Array.isArray(candidate))return schema.parse(candidate)
 const start=cleaned.indexOf('{'),end=cleaned.lastIndexOf('}')
 if(start<0||end<=start)throw new Error('invalid-json')
 return schema.parse(JSON.parse(cleaned.slice(start,end+1)))
}
