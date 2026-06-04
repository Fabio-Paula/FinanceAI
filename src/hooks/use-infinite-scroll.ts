import { useEffect, useRef } from 'react'

interface Options {
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  rootMargin?: string
}

/**
 * Attaches an IntersectionObserver to a sentinel div.
 * When the sentinel enters the viewport (or containerRef, if provided),
 * it calls fetchNextPage automatically.
 *
 * Usage — with explicit scroll container (e.g. transactions table):
 *   const { sentinelRef, containerRef } = useInfiniteScroll(...)
 *   <div ref={containerRef} className="overflow-y-auto">
 *     ...rows...
 *     <div ref={sentinelRef} className="h-px" />
 *   </div>
 *
 * Usage — page-level scroll (observer uses viewport):
 *   const { sentinelRef } = useInfiniteScroll(...)   // containerRef unused
 *   ...content...
 *   <div ref={sentinelRef} className="h-px" />
 */
export function useInfiniteScroll({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  rootMargin = '200px',
}: Options) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    // containerRef.current === null → observe against the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { root: containerRef.current ?? null, rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin])

  return { sentinelRef, containerRef }
}
