export const attributionParamKeys = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
] as const

export type AttributionParam = (typeof attributionParamKeys)[number]
export type AttributionParams = Partial<Record<AttributionParam, string>>

const storageKey = 'anuka_worksheet_attribution'

function hasParams(params: AttributionParams): boolean {
  return Object.keys(params).length > 0
}

function readParamsFromSearch(searchParams: URLSearchParams): AttributionParams {
  const params: AttributionParams = {}
  for (const key of attributionParamKeys) {
    const value = searchParams.get(key)
    if (value) params[key] = value
  }
  return params
}

function readStoredParams(storage: Storage | undefined): AttributionParams {
  if (!storage) return {}
  try {
    const raw = storage.getItem(storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const params: AttributionParams = {}
    for (const key of attributionParamKeys) {
      if (typeof parsed[key] === 'string') params[key] = parsed[key]
    }
    return params
  } catch {
    return {}
  }
}

function writeStoredParams(params: AttributionParams, storage: Storage | undefined): void {
  if (!storage || !hasParams(params)) return
  try {
    storage.setItem(storageKey, JSON.stringify(params))
  } catch {
    // Storage can be unavailable in private browsing modes.
  }
}

export function getAttributionParams(url: URL = new URL(window.location.href)): AttributionParams {
  return readParamsFromSearch(url.searchParams)
}

export function initAttributionParams(): AttributionParams {
  if (typeof window === 'undefined') return {}
  const current = getAttributionParams()
  if (hasParams(current)) {
    writeStoredParams(current, window.localStorage)
    writeStoredParams(current, window.sessionStorage)
  }
  return getCurrentAttributionParams()
}

export function getCurrentAttributionParams(): AttributionParams {
  if (typeof window === 'undefined') return {}
  const stored = {
    ...readStoredParams(window.localStorage),
    ...readStoredParams(window.sessionStorage),
  }
  return {
    ...stored,
    ...getAttributionParams(),
  }
}

export function appendAttributionParams(url: string, params: AttributionParams = getCurrentAttributionParams()): string {
  const base = typeof window === 'undefined' ? 'https://anukauchika.com' : window.location.origin
  const next = new URL(url, base)
  for (const key of attributionParamKeys) {
    const value = params[key]
    if (value) next.searchParams.set(key, value)
  }
  if (next.origin === base) return `${next.pathname}${next.search}${next.hash}`
  return next.toString()
}
