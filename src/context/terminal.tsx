import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react"
import { useSdk } from "./sdk"
import type { Pty, PtyCreateInput } from "@/types/terminal"

type TerminalSession = {
  id: string
  title: string
  ws: WebSocket | null
  connected: boolean
}

type TerminalContextValue = {
  sessions: TerminalSession[]
  activeId: string | null
  create: (input?: PtyCreateInput) => Promise<string>
  remove: (id: string) => void
  setActive: (id: string | null) => void
  sendInput: (id: string, data: string) => void
  resize: (id: string, rows: number, cols: number) => Promise<void>
}

const TerminalContext = createContext<TerminalContextValue | null>(null)

export function TerminalProvider({ children }: { children: ReactNode }) {
  const { client, baseUrl } = useSdk()
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const wsMapRef = useRef<Map<string, WebSocket>>(new Map())

  const create = useCallback(
    async (input?: PtyCreateInput) => {
      const pty = (await client.pty.create({
        body: input ?? {},
      })) as Pty
      const id = pty.id

      const session: TerminalSession = {
        id,
        title: pty.title || `Terminal ${id.slice(0, 6)}`,
        ws: null,
        connected: false,
      }

      setSessions((prev) => [...prev, session])
      setActiveId(id)

      try {
        const tokenResult = await client.pty.connectToken(id)
        const wsBaseUrl = baseUrl.replace(/^http/, "ws")
        const wsUrl = new URL(`/pty/${id}/ws`, wsBaseUrl)
        if (tokenResult.ticket) {
          wsUrl.searchParams.set("ticket", tokenResult.ticket)
        }

        const ws = new WebSocket(wsUrl.toString())
        ws.binaryType = "arraybuffer"
        wsMapRef.current.set(id, ws)

        ws.addEventListener("open", () => {
          setSessions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ws, connected: true } : s)),
          )
        })

        ws.addEventListener("close", () => {
          setSessions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, connected: false } : s)),
          )
          wsMapRef.current.delete(id)
        })

        ws.addEventListener("error", () => {
          wsMapRef.current.delete(id)
        })
      } catch {
        // connection failed, session still exists but disconnected
      }

      return id
    },
    [client, baseUrl],
  )

  const remove = useCallback(
    (id: string) => {
      const ws = wsMapRef.current.get(id)
      if (ws) {
        ws.close(1000)
        wsMapRef.current.delete(id)
      }
      void client.pty.remove(id).catch(() => {})
      setSessions((prev) => prev.filter((s) => s.id !== id))
      setActiveId((prev) => (prev === id ? null : prev))
    },
    [client],
  )

  const sendInput = useCallback((id: string, data: string) => {
    const ws = wsMapRef.current.get(id)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data)
    }
  }, [])

  const resize = useCallback(
    async (id: string, rows: number, cols: number) => {
      await client.pty.update(id, { body: { size: { rows, cols } } })
    },
    [client],
  )

  const value = useMemo<TerminalContextValue>(
    () => ({
      sessions,
      activeId,
      create,
      remove,
      setActive: setActiveId,
      sendInput,
      resize,
    }),
    [sessions, activeId, create, remove, sendInput, resize],
  )

  return (
    <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
  )
}

export function useTerminals() {
  const ctx = useContext(TerminalContext)
  if (!ctx) throw new Error("useTerminals must be used within TerminalProvider")
  return ctx
}
