export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined

  const debounced = (...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn(...args)
    }, ms)
  }

  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  return debounced
}

export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args
    if (timer !== undefined) return
    timer = setTimeout(() => {
      timer = undefined
      if (lastArgs !== undefined) {
        fn(...lastArgs)
        lastArgs = undefined
      }
    }, ms)
    fn(...args)
  }

  throttled.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    lastArgs = undefined
  }

  return throttled
}
