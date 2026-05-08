import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react"
import { useSdk } from "./sdk"
import type { FileNode, FileContent, FileChange } from "@/types/file"

type DirState = {
  expanded: boolean
  loaded: boolean
  loading: boolean
}

type FileState = {
  content: FileContent | null
  loading: boolean
  error: string | null
}

type FileContextValue = {
  tree: {
    children: (path: string) => FileNode[]
    state: (path: string) => DirState
    expand: (path: string) => void
    collapse: (path: string) => void
    toggle: (path: string) => void
    refresh: (path: string) => void
  }
  content: (path: string) => FileState | null
  loadContent: (path: string) => Promise<void>
  gitStatus: FileChange[]
  refreshGitStatus: () => Promise<void>
}

const FileContext = createContext<FileContextValue | null>(null)

function normalizePath(p: string): string {
  return p.replace(/[\\/]+$/, "").replaceAll("\\", "/")
}

export function FileProvider({ children }: { children: ReactNode }) {
  const { client } = useSdk()

  const dirMapRef = useRef<Map<string, FileNode[]>>(new Map())
  const dirStateRef = useRef<Map<string, DirState>>(new Map())
  const fileCacheRef = useRef<Map<string, FileState>>(new Map())
  const gitStatusRef = useRef<FileChange[]>([])

  const [revision, setRevision] = useState(0)
  const bump = useCallback(() => setRevision((r) => r + 1), [])

  const tree = useMemo<FileContextValue["tree"]>(
    () => ({
      children: (path: string) => dirMapRef.current.get(normalizePath(path)) ?? [],
      state: (path: string) =>
        dirStateRef.current.get(normalizePath(path)) ?? {
          expanded: false,
          loaded: false,
          loading: false,
        },
      expand: (path: string) => {
        const key = normalizePath(path)
        const current = dirStateRef.current.get(key)
        if (current?.expanded) return
        dirStateRef.current.set(key, {
          expanded: true,
          loaded: current?.loaded ?? false,
          loading: current?.loading ?? false,
        })
        bump()
        if (!current?.loaded && !current?.loading) {
          void listDir(key)
        }
      },
      collapse: (path: string) => {
        const key = normalizePath(path)
        const current = dirStateRef.current.get(key)
        if (!current?.expanded) return
        dirStateRef.current.set(key, {
          ...current,
          expanded: false,
        })
        bump()
      },
      toggle: (path: string) => {
        const key = normalizePath(path)
        const current = dirStateRef.current.get(key)
        if (current?.expanded) {
          dirStateRef.current.set(key, { ...current, expanded: false })
        } else {
          dirStateRef.current.set(key, {
            expanded: true,
            loaded: current?.loaded ?? false,
            loading: current?.loading ?? false,
          })
          bump()
          if (!current?.loaded && !current?.loading) {
            void listDir(key)
          }
        }
        bump()
      },
      refresh: (path: string) => {
        void listDir(normalizePath(path))
      },
    }),
    [bump],
  )

  const listDir = useCallback(
    async (path: string) => {
      const key = normalizePath(path)
      const current = dirStateRef.current.get(key)
      dirStateRef.current.set(key, {
        expanded: true,
        loaded: false,
        loading: true,
      })
      bump()

      try {
        const nodes = (await client.file.list({ path: key })) as FileNode[]
        const sorted = [...(nodes ?? [])].sort((a, b) => {
          if (a.type !== b.type) return a.type === "directory" ? -1 : 1
          return a.name.localeCompare(b.name)
        })
        dirMapRef.current.set(key, sorted)
        dirStateRef.current.set(key, {
          expanded: true,
          loaded: true,
          loading: false,
        })
      } catch {
        dirStateRef.current.set(key, {
          expanded: true,
          loaded: true,
          loading: false,
        })
      }
      bump()
    },
    [client, bump],
  )

  const getContent = useCallback(
    (path: string): FileState | null => fileCacheRef.current.get(normalizePath(path)) ?? null,
    [],
  )

  const loadContent = useCallback(
    async (path: string) => {
      const key = normalizePath(path)
      if (fileCacheRef.current.has(key)) return

      fileCacheRef.current.set(key, {
        content: null,
        loading: true,
        error: null,
      })
      bump()

      try {
        const data = (await client.file.content({ path: key })) as FileContent
        fileCacheRef.current.set(key, {
          content: data,
          loading: false,
          error: null,
        })
      } catch (e) {
        fileCacheRef.current.set(key, {
          content: null,
          loading: false,
          error: e instanceof Error ? e.message : "Failed to load file",
        })
      }
      bump()
    },
    [client, bump],
  )

  const refreshGitStatus = useCallback(async () => {
    try {
      const status = (await client.file.status()) as FileChange[]
      gitStatusRef.current = status ?? []
    } catch {
      gitStatusRef.current = []
    }
    bump()
  }, [client, bump])

  useEffect(() => {
    void tree.expand(".")
    void refreshGitStatus()
  }, [tree, refreshGitStatus])

  const value = useMemo<FileContextValue>(
    () => ({
      tree,
      content: getContent,
      loadContent,
      gitStatus: gitStatusRef.current,
      refreshGitStatus,
    }),
    // revision is the reactive trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree, getContent, loadContent, refreshGitStatus, revision],
  )

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>
}

export function useFileTree() {
  const ctx = useContext(FileContext)
  if (!ctx) throw new Error("useFileTree must be used within FileProvider")
  return ctx
}

export function useFileContent(path: string) {
  const ctx = useContext(FileContext)
  if (!ctx) throw new Error("useFileContent must be used within FileProvider")

  useEffect(() => {
    void ctx.loadContent(path)
  }, [ctx, path])

  return ctx.content(path)
}
