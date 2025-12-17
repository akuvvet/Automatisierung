import { useState } from 'react'

function formatDateYMD(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export default function Telematik() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [clipboardPreview, setClipboardPreview] = useState<string>('')
  const fileId = 'file-telematik'

  async function onProcess(): Promise<void> {
    if (!file) {
      setMessage('Bitte zuerst eine Excel-Datei auswählen (.xlsx).')
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const form = new FormData()
      form.append('excel', file)
      const res = await fetch('/py/telematik/process', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      if (res.status === 302 || (res as any).redirected) {
        // Sollte nicht mehr passieren (Auth entfernt), fallback
        window.location.href = '/py/login'
        return
      }
      const j = await res.json().catch(() => null)
      if (!res.ok || !j || j.status !== 'ok') {
        throw new Error(j?.message || 'Verarbeitung fehlgeschlagen')
      }
      // XLSX-Download öffnen
      if (!j.download || typeof j.download !== 'string') {
        throw new Error('Server lieferte keinen Download-Pfad.')
      }
      const downloadPath: string = j.download.startsWith('/') ? j.download : `/${j.download}`
      const url = `/py${downloadPath}`
      window.open(url, '_blank', 'noopener,noreferrer')
      // Zwischenablagevorschau aus Response setzen
      setClipboardPreview(j.clipboardPreview || '')
      setMessage(`Datei verarbeitet und heruntergeladen: ${url.split('/').pop()}`)
    } catch (err: any) {
      setMessage(err?.message ?? 'Unbekannter Fehler bei der Verarbeitung')
    } finally {
      setBusy(false)
    }
  }

  async function onCopyClipboard(): Promise<void> {
    try {
      if (!clipboardPreview) {
        setMessage('Keine passenden Daten zum Kopieren gefunden. Bitte zuerst verarbeiten.')
        return
      }
      await navigator.clipboard.writeText(clipboardPreview)
      setMessage('Zwischenablage gefüllt (Neukunden).')
    } catch {
      setMessage('Konnte nicht in die Zwischenablage schreiben.')
    }
  }

  return (
    <div>
      <div className="uploadGrid">
        <div className="uploadCard konto">
          <div className="uploadCardTitle">Telematik Excel (.xlsx) auswählen</div>
          <div className="fileRow">
            <input
              id={fileId}
              className="visuallyHidden"
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              aria-label="Excel-Datei auswählen"
            />
            <label className="fileButton" htmlFor={fileId}>Datei auswählen</label>
            <span className={`fileName${file ? ' selected' : ''}`}>{file ? file.name : 'Keine Datei ausgewählt'}</span>
          </div>
          <div style={{ marginTop: 12, color: '#64748b' }}>Vorschlag: {formatDateYMD()}.xlsx</div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={onProcess} disabled={busy || !file} style={{ padding: '10px 14px' }}>
              {busy ? 'Bitte warten…' : 'Verarbeiten & herunterladen'}
            </button>
            <button onClick={onCopyClipboard} disabled={busy} style={{ padding: '10px 14px' }}>
              In Zwischenablage kopieren
            </button>
          </div>
        </div>

        {message && (
          <div
            style={{
              background: message.includes('heruntergeladen') ? 'rgb(100, 100, 100)' : '#eef2ff',
              padding: 10,
              borderRadius: 8,
            }}
          >
            {message}
          </div>
        )}
      </div>

      <fieldset>
        <legend>Zwischenablage-Vorschau (A..K, Zeilen mit F=1/2)</legend>
        <textarea
          value={clipboardPreview}
          readOnly
          style={{
            width: '100%',
            minHeight: 200,
            fontFamily:
              'Courier New, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
            fontSize: 12,
            whiteSpace: 'pre',
            padding: 12,
            border: '1px solid #e2e8f0',
            borderRadius: 8,
          }}
        />
      </fieldset>
    </div>
  )
}


