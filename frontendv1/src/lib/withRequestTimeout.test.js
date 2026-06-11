import { describe, expect, it, vi, afterEach } from 'vitest'
import { withRequestTimeout } from './withRequestTimeout.js'

describe('withRequestTimeout', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves the original promise before the timeout', async () => {
    await expect(withRequestTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok')
  })

  it('rejects with the provided timeout message when the promise hangs', async () => {
    vi.useFakeTimers()

    const pendingPromise = new Promise(() => {})
    const guardedPromise = withRequestTimeout(pendingPromise, 8000, '社区请求超时')
    const assertion = expect(guardedPromise).rejects.toThrow('社区请求超时')

    await vi.advanceTimersByTimeAsync(8001)

    await assertion
  })
})
