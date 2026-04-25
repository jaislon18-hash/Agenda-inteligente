import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'

export async function GET() {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const events = await prisma.event.findMany({
    where: { userId: user.id },
    orderBy: { date: 'asc' }
  })

  return Response.json(events)
}

export async function POST(request: Request) {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const event = await prisma.event.create({
    data: {
      title: body.title,
      date: new Date(body.date),
      color: body.color ?? '#7c6af7',
      userId: user.id,
    }
  })

  return Response.json(event)
}