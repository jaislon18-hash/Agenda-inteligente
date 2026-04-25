import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const task = await prisma.task.update({
    where: { id: params.id, userId: user.id },
    data: body
  })

  return Response.json(task)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.task.delete({
    where: { id: params.id, userId: user.id }
  })

  return Response.json({ ok: true })
}