import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { id } = await params

  const task = await prisma.task.update({
    where: { id, userId: user.id },
    data: body
  })

  return Response.json(task)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  await prisma.task.delete({
    where: { id, userId: user.id }
  })

  return Response.json({ ok: true })
}