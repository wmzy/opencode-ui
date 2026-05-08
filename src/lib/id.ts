const CHARSET = "0123456789abcdefghijklmnopqrstuvwxyz"

function randomChars(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let result = ""
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length]
  }
  return result
}

export function generateId(prefix: "ses" | "msg" | "per" | "que" | "pty" = "ses"): string {
  return `${prefix}${randomChars(24)}`
}

export function generateShortId(): string {
  return randomChars(8)
}
