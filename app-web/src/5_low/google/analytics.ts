declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = 'G-ELKSNFMX2R'
const GOOGLE_ADS_ID = 'AW-953778095'
const HSK_WORKSHEET_PRINTT_CONVERSION_ID = 'AW-953778095/sWzNCNzh8sccEK__5cYD'
const HSK_PRACTICE_ONLINE_CONVERSION_ID = 'AW-953778095/u9oRCJ6y3MccEK__5cYD'

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

export function trackWorksheetPrintConversion(): void {
  trackEvent('conversion', {
    send_to: HSK_WORKSHEET_PRINTT_CONVERSION_ID,
  })
}

export function trackPracticeOnlineConversion(): void {
  trackEvent('conversion', {
    send_to: HSK_PRACTICE_ONLINE_CONVERSION_ID,
  })
}
