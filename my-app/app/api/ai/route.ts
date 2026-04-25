import Anthropic from '@anthropic-ai/sdk'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const client = new Anthropic()

export async function POST(request: Request) {
  const user = await getOrCreateUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { question } = await request.json()

  const tasks = await prisma.task.findMany({ where: { userId: user.id } })
  const goals = await prisma.goal.findMany({ where: { userId: user.id } })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `Você é o assistente da Agenda Inteligente. Responda sempre em português do Brasil de forma concisa.
    Tarefas do usuário: ${JSON.stringify(tasks)}
    Metas do usuário: ${JSON.stringify(goals)}`,
    messages: [{ role: 'user', content: question }]
  })

  return Response.json({ answer: (response.content[0] as { text: string }).text })
}