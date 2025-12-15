import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import logsRouter from './routes/logs';

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

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend läuft auf http://localhost:${port}`);
});


