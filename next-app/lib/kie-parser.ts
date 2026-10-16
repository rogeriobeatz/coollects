import {z} from 'zod'
export const collectibleDetailsSchema=z.object({
 manufacturer:z.string().max(80).optional().default(''),
 series:z.string().max(90).optional().default(''),
 seriesNumber:z.string().max(25).optional().default(''),
 collectionNumber:z.string().max(25).optional().default(''),
 year:z.union([z.number().int().min(1900).max(2100),z.null()]).optional().default(null),
 scale:z.string().max(25).optional().default(''),
 color:z.string().max(50).optional().default(''),
 condition:z.string().max(50).optional().default('')
})
const schema=z.object({name:z.string().max(90).optional().default(''),brand:z.string().max(70).optional().default(''),category:z.string().max(50).optional().default('Miniaturas'),notes:z.string().max(300).optional().default(''),visibleText:z.string().max(500).optional().default(''),confidence:z.enum(['low','medium','high']).optional().default('low'),details:collectibleDetailsSchema.optional().default({})}).strip()
export const prompt='Você cataloga colecionáveis brasileiros. Examine a foto, principalmente textos legíveis na cartela. Responda SOMENTE JSON válido com name, brand (fabricante da MINIATURA, como Hot Wheels), category, notes (apenas observações adicionais realmente importantes), visibleText, confidence (low,medium,high), details (objeto). Para category Miniaturas, details deve conter manufacturer (montadora do veículo, como Honda), series (ex: Compact Kings), seriesNumber (ex: 4/10), collectionNumber (ex: 105/250), year (número se a cartela explicitamente informa o ano, senão null), scale (somente se comprovada), color (somente se inequívoca), condition (somente se visível). Deixe campos não confirmados vazios, sem preencher por conhecimento geral. name representa o nome do modelo tal como na cartela. NÃO copie os campos estruturados para notes. Exemplos: name \'85 Honda City Turbo II, brand Hot Wheels, details {manufacturer: Honda,series: Compact Kings,seriesNumber: 4/10,collectionNumber:105/250,year:null}. Não invente edições, ano ou raridade. Categorias permitidas: Miniaturas, Cartas, Tênis, Games, Quadrinhos, Discos, Action figures, Moedas, Outros.'
export function parseKieSuggestion(text:string){
 const cleaned=text.trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'')
 const start=cleaned.indexOf('{'),end=cleaned.lastIndexOf('}')
 if(start<0||end<=start)throw new Error('invalid-json')
 return schema.parse(JSON.parse(cleaned.slice(start,end+1)))
}
