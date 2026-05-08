export type Command = {
  name: string
  description?: string
  agent?: string
  model?: string
  template: string
  subtask?: boolean
}

export type Todo = {
  content: string
  status: string
  priority: string
  id: string
}
