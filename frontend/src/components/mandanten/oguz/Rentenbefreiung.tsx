import { useCallback, useMemo, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

type ExportFormat = 'xlsx' | 'pdf'

function formatTodayDDMMYYYY(): string {
	const d = new Date()
	const dd = String(d.getDate()).padStart(2, '0')
	const mm = String(d.getMonth() + 1).padStart(2, '0')
	const yyyy = String(d.getFullYear())
	return `${dd}.${mm}.${yyyy}`
}

function parseDateDDMMYYYY(value: string, allowTodayDefault: boolean): string {
	const raw = (value || '').trim()
	if (!raw && allowTodayDefault) return formatTodayDDMMYYYY()
	const m = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
	if (!m) {
		throw new Error('Bitte Datum im Format TT.MM.JJJJ angeben (z. B. 25.11.2025).')
	}
	const dd = Number(m[1])
	const mm = Number(m[2])
	const yyyy = Number(m[3])
	const dt = new Date(yyyy, mm - 1, dd)
	// Plausibilitäts-Check
	if (
		dt.getFullYear() !== yyyy ||
		dt.getMonth() !== mm - 1 ||
		dt.getDate() !== dd
	) {
		throw new Error('Bitte Datum im Format TT.MM.JJJJ angeben (z. B. 25.11.2025).')
	}
	return `${String(dd).padStart(2, '0')}.${String(mm).padStart(2, '0')}.${String(yyyy)}`
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
	return await file.arrayBuffer()
}

async function fileToDataUrl(file: File): Promise<string> {
	return await new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onerror = () => reject(reader.error)
		reader.onload = () => resolve(String(reader.result))
		reader.readAsDataURL(file)
	})
}

async function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
	return await new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
		img.onerror = (e) => reject(e)
		img.src = dataUrl
	})
}

