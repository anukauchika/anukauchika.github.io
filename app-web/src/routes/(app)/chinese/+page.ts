// Override the (app) layout's ssr=false for this page only: /chinese is
// prerendered with a static intro + full head so crawlers see real content.
// The interactive app subtree stays client-only ({#if browser} in +page.svelte).
export const ssr = true
