import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get user with their family
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        family: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                points: true,
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (!user.family) {
      return NextResponse.json({ family: null })
    }

    return NextResponse.json({ family: user.family })
  } catch (error) {
    console.error('Get family error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
