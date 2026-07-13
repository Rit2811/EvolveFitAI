import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'PROJECT_PROGRESS_REPORT.md')
const htmlPath = resolve(root, '.project-progress-report.html')
const output = resolve(root, 'EvolveFit_AI_Project_Progress_Report.pdf')
const browsers = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]

const browser = browsers.find(existsSync)
if (!existsSync(source)) throw new Error('PROJECT_PROGRESS_REPORT.md was not found.')
if (!browser) throw new Error('Chrome or Microsoft Edge is required to render the PDF.')

const markdown = readFileSync(source, 'utf8')
writeFileSync(htmlPath, renderDocument(markdown), 'utf8')

try {
  const result = spawnSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${output}`,
    pathToFileURL(htmlPath).href,
  ], { encoding: 'utf8', timeout: 120000 })

  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr || `Browser exited with status ${result.status}.`)
  if (!existsSync(output)) throw new Error('The browser did not create the PDF.')
  console.log(output)
} finally {
  if (existsSync(htmlPath)) unlinkSync(htmlPath)
}

function renderDocument(text) {
  const lines = text.replace(/\r/g, '').split('\n')
  const output = []
  let paragraph = []
  let list = ''
  let code = false
  let codeLines = []

  const closeParagraph = () => {
    if (paragraph.length) output.push(`<p>${inline(paragraph.join(' '))}</p>`)
    paragraph = []
  }
  const closeList = () => {
    if (list) output.push(`</${list}>`)
    list = ''
  }
  const closeBlocks = () => { closeParagraph(); closeList() }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.startsWith('```')) {
      closeBlocks()
      if (code) {
        output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        codeLines = []
      }
      code = !code
      continue
    }
    if (code) { codeLines.push(line); continue }
    if (!line.trim()) { closeBlocks(); continue }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      closeBlocks()
      const level = heading[1].length
      output.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }

    if (line.includes('|') && lines[index + 1]?.match(/^\s*\|?\s*:?-+/)) {
      closeBlocks()
      const headers = tableCells(line)
      index += 1
      const rows = []
      while (index + 1 < lines.length && lines[index + 1].includes('|') && lines[index + 1].trim()) {
        index += 1
        rows.push(tableCells(lines[index]))
      }
      output.push(`<table><thead><tr>${headers.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`)
      continue
    }

    const bullet = line.match(/^\s*-\s+(.+)$/)
    const numbered = line.match(/^\s*\d+\.\s+(.+)$/)
    if (bullet || numbered) {
      closeParagraph()
      const nextList = bullet ? 'ul' : 'ol'
      if (list && list !== nextList) closeList()
      if (!list) { list = nextList; output.push(`<${list}>`) }
      output.push(`<li>${inline((bullet || numbered)[1])}</li>`)
      continue
    }

    paragraph.push(line.trim())
  }
  closeBlocks()

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>EvolveFit AI — Project and Progress Report</title><style>
    @page { size: A4; margin: 16mm 15mm 17mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #18201B; font: 10.2pt/1.52 Arial, Helvetica, sans-serif; }
    h1 { color: #166534; font-size: 25pt; line-height: 1.15; margin: 0 0 16pt; padding-bottom: 10pt; border-bottom: 3px solid #84CC16; }
    h2 { color: #166534; font-size: 16pt; line-height: 1.25; margin: 22pt 0 8pt; break-after: avoid; }
    h3 { color: #294d36; font-size: 12.5pt; margin: 15pt 0 5pt; break-after: avoid; }
    p { margin: 0 0 8pt; orphans: 3; widows: 3; }
    ul, ol { margin: 4pt 0 10pt 20pt; padding: 0; }
    li { margin: 2.5pt 0; }
    table { width: 100%; margin: 8pt 0 13pt; border-collapse: collapse; font-size: 8.7pt; break-inside: auto; }
    tr { break-inside: avoid; }
    th { background: #166534; color: white; text-align: left; }
    th, td { padding: 6pt; border: 1px solid #DCE5DB; vertical-align: top; }
    tbody tr:nth-child(even) { background: #F5F7F2; }
    code { font-family: Consolas, monospace; color: #14532d; }
    pre { margin: 6pt 0 12pt; padding: 9pt; background: #F5F7F2; border: 1px solid #E4E8E2; border-radius: 7px; white-space: pre-wrap; break-inside: avoid; }
    strong { color: #132d1c; }
  </style></head><body>${output.join('\n')}</body></html>`
}

function tableCells(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
}

function inline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}
