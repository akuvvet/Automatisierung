import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const router = Router()

function extractFromAuthHeader(req: Request): { userId?: number; tenantId?: number } {
  try {
    const auth = req.headers.authorization || ''
    const [, token] = auth.split(' ')
    if (!token) return {}
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const payload = jwt.verify(token, secret) as any
    const userId = payload?.sub ? Number(payload.sub) : undefined
    const tenantId = payload?.tenantId ? Number(payload.tenantId) : undefined
    return { userId, tenantId }
  } catch {
    return {}
  }
}

// Menü-Aufruf protokollieren
// Body: { menu: string } – userId/tenantId werden bevorzugt aus JWT gelesen
router.post('/', async (req: Request, res: Response) => {
  const { menu, userId: bodyUserId, tenantId: bodyTenantId } = req.body as {
    menu?: string
    userId?: number
    tenantId?: number
  }
  if (!menu || typeof menu !== 'string') {
    return res.status(400).json({ error: 'Feld "menu" ist erforderlich.' })
  }

  const fromToken = extractFromAuthHeader(req)
  const userId = fromToken.userId ?? (typeof bodyUserId === 'number' ? bodyUserId : undefined)
  const tenantId = fromToken.tenantId ?? (typeof bodyTenantId === 'number' ? bodyTenantId : undefined)
  if (!userId || !tenantId) {
    return res.status(400).json({ error: 'userId/tenantId konnten nicht ermittelt werden.' })
  }

  const log = await prisma.usageLog.create({
    data: { userId, tenantId, menu },
  })
  return res.json({ ok: true, id: log.id, createdAt: log.createdAt })
})

export default router


