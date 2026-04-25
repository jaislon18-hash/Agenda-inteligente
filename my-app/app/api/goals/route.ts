import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'

export async function GET() {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    include: { tasks: true },
    orderBy: { createdAt: 'desc' }
  })

  return Response.json(goals)
}

export async function POST(request: Request) {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const goal = await prisma.goal.create({
    data: {
      title: body.title,
      priority: body.priority ?? 'mid',
      deadline: body.deadline ? new Date(body.deadline) : null,
      userId: user.id,
    }
  })

  return Response.json(goal)
}