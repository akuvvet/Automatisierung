import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Vorgaben aus dem Auftrag
  const username = 'adam';
  const email = 'test@test.de';
  const plainPassword = 'test2025';
  const role = 'admin';
  const verzeichnisbaumLogPfad = '/';

  // Sicherstellen, dass ein Default-Tenant existiert
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    create: {
      slug: 'default',
      name: 'Default',
      redirectPath: '/',
    },
    update: {},
  });

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // Benutzer anlegen oder aktualisieren (über E-Mail als eindeutiges Kriterium)
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
  });

  // eslint-disable-next-line no-console
  console.log('Benutzer angelegt/aktualisiert:', {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    tenant: user.tenant.slug,
    verzeichnisbaumLogPfad: user.verzeichnisbaumLogPfad,
  });
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


