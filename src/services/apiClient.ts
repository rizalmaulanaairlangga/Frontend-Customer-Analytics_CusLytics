export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type Query = Record<string, string | undefined>

export async function getJson<T>(
  path: string,
  baseUrl: string,
  query: Query = {},
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  if (!baseUrl.trim()) throw new ApiError('Set VITE_API_BASE_URL before using API mode.')

  const url = new URL(path.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, value)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new DOMException('The request timed out.', 'TimeoutError')), options.timeoutMs ?? 12000)
  const abortFromCaller = () => controller.abort(options.signal?.reason)
  options.signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!response.ok) throw new ApiError(`Request failed (${response.status}).`, response.status)
    try {
      return await response.json() as T
    } catch {
      throw new ApiError('The server response was not valid JSON.')
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted && !options.signal?.aborted) throw new ApiError('The request timed out. Try again.')
    if (options.signal?.aborted) throw error
    throw new ApiError('Could not reach the analytics service. Check the API connection and try again.')
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}

export async function postJson<T>(
  path: string,
  baseUrl: string,
  body: unknown,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  if (!baseUrl.trim()) throw new ApiError('Set VITE_API_BASE_URL before using API mode.')

  const url = new URL(path.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new DOMException('The request timed out.', 'TimeoutError')), options.timeoutMs ?? 12000)
  const abortFromCaller = () => controller.abort(options.signal?.reason)
  options.signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new ApiError(`Request failed (${response.status}).`, response.status)
    try {
      return await response.json() as T
    } catch {
      throw new ApiError('The server response was not valid JSON.')
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted && !options.signal?.aborted) throw new ApiError('The request timed out. Try again.')
    if (options.signal?.aborted) throw error
    throw new ApiError('Could not reach the analytics service. Check the API connection and try again.')
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}
