import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'

export async function GET() {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  return Response.json(tasks)
}

export async function POST(request: Request) {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      priority: body.priority ?? 'mid',
      label: body.label,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      userId: user.id,
      goalId: body.goalId ?? null,
    }
  })

  return Response.json(task)
}