import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const manifestPath = new URL('../plugin/manifest.json', import.meta.url)
const bundlePath = new URL('../plugin/index.js', import.meta.url)

const bundle = readFileSync(bundlePath)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

manifest.hash = createHash('sha256').update(bundle).digest('hex')
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, '\t')}\n`)

console.log(`hash = ${manifest.hash}`)
