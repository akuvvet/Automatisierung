import { type FormEvent, useRef, useState } from 'react'

const SERVICE_URL = '/klees/upload'

export default function XlsxToPdf() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>('Keine Datei ausgewählt')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const f = e.target.files && e.target.files[0]
    setSelectedFileName(f ? f.name : 'Keine Datei ausgewählt')
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    if (!fileInputRef.current || !fileInputRef.current.files || !fileInputRef.current.files[0]) {
      setError('Bitte eine Excel-Datei auswählen.')
      return
    }
    const file = fileInputRef.current.files[0]
    const formData = new FormData()
    formData.append('file', file)
    setLoading(true)
    try {
      const res = await fetch(SERVICE_URL, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => 'Fehler beim Serveraufruf.')
        throw new Error(text || 'Fehler beim Serveraufruf.')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lagerbuch_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <h2 style={{ margin: 0, marginBottom: 8 }}>Excel hochladen → PDF erzeugen</h2>
      <p style={{ color: '#475569', marginTop: 0, marginBottom: 12 }}>Unterstützt .xlsx/.xls</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <label
          htmlFor="file"
          style={{ display: 'inline-block', padding: '10px 14px', borderRadius: 10, background: '#111827', color: 'white', cursor: 'pointer' }}
        >
          Datei wählen
        </label>
        <input id="file" name="file" type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} />
        <span style={{ color: '#64748b' }}>{selectedFileName}</span>
        <button type="submit" disabled={loading} style={{ padding: '10px 14px' }}>
          {loading ? 'Bitte warten…' : 'PDF erzeugen'}
        </button>
      </div>
      {error ? <div style={{ color: '#ef4444' }}>{error}</div> : null}
    </form>
  )
}

