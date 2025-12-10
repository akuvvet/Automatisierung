import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Debug-Ping, um sicherzustellen, dass der Auth-Router geladen ist
router.get('/_ping', (_req: Request, res: Response) => {
  res.json({ ok: true, route: '/auth/_ping' });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { email },
    include: { tenant: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
  }

  const ok = await bcrypt.compare(password, user.passwort);
  if (!ok) {
    return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch' });
  }

  const secret = process.env.JWT_SECRET || 'dev-secret';
  const token = jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      tenantId: user.tenantId,
    },
    secret,
    { expiresIn: '1d' }
  );

  function normalizePath(input?: string | null): string | undefined {
    if (!input) return undefined;
    let s = String(input).trim();
    if (!s) return undefined;
    // Backslashes zu Slashes
    s = s.replace(/\\/g, '/');
    // Mehrfache Slashes reduzieren
    s = s.replace(/\/+/g, '/');
    // Führenden Slash sicherstellen
    if (!s.startsWith('/')) s = `/${s}`;
    return s;
  }

  const pathFromUser = normalizePath(user.verzeichnisbaumLogPfad);
  const pathFromTenant = normalizePath(user.tenant?.redirectPath);
  const redirectPath = pathFromUser ?? pathFromTenant ?? '/';

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      tenant: user.tenant ? { id: user.tenant.id, slug: user.tenant.slug, redirectPath: user.tenant.redirectPath } : null,
    },
    redirectPath,
  });
});

export default router;


