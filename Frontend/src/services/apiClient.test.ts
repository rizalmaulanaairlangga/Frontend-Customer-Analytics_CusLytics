import { afterEach, describe, expect, it, vi } from 'vitest'
import { getJson, postJson } from './apiClient'

afterEach(() => vi.unstubAllGlobals())

describe('getJson', () => {
  it('resolves the resource against the configured base and encodes shared filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await getJson('/analytics/dashboard', 'https://api.example.test/v1', {
      country: 'United Kingdom', startDate: '2025-01-01', endDate: '2025-02-01', interval: 'month',
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://api.example.test/v1/analytics/dashboard?country=United+Kingdom&startDate=2025-01-01&endDate=2025-02-01&interval=month')
  })

  it('reports an HTTP failure without treating its body as dashboard data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })))
    await expect(getJson('/analytics/dashboard', 'https://api.example.test')).rejects.toThrow('Request failed (503)')
  })

  it('rejects malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{', { status: 200 })))
    await expect(getJson('/analytics/dashboard', 'https://api.example.test')).rejects.toThrow('valid JSON')
  })

  it('aborts a request when its timeout expires', async () => {
    const fetchMock = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getJson('/dashboard', 'https://api.example.test', {}, { timeoutMs: 5 })).rejects.toThrow('timed out')
  })

  it('preserves a caller cancellation instead of reporting a network failure', async () => {
    const fetchMock = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
    }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    const request = getJson('/dashboard', 'https://api.example.test', {}, { signal: controller.signal })
    controller.abort()

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('postJson', () => {
  it('posts the supplied experiment configuration to the configured resource', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"exp-1"}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    const body = { k: 4, randomSeed: 72 }

    await expect(postJson('/experiments/run', 'https://api.example.test/v1', body)).resolves.toEqual({ id: 'exp-1' })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  })

  it('reports an unsuccessful experiment request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })))
    await expect(postJson('/experiments/run', 'https://api.example.test', { k: 3, randomSeed: 42 })).rejects.toThrow('Request failed (503)')
  })
})
