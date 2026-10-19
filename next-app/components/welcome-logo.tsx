'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnimationItem } from 'lottie-web'
import { BrandLogo } from './brand-logo'

export function WelcomeLogo() {
 const container = useRef<HTMLDivElement>(null)
 const [ready, setReady] = useState(false)

 useEffect(() => {
  const target = container.current
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (!target || motion.matches) return
  let active = true
  let animation: AnimationItem | undefined
  function stopForReducedMotion() {
   if (motion.matches) { animation?.destroy(); setReady(false) }
  }
  motion.addEventListener('change', stopForReducedMotion)
  // Load the original animation only on the welcome screen. Keep the image if it fails.
  void Promise.all([
   import('lottie-web'),
   fetch('/brand/intro-anim.json').then(response => {
    if (!response.ok) throw new Error('Animation unavailable')
    return response.json()
   })
  ]).then(([{ default: lottie }, animationData]) => {
   if (!active || motion.matches) return
   // Keep the logo transparent if a future animation export includes solid backgrounds.
   const transparentData = { ...animationData, layers: animationData.layers.filter((layer: { ty: number }) => layer.ty !== 1) }
   animation = lottie.loadAnimation({ container: target, renderer: 'svg', loop: false, autoplay: false, animationData: transparentData })
   animation.addEventListener('DOMLoaded', () => {
    if (!active) return
    setReady(true)
    animation?.play()
   })
   animation.addEventListener('data_failed', () => { if (active) setReady(false) })
  }).catch(() => { /* The static logo remains visible. */ })
  return () => { active = false; motion.removeEventListener('change', stopForReducedMotion); animation?.destroy() }
 }, [])

 return <div className={'welcome-logo' + (ready ? ' is-animated' : '')}>
  <div className="welcome-logo-static"><BrandLogo/></div>
  <div ref={container} className="welcome-logo-animation" aria-hidden="true"/>
 </div>
}
