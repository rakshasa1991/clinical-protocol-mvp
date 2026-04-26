import { NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export async function POST(req: Request) {
  try {
    const { format, data } = await req.json()

    if (!format || !data) {
      return NextResponse.json(
        { error: 'Format and data are required' },
        { status: 400 }
      )
    }

    const getSections = (protocolData: any) => {
      if (!protocolData) return []
      if (protocolData.sections && Array.isArray(protocolData.sections)) {
        return protocolData.sections
      }
      if (typeof protocolData === 'object') {
        return Object.entries(protocolData).map(([key, value]) => ({
          id: key,
          title: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          content: typeof value === 'string' ? value : JSON.stringify(value)
        }))
      }
      return []
    }

    if (format === 'markdown') {
      let markdown = '# Clinical Study Protocol Draft\n\n'
      
      const protocolSections = getSections(data.protocol)
      protocolSections.forEach((section: any) => {
        markdown += `## ${section.title}\n\n${section.content}\n\n`
      })

      if (data.sap_outline) {
        markdown += '# SAP Outline\n\n'
        getSections(data.sap_outline).forEach((section: any) => {
          markdown += `## ${section.title}\n\n${section.content}\n\n`
        })
      }

      if (data.icf_outline) {
        markdown += '# ICF Outline\n\n'
        getSections(data.icf_outline).forEach((section: any) => {
          markdown += `## ${section.title}\n\n${section.content}\n\n`
        })
      }

      if (data.warnings && data.warnings.length > 0) {
        markdown += '# Warnings\n\n'
        data.warnings.forEach((w: string) => { markdown += `- ${w}\n` })
      }

      if (data.gcp_suggestions && data.gcp_suggestions.length > 0) {
        markdown += '# GCP Suggestions\n\n'
        data.gcp_suggestions.forEach((s: string) => { markdown += `- ${s}\n` })
      }

      if (data.disclaimer) {
        markdown += `\n> ${data.disclaimer}\n`
      }

      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="protocol-draft.md"',
        },
      })
    }

    if (format === 'html') {
      let html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Clinical Study Protocol Draft</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}h1{color:#2c3e50}h2{color:#34495e;border-bottom:1px solid #ecf0f1;padding-bottom:10px}.warning{background:#fff3cd;padding:15px;border-radius:5px;margin:10px 0}.suggestion{background:#d1ecf1;padding:15px;border-radius:5px;margin:10px 0}.disclaimer{background:#f8f9fa;padding:15px;border-radius:5px;font-style:italic;margin-top:30px}</style>
</head>
<body><h1>Clinical Study Protocol Draft</h1>`

      getSections(data.protocol).forEach((section: any) => {
        html += `<h2>${section.title}</h2><p>${section.content}</p>`
      })

      if (data.sap_outline) {
        html += '<h1>SAP Outline</h1>'
        getSections(data.sap_outline).forEach((section: any) => {
          html += `<h2>${section.title}</h2><p>${section.content}</p>`
        })
      }

      if (data.icf_outline) {
        html += '<h1>ICF Outline</h1>'
        getSections(data.icf_outline).forEach((section: any) => {
          html += `<h2>${section.title}</h2><p>${section.content}</p>`
        })
      }

      if (data.warnings && data.warnings.length > 0) {
        html += '<div class="warning"><h2>Warnings</h2><ul>'
        data.warnings.forEach((w: string) => { html += `<li>${w}</li>` })
        html += '</ul></div>'
      }

      if (data.gcp_suggestions && data.gcp_suggestions.length > 0) {
        html += '<div class="suggestion"><h2>GCP Suggestions</h2><ul>'
        data.gcp_suggestions.forEach((s: string) => { html += `<li>${s}</li>` })
        html += '</ul></div>'
      }

      if (data.disclaimer) {
        html += `<div class="disclaimer"><p>${data.disclaimer}</p></div>`
      }

      html += '</body></html>'

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': 'attachment; filename="protocol-draft.html"',
        },
      })
    }

    if (format === 'docx') {
      const children: any[] = []

      children.push(new Paragraph({ text: 'Clinical Study Protocol Draft', heading: HeadingLevel.TITLE }))

      getSections(data.protocol).forEach((section: any) => {
        children.push(
          new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun(section.content)] })
        )
      })

      if (data.sap_outline) {
        children.push(new Paragraph({ text: 'SAP Outline', heading: HeadingLevel.TITLE }))
        getSections(data.sap_outline).forEach((section: any) => {
          children.push(
            new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ children: [new TextRun(section.content)] })
          )
        })
      }

      if (data.icf_outline) {
        children.push(new Paragraph({ text: 'ICF Outline', heading: HeadingLevel.TITLE }))
        getSections(data.icf_outline).forEach((section: any) => {
          children.push(
            new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ children: [new TextRun(section.content)] })
          )
        })
      }

      if (data.warnings && data.warnings.length > 0) {
        children.push(new Paragraph({ text: 'Warnings', heading: HeadingLevel.TITLE }))
        data.warnings.forEach((w: string) => {
          children.push(new Paragraph({ children: [new TextRun(`• ${w}`)] }))
        })
      }

      if (data.gcp_suggestions && data.gcp_suggestions.length > 0) {
        children.push(new Paragraph({ text: 'GCP Suggestions', heading: HeadingLevel.TITLE }))
        data.gcp_suggestions.forEach((s: string) => {
          children.push(new Paragraph({ children: [new TextRun(`• ${s}`)] }))
        })
      }

      if (data.disclaimer) {
        children.push(
          new Paragraph({ text: 'Disclaimer', heading: HeadingLevel.TITLE }),
          new Paragraph({ children: [new TextRun({ text: data.disclaimer, italics: true })] })
        )
      }

      const doc = new Document({ sections: [{ properties: {}, children }] })
      const buffer = await Packer.toBuffer(doc)

      return new NextResponse(Buffer.from(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="protocol-draft.docx"',
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
