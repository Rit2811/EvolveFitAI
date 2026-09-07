import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const checks = []
const check = (name, pass, detail) => checks.push({ name, pass, detail })

const nodeMajor = Number(process.versions.node.split('.')[0])
check('Node.js 20+', nodeMajor >= 20, `detected ${process.versions.node}`)

const serverEnvPath = resolve(root, 'server/.env')
const serverEnv = existsSync(serverEnvPath) ? parseEnv(readFileSync(serverEnvPath, 'utf8')) : {}
check('Gemini mode', validValue(serverEnv.GEMINI_API_KEY, 'your-gemini') || !serverEnv.GEMINI_API_KEY, serverEnv.GEMINI_API_KEY ? 'live model enabled' : 'local fallback enabled')
check('Gemini model', !serverEnv.GEMINI_API_KEY || validValue(serverEnv.GEMINI_MODEL, 'your-'), 'required when live Gemini mode is enabled')

for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'}  ${item.name} — ${item.detail}`)
const failures = checks.filter((item) => !item.pass)
console.log(`\n${checks.length - failures.length}/${checks.length} preflight checks passed.`)
if (failures.length) {
  console.error('Release environment is not ready. Resolve the FAIL items before the live demo.')
  process.exitCode = 1
}

function parseEnv(text) {
  return Object.fromEntries(text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => { const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')] }))
}
function validValue(value, placeholder) { return Boolean(value && !value.toLowerCase().includes(placeholder)) }
