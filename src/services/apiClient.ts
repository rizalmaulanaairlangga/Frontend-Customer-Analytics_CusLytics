export class ApiError extends Error {
  readonly status?: number
  readonly code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export type Query = Record<string, string | undefined>

function createUrl(path: string, baseUrl: string): URL {
  try {
    return new URL(path.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`)
  } catch {
    throw new ApiError('Service unavailable', undefined, 'API_UNAVAILABLE')
  }
}

export async function getJson<T>(
  path: string,
  baseUrl: string,
  query: Query = {},
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  if (!baseUrl.trim()) throw new ApiError('Service unavailable', undefined, 'API_UNAVAILABLE')

  const url = createUrl(path, baseUrl)
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
    if (controller.signal.aborted && !options.signal?.aborted) throw new ApiError('Request timed out', undefined, 'TIMEOUT')
    if (options.signal?.aborted) throw error
    throw new ApiError('Network request failed', undefined, 'NETWORK_ERROR')
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
  if (!baseUrl.trim()) throw new ApiError('Service unavailable', undefined, 'API_UNAVAILABLE')

  const url = createUrl(path, baseUrl)
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
    if (controller.signal.aborted && !options.signal?.aborted) throw new ApiError('Request timed out', undefined, 'TIMEOUT')
    if (options.signal?.aborted) throw error
    throw new ApiError('Network request failed', undefined, 'NETWORK_ERROR')
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}
