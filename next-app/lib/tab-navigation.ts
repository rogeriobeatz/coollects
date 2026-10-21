import type { KeyboardEvent } from 'react'

/** Arrow keys select adjacent tabs; Home/End select the first/last tab. */
export function navigateTabs(event:KeyboardEvent<HTMLElement>){
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return
 const tabs=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="tab"]'))
 const index=tabs.indexOf(event.target as HTMLButtonElement)
 if(index<0)return
 event.preventDefault()
 const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length
 tabs[next]?.focus();tabs[next]?.click()
}
