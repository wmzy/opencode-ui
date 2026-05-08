import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { createSSEClient, type SSEClient, type SSEEvent } from "@/lib/sse-client"
import { useServer } from "./server"
import type { Session } from "@/types/session"
import type { Message } from "@/types/message"
import type { Part } from "@/types/part"
import type { Permission } from "@/types/common"
import type { SessionStatus } from "@/types/session"
import type { FileDiff } from "@/types/common"
import type { Todo } from "@/types/shared-types"

type GlobalSyncState = {
  sessions: Map<string, Session>
  messages: Map<string, Message[]>
  parts: Map<string, Part[]>
  permissions: Map<string, Permission[]>
  sessionStatus: Map<string, SessionStatus>
  sessionDiffs: Map<string, FileDiff[]>
  todos: Map<string, Todo[]>
}

type GlobalSyncContextValue = {
  state: GlobalSyncState
  connected: boolean
}

const GlobalSyncContext = createContext<GlobalSyncContextValue | null>(null)

const initialState: GlobalSyncState = {
  sessions: new Map(),
  messages: new Map(),
  parts: new Map(),
  permissions: new Map(),
  sessionStatus: new Map(),
  sessionDiffs: new Map(),
  todos: new Map(),
}

function applyEvent(state: GlobalSyncState, event: SSEEvent): GlobalSyncState {
  const next = state

  switch (event.type) {
    case "session.created": {
      const info = (event.data as { info: Session }).info
      if (!info?.id) break
      const sessions = new Map(next.sessions)
      sessions.set(info.id, info)
      return { ...next, sessions }
    }
    case "session.updated": {
      const info = (event.data as { info: Session }).info
      if (!info?.id) break
      const sessions = new Map(next.sessions)
      sessions.set(info.id, info)
      return { ...next, sessions }
    }
    case "session.deleted": {
      const info = (event.data as { info: Session }).info
      if (!info?.id) break
      const sessions = new Map(next.sessions)
      sessions.delete(info.id)
      const messages = new Map(next.messages)
      messages.delete(info.id)
      const parts = new Map(next.parts)
      const permissions = new Map(next.permissions)
      permissions.delete(info.id)
      const sessionStatus = new Map(next.sessionStatus)
      sessionStatus.delete(info.id)
      const sessionDiffs = new Map(next.sessionDiffs)
      sessionDiffs.delete(info.id)
      const todos = new Map(next.todos)
      todos.delete(info.id)
      return { ...next, sessions, messages, parts, permissions, sessionStatus, sessionDiffs, todos }
    }
    case "session.status": {
      const props = event.data as { sessionID: string; status: SessionStatus }
      if (!props?.sessionID) break
      const sessionStatus = new Map(next.sessionStatus)
      sessionStatus.set(props.sessionID, props.status)
      return { ...next, sessionStatus }
    }
    case "session.diff": {
      const props = event.data as { sessionID: string; diff: FileDiff[] }
      if (!props?.sessionID) break
      const sessionDiffs = new Map(next.sessionDiffs)
      sessionDiffs.set(props.sessionID, props.diff)
      return { ...next, sessionDiffs }
    }
    case "message.updated": {
      const info = (event.data as { info: Message }).info
      if (!info?.id || !info?.sessionID) break
      const messages = new Map(next.messages)
      const existing = messages.get(info.sessionID) ?? []
      const idx = existing.findIndex((m) => m.id === info.id)
      if (idx >= 0) {
        const updated = [...existing]
        updated[idx] = info
        messages.set(info.sessionID, updated)
      } else {
        messages.set(info.sessionID, [...existing, info])
      }
      return { ...next, messages }
    }
    case "message.removed": {
      const props = event.data as { sessionID: string; messageID: string }
      if (!props?.sessionID || !props?.messageID) break
      const messages = new Map(next.messages)
      const existing = messages.get(props.sessionID)
      if (existing) {
        messages.set(
          props.sessionID,
          existing.filter((m) => m.id !== props.messageID),
        )
      }
      const parts = new Map(next.parts)
      parts.delete(props.messageID)
      return { ...next, messages, parts }
    }
    case "message.part.updated": {
      const part = (event.data as { part: Part }).part
      if (!part?.id || !part?.messageID) break
      if (part.type === "patch" || part.type === "step-start" || part.type === "step-finish") break
      const partsMap = new Map(next.parts)
      const existing = partsMap.get(part.messageID) ?? []
      const idx = existing.findIndex((p) => p.id === part.id)
      if (idx >= 0) {
        const updated = [...existing]
        updated[idx] = part
        partsMap.set(part.messageID, updated)
      } else {
        partsMap.set(part.messageID, [...existing, part])
      }
      return { ...next, parts: partsMap }
    }
    case "message.part.removed": {
      const props = event.data as { messageID: string; partID: string }
      if (!props?.messageID || !props?.partID) break
      const partsMap = new Map(next.parts)
      const existing = partsMap.get(props.messageID)
      if (existing) {
        const filtered = existing.filter((p) => p.id !== props.partID)
        if (filtered.length === 0) {
          partsMap.delete(props.messageID)
        } else {
          partsMap.set(props.messageID, filtered)
        }
      }
      return { ...next, parts: partsMap }
    }
    case "message.part.delta": {
      const props = event.data as { messageID: string; partID: string; field: string; delta: string }
      if (!props?.messageID || !props?.partID) break
      const partsMap = new Map(next.parts)
      const existing = partsMap.get(props.messageID)
      if (!existing) break
      const idx = existing.findIndex((p) => p.id === props.partID)
      if (idx < 0) break
      const part = existing[idx]
      const field = props.field as keyof typeof part
      const currentVal = part[field] as string | undefined
      const updated = [...existing]
      updated[idx] = { ...part, [field]: (currentVal ?? "") + props.delta }
      partsMap.set(props.messageID, updated)
      return { ...next, parts: partsMap }
    }
    case "permission.asked": {
      const permission = event.data as Permission
      if (!permission?.id || !permission?.sessionID) break
      const permissions = new Map(next.permissions)
      const existing = permissions.get(permission.sessionID) ?? []
      const idx = existing.findIndex((p) => p.id === permission.id)
      if (idx >= 0) {
        const updated = [...existing]
        updated[idx] = permission
        permissions.set(permission.sessionID, updated)
      } else {
        permissions.set(permission.sessionID, [...existing, permission])
      }
      return { ...next, permissions }
    }
    case "permission.replied": {
      const props = event.data as { sessionID: string; requestID: string }
      if (!props?.sessionID || !props?.requestID) break
      const permissions = new Map(next.permissions)
      const existing = permissions.get(props.sessionID)
      if (existing) {
        permissions.set(
          props.sessionID,
          existing.filter((p) => p.id !== props.requestID),
        )
      }
      return { ...next, permissions }
    }
    case "todo.updated": {
      const props = event.data as { sessionID: string; todos: Todo[] }
      if (!props?.sessionID) break
      const todos = new Map(next.todos)
      todos.set(props.sessionID, props.todos)
      return { ...next, todos }
    }
  }

  return next
}

