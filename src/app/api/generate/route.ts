import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = 'Return ONLY valid JSON. Keep content concise - max 1 sentence per section.'

export async function POST(req: Request) {
  try {
    console.log('=== Generate API called ===')
    const {
      title,
      therapeuticArea,
      phase,
      objective,
    } = await req.json()

    console.log('Study:', title)

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const userPrompt = `Generate a clinical study protocol draft based on:

Study: ${title || 'Not specified'}
Therapeutic area: ${therapeuticArea || 'Not specified'}
Phase: ${phase || 'Not specified'}
Objective: ${objective || 'Not specified'}

Return JSON with keys: protocol, sap_outline, icf_outline, warnings, gcp_suggestions, disclaimer.

Protocol sections (1 sentence each): synopsis, background, objectives, study_design, study_population, eligibility_criteria, treatment_plan, efficacy_assessments, safety_assessments, statistical_considerations, ethics, monitoring_data_handling.

SAP sections: analysis_populations, endpoints, analysis_approach.

ICF sections: study_purpose, participation_overview, risks_and_benefits, voluntary_participation, participant_rights.

Warnings: array of potential issues. GCP suggestions: array of wording improvements.

IMPORTANT: Return ONLY raw JSON. No markdown. Compact content.`

    const response = await fetch(
      `${process.env.OPENAI_BASE_URL || 'https://aigateway.biocad.ru/api/v2'}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'InHouse/Qwen3.5-122B',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      }
    )

    console.log('AI Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI Error:', errorText)
      return NextResponse.json(
        { error: 'AI generation failed', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    console.log('AI Content length:', content?.length)

    if (!content) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      )
    }

    // Remove markdown code fences if present
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7)
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3)
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3)
    }
    cleanContent = cleanContent.trim()

    // Fix newlines in strings
    cleanContent = cleanContent.replace(/\n/g, ' ').replace(/\r/g, '')

    let parsedContent
    try {
      parsedContent = JSON.parse(cleanContent)
      console.log('Parsed AI Response successfully')
    } catch (parseError) {
      console.error('Parse Error:', parseError)
      console.error('Content preview:', cleanContent.substring(0, 300))
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: cleanContent.substring(0, 500) },
        { status: 500 }
      )
    }

    return NextResponse.json(parsedContent)
  } catch (error) {
    console.error('Error generating AI draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
