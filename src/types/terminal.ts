export type Pty = {
  id: string
  title: string
  command: string
  args: Array<string>
  cwd: string
  status: "running" | "exited"
  pid: number
}

export type PtyCreateInput = {
  command?: string
  args?: Array<string>
  cwd?: string
  title?: string
  env?: {
    [key: string]: string
  }
}

export type PtyUpdateInput = {
  title?: string
  size?: {
    rows: number
    cols: number
  }
}
