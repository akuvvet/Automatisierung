import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import logsRouter from './routes/logs';
import oguzRouter from './routes/oguz';
import path from 'path';
import fs from 'fs';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT ? Number(process.env.PORT) : 3007;

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'automatik-backend' });
});

app.get('/users/count', async (_req: Request, res: Response) => {
  const count = await prisma.user.count();
  res.json({ count });
});

app.use('/auth', authRouter);
app.use('/logs', logsRouter);
app.use('/oguz', oguzRouter);

// Statisches Ausliefern der Frontend-Builds
const distDir = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  // SPA-Fallback: Liefere index.html für Client-Routen (z. B. /oguz)
  app.get('*', (req: Request, res: Response) => {
    const url = req.path;
    // API-Pfade ausnehmen
    if (
      url.startsWith('/auth') ||
      url.startsWith('/logs') ||
      url.startsWith('/oguz/telematik') ||
      url.startsWith('/oguz/results') ||
      url.startsWith('/oguz/health')
    ) {
      res.status(404).json({ ok: false, message: 'Not Found' });
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend läuft auf http://localhost:${port}`);
});


