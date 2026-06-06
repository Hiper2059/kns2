import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useGsapPageTransitions(dependency) {
  const scopeRef = useRef(null)

  useEffect(() => {
    const scope = scopeRef.current
    if (!scope || prefersReducedMotion()) {
      return undefined
    }

    const hoverCleanups = []
    const ctx = gsap.context(() => {
      gsap.fromTo(
        scope,
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform'
        }
      )

      const hoverTargets = gsap.utils.toArray(
        '[data-gsap-hover], .course-pill, .sidebar-link, .video-card, .lms-course-card',
        scope
      )

      hoverTargets.forEach(target => {
        const enter = () => gsap.to(target, { y: -2, duration: 0.18, ease: 'power2.out' })
        const leave = () => gsap.to(target, { y: 0, duration: 0.18, ease: 'power2.out' })
        target.addEventListener('mouseenter', enter)
        target.addEventListener('mouseleave', leave)
        hoverCleanups.push(() => {
          target.removeEventListener('mouseenter', enter)
          target.removeEventListener('mouseleave', leave)
        })
      })
    }, scope)

    return () => {
      hoverCleanups.forEach(cleanup => cleanup())
      gsap.killTweensOf(scope)
      gsap.set(scope, { clearProps: 'opacity,visibility,transform' })
      ctx.revert()
    }
  }, [dependency])

  return scopeRef
}
