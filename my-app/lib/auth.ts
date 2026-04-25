import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export async function getOrCreateUser() {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  let user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  if (!user) {
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? `${userId}@placeholder.com`
    const name = clerkUser.firstName ?? 'Usuário'

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        name,
        email,
      }
    })
  }

  return user
}