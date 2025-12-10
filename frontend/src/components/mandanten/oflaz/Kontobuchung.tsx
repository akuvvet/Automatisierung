import { useState } from 'react'

export default function Kontobuchung() {
  const [excelMieter, setExcelMieter] = useState<File | null>(null)
  const [excelKonto, setExcelKonto] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr', maxWidth: 560 }}>
        <div>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Mieter Excel (.xlsx) auswählen</div>
          <input type="file" accept=".xlsx" onChange={(e) => setExcelMieter(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Kontoauszug Excel (.xlsx) auswählen</div>
          <input type="file" accept=".xlsx" onChange={(e) => setExcelKonto(e.target.files?.[0] ?? null)} />
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


