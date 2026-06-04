import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'

interface RouterContext {
  queryClient: QueryClient
}

function useAppTheme(): 'light' | 'dark' {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark ? 'dark' : 'light'
}

function Root() {
  const theme = useAppTheme()
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" theme={theme} />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
})
