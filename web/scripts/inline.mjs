import fs from 'fs'
import path from 'path'

const distDir = path.resolve('dist')
const htmlPath = path.join(distDir, 'index.html')
const outPath = path.join(distDir, 'sherzod.html')

if (!fs.existsSync(htmlPath)) {
  console.error('Missing dist/index.html. Run `npm run build` first.')
  process.exit(1)
}

const readAsset = (assetPath) => {
  const clean = assetPath.replace(/^\//, '')
  const fullPath = path.join(distDir, clean)
  return fs.readFileSync(fullPath, 'utf8')
}

let html = fs.readFileSync(htmlPath, 'utf8')

html = html.replace(/<link rel="modulepreload"[^>]*>/g, '')

html = html.replace(
  /<link rel="stylesheet" href="([^"]+)"[^>]*>/g,
  (_match, href) => `<style>\n${readAsset(href)}\n</style>`
)

html = html.replace(
  /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_match, src) => `<script type="module">\n${readAsset(src)}\n</script>`
)

fs.writeFileSync(outPath, html)
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`)
