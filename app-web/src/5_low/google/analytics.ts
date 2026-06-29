declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = 'G-ELKSNFMX2R'
const GOOGLE_ADS_ID = 'AW-953778095'

export function initAnalytics(): void {
  if (typeof window === 'undefined') return
  if (window.location.hostname === 'localhost') return // skip in dev
  if (typeof window.gtag === 'function') return

  // Load gtag.js
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // Initialize gtag — gtag.js only processes `arguments` objects pushed to
  // dataLayer; plain arrays are silently ignored
  window.dataLayer = window.dataLayer || []
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
  gtag('config', GOOGLE_ADS_ID)
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params ?? {})
}

// Inline head snippet for prerendered pages with csr=false (no SvelteKit JS
// runs there, so the root layout never calls initAnalytics). Same logic.
export const gaHeadSnippet = `<script>(function(){if(location.hostname==='localhost'||typeof window.gtag==='function')return;var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}';document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');gtag('config','${GOOGLE_ADS_ID}');})()</script>`
