/** Brand illustrations for empty and unavailable states (decorative). */
type Kind='shelf'|'first-item'|'search'|'empty-collection'|'unavailable'

const P='#6125BF',O='#F15700',L='#EEE4FF',Y='#FFDA4B',M='#98E6D5'

export function EmptyIllustration({kind}:{kind:Kind}){
 return <svg className={'empty-illustration empty-illustration-'+kind} viewBox="0 0 200 150" width="200" height="150" aria-hidden="true" focusable="false">
  <ellipse cx="100" cy="138" rx="70" ry="7" fill={L}/>
  {kind==='shelf'&&<g>
   <rect x="34" y="40" width="132" height="8" rx="4" fill={P}/>
   <rect x="34" y="96" width="132" height="8" rx="4" fill={P}/>
   <g className="ei-float"><rect x="48" y="58" width="30" height="38" rx="6" fill={O}/><rect x="54" y="66" width="18" height="12" rx="3" fill="#fff" opacity=".85"/></g>
   <g className="ei-float ei-delay"><rect x="86" y="62" width="26" height="34" rx="6" fill={M}/><circle cx="99" cy="76" r="6" fill="#fff" opacity=".85"/></g>
   <rect x="120" y="54" width="32" height="42" rx="6" fill="none" stroke={P} strokeWidth="3" strokeDasharray="6 5"/>
   <path d="M136 68v14M129 75h14" stroke={P} strokeWidth="3" strokeLinecap="round"/>
   <path className="ei-twinkle" d="M60 18l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={Y}/>
  </g>}
  {kind==='first-item'&&<g>
   <g className="ei-float"><rect x="62" y="28" width="76" height="98" rx="12" fill="#fff" stroke={P} strokeWidth="3"/>
    <rect x="70" y="36" width="60" height="50" rx="8" fill={L}/>
    <path d="M78 74l14-16 10 11 7-7 13 12z" fill={P} opacity=".5"/><circle cx="114" cy="50" r="6" fill={O}/>
    <rect x="70" y="94" width="40" height="6" rx="3" fill={P}/><rect x="70" y="106" width="26" height="5" rx="2.5" fill="#cbb8ef"/></g>
   <g className="ei-float ei-delay"><circle cx="148" cy="104" r="20" fill={O}/><path d="M139 104h18M148 95v18" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></g>
   <path className="ei-twinkle" d="M44 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={Y}/>
  </g>}
  {kind==='search'&&<g>
   <rect x="40" y="46" width="52" height="70" rx="9" fill={L} transform="rotate(-8 66 81)"/>
   <rect x="98" y="46" width="52" height="70" rx="9" fill={L} transform="rotate(8 124 81)"/>
   <g className="ei-float"><circle cx="96" cy="70" r="26" fill="#fff" stroke={P} strokeWidth="6"/><path d="M115 89l20 20" stroke={P} strokeWidth="9" strokeLinecap="round"/>
    <path d="M86 64q10-8 20 0" stroke={O} strokeWidth="4" fill="none" strokeLinecap="round"/></g>
  </g>}
  {kind==='empty-collection'&&<g>
   <path d="M46 70l54-22 54 22-54 22z" fill={L}/>
   <path d="M46 70v42l54 22v-42z" fill={P}/><path d="M154 70v42l-54 22v-42z" fill="#4b1c96"/>
   <path d="M46 70l-12 16 54 22 12-16z" fill="#7b4bd1"/><path d="M154 70l12 16-54 22-12-16z" fill="#7b4bd1"/>
   <g className="ei-float"><rect x="84" y="20" width="32" height="42" rx="6" fill={O} transform="rotate(-10 100 41)"/></g>
   <path className="ei-twinkle" d="M140 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={Y}/>
  </g>}
  {kind==='unavailable'&&<g>
   <rect x="56" y="34" width="88" height="96" rx="14" fill={L}/>
   <g className="ei-float"><rect x="76" y="66" width="48" height="40" rx="8" fill={P}/><path d="M86 66v-10a14 14 0 0128 0v10" fill="none" stroke={P} strokeWidth="7"/><circle cx="100" cy="84" r="5" fill="#fff"/><rect x="98" y="86" width="4" height="10" rx="2" fill="#fff"/></g>
  </g>}
 </svg>
}
