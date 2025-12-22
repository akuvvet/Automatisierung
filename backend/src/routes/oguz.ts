import express, { Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

const router = express.Router();
const upload = multer();

// Ziel-Service: Python Telematik (oguz)
// Fallback auf localhost:5007, kann via ENV überschrieben werden
const OGUZ_TELEMATIK_BASE: string =
  process.env.OGUZ_TELEMATIK_BASE?.replace(/\/+$/, '') || 'http://127.0.0.1:5007';

function toErrorMessage(err: any): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as any;
    const detail =
      (data && (data.message || data.error)) ||
      err.message ||
      'Upstream-Fehler';
    return `Upstream ${status ?? ''} ${detail}`.trim();
  }
  return err?.message || 'Unbekannter Fehler';
}

// POST /oguz/telematik/process
// Erwartet multipart/form-data mit Feld "excel"
router.post(
  '/telematik/process',
  upload.single('excel'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ status: 'error', message: 'Excel-Datei fehlt (Feldname: excel).' });
        return;
      }

      const form = new FormData();
      form.append('excel', file.buffer, {
        filename: file.originalname || 'telematik.xlsx',
        contentType: file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        knownLength: file.size,
      });

      const upstream = await axios.post(`${OGUZ_TELEMATIK_BASE}/telematik/process`, form, {
        headers: form.getHeaders(),
        // großzügiges Timeout für XLSX-Verarbeitung
        timeout: 60_000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true, // Wir geben Fehler sauber nach vorne durch
      });

      res.status(upstream.status).json(upstream.data);
    } catch (err) {
      res.status(500).json({ status: 'error', message: toErrorMessage(err) });
    }
  }
);

// GET /oguz/results/:filename → Datei streamen
router.get('/results/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const upstream = await axios.get(`${OGUZ_TELEMATIK_BASE}/results/${encodeURIComponent(filename)}`, {
      responseType: 'stream',
      timeout: 60_000,
      validateStatus: () => true,
    });

    // Leite relevante Header weiter
    const contentType = upstream.headers['content-type'];
    const contentDisposition = upstream.headers['content-disposition'];
    if (contentType) res.setHeader('Content-Type', String(contentType));
    if (contentDisposition) res.setHeader('Content-Disposition', String(contentDisposition));

    res.status(upstream.status);
    upstream.data.pipe(res);
  } catch (err) {
    res.status(500).json({ status: 'error', message: toErrorMessage(err) });
  }
});

// GET /oguz/health → Health des Python-Services
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const upstream = await axios.get(`${OGUZ_TELEMATIK_BASE}/health`, {
      timeout: 10_000,
      validateStatus: () => true,
    });
    res.status(upstream.status).json(upstream.data);
  } catch (err) {
    res.status(500).json({ status: 'error', message: toErrorMessage(err) });
  }
});

export default router;


