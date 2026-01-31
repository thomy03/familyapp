import { NextResponse } from 'next/server'

type CoachContext = {
  action: 'task_completed' | 'task_late' | 'motivation' | 'competition' | 'chat'
  userName: string
  taskTitle?: string
  taskPoints?: number
  userPoints?: number
  streak?: number
  message?: string // For chat
  familyRanking?: { name: string; points: number }[]
}

export async function POST(request: Request) {
  try {
    const ctx: CoachContext = await request.json()
    
    let systemPrompt = `Tu es un coach IA bienveillant pour une app familiale de gestion de tâches.
Tu t'adresses à ${ctx.userName}.
Ton style: encourageant, fun, parfois taquin mais jamais méchant.
Utilise des emojis.
Sois concis (2-3 phrases max).
Tutoie toujours.`

    let userPrompt = ''

    switch (ctx.action) {
      case 'task_completed':
        userPrompt = `${ctx.userName} vient de terminer la tâche ${ctx.taskTitle} et gagne ${ctx.taskPoints} points!
Son total: ${ctx.userPoints} points. Streak: ${ctx.streak} jours.
Félicite-le de façon personnalisée et motive-le pour la suite. Mentionne son streak si > 1.`
        break
        
      case 'task_late':
        userPrompt = `${ctx.userName} a une tâche en retard: ${ctx.taskTitle}.
Encourage-le sans culpabiliser. Propose une approche pour s'y mettre maintenant.
Sois compréhensif mais motivant.`
        break
        
      case 'motivation':
        userPrompt = `${ctx.userName} a besoin de motivation.
Points: ${ctx.userPoints}, Streak: ${ctx.streak}.
Donne un message d'encouragement personnalisé. Rappelle ses accomplissements.`
        break
        
      case 'competition':
        const ranking = ctx.familyRanking || []
        const rankStr = ranking.map((r, i) => `${i+1}. ${r.name}: ${r.points}pts`).join(', ')
        userPrompt = `Classement famille: ${rankStr}.
${ctx.userName} veut savoir où il en est.
Commente le classement de façon fun et motivante. Un peu de compétition saine!`
        break
        
      case 'chat':
        userPrompt = ctx.message || 'Dis quelque chose de motivant.'
        break
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ 
        message: 'Bravo! Continue comme ça! 🎉' 
      })
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message?.content || 'Super travail! 💪'
    
    return NextResponse.json({ message })
  } catch (error) {
    console.error('Coach API error:', error)
    return NextResponse.json({ 
      message: 'Tu gères! Continue! 🚀' 
    })
  }
}
