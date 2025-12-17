import { useState } from 'react'

export default function Kontobuchung() {
  const [excelMieter, setExcelMieter] = useState<File | null>(null)
  const [excelKonto, setExcelKonto] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const mieterId = 'file-mieter'
  const kontoId = 'file-konto'

  async function onRun(): Promise<void> {
    if (!excelMieter || !excelKonto) {
      setMessage('Bitte Mieter-Excel und Kontoauszug-Excel auswählen.')
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const form = new FormData()
      form.append('excel', excelMieter)
      form.append('konto', excelKonto)
      const res = await fetch('/py/process', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      if (res.status === 302 || (res as unknown as { redirected?: boolean }).redirected) {
        setMessage('Bitte zuerst im Python-Backend anmelden. Weiterleitung…')
        window.location.href = '/py/login'
        return
      }
      const j = await res.json().catch(() => null)
      if (!res.ok || !j || j.status !== 'ok') {
        throw new Error(j?.message || 'Verarbeitung fehlgeschlagen')
      }
      const url = `/py${j.download}`
      window.open(url, '_blank', 'noopener,noreferrer')
      setMessage('Mietabgleich abgeschlossen. Download wird gestartet.')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
      setMessage(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="uploadGrid">
        <div className="uploadCard mieter">
          <div className="uploadCardTitle">Mieter Excel (.xlsx) auswählen</div>
          <div className="fileRow">
            <input
              id={mieterId}
              className="visuallyHidden"
              type="file"
              accept=".xlsx"
              onChange={(e) => setExcelMieter(e.target.files?.[0] ?? null)}
            />
            <label className="fileButton" htmlFor={mieterId}>Datei auswählen</label>
            <span className={`fileName${excelMieter ? ' selected' : ''}`}>{excelMieter ? excelMieter.name : 'Keine Datei ausgewählt'}</span>
          </div>
        </div>
        <div className="uploadCard konto">
          <div className="uploadCardTitle">Kontoauszug Excel (.xlsx) auswählen</div>
          <div className="fileRow">
            <input
              id={kontoId}
              className="visuallyHidden"
              type="file"
              accept=".xlsx"
              onChange={(e) => setExcelKonto(e.target.files?.[0] ?? null)}
            />
            <label className="fileButton" htmlFor={kontoId}>Datei auswählen</label>
            <span className={`fileName${excelKonto ? ' selected' : ''}`}>{excelKonto ? excelKonto.name : 'Keine Datei ausgewählt'}</span>
          </div>
        </div>
        <div>
          <button onClick={onRun} disabled={busy || !excelMieter || !excelKonto} style={{ padding: '10px 14px' }}>
            {busy ? 'Bitte warten…' : 'Mietabgleich starten'}
          </button>
        </div>
        {message && (
          <div
            style={{
              background: message.includes('Mietabgleich abgeschlossen') ? 'rgb(100, 100, 100)' : '#eef2ff',
              padding: 10,
              borderRadius: 8,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  )
}


