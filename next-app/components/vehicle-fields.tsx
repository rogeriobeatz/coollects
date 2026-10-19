import { VEHICLE_FIELDS } from '@/lib/item-presentation'
export function VehicleFields({values,onChange}:{values:Record<string,string|number|null>;onChange:(key:string,value:string)=>void}){
 return <details className="vehicle-fields"><summary>Ficha do veículo real <span>Opcional</span></summary>
  <p>Dados do carro representado pela miniatura. Preencha apenas o que você conhece; o ano da cartela é um campo separado.</p>
  <div className="diecast-field-grid">{VEHICLE_FIELDS.map(field=><label className="field-label" key={field.key}>{field.label}<input value={String(values[field.key]??'')} placeholder={field.placeholder} maxLength={field.maxLength} onChange={event=>onChange(field.key,event.target.value)}/></label>)}</div>
 </details>
}
