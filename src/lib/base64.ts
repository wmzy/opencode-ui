export function encode64(value: string): string {
  return btoa(value)
}

export function decode64(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  try {
    return atob(value)
  } catch {
    return undefined
  }
}

export function encode64UrlSafe(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function decode64UrlSafe(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/")
    const padding = padded.length % 4
    const normalized = padding ? padded + "=".repeat(4 - padding) : padded
    return atob(normalized)
  } catch {
    return undefined
  }
}

export function authTokenFromCredentials(input: {
  username?: string
  password: string
}): string {
  return btoa(`${input.username ?? "opencode"}:${input.password}`)
}

export function authFromToken(
  token: string | null | undefined,
): { username: string; password: string } | undefined {
  const decoded = decode64(token ?? undefined)
  if (!decoded) return undefined
  const separator = decoded.indexOf(":")
  if (separator === -1) return undefined
  return {
    username: decoded.slice(0, separator) || "opencode",
    password: decoded.slice(separator + 1),
  }
}
