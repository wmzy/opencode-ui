import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react"
import { createSdk, type OpenCodeSdk } from "@/lib/sdk"
import { useServer } from "./server"

type SdkContextValue = {
  client: OpenCodeSdk
  baseUrl: string
  getSdk: (directory: string) => OpenCodeSdk
}

const SdkContext = createContext<SdkContextValue | null>(null)

export function SDKProvider({ children }: { children: ReactNode }) {
  const { active } = useServer()

  const auth = useMemo(() => {
    if (active.username && active.password)
      return { username: active.username, password: active.password }
    if (active.password) return { password: active.password }
    return undefined
  }, [active.username, active.password])

  const client = useMemo(
    () => createSdk(active.url, auth),
    [active.url, auth],
  )

  const getSdk = useCallback(
    (directory: string) => createSdk(active.url, auth, directory),
    [active.url, auth],
  )

  const value = useMemo<SdkContextValue>(
    () => ({ client, baseUrl: active.url, getSdk }),
    [client, active.url, getSdk],
  )

  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>
}

export function useSdk() {
  const ctx = useContext(SdkContext)
  if (!ctx) throw new Error("useSdk must be used within SDKProvider")
  return ctx
}
