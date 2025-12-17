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
  path: z.string().max(2048).optional().nullable(),
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

  const { email, password, path } = parsed.data;

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
  const requestedPath = normalizePath(path ?? undefined);

  // Admin darf Pfad überschreiben; andere nur ihren eigenen bzw. Tenant-Redirect
  const redirectPath =
    (user.role === 'admin' && requestedPath) ? requestedPath :
    (requestedPath && pathFromUser && requestedPath.startsWith(pathFromUser) ? requestedPath : (pathFromUser ?? pathFromTenant ?? '/'));

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

// Tenants-Liste für Admins
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization || '';
    const [, token] = auth.split(' ');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret) as any;
    const userId = payload?.sub ? Number(payload.sub) : undefined;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const tenants = await prisma.tenant.findMany({
      select: { id: true, slug: true, name: true, redirectPath: true },
      orderBy: { name: 'asc' },
    });
    return res.json({ tenants });
  } catch (e) {
    return res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;


