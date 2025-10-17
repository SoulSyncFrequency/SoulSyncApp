import fs from 'fs-extra'
import path from 'path'
import PDFDocument from 'pdfkit'
import { TherapyPlan } from './therapy.js'
import { annotatePrimaryMoleculeSection } from './pdfAnnotation.primary'

export async function generateTherapyPDF(plan: TherapyPlan, input: { disease?: string, symptoms?: string[], language?: 'en'|'hr' }) {
  const reportsDir = path.join(process.cwd(), 'reports')
  await fs.ensureDir(reportsDir)
  const filename = `therapy_${Date.now()}.pdf`
  const filepath = path.join(reportsDir, filename)

  const doc = new PDFDocument({ margin: 50 })
  const stream = fs.createWriteStream(filepath)
  doc.pipe(stream)

  // Primary molecule section
  annotatePrimaryMoleculeSection(plan as any, doc)

  // Header
  doc.fontSize(18).text('SoulSync — Therapy Report', { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(10).fillColor('#666').text(new Date().toISOString(), { align: 'center' })
  doc.moveDown(1)
  doc.fillColor('#000')

  // Input
  doc.fontSize(14).text('Input')
  doc.fontSize(11).text(`Disease: ${input.disease || 'N/A'}`)
  if (input.symptoms?.length) doc.text(`Symptoms: ${input.symptoms.join(', ')}`)
  doc.moveDown(0.5)

  // Summary
  doc.fontSize(14).text('Summary')
  doc.fontSize(11).text(`Predicted modules: ${plan.modules.join(' | ')}`)
  doc.text(`Supplements: ${plan.supplements.join(' | ')}`)
  doc.text(`SMILES: ${plan.smiles}`)
  doc.text(`F₀ Score: ${plan.f0_score}`)
  doc.moveDown(0.5)

  // 5-day plan
  doc.fontSize(14).text('5-Day Nutrition & Lifestyle Plan')
  doc.moveDown(0.3)
  plan.plan5day.forEach(day => {
    doc.fontSize(12).text(`${day.day} — Chakra: ${day.chakra}`)
    doc.fontSize(11).list(day.meals, { bulletRadius: 2 })
    doc.moveDown(0.2)
  })

  doc.end()

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve())
    stream.on('error', reject)
  })

  return { filename, filepath, urlPath: `/reports/${filename}` }
}
