Klees XLSX → PDF Service

Voraussetzungen
- Python 3.10+

Installation
1) In dieses Verzeichnis wechseln:

   ```bash
   cd services/klees_xlsx_to_pdf
   ```

2) (Optional) Virtuelle Umgebung erstellen/aktivieren:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows PowerShell/CMD
   # oder: source .venv/bin/activate  # macOS/Linux
   ```

3) Abhängigkeiten installieren:

   ```bash
   pip install -r requirements.txt
   ```

Start

```bash
python app.py
```

Der Service lauscht standardmäßig auf `http://localhost:5001`. Die React-UI im Mandanten „Klees“ (Menü „XLSX_to_PDF“) lädt Dateien zum Endpoint `POST /upload` hoch und erhält ein PDF als Download.

Hinweis
- Falls die Vite-Dev-URL abweicht (z. B. anderer Port), die CORS-Origins in `app.py` anpassen.


