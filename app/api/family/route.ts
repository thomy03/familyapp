import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Créer une famille
export async function POST(request: Request) {
  try {
    const { name, userId } = await request.json()
    
    if (!name || !userId) {
      return NextResponse.json({ error: 'Nom et userId requis' }, { status: 400 })
    }

    // Générer un code d'invitation lisible
    const inviteCode = name.toUpperCase().slice(0, 4) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()

    const family = await prisma.family.create({
      data: {
        name,
        inviteCode,
        members: {
          connect: { id: userId }
        }
      },
      include: { members: true }
    })

    // Set user as admin
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' }
    })

    return NextResponse.json({ family })
  } catch (error) {
    console.error('Create family error:', error)
    return NextResponse.json({ error: 'Erreur création famille' }, { status: 500 })
  }
}

// Rejoindre une famille
export async function PUT(request: Request) {
  try {
    const { inviteCode, userId } = await request.json()
    
    if (!inviteCode || !userId) {
      return NextResponse.json({ error: 'Code et userId requis' }, { status: 400 })
    }

    const family = await prisma.family.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: { members: true }
    })

    if (!family) {
      return NextResponse.json({ error: 'Code famille invalide' }, { status: 404 })
    }

    // Add user to family
    await prisma.user.update({
      where: { id: userId },
      data: { familyId: family.id }
    })

    return NextResponse.json({ family })
  } catch (error) {
    console.error('Join family error:', error)
    return NextResponse.json({ error: 'Erreur pour rejoindre' }, { status: 500 })
  }
}
