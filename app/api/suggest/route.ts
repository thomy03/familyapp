import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { title } = await request.json()
    
    if (!title || title.length < 2) {
      return NextResponse.json({ error: 'Title too short' }, { status: 400 })
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant qui analyse des tâches ménagères/familiales.
Pour chaque tâche, tu dois estimer:
1. La difficulté: easy, normal, hard, epic
2. La durée en minutes: 5, 15, 30, 60, 120

Réponds UNIQUEMENT en JSON valide, sans markdown, sans explication:
{"difficulty": "...", "duration": "...", "tip": "..."}`
          },
          {
            role: 'user',
            content: `Analyse cette tâche: ${title}`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    })

    if (!response.ok) {
      console.error('Grok API error:', response.status)
      return NextResponse.json({ 
        difficulty: 'normal', 
        duration: '15',
        tip: null 
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    try {
      // Parse JSON response
      const parsed = JSON.parse(content.trim())
      return NextResponse.json({
        difficulty: parsed.difficulty || 'normal',
        duration: String(parsed.duration) || '15',
        tip: parsed.tip || null,
      })
    } catch {
      // Fallback if JSON parsing fails
      return NextResponse.json({ 
        difficulty: 'normal', 
        duration: '15',
        tip: null 
      })
    }
  } catch (error) {
    console.error('Suggest API error:', error)
    return NextResponse.json({ 
      difficulty: 'normal', 
      duration: '15',
      tip: null 
    })
  }
}