export default function Rentenbefreiung() {
	const [familienname, setFamilienname] = useState<string>('')
	const [vorname, setVorname] = useState<string>('')
	const [rvnr, setRvnr] = useState<string>('')
	const [ort, setOrt] = useState<string>('Solingen')
	const [aktuellesDatum, setAktuellesDatum] = useState<string>(formatTodayDDMMYYYY())
	const [beginnBefreiung, setBeginnBefreiung] = useState<string>('')

	const [templateFile, setTemplateFile] = useState<File | null>(null)
	const [signatureFile, setSignatureFile] = useState<File | null>(null)
	const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx')
	const [isBusy, setIsBusy] = useState<boolean>(false)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)

	const pdfRef = useRef<HTMLDivElement | null>(null)

	const filenameBase = useMemo(() => {
		const fn = (familienname || '').trim()
		const vn = (vorname || '').trim()
		return `Rentenbefreiung_${fn || 'Familienname'}_${vn || 'Vorname'}`
	}, [familienname, vorname])

	const handleSelectTemplate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null
		setTemplateFile(f)
	}, [])

	const handleSelectSignature = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null
		setSignatureFile(f)
	}, [])

	async function buildWorkbookWithData(): Promise<ExcelJS.Workbook> {
		const familiennameClean = (familienname || '').trim()
		const vornameClean = (vorname || '').trim()
		const rvnrClean = (rvnr || '').trim()
		if (!familiennameClean) throw new Error('Familienname darf nicht leer sein.')
		if (!vornameClean) throw new Error('Vorname darf nicht leer sein.')
		if (!rvnrClean) throw new Error('Rentenversicherungsnr darf nicht leer sein.')
		const ortClean = (ort || '').trim() || 'Solingen'

		const aktuellesDatumNorm = parseDateDDMMYYYY(aktuellesDatum, true)
		const beginnBefreiungNorm = parseDateDDMMYYYY(beginnBefreiung, false)

		const workbook = new ExcelJS.Workbook()
		if (templateFile) {
			const ab = await fileToArrayBuffer(templateFile)
			await workbook.xlsx.load(ab)
		} else {
			// Fallback: leeres Arbeitsblatt
			workbook.addWorksheet('Tabelle1')
		}
		const ws = workbook.worksheets[0]

		// Seitenränder: 1,5 cm → inch
		const marginIn = 1.5 / 2.54
		ws.pageSetup.margins = {
			left: marginIn,
			right: marginIn,
			top: marginIn,
			bottom: marginIn,
			header: 0.3,
			footer: 0.3,
		}
		// Auf eine Seite skalieren
		ws.pageSetup.fitToPage = true
		ws.pageSetup.fitToWidth = 1
		ws.pageSetup.fitToHeight = 1
		ws.pageSetup.orientation = 'portrait'

		// Einträge
		ws.getCell('C10').value = familiennameClean
		ws.getCell('C10').font = { bold: true }
		ws.getCell('C12').value = vornameClean
		ws.getCell('C12').font = { bold: true }
		ws.getCell('C14').value = rvnrClean
		ws.getCell('C14').font = { bold: true }

		const ortKommaDatum = `${ortClean}, ${aktuellesDatumNorm}`
		ws.getCell('B26').value = ortKommaDatum
		ws.getCell('B26').font = { bold: true }
		ws.getCell('B40').value = ortKommaDatum
		ws.getCell('B40').font = { bold: true }

		ws.getCell('E36').value = aktuellesDatumNorm
		ws.getCell('E36').font = { bold: true }
		ws.getCell('D38').value = beginnBefreiungNorm
		ws.getCell('D38').font = { bold: true }

		// Unterschrift optional bei D25
		if (signatureFile) {
			const dataUrl = await fileToDataUrl(signatureFile)
			const { width: naturalW, height: naturalH } = await getImageSize(dataUrl)

			// Ziel max 5 cm x 2 cm bei 96 DPI
			const maxWpx = Math.round((5 / 2.54) * 96)
			const maxHpx = Math.round((2 / 2.54) * 96)
			let targetW = naturalW
			let targetH = naturalH
			if (naturalW > 0 && naturalH > 0) {
				const scale = Math.min(maxWpx / naturalW, maxHpx / naturalH, 1)
				targetW = Math.round(naturalW * scale)
				targetH = Math.round(naturalH * scale)
			} else {
				targetW = maxWpx
				targetH = maxHpx
			}

			const imageId = workbook.addImage({
				base64: dataUrl.split(',')[1] ? dataUrl : dataUrl, // ExcelJS akzeptiert auch dataUrl
				extension: (signatureFile.type.includes('png') ? 'png' : 'jpeg') as 'png' | 'jpeg',
			})
			// D25 → 0-basierte Position: col=3, row=24
			ws.addImage(imageId, {
				tl: { col: 3, row: 24 },
				ext: { width: targetW, height: targetH },
				editAs: 'oneCell',
			})
		}

		return workbook
	}

	async function exportAsXlsx(): Promise<void> {
		const workbook = await buildWorkbookWithData()
		const buffer = await workbook.xlsx.writeBuffer()
		const filename = `${filenameBase}.xlsx`
		saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
	}

	async function exportAsPdf(): Promise<void> {
		// PDF aus HTML-Ansicht rendern (nicht aus XLSX), auf A4 mit 1,5 cm Rändern
		const root = pdfRef.current
		if (!root) return
		// Temporär sichtbar machen für korrektes Layout, falls versteckt
		const prev = root.style.display
		root.style.display = ''
		const canvas = await html2canvas(root, { scale: 2, useCORS: true })
		root.style.display = prev

		const imgData = canvas.toDataURL('image/png')
		const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
		const pageWidth = doc.internal.pageSize.getWidth()
		const pageHeight = doc.internal.pageSize.getHeight()
		const margin = 15 // 1,5 cm
		const availW = pageWidth - margin * 2
		const availH = pageHeight - margin * 2
		const imgWpx = canvas.width
		const imgHpx = canvas.height
		const imgRatio = imgWpx / imgHpx
		let drawW = availW
		let drawH = drawW / imgRatio
		if (drawH > availH) {
			drawH = availH
			drawW = drawH * imgRatio
		}
		const x = margin + (availW - drawW) / 2
		const y = margin + (availH - drawH) / 2
		doc.addImage(imgData, 'PNG', x, y, drawW, drawH, undefined, 'FAST')
		doc.save(`${filenameBase}.pdf`)
	}

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault()
		setErrorMsg(null)
		setIsBusy(true)
		try {
			if (exportFormat === 'xlsx') {
				await exportAsXlsx()
			} else {
				await exportAsPdf()
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
			setErrorMsg(msg)
		} finally {
			setIsBusy(false)
		}
	}, [exportFormat, familienname, vorname, rvnr, ort, aktuellesDatum, beginnBefreiung, templateFile, signatureFile])

	return (
		<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
			<form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
				<div style={{ gridColumn: '1 / span 2', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
					Formular ausfüllen
				</div>
				<label style={{ display: 'grid', gap: 4 }}>
					<span>Familienname *</span>
					<input value={familienname} onChange={(e) => setFamilienname(e.target.value)} required />
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span>Vorname *</span>
					<input value={vorname} onChange={(e) => setVorname(e.target.value)} required />
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span>Rentenversicherungsnr *</span>
					<input value={rvnr} onChange={(e) => setRvnr(e.target.value)} required />
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span>Ort</span>
					<input value={ort} onChange={(e) => setOrt(e.target.value)} placeholder="Solingen" />
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span>Aktuelles Datum (TT.MM.JJJJ, leer = heute)</span>
					<input value={aktuellesDatum} onChange={(e) => setAktuellesDatum(e.target.value)} placeholder={formatTodayDDMMYYYY()} />
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span>Beginn der Befreiung (TT.MM.JJJJ) *</span>
					<input value={beginnBefreiung} onChange={(e) => setBeginnBefreiung(e.target.value)} required />
				</label>

				<div style={{ gridColumn: '1 / span 2', height: 8 }} />

				<label style={{ display: 'grid', gap: 4 }}>
					<span>Excel-Vorlage (optional, .xlsx)</span>
					<input type="file" accept=".xlsx" onChange={handleSelectTemplate} />
				</label>
				<label style={{ display: 'grid', gap: 4 }}>
					<span>Unterschrift (optional, PNG/JPG)</span>
					<input type="file" accept="image/png,image/jpeg" onChange={handleSelectSignature} />
				</label>

				<label style={{ display: 'grid', gap: 4 }}>
					<span>Exportformat</span>
					<select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)}>
						<option value="xlsx">Excel (XLSX)</option>
						<option value="pdf">PDF</option>
					</select>
				</label>

				<div />

				<div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 8 }}>
					<button
						type="submit"
						disabled={isBusy}
						style={{
							padding: '10px 12px',
							borderRadius: 8,
							background: '#0ea5e9',
							color: 'white',
							border: 'none',
							cursor: 'pointer',
						}}
					>
						{isBusy ? 'Bitte warten…' : exportFormat === 'xlsx' ? 'Als XLSX speichern' : 'Als PDF speichern'}
					</button>
				</div>
				{errorMsg && (
					<div style={{ gridColumn: '1 / span 2', color: '#b91c1c' }}>
						{errorMsg}
					</div>
				)}
			</form>

			{/* PDF-Voransicht (für HTML-zu-PDF Render) */}
			<div
				ref={pdfRef}
				style={{
					background: 'white',
					color: '#111827',
					padding: '1.5cm',
					width: '210mm',
					minHeight: '297mm',
					boxSizing: 'border-box',
					border: '1px solid #e5e7eb',
				}}
			>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
					<h2 style={{ margin: 0 }}>Rentenbefreiung</h2>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
						<div><strong>Familienname:</strong> {familienname || '—'}</div>
						<div><strong>Vorname:</strong> {vorname || '—'}</div>
						<div><strong>Rentenversicherungsnr:</strong> {rvnr || '—'}</div>
						<div><strong>Ort, Datum:</strong> {(ort || 'Solingen') + ', ' + (aktuellesDatum || formatTodayDDMMYYYY())}</div>
						<div><strong>Beginn der Befreiung:</strong> {beginnBefreiung || '—'}</div>
					</div>
					<div style={{ marginTop: 24 }}>
						<div style={{ marginBottom: 6, fontWeight: 600 }}>Unterschrift</div>
						{signatureFile ? (
							<img
								alt="Unterschrift"
								src={URL.createObjectURL(signatureFile)}
								style={{
									maxWidth: '5cm',
									maxHeight: '2cm',
									objectFit: 'contain',
								}}
							/>
						) : (
							<div style={{ color: '#6b7280' }}>— keine Unterschrift —</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}


