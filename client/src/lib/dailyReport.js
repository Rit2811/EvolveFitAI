export function buildDailyReport(checkIn) {
  if (!checkIn) return null
  const score = Number(checkIn.readiness_score)
  const positives = []
  const improvements = []

  if (Number(checkIn.sleep_hours) >= 7 && Number(checkIn.sleep_quality) >= 3) positives.push('Your sleep duration and quality support useful recovery today.')
  if (Number(checkIn.energy) >= 4) positives.push('Your energy is strong enough for the planned session without adding extra intensity.')
  if (Number(checkIn.soreness) <= 2) positives.push('Low soreness suggests you are tolerating the recent training load well.')
  if (Number(checkIn.stress) <= 2) positives.push('Lower stress is a positive sign for focus and consistency.')
  if (Number(checkIn.diet_adherence) >= 4) positives.push('Your meal-plan consistency is supporting the routine you selected.')
  if (checkIn.workout_completed) positives.push('You completed the planned workout and kept the week moving forward.')

  if (Number(checkIn.sleep_hours) < 7) improvements.push(`Aim for a more consistent sleep window; ${checkIn.sleep_hours} hours may limit recovery.`)
  if (Number(checkIn.sleep_quality) <= 2) improvements.push('Keep the evening routine simple and consistent to support better sleep quality.')
  if (Number(checkIn.energy) <= 2) improvements.push('Use the easier end of the planned intensity and prioritize clean technique over volume.')
  if (Number(checkIn.soreness) >= 4) improvements.push('Keep today low impact and avoid adding sets beyond the planned session.')
  if (Number(checkIn.stress) >= 4) improvements.push('Protect a short recovery break today and keep training expectations realistic.')
  if (Number(checkIn.diet_adherence) <= 2) improvements.push('Prepare one simple planned meal in advance rather than trying to perfect the full day.')
  if (Number(checkIn.hunger) >= 4) improvements.push('Use regular balanced meals from the plan instead of allowing long gaps between meals.')
  if (!checkIn.workout_completed) improvements.push('Resume with the next planned session; do not double the workload to make up for one missed day.')

  if (!positives.length) positives.push('Completing the check-in is useful progress because it makes real patterns visible over time.')
  if (!improvements.length) improvements.push('Keep the same routine today and avoid unnecessary changes while recovery is steady.')

  const level = score >= 80 ? 'Strong readiness' : score >= 60 ? 'Steady readiness' : score >= 40 ? 'Recovery needs attention' : 'Recovery-first day'
  const summary = score >= 80
    ? 'Your signals support following the planned session with normal effort and controlled technique.'
    : score >= 60
      ? 'Most signals are manageable. Follow the plan as written and stay toward the comfortable end of the intensity range.'
      : 'Today is better used for consistency than intensity. Stay conservative and give recovery signals priority.'

  return {
    title: level,
    score,
    summary,
    positives: positives.slice(0, 3),
    improvements: improvements.slice(0, 4),
    focus: score >= 80 ? 'Execute the plan well; more is not automatically better.' : score >= 60 ? 'Keep effort controlled and maintain the routine.' : 'Reduce pressure, choose the conservative option, and reassess at the next check-in.',
    createdAt: checkIn.created_at || new Date().toISOString(),
  }
}

export function downloadDailyReportPdf(report, checkIn, fullName = 'EvolveFit profile') {
  if (!report) return
  const lines = [
    ['EvolveFit AI - Daily Wellness Report', 18],
    [`Prepared for ${fullName}`, 10],
    [formatDate(report.createdAt), 10],
    ['', 10],
    [`Readiness: ${report.score}/100 - ${report.title}`, 13],
    [report.summary, 10],
    ['', 10],
    ['What is going well', 12],
    ...report.positives.map((item) => [`- ${item}`, 10]),
    ['', 10],
    ['What to improve', 12],
    ...report.improvements.map((item) => [`- ${item}`, 10]),
    ['', 10],
    ["Today's focus", 12],
    [report.focus, 10],
    ['', 10],
    ['Check-in snapshot', 12],
    [`Energy ${checkIn.energy}/5 | Sleep ${checkIn.sleep_hours} h | Sleep quality ${checkIn.sleep_quality}/5`, 10],
    [`Soreness ${checkIn.soreness}/5 | Stress ${checkIn.stress}/5 | Diet adherence ${checkIn.diet_adherence}/5`, 10],
    ['', 10],
    ['General wellness guidance only. This report is not medical advice.', 9],
  ]
  const blob = createDailyReportPdfBlob(lines)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `evolvefit-daily-report-${new Date(report.createdAt).toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function createDailyReportPdfBlob(entries) {
  const commands = []
  let y = 790
  for (const [text, size] of entries) {
    if (!text) { y -= 9; continue }
    for (const line of wrap(ascii(text), size >= 12 ? 70 : 92)) {
      commands.push(`BT /F1 ${size} Tf 50 ${y} Td (${pdfEscape(line)}) Tj ET`)
      y -= size + 5
    }
    y -= size >= 12 ? 3 : 0
  }
  const stream = commands.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

function wrap(text, limit) {
  const words = text.split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    if (`${current} ${word}`.trim().length > limit && current) { lines.push(current); current = word } else current = `${current} ${word}`.trim()
  }
  if (current) lines.push(current)
  return lines
}
function pdfEscape(value) { return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)') }
function ascii(value) { return String(value).normalize('NFKD').replace(/[^\x20-\x7E]/g, '') }
function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value)) }