export function GlobalSyncProvider({ children }: { children: ReactNode }) {
  const { active } = useServer()
  const [state, setState] = useState<GlobalSyncState>(initialState)
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<SSEClient | null>(null)

  useEffect(() => {
    const auth =
      active.username && active.password
        ? { username: active.username, password: active.password }
        : active.password
          ? { password: active.password }
          : undefined

    const client = createSSEClient({
      baseUrl: active.url,
      auth,
    })

    clientRef.current = client

    const unsub = client.on((event: SSEEvent) => {
      setState((prev) => applyEvent(prev, event))
    })

    const unsubError = client.onError(() => {
      setConnected(false)
    })

    client.start()
    setConnected(true)

    return () => {
      unsub()
      unsubError()
      client.stop()
      clientRef.current = null
      setConnected(false)
    }
  }, [active.url, active.username, active.password])

  return (
    <GlobalSyncContext.Provider value={{ state, connected }}>
      {children}
    </GlobalSyncContext.Provider>
  )
}

export function useGlobalSync() {
  const ctx = useContext(GlobalSyncContext)
  if (!ctx) throw new Error("useGlobalSync must be used within GlobalSyncProvider")
  return ctx
}

export function useSessions() {
  const { state } = useGlobalSync()
  return Array.from(state.sessions.values())
}

export function useSession(id: string | undefined) {
  const { state } = useGlobalSync()
  if (!id) return undefined
  return state.sessions.get(id)
}

export function useMessages(sessionId: string | undefined) {
  const { state } = useGlobalSync()
  if (!sessionId) return []
  return state.messages.get(sessionId) ?? []
}

export function useParts(messageId: string | undefined) {
  const { state } = useGlobalSync()
  if (!messageId) return []
  return state.parts.get(messageId) ?? []
}

export function usePermissions(sessionId: string | undefined) {
  const { state } = useGlobalSync()
  if (!sessionId) return []
  return state.permissions.get(sessionId) ?? []
}

export function useSessionStatus(sessionId: string | undefined) {
  const { state } = useGlobalSync()
  if (!sessionId) return undefined
  return state.sessionStatus.get(sessionId)
}

export function useTodos(sessionId: string | undefined) {
  const { state } = useGlobalSync()
  if (!sessionId) return []
  return state.todos.get(sessionId) ?? []
}

export function useSessionDiffs(sessionId: string | undefined) {
  const { state } = useGlobalSync()
  if (!sessionId) return []
  return state.sessionDiffs.get(sessionId) ?? []
}
