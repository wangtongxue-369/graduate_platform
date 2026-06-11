const DEFAULT_TIMEOUT_MESSAGE = '请求超时，请稍后再试。'

export function withRequestTimeout(promise, timeoutMs = 8000, message = DEFAULT_TIMEOUT_MESSAGE) {
  let timerId

  const timeoutPromise = new Promise((_, reject) => {
    timerId = globalThis.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timerId) {
      globalThis.clearTimeout(timerId)
    }
  })
}
