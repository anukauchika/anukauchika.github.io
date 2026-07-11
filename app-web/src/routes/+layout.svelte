<script>
  import '@std/style/anuka.css'
  import { browser } from '$app/environment'
  import { initAttributionParams } from '@low/worksheet/attribution'

  let { children } = $props()

  if (browser) {
    initAttributionParams()
    import('virtual:pwa-register').then((m) => m.registerSW({ immediate: true }))
    import('@low/google/analytics').then((m) => m.initAnalytics())

    import('@svc/dataset')
      .then((dataset) => dataset.svcDataset.init())
      .catch((e) => console.error('dataset init failed', e))

    import('@svc/user-prefs')
      .then((prefs) => prefs.svcUserPrefs.loadTheme())
      .catch((e) => console.error('theme init failed', e))

    import('@svc/auth').then((auth) => auth.svcAuth.init()).catch((e) => console.error('auth init failed', e))

    const runMaintenance = () => {
      import('@svc/maintenance')
        .then((maint) => maint.svcMaintenance.runStartupTasks())
        .catch((e) => console.error('startup maintenance failed', e))
    }
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runMaintenance, { timeout: 5_000 })
    } else {
      setTimeout(runMaintenance, 1_000)
    }
  }
</script>

<svelte:head>
  {@html `<script>try{var t=localStorage.getItem('uch-theme');if(t)document.documentElement.dataset.theme=t}catch{}</script>`}
</svelte:head>

{@render children()}
