const GA_MEASUREMENT_ID = 'G-ELKSNFMX2R'

export function initAnalytics() {
  if (typeof window === 'undefined') return
  if (window.location.hostname === 'localhost') return // skip in dev

  // Load gtag.js
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  function gtag() { window.dataLayer.push(arguments) }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}
