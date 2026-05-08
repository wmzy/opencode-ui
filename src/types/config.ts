export type PermissionConfig = {
  edit?: "ask" | "allow" | "deny"
  bash?:
    | ("ask" | "allow" | "deny")
    | {
        [key: string]: "ask" | "allow" | "deny"
      }
  webfetch?: "ask" | "allow" | "deny"
  doom_loop?: "ask" | "allow" | "deny"
  external_directory?: "ask" | "allow" | "deny"
}

export type KeybindsConfig = {
  leader?: string
  app_exit?: string
  editor_open?: string
  theme_list?: string
  sidebar_toggle?: string
  scrollbar_toggle?: string
  username_toggle?: string
  status_view?: string
  session_export?: string
  session_new?: string
  session_list?: string
  session_timeline?: string
  session_share?: string
  session_unshare?: string
  session_interrupt?: string
  session_compact?: string
  messages_page_up?: string
  messages_page_down?: string
  messages_line_up?: string
  messages_line_down?: string
  messages_half_page_up?: string
  messages_half_page_down?: string
  messages_first?: string
  messages_last?: string
  messages_next?: string
  messages_previous?: string
  messages_last_user?: string
  messages_copy?: string
  messages_undo?: string
  messages_redo?: string
  messages_toggle_conceal?: string
  tool_details?: string
  model_list?: string
  model_cycle_recent?: string
  model_cycle_recent_reverse?: string
  command_list?: string
  agent_list?: string
  agent_cycle?: string
  agent_cycle_reverse?: string
  input_clear?: string
  input_forward_delete?: string
  input_paste?: string
  input_submit?: string
  input_newline?: string
  history_previous?: string
  history_next?: string
  session_child_cycle?: string
  session_child_cycle_reverse?: string
  terminal_suspend?: string
  terminal_title_toggle?: string
}

export type AgentConfig = {
  model?: string
  temperature?: number
  top_p?: number
  prompt?: string
  tools?: {
    [key: string]: boolean
  }
  disable?: boolean
  description?: string
  mode?: "subagent" | "primary" | "all"
  color?: string
  maxSteps?: number
  permission?: PermissionConfig
  [key: string]:
    | unknown
    | string
    | number
    | {
        [key: string]: boolean
      }
    | boolean
    | ("subagent" | "primary" | "all")
    | number
    | PermissionConfig
    | undefined
}

export type ModelConfig = {
  id?: string
  name?: string
  release_date?: string
  attachment?: boolean
  reasoning?: boolean
  temperature?: boolean
  tool_call?: boolean
  cost?: {
    input: number
    output: number
    cache_read?: number
    cache_write?: number
    context_over_200k?: {
      input: number
      output: number
      cache_read?: number
      cache_write?: number
    }
  }
  limit?: {
    context: number
    output: number
  }
  modalities?: {
    input: Array<"text" | "audio" | "image" | "video" | "pdf">
    output: Array<"text" | "audio" | "image" | "video" | "pdf">
  }
  experimental?: boolean
  status?: "alpha" | "beta" | "deprecated"
  options?: {
    [key: string]: unknown
  }
  headers?: {
    [key: string]: string
  }
  provider?: {
    npm: string
  }
}

export type ProviderConfig = {
  api?: string
  name?: string
  env?: Array<string>
  id?: string
  npm?: string
  models?: {
    [key: string]: ModelConfig
  }
  whitelist?: Array<string>
  blacklist?: Array<string>
  options?: {
    apiKey?: string
    baseURL?: string
    enterpriseUrl?: string
    setCacheKey?: boolean
    timeout?: number | false
    [key: string]: unknown | string | boolean | (number | false) | undefined
  }
}

export type McpLocalConfig = {
  type: "local"
  command: Array<string>
  environment?: {
    [key: string]: string
  }
  enabled?: boolean
  timeout?: number
}

export type McpOAuthConfig = {
  clientId?: string
  clientSecret?: string
  scope?: string
}

export type McpRemoteConfig = {
  type: "remote"
  url: string
  enabled?: boolean
  headers?: {
    [key: string]: string
  }
  oauth?: McpOAuthConfig | false
  timeout?: number
}

export type McpConfig = McpLocalConfig | McpRemoteConfig

export type LayoutConfig = "auto" | "stretch"

export type Config = {
  $schema?: string
  theme?: string
  keybinds?: KeybindsConfig
  logLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR"
  tui?: {
    scroll_speed?: number
    scroll_acceleration?: {
      enabled: boolean
    }
    diff_style?: "auto" | "stacked"
  }
  command?: {
    [key: string]: {
      template: string
      description?: string
      agent?: string
      model?: string
      subtask?: boolean
    }
  }
  watcher?: {
    ignore?: Array<string>
  }
  plugin?: Array<string>
  snapshot?: boolean
  share?: "manual" | "auto" | "disabled"
  autoupdate?: boolean | "notify"
  disabled_providers?: Array<string>
  enabled_providers?: Array<string>
  model?: string
  small_model?: string
  username?: string
  mode?: {
    build?: AgentConfig
    plan?: AgentConfig
    [key: string]: AgentConfig | undefined
  }
  agent?: {
    plan?: AgentConfig
    build?: AgentConfig
    general?: AgentConfig
    explore?: AgentConfig
    [key: string]: AgentConfig | undefined
  }
  provider?: {
    [key: string]: ProviderConfig
  }
  mcp?: {
    [key: string]: McpConfig
  }
  formatter?:
    | false
    | {
        [key: string]: {
          disabled?: boolean
          command?: Array<string>
          environment?: {
            [key: string]: string
          }
          extensions?: Array<string>
        }
      }
  lsp?:
    | false
    | {
        [key: string]:
          | {
              disabled: true
            }
          | {
              command: Array<string>
              extensions?: Array<string>
              disabled?: boolean
              env?: {
                [key: string]: string
              }
              initialization?: {
                [key: string]: unknown
              }
            }
      }
  instructions?: Array<string>
  layout?: LayoutConfig
  permission?: PermissionConfig
  tools?: {
    [key: string]: boolean
  }
  enterprise?: {
    url?: string
  }
  experimental?: {
    hook?: {
      file_edited?: {
        [key: string]: Array<{
          command: Array<string>
          environment?: {
            [key: string]: string
          }
        }>
      }
      session_completed?: Array<{
        command: Array<string>
        environment?: {
          [key: string]: string
        }
      }>
    }
    chatMaxRetries?: number
    disable_paste_summary?: boolean
    batch_tool?: boolean
    openTelemetry?: boolean
    primary_tools?: Array<string>
  }
}
