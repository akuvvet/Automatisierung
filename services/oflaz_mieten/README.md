Oflaz Mieterabgleich Backend (Flask)

Dieses Backend verarbeitet:

- POST /process → Mieter.xlsx + Kontoauszug.xlsx verarbeiten (Mietabgleich)
- POST /telematik/process → Telematik-Helfer (optional)
- GET /results/<filename> → Download der erzeugten Dateien

Start (lokal)

1) Python-Umgebung erstellen und Abhängigkeiten installieren:

   ```bash
   cd services/oflaz_mieten
   python -m venv .venv
   .venv/Scripts/activate  # Windows PowerShell/CMD: .venv\\Scripts\\activate
   pip install -r requirements.txt
   ```

2) Server starten (Port 5000):

   ```bash
   python app.py
   ```

Das Frontend ist über Vite so konfiguriert, dass Anfragen auf `/py/...` an `http://localhost:5000` weitergeleitet werden.

Hinweise

- Die Mieter-Excel-Formatierung bleibt unverändert; es werden ausschließlich Zellenwerte in vorhandene Spalten geschrieben.
- Die Monatszuordnung erfolgt über Spaltenüberschriften: Betrag in `Jan/Feb/.../Dez`, Datum in `ZE-Jan/ZE-Feb/.../ZE-Dez`. Die Spaltenreihenfolge ist damit egal.
- Kontoauszug-Header: `Wertstellung`, `Kontoname`, `Betrag`. `Kategorie` ist optional und wird ignoriert, falls nicht vorhanden.


