<script>
  import '@std/style/anuka.css'
  import { browser } from '$app/environment'

  let { children } = $props()

  if (browser) {
    import('virtual:pwa-register').then(m => m.registerSW({ immediate: true }))
    import('@low/google/analytics').then(m => m.initAnalytics())

    Promise.all([
      import('@svc/maintenance'),
      import('@svc/auth'),
      import('@svc/user-prefs'),
      import('@svc/dataset'),
    ]).then(([maint, auth, prefs, dataset]) => {
      maint.svcMaintenance.runStartupTasks()
      return auth.svcAuth.init()
        .then(() => prefs.svcUserPrefs.loadTheme())
        .then(() => dataset.svcDataset.init())
    })
  }
</script>

<svelte:head>
  {@html `<script>try{var t=localStorage.getItem('uch-theme');if(t)document.documentElement.dataset.theme=t}catch{}</script>`}
</svelte:head>

{@render children()}
