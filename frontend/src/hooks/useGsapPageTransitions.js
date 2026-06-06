import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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
        { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }
      )

      gsap.fromTo(
        '[data-animate-item], .card-panel, .post-card, .lms-course-card, .teacher-card, .admin-card',
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.05,
          delay: 0.08,
          scrollTrigger: {
            trigger: scope,
            start: 'top 88%',
            once: true
          }
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
      ctx.revert()
    }
  }, [dependency])

  return scopeRef
}
