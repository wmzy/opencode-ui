import { useRef, useEffect, useCallback } from "react"

type TerminalTabProps = {
  id: string
  title: string
  connected: boolean
  active: boolean
  output: string[]
  onInput: (data: string) => void
  onClose: () => void
  onFocus: () => void
}

export function TerminalTab({
  title,
  connected,
  active,
  output,
  onInput,
  onClose,
  onFocus,
}: TerminalTabProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [output])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        const target = e.currentTarget
        onInput(target.value + "\n")
        target.value = ""
        return
      }

      if (e.key === "Backspace") return
      if (e.key === "Tab") {
        e.preventDefault()
        onInput("\t")
        return
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c") {
          onInput("\x03")
          e.preventDefault()
          return
        }
        if (e.key === "d") {
          onInput("\x04")
          e.preventDefault()
          return
        }
        if (e.key === "l") {
          onInput("\x0c")
          e.preventDefault()
          return
        }
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        onInput(e.key)
      }
    },
    [onInput],
  )

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus()
    onFocus()
  }, [onFocus])

  return (
    <div
      role="tabpanel"
      style={{
        display: active ? "flex" : "none",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "2px 8px",
          borderBottom: "1px solid var(--color-border, #2d333b)",
          fontSize: 11,
          gap: 6,
        }}
      >
        <span style={{ flex: 1, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-muted, #636e7b)",
            cursor: "pointer",
            fontSize: 14,
            padding: "0 4px",
            lineHeight: 1,
          }}
          aria-label={`Close ${title}`}
        >
          ×
        </button>
      </div>
      <div
        style={{ flex: 1, overflow: "hidden", cursor: "text" }}
        onClick={handleContainerClick}
      >
        <pre
          ref={preRef}
          style={{
            margin: 0,
            padding: "8px 12px",
            fontSize: 13,
            fontFamily: "monospace",
            lineHeight: 1.4,
            height: "100%",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            background: "#191515",
            color: "#d4d4d4",
          }}
        >
          {output.join("")}
          {!connected && (
            <span style={{ color: "#f85149" }}>
              {"\n"}Disconnected
            </span>
          )}
        </pre>
      </div>
      <input
        ref={inputRef}
        type="text"
        onKeyDown={handleKeyDown}
        style={{
          position: "absolute",
          left: -9999,
          opacity: 0,
          width: 0,
          height: 0,
        }}
        aria-label="Terminal input"
      />
    </div>
  )
}
