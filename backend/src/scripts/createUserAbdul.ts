import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const username = 'abdul'
  const email = 'abdul@test.de'
  const plainPassword = 'abdul123'
  const role = 'mandant'
  const verzeichnisbaumLogPfad = 'oflaz'

  // Tenant für oflaz anlegen/holen
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'oflaz' },
    create: {
      slug: 'oflaz',
      name: 'Oflaz',
      redirectPath: '/oflaz',
    },
    update: {},
  })

  const passwordHash = await bcrypt.hash(plainPassword, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwort: passwordHash,
      role,
      verzeichnisbaumLogPfad,
      tenantId: tenant.id,
    },
    create: {
      username,
      email,
      passwort: passwordHash,
      role,
      verzeichnisbaumLogPfad,
      tenantId: tenant.id,
    },
    include: { tenant: true },
  })

  // eslint-disable-next-line no-console
  console.log('Benutzer abdul angelegt/aktualisiert:', {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    tenant: user.tenant.slug,
    verzeichnisbaumLogPfad: user.verzeichnisbaumLogPfad,
    redirectPath: user.tenant.redirectPath,
  })
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


