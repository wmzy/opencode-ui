import { authTokenFromCredentials } from "./base64"

type Auth = { username?: string; password: string }

interface RequestOptions {
  signal?: AbortSignal
  query?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
}

interface JsonRequestOptions extends RequestOptions {
  body?: unknown
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`API Error ${status}: ${statusText}`)
    this.name = "ApiError"
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = await response.text().catch(() => "")
    }
    throw new ApiError(response.status, response.statusText, body)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(path, baseUrl)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

export interface OpenCodeSdk {
  session: {
    list(opts?: RequestOptions & { scope?: string; roots?: boolean; start?: number; search?: string; limit?: number }): Promise<unknown[]>
    create(opts?: JsonRequestOptions & { body?: { parentID?: string; title?: string; agent?: string; model?: { id: string; providerID: string; variant?: string }; permission?: unknown; workspaceID?: string } }): Promise<unknown>
    get(sessionID: string, opts?: RequestOptions): Promise<unknown>
    delete(sessionID: string, opts?: RequestOptions): Promise<boolean>
    update(sessionID: string, opts?: JsonRequestOptions & { body?: { title?: string; permission?: unknown; time?: { archived?: number } } }): Promise<unknown>
    abort(sessionID: string, opts?: RequestOptions): Promise<boolean>
    share(sessionID: string, opts?: RequestOptions): Promise<unknown>
    unshare(sessionID: string, opts?: RequestOptions): Promise<unknown>
    fork(sessionID: string, opts?: JsonRequestOptions & { body?: { messageID?: string } }): Promise<unknown>
    summarize(sessionID: string, opts?: JsonRequestOptions & { body?: { providerID: string; modelID: string; auto?: boolean } }): Promise<boolean>
    init(sessionID: string, opts: JsonRequestOptions & { body: { modelID: string; providerID: string; messageID: string } }): Promise<boolean>
    status(opts?: RequestOptions): Promise<Record<string, unknown>>
    message: {
      list(sessionID: string, opts?: RequestOptions & { limit?: number; before?: string }): Promise<unknown[]>
      create(sessionID: string, opts: JsonRequestOptions & { body: { parts: unknown[]; messageID?: string; model?: { providerID: string; modelID: string }; agent?: string; noReply?: boolean; tools?: Record<string, boolean>; format?: unknown; system?: string; variant?: string } }): Promise<unknown>
      get(sessionID: string, messageID: string, opts?: RequestOptions): Promise<unknown>
      delete(sessionID: string, messageID: string, opts?: RequestOptions): Promise<boolean>
    }
    diff(sessionID: string, opts?: RequestOptions & { messageID?: string }): Promise<unknown[]>
    children(sessionID: string, opts?: RequestOptions): Promise<unknown[]>
    todo(sessionID: string, opts?: RequestOptions): Promise<unknown[]>
    promptAsync(sessionID: string, opts: JsonRequestOptions & { body: { parts: unknown[]; messageID?: string; model?: { providerID: string; modelID: string }; agent?: string; noReply?: boolean; tools?: Record<string, boolean>; format?: unknown; system?: string; variant?: string } }): Promise<void>
  }
  file: {
    list(opts: RequestOptions & { path: string }): Promise<unknown[]>
    content(opts: RequestOptions & { path: string }): Promise<unknown>
    status(opts?: RequestOptions): Promise<unknown[]>
  }
  find: {
    text(opts: RequestOptions & { pattern: string }): Promise<unknown[]>
    file(opts: RequestOptions & { query: string; dirs?: string; type?: string; limit?: number }): Promise<string[]>
    symbol(opts: RequestOptions & { query: string }): Promise<unknown[]>
  }
  pty: {
    list(opts?: RequestOptions): Promise<unknown[]>
    create(opts?: JsonRequestOptions & { body?: { command?: string; args?: string[]; cwd?: string; title?: string; env?: Record<string, string> } }): Promise<unknown>
    get(ptyID: string, opts?: RequestOptions): Promise<unknown>
    update(ptyID: string, opts?: JsonRequestOptions & { body?: { title?: string; size?: { rows: number; cols: number } } }): Promise<unknown>
    remove(ptyID: string, opts?: RequestOptions): Promise<boolean>
    connectToken(ptyID: string, opts?: RequestOptions): Promise<{ ticket: string; expires_in: number }>
    shells(opts?: RequestOptions): Promise<Array<{ path: string; name: string; acceptable: boolean }>>
  }
  provider: {
    list(opts?: RequestOptions): Promise<{ all: unknown[]; default: Record<string, string>; connected: string[] }>
    auth(opts?: RequestOptions): Promise<Record<string, unknown[]>>
    oauth: {
      authorize(providerID: string, opts: JsonRequestOptions & { body: { method: number; inputs?: Record<string, string> } }): Promise<unknown>
      callback(providerID: string, opts: JsonRequestOptions & { body: { method: number; code?: string } }): Promise<boolean>
    }
  }
  mcp: {
    status(opts?: RequestOptions): Promise<Record<string, unknown>>
    add(opts: JsonRequestOptions & { body: { name: string; config: unknown } }): Promise<Record<string, unknown>>
    connect(name: string, opts?: RequestOptions): Promise<boolean>
    disconnect(name: string, opts?: RequestOptions): Promise<boolean>
    auth: {
      start(name: string, opts?: RequestOptions): Promise<{ authorizationUrl: string; oauthState: string }>
      callback(name: string, opts: JsonRequestOptions & { body: { code: string } }): Promise<unknown>
      authenticate(name: string, opts?: RequestOptions): Promise<unknown>
      remove(name: string, opts?: RequestOptions): Promise<{ success: boolean }>
    }
  }
  global: {
    health(opts?: RequestOptions): Promise<{ healthy: boolean; version: string }>
    config: {
      get(opts?: RequestOptions): Promise<unknown>
      update(opts?: JsonRequestOptions & { body?: unknown }): Promise<unknown>
    }
    event(opts?: RequestOptions): Promise<Response>
    dispose(opts?: RequestOptions): Promise<boolean>
    upgrade(opts?: JsonRequestOptions & { body?: { target?: string } }): Promise<unknown>
  }
  event: {
    subscribe(opts?: RequestOptions): Promise<Response>
  }
  config: {
    get(opts?: RequestOptions): Promise<unknown>
    update(opts?: JsonRequestOptions & { body?: unknown }): Promise<unknown>
    providers(opts?: RequestOptions): Promise<{ providers: unknown[]; default: Record<string, string> }>
  }
  lsp: {
    status(opts?: RequestOptions): Promise<unknown[]>
  }
  formatter: {
    status(opts?: RequestOptions): Promise<unknown[]>
  }
  permission: {
    list(opts?: RequestOptions): Promise<unknown[]>
    reply(requestID: string, opts: JsonRequestOptions & { body: { reply: "once" | "always" | "reject"; message?: string } }): Promise<boolean>
  }
  question: {
    list(opts?: RequestOptions): Promise<unknown[]>
    reply(requestID: string, opts: JsonRequestOptions & { body: { answers: unknown[] } }): Promise<boolean>
    reject(requestID: string, opts?: RequestOptions): Promise<boolean>
  }
  auth: {
    set(providerID: string, opts: JsonRequestOptions & { body: unknown }): Promise<boolean>
    remove(providerID: string, opts?: RequestOptions): Promise<boolean>
  }
  vcs: {
    get(opts?: RequestOptions): Promise<unknown>
    diff(opts: RequestOptions & { mode: "git" | "branch" }): Promise<unknown[]>
  }
  command: {
    list(opts?: RequestOptions): Promise<unknown[]>
  }
  agent: {
    list(opts?: RequestOptions): Promise<unknown[]>
  }
  skill: {
    list(opts?: RequestOptions): Promise<unknown[]>
  }
  project: {
    list(opts?: RequestOptions): Promise<unknown[]>
    current(opts?: RequestOptions): Promise<unknown>
    update(projectID: string, opts?: JsonRequestOptions & { body?: { name?: string; icon?: { url?: string; override?: string; color?: string }; commands?: { start?: string } } }): Promise<unknown>
    initGit(opts?: RequestOptions): Promise<unknown>
  }
  path: {
    get(opts?: RequestOptions): Promise<unknown>
  }
  instance: {
    dispose(opts?: RequestOptions): Promise<boolean>
  }
  app: {
    log(opts: JsonRequestOptions & { body: { service: string; level: "debug" | "info" | "error" | "warn"; message: string; extra?: Record<string, unknown> } }): Promise<boolean>
  }
}

