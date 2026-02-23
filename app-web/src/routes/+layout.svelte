<script>
  import '@std/style/anuka.css'
  import { browser } from '$app/environment'

  let { children } = $props()

  if (browser) {
    Promise.all([
      import('@low/google/analytics'),
      import('@svc/maintenance'),
      import('@svc/auth'),
      import('@svc/user-prefs'),
      import('@svc/dataset'),
    ]).then(([analytics, maint, auth, prefs, dataset]) => {
      analytics.initAnalytics()
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
