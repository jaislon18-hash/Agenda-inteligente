import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'

export async function GET() {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const users = await prisma.user.findMany({
    include: {
      tasks: true,
    },
    orderBy: { createdAt: 'asc' }
  })

  return Response.json(users)
}