export function createSdk(
  baseUrl: string,
  auth?: Auth,
  defaultDirectory?: string,
): OpenCodeSdk {
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (auth) {
    baseHeaders["Authorization"] = `Basic ${authTokenFromCredentials(auth)}`
  }

  const request = async <T>(
    method: string,
    path: string,
    opts?: RequestOptions,
  ): Promise<T> => {
    const url = buildUrl(baseUrl, path, {
      ...opts?.query,
    })
    const headers = { ...baseHeaders, ...opts?.headers }
    const response = await fetch(url, {
      method,
      headers,
      signal: opts?.signal,
    })
    return handleResponse<T>(response)
  }

  const requestWithBody = async <T>(
    method: string,
    path: string,
    opts?: JsonRequestOptions,
  ): Promise<T> => {
    const url = buildUrl(baseUrl, path, opts?.query)
    const headers = { ...baseHeaders, ...opts?.headers }
    const response = await fetch(url, {
      method,
      headers,
      signal: opts?.signal,
      body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
    return handleResponse<T>(response)
  }

  const withDirectory = (
    query?: Record<string, string | number | boolean | undefined>,
  ): Record<string, string | number | boolean | undefined> | undefined => {
    if (!defaultDirectory && !query) return query
    return { directory: defaultDirectory, ...(query ?? {}) }
  }

  return {
    session: {
      list: (opts) =>
        request("GET", "/session", {
          ...opts,
          query: withDirectory({ ...opts?.query }),
        }),
      create: (opts) =>
        requestWithBody("POST", "/session", {
          ...opts,
          query: withDirectory(),
        }),
      get: (id, opts) =>
        request("GET", `/session/${id}`, {
          ...opts,
          query: withDirectory(),
        }),
      delete: (id, opts) =>
        request("DELETE", `/session/${id}`, {
          ...opts,
          query: withDirectory(),
        }),
      update: (id, opts) =>
        requestWithBody("PATCH", `/session/${id}`, {
          ...opts,
          query: withDirectory(),
        }),
      abort: (id, opts) =>
        request("POST", `/session/${id}/abort`, {
          ...opts,
          query: withDirectory(),
        }),
      share: (id, opts) =>
        requestWithBody("POST", `/session/${id}/share`, {
          ...opts,
          query: withDirectory(),
        }),
      unshare: (id, opts) =>
        requestWithBody("DELETE", `/session/${id}/share`, {
          ...opts,
          query: withDirectory(),
        }),
      fork: (id, opts) =>
        requestWithBody("POST", `/session/${id}/fork`, {
          ...opts,
          query: withDirectory(),
        }),
      summarize: (id, opts) =>
        requestWithBody("POST", `/session/${id}/summarize`, {
          ...opts,
          query: withDirectory(),
        }),
      init: (id, opts) =>
        requestWithBody("POST", `/session/${id}/init`, {
          ...opts,
          query: withDirectory(),
        }),
      status: (opts) =>
        request("GET", "/session/status", {
          ...opts,
          query: withDirectory(),
        }),
      message: {
        list: (sessionID, opts) =>
          request("GET", `/session/${sessionID}/message`, {
            ...opts,
            query: withDirectory({ ...opts?.query }),
          }),
        create: (sessionID, opts) =>
          requestWithBody("POST", `/session/${sessionID}/message`, {
            ...opts,
            query: withDirectory(),
          }),
        get: (sessionID, messageID, opts) =>
          request("GET", `/session/${sessionID}/message/${messageID}`, {
            ...opts,
            query: withDirectory(),
          }),
        delete: (sessionID, messageID, opts) =>
          request("DELETE", `/session/${sessionID}/message/${messageID}`, {
            ...opts,
            query: withDirectory(),
          }),
      },
      diff: (sessionID, opts) =>
        request("GET", `/session/${sessionID}/diff`, {
          ...opts,
          query: withDirectory({ ...opts?.query }),
        }),
      children: (sessionID, opts) =>
        request("GET", `/session/${sessionID}/children`, {
          ...opts,
          query: withDirectory(),
        }),
      todo: (sessionID, opts) =>
        request("GET", `/session/${sessionID}/todo`, {
          ...opts,
          query: withDirectory(),
        }),
      promptAsync: (sessionID, opts) =>
        requestWithBody("POST", `/session/${sessionID}/prompt_async`, {
          ...opts,
          query: withDirectory(),
        }),
    },
    file: {
      list: (opts) =>
        request("GET", "/file", {
          ...opts,
          query: withDirectory({ path: opts.path, ...opts?.query }),
        }),
      content: (opts) =>
        request("GET", "/file/content", {
          ...opts,
          query: withDirectory({ path: opts.path, ...opts?.query }),
        }),
      status: (opts) =>
        request("GET", "/file/status", {
          ...opts,
          query: withDirectory(),
        }),
    },
    find: {
      text: (opts) =>
        request("GET", "/find", {
          ...opts,
          query: withDirectory({ ...opts?.query }),
        }),
      file: (opts) =>
        request("GET", "/find/file", {
          signal: opts?.signal,
          headers: opts?.headers,
          query: withDirectory({ query: opts.query, dirs: opts.dirs, type: opts.type, limit: opts.limit }),
        }),
      symbol: (opts) =>
        request("GET", "/find/symbol", {
          signal: opts?.signal,
          headers: opts?.headers,
          query: withDirectory({ query: opts.query }),
        }),
    },
    pty: {
      list: (opts) =>
        request("GET", "/pty", {
          ...opts,
          query: withDirectory(),
        }),
      create: (opts) =>
        requestWithBody("POST", "/pty", {
          ...opts,
          query: withDirectory(),
        }),
      get: (ptyID, opts) =>
        request("GET", `/pty/${ptyID}`, {
          ...opts,
          query: withDirectory(),
        }),
      update: (ptyID, opts) =>
        requestWithBody("PUT", `/pty/${ptyID}`, {
          ...opts,
          query: withDirectory(),
        }),
      remove: (ptyID, opts) =>
        request("DELETE", `/pty/${ptyID}`, {
          ...opts,
          query: withDirectory(),
        }),
      connectToken: (ptyID, opts) =>
        requestWithBody("POST", `/pty/${ptyID}/connect-token`, {
          ...opts,
          query: withDirectory(),
        }),
      shells: (opts) =>
        request("GET", "/pty/shells", {
          ...opts,
          query: withDirectory(),
        }),
    },
    provider: {
      list: (opts) =>
        request("GET", "/provider", {
          ...opts,
          query: withDirectory(),
        }),
      auth: (opts) =>
        request("GET", "/provider/auth", {
          ...opts,
          query: withDirectory(),
        }),
      oauth: {
        authorize: (providerID, opts) =>
          requestWithBody("POST", `/provider/${providerID}/oauth/authorize`, {
            ...opts,
            query: withDirectory(),
          }),
        callback: (providerID, opts) =>
          requestWithBody("POST", `/provider/${providerID}/oauth/callback`, {
            ...opts,
            query: withDirectory(),
          }),
      },
    },
    mcp: {
      status: (opts) =>
        request("GET", "/mcp", {
          ...opts,
          query: withDirectory(),
        }),
      add: (opts) =>
        requestWithBody("POST", "/mcp", {
          ...opts,
          query: withDirectory(),
        }),
      connect: (name, opts) =>
        requestWithBody("POST", `/mcp/${name}/connect`, {
          ...opts,
          query: withDirectory(),
        }),
      disconnect: (name, opts) =>
        requestWithBody("POST", `/mcp/${name}/disconnect`, {
          ...opts,
          query: withDirectory(),
        }),
      auth: {
        start: (name, opts) =>
          request("POST", `/mcp/${name}/auth`, {
            ...opts,
            query: withDirectory(),
          }),
        callback: (name, opts) =>
          requestWithBody("POST", `/mcp/${name}/auth/callback`, {
            ...opts,
            query: withDirectory(),
          }),
        authenticate: (name, opts) =>
          request("POST", `/mcp/${name}/auth/authenticate`, {
            ...opts,
            query: withDirectory(),
          }),
        remove: (name, opts) =>
          request("DELETE", `/mcp/${name}/auth`, {
            ...opts,
            query: withDirectory(),
          }),
      },
    },
    global: {
      health: (opts) => request("GET", "/global/health", opts),
      config: {
        get: (opts) => request("GET", "/global/config", opts),
        update: (opts) =>
          requestWithBody("PATCH", "/global/config", opts),
      },
      event: (opts) => {
        const url = buildUrl(baseUrl, "/global/event", opts?.query)
        const headers = { ...baseHeaders, ...opts?.headers }
        return fetch(url, {
          method: "GET",
          headers,
          signal: opts?.signal,
        })
      },
      dispose: (opts) =>
        requestWithBody("POST", "/global/dispose", opts),
      upgrade: (opts) =>
        requestWithBody("POST", "/global/upgrade", opts),
    },
    event: {
      subscribe: (opts) => {
        const url = buildUrl(baseUrl, "/event", {
          ...opts?.query,
          directory: defaultDirectory,
        })
        const headers = { ...baseHeaders, ...opts?.headers }
        return fetch(url, {
          method: "GET",
          headers,
          signal: opts?.signal,
        })
      },
    },
    config: {
      get: (opts) =>
        request("GET", "/config", {
          ...opts,
          query: withDirectory(),
        }),
      update: (opts) =>
        requestWithBody("PATCH", "/config", {
          ...opts,
          query: withDirectory(),
        }),
      providers: (opts) =>
        request("GET", "/config/providers", {
          ...opts,
          query: withDirectory(),
        }),
    },
    lsp: {
      status: (opts) =>
        request("GET", "/lsp", {
          ...opts,
          query: withDirectory(),
        }),
    },
    formatter: {
      status: (opts) =>
        request("GET", "/formatter", {
          ...opts,
          query: withDirectory(),
        }),
    },
    permission: {
      list: (opts) =>
        request("GET", "/permission", {
          ...opts,
          query: withDirectory(),
        }),
      reply: (requestID, opts) =>
        requestWithBody("POST", `/permission/${requestID}/reply`, {
          ...opts,
          query: withDirectory(),
        }),
    },
    question: {
      list: (opts) =>
        request("GET", "/question", {
          ...opts,
          query: withDirectory(),
        }),
      reply: (requestID, opts) =>
        requestWithBody("POST", `/question/${requestID}/reply`, {
          ...opts,
          query: withDirectory(),
        }),
      reject: (requestID, opts) =>
        requestWithBody("POST", `/question/${requestID}/reject`, {
          ...opts,
          query: withDirectory(),
        }),
    },
    auth: {
      set: (providerID, opts) =>
        requestWithBody("PUT", `/auth/${providerID}`, {
          ...opts,
          query: withDirectory(),
        }),
      remove: (providerID, opts) =>
        request("DELETE", `/auth/${providerID}`, {
          ...opts,
          query: withDirectory(),
        }),
    },
    vcs: {
      get: (opts) =>
        request("GET", "/vcs", {
          ...opts,
          query: withDirectory(),
        }),
      diff: (opts) =>
        request("GET", "/vcs/diff", {
          ...opts,
          query: withDirectory({ ...opts?.query }),
        }),
    },
    command: {
      list: (opts) =>
        request("GET", "/command", {
          ...opts,
          query: withDirectory(),
        }),
    },
    agent: {
      list: (opts) =>
        request("GET", "/agent", {
          ...opts,
          query: withDirectory(),
        }),
    },
    skill: {
      list: (opts) =>
        request("GET", "/skill", {
          ...opts,
          query: withDirectory(),
        }),
    },
    project: {
      list: (opts) =>
        request("GET", "/project", {
          ...opts,
          query: withDirectory(),
        }),
      current: (opts) =>
        request("GET", "/project/current", {
          ...opts,
          query: withDirectory(),
        }),
      update: (projectID, opts) =>
        requestWithBody("PATCH", `/project/${projectID}`, {
          ...opts,
          query: withDirectory(),
        }),
      initGit: (opts) =>
        requestWithBody("POST", "/project/git/init", {
          ...opts,
          query: withDirectory(),
        }),
    },
    path: {
      get: (opts) =>
        request("GET", "/path", {
          ...opts,
          query: withDirectory(),
        }),
    },
    instance: {
      dispose: (opts) =>
        requestWithBody("POST", "/instance/dispose", {
          ...opts,
          query: withDirectory(),
        }),
    },
    app: {
      log: (opts) =>
        requestWithBody("POST", "/log", {
          ...opts,
          query: withDirectory(),
        }),
    },
  }
}

export { ApiError }
export type { Auth, RequestOptions, JsonRequestOptions }
