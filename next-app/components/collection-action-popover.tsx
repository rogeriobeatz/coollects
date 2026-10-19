'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/** Native disclosure: normal Tab navigation, outside dismissal and Escape. */
export function CollectionActionPopover({ label, trigger, children, className = '' }: {
 label: string
 trigger: ReactNode
 children: ReactNode
 className?: string
}) {
 const ref = useRef<HTMLDetailsElement>(null)
 const panelId = useId()
 const [expanded,setExpanded]=useState(false)

 useEffect(() => {
  function dismiss(event: PointerEvent) {
   if (event.target instanceof Node && !ref.current?.contains(event.target)) ref.current?.removeAttribute('open')
  }
  document.addEventListener('pointerdown', dismiss)
  return () => document.removeEventListener('pointerdown', dismiss)
 }, [])

 return <details ref={ref} name="collection-actions" className={'collection-action-popover ' + className} onToggle={event=>setExpanded(event.currentTarget.open)}
  onKeyDown={event => {
   if (event.key === 'Escape' && ref.current?.open) {
    event.preventDefault()
    ref.current.open = false
    ref.current.querySelector('summary')?.focus()
   }
  }}>
  <summary role="button" aria-label={label} title={label} aria-controls={panelId} aria-expanded={expanded}>{trigger}</summary>
  <div id={panelId} className="collection-action-panel" onClick={event => {
   if (event.target instanceof Element && event.target.closest('a,button:not(:disabled)') && ref.current) ref.current.open = false
  }}>{children}</div>
 </details>
}
