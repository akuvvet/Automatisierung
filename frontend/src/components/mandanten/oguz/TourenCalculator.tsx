import { useState } from 'react'

type WageType = 'Teilzeit' | 'Aushilfe'
type TourType = 'AL' | 'LL'
type KmPeriod = 'Tag' | 'Monat'

function parseNumber(input: string): number | null {
  const normalized = String(input ?? '').replace(',', '.').trim()
  if (normalized === '') return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function formatEuro(n: number): string {
  return `${n.toFixed(2)} €`
}

export default function TourenCalculator() {
  // --- Variables (strings to mirror the original form fields) ---
  const [tourType, setTourType] = useState<TourType>('AL')
  const [leasingRate, setLeasingRate] = useState('555.00')
  const [adBonusNet, setAdBonusNet] = useState('350.00')
  const [insurance, setInsurance] = useState('100.00')
  const [vehicleTax, setVehicleTax] = useState('50.00')
  const [otherVehicleCosts, setOtherVehicleCosts] = useState('50.00')
  const [fuelConsumption, setFuelConsumption] = useState('10.0')
  const [fuelPrice, setFuelPrice] = useState('1.60')
  const [kilometers, setKilometers] = useState('250')
  const [kmPeriod, setKmPeriod] = useState<KmPeriod>('Tag')
  const [autoServiceFlatrate, setAutoServiceFlatrate] = useState('5.00')
  const [routeSoftwareCost, setRouteSoftwareCost] = useState('13.62')
  const [mobileCost, setMobileCost] = useState('10.00')
  const [careCost, setCareCost] = useState('20.00')
  const [otherGeneralCostsMonthly, setOtherGeneralCostsMonthly] = useState('10.00')
  const [wageType, setWageType] = useState<WageType>('Teilzeit')
  const [wageAmount, setWageAmount] = useState('1200.00')
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState('30')
  const [payrollOverheadMonthlyAmount, setPayrollOverheadMonthlyAmount] = useState('288.00') // 24% of 1200
  const [vatRate, setVatRate] = useState('19.00')
  const [adBlueConsumption, setAdBlueConsumption] = useState('10.0') // L per 5000km
  const [adBluePrice, setAdBluePrice] = useState('1.00')
  const [oilChangeKm, setOilChangeKm] = useState('20000')
  const [oilChangeCost, setOilChangeCost] = useState('150.00')
  const [tireChangeKm, setTireChangeKm] = useState('20000')
  const [tireChangeCost, setTireChangeCost] = useState('200.00')
  const [vehicleDepreciation, setVehicleDepreciation] = useState('0.00')
  const [includeOilChange, setIncludeOilChange] = useState(false)
  const [includeTireChange, setIncludeTireChange] = useState(false)
  const [includeAccidentCost, setIncludeAccidentCost] = useState(false)
  const [accidentCost, setAccidentCost] = useState('50.00')
  const [tempWorkers, setTempWorkers] = useState('1')
  const tempWorkerTotalCost = 683.0 // fixed per worker

  // Temp worker calculator
  const [tourHoursPerDay, setTourHoursPerDay] = useState('4')
  const [tempWorkerHoursPerMonth, setTempWorkerHoursPerMonth] = useState('41')
  const [calculatedTempWorkers, setCalculatedTempWorkers] = useState('0')
  const [calculatedTotalCost, setCalculatedTotalCost] = useState('0,00 €')
  const [calculatedTeilzeitTotalCost, setCalculatedTeilzeitTotalCost] = useState('0,00 €')

  // Output text
  const [output, setOutput] = useState('')

  // --- Actions mirroring the original buttons ---
  function calculateTeilzeitTotal(): void {
    const wage = parseNumber(wageAmount)
    if (wage === null || wage <= 0) {
      alert('Bitte geben Sie einen gültigen Bruttolohn (> 0) ein.')
      return
    }
    const payrollOverhead = wage * 0.24
    const total = wage + payrollOverhead
    setPayrollOverheadMonthlyAmount(payrollOverhead.toFixed(2))
    setCalculatedTeilzeitTotalCost(formatEuro(total))
  }

  function calculateTempWorkers(): void {
    const tourHours = parseNumber(tourHoursPerDay)
    const workDays = parseNumber(workDaysPerMonth)
    const workerHours = parseNumber(tempWorkerHoursPerMonth)
    if (
      tourHours === null ||
      workDays === null ||
      workerHours === null ||
      tourHours <= 0 ||
      workDays <= 0 ||
      workerHours <= 0
    ) {
      alert('Bitte geben Sie gültige Zahlen (> 0) ein.')
      return
    }
    const totalTourHours = tourHours * workDays
    const requiredWorkers = Math.ceil(totalTourHours / workerHours)
    const totalCost = requiredWorkers * tempWorkerTotalCost
    setCalculatedTempWorkers(String(requiredWorkers))
    setCalculatedTotalCost(formatEuro(totalCost))
  }

  function applyCalculatedWorkers(): void {
    const n = Number(calculatedTempWorkers)
    if (Number.isFinite(n) && n > 0) {
      setTempWorkers(String(n))
      if (wageType !== 'Aushilfe') {
        setWageType('Aushilfe')
      }
    } else {
      alert('Keine gültige Berechnung vorhanden.')
    }
  }

  // --- Main calculation ---
  function calculateCosts(): void {
    const outputWidth = 68
    const line = (s: string) => s
    const center = (s: string) => {
      const pad = Math.max(0, Math.floor((outputWidth - s.length) / 2))
      return ' '.repeat(pad) + s
    }

    const vatRatePercent = parseNumber(vatRate)
    const workDays = parseNumber(workDaysPerMonth)
    if (vatRatePercent === null || workDays === null || workDays === 0) {
      if (workDays === 0) alert('Arbeitstage pro Monat dürfen nicht Null sein.')
      return
    }
    const vatMultiplier = 1 + vatRatePercent / 100

    let totalMonthlyVehicleCost = 0
    let totalMonthlyStaffCostFinal = 0
    let totalMonthlyGeneralOpsCost = 0

    // Vehicle operation costs
    const fuelCons = parseNumber(fuelConsumption)
    const fuelPriceNumber = parseNumber(fuelPrice)
    const kilometersInput = parseNumber(kilometers)
    const autoService = parseNumber(autoServiceFlatrate)
    const adBlueCons = parseNumber(adBlueConsumption)
    const adBluePriceNumber = parseNumber(adBluePrice)
    if (
      fuelCons === null ||
      fuelPriceNumber === null ||
      kilometersInput === null ||
      autoService === null ||
      adBlueCons === null ||
      adBluePriceNumber === null
    ) {
      return
    }
    let monthlyKm = kilometersInput
    if (kmPeriod === 'Tag') monthlyKm = kilometersInput * workDays
    const monthlyFuelCost = (monthlyKm / 100) * fuelCons * fuelPriceNumber
    const monthlyAdBlueCost = (monthlyKm / 5000) * adBlueCons * adBluePriceNumber

    let monthlyOilChangeCost = 0
    if (includeOilChange) {
      const oilKm = parseNumber(oilChangeKm)
      const oilCost = parseNumber(oilChangeCost)
      if (oilKm === null || oilCost === null) return
      if (oilKm > 0) monthlyOilChangeCost = (monthlyKm / oilKm) * oilCost
    }

    let monthlyTireChangeCost = 0
    if (includeTireChange) {
      const tireKm = parseNumber(tireChangeKm)
      const tireCost = parseNumber(tireChangeCost)
      if (tireKm === null || tireCost === null) return
      if (tireKm > 0) monthlyTireChangeCost = (monthlyKm / tireKm) * tireCost
    }

    totalMonthlyGeneralOpsCost +=
      monthlyFuelCost + autoService + monthlyAdBlueCost + monthlyOilChangeCost + monthlyTireChangeCost

    // Common
    const routeSw = parseNumber(routeSoftwareCost)
    const mobile = parseNumber(mobileCost)
    const care = parseNumber(careCost)
    const otherGen = parseNumber(otherGeneralCostsMonthly)
    if (routeSw === null || mobile === null || care === null || otherGen === null) return
    totalMonthlyGeneralOpsCost += routeSw + mobile + care + otherGen

    // Vehicle specific
    if (tourType === 'AL') {
      const leasingBrutto = parseNumber(leasingRate)
      const adNet = parseNumber(adBonusNet)
      if (leasingBrutto === null || adNet === null) return
      const accident = includeAccidentCost ? parseNumber(accidentCost) ?? 0 : 0
      const adBrutto = adNet * vatMultiplier
      const effectiveLeasing = leasingBrutto - adBrutto + accident
      totalMonthlyVehicleCost = effectiveLeasing
    } else {
      const insuranceMonthly = parseNumber(insurance)
      const vehicleTaxMonthly = parseNumber(vehicleTax)
      const otherLL = parseNumber(otherVehicleCosts)
      const depreciation = parseNumber(vehicleDepreciation)
      if (
        insuranceMonthly === null ||
        vehicleTaxMonthly === null ||
        otherLL === null ||
        depreciation === null
      )
        return
      totalMonthlyVehicleCost = insuranceMonthly + vehicleTaxMonthly + otherLL + depreciation
    }

    // Staff
    if (wageType === 'Aushilfe') {
      const nWorkers = parseNumber(tempWorkers)
      if (nWorkers === null || nWorkers <= 0) {
        alert('Die Anzahl der Aushilfsmitarbeiter muss größer als 0 sein.')
        return
      }
      totalMonthlyStaffCostFinal = tempWorkerTotalCost * nWorkers
    } else {
      const wage = parseNumber(wageAmount)
      const payrollOverhead = parseNumber(payrollOverheadMonthlyAmount)
      if (wage === null || payrollOverhead === null) return
      const computedOverhead = wage * 0.24
      totalMonthlyStaffCostFinal = wage + computedOverhead
    }

    const grandTotalMonthly = totalMonthlyVehicleCost + totalMonthlyGeneralOpsCost + totalMonthlyStaffCostFinal

    // Daily
    const dailyVehicleCost = totalMonthlyVehicleCost / workDays
    const dailyGeneralOpsCost = totalMonthlyGeneralOpsCost / workDays
    const dailyStaffCost = totalMonthlyStaffCostFinal / workDays
    const totalDailyCost = dailyVehicleCost + dailyGeneralOpsCost + dailyStaffCost

    // VAT info
    const vatVehicle = totalMonthlyVehicleCost * (vatRatePercent / 100)
    const vatGeneral = totalMonthlyGeneralOpsCost * (vatRatePercent / 100)
    const vatStaff = totalMonthlyStaffCostFinal * (vatRatePercent / 100)
    const totalVat = vatVehicle + vatGeneral + vatStaff
    const dailyVatVehicle = vatVehicle / workDays
    const dailyVatGeneral = vatGeneral / workDays
    const dailyVatStaff = vatStaff / workDays
    const totalDailyVat = totalVat / workDays

    const lines: string[] = []
    lines.push(center('Kostenaufstellung pro Tour/Fahrzeug'))
    lines.push('='.repeat(outputWidth))

    // Vehicle ops
    lines.push(line(`-${'Fahrzeug-Betriebskosten (monatlich)'.padStart(Math.floor(outputWidth / 2) + 15, '-')}`))
    lines.push(`  Gef. Kilometer: ${monthlyKm.toFixed(2).padStart(30)} km`)
    lines.push(`  Spritkosten: ${monthlyFuelCost.toFixed(2).padStart(35)} €`)
    lines.push(`  AdBlue Kosten: ${monthlyAdBlueCost.toFixed(2).padStart(32)} €`)
    if (includeOilChange) lines.push(`  Ölwechsel Kosten: ${monthlyOilChangeCost.toFixed(2).padStart(29)} €`)
    if (includeTireChange) lines.push(`  Reifenwechsel Kosten: ${monthlyTireChangeCost.toFixed(2).padStart(26)} €`)
    lines.push(`  Autoservice: ${autoService.toFixed(2).padStart(35)} €`)

    // Common
    lines.push(line(`-${'Weitere Gemeinkosten (monatlich)'.padStart(Math.floor(outputWidth / 2) + 12, '-')}`))
    lines.push(`  Routensoftware: ${routeSw.toFixed(2).padStart(30)} €`)
    lines.push(`  Mobiltelefon: ${mobile.toFixed(2).padStart(32)} €`)
    lines.push(`  Pflegekosten: ${care.toFixed(2).padStart(32)} €`)
    lines.push(`  Sonstige Kosten: ${otherGen.toFixed(2).padStart(29)} €`)

    // Vehicle specific
    lines.push(line(`-${'Fahrzeugspez. Kosten (monatlich)'.padStart(Math.floor(outputWidth / 2) + 12, '-')}`))
    if (tourType === 'AL') {
      const leasingBrutto = parseNumber(leasingRate) ?? 0
      const adNet = parseNumber(adBonusNet) ?? 0
      const adBrutto = adNet * vatMultiplier
      const accident = includeAccidentCost ? parseNumber(accidentCost) ?? 0 : 0
      lines.push(`  Typ: Leasing (AL)`)
      lines.push(`    Leasingrate Br.: ${leasingBrutto.toFixed(2).padStart(27)} €`)
      lines.push(`    Werbez. Netto: ${adNet.toFixed(2).padStart(29)} €`)
      lines.push(`      + ${vatRatePercent.toFixed(2)}% USt.: ${(adNet * (vatRatePercent / 100)).toFixed(2).padStart(28)} €`)
      lines.push(`    = Werbez. Br.: ${adBrutto.toFixed(2).padStart(28)} €`)
      if (includeAccidentCost) lines.push(`    Unfallkosten: ${accident.toFixed(2).padStart(32)} €`)
      lines.push(`  Eff. Leasingk.: ${totalMonthlyVehicleCost.toFixed(2).padStart(29)} €`)
    } else {
      const ins = parseNumber(insurance) ?? 0
      const tax = parseNumber(vehicleTax) ?? 0
      const other = parseNumber(otherVehicleCosts) ?? 0
      const depr = parseNumber(vehicleDepreciation) ?? 0
      lines.push(`  Typ: Eigenfahrzeug (LL)`)
      lines.push(`    Versicherung: ${ins.toFixed(2).padStart(30)} €`)
      lines.push(`    KFZ-Steuer: ${tax.toFixed(2).padStart(32)} €`)
      lines.push(`    Sonst. LL-Kost.: ${other.toFixed(2).padStart(26)} €`)
      lines.push(`    Wertverlust: ${depr.toFixed(2).padStart(32)} €`)
    }

    // Staff
    lines.push(line(`-${'Personalkosten (monatlich)'.padStart(Math.floor(outputWidth / 2) + 9, '-')}`))
    if (wageType === 'Aushilfe') {
      const nWorkers = parseNumber(tempWorkers) ?? 0
      lines.push(`  Anzahl Aushilfsmitarbeiter: ${nWorkers.toFixed(0).padStart(20)}`)
      lines.push(`  Kosten pro Aushilfe: ${tempWorkerTotalCost.toFixed(2).padStart(30)} €`)
      lines.push(`  Gesamt Personal: ${totalMonthlyStaffCostFinal.toFixed(2).padStart(29)} €`)
    } else {
      const wage = parseNumber(wageAmount) ?? 0
      const overhead = wage * 0.24
      lines.push(`  Bruttolohn: ${wage.toFixed(2).padStart(36)} €`)
      lines.push(`  Lohnnebenkosten: ${overhead.toFixed(2).padStart(30)} €`)
      lines.push(`  Gesamt Personal: ${totalMonthlyStaffCostFinal.toFixed(2).padStart(29)} €`)
    }

    // Totals
    lines.push('='.repeat(outputWidth))
    lines.push(`${'GESAMTE MONATSKOSTEN:'.padEnd(outputWidth - 20)} ${grandTotalMonthly.toFixed(2).padStart(15)} €`)
    lines.push(`${'AUFSCHLÜSSELUNG TAGESKOSTEN:'.padStart(Math.floor(outputWidth / 2) + 13, '-')}`)
    lines.push(`  Anteil Fahrzeug: ${dailyVehicleCost.toFixed(2).padStart(29)} €`)
    lines.push(`  Anteil Betrieb: ${dailyGeneralOpsCost.toFixed(2).padStart(30)} €`)
    lines.push(`  Anteil Personal: ${dailyStaffCost.toFixed(2).padStart(29)} €`)
    lines.push(`${'GESAMTE TAGESKOSTEN:'.padEnd(outputWidth - 20)} ${totalDailyCost.toFixed(2).padStart(15)} €`)
    lines.push('='.repeat(outputWidth))

    // VAT info
    lines.push(`${'MEHRWERTSTEUER AUFSCHLÜSSELUNG'.padStart(Math.floor(outputWidth / 2) + 15, '-')}`)
    lines.push(`${'Monatliche Kosten (Netto)'.padEnd(40)} ${'MwSt.'.padStart(10)} ${'Brutto'.padStart(10)}`)
    lines.push('-'.repeat(outputWidth))
    lines.push(`${'Fahrzeugspezifische Kosten:'.padEnd(40)} ${vatVehicle.toFixed(2).padStart(10)} ${totalMonthlyVehicleCost.toFixed(2).padStart(10)}`)
    lines.push(`${'Betrieb & Gemeinkosten:'.padEnd(40)} ${vatGeneral.toFixed(2).padStart(10)} ${totalMonthlyGeneralOpsCost.toFixed(2).padStart(10)}`)
    lines.push(`${'Personalkosten:'.padEnd(40)} ${vatStaff.toFixed(2).padStart(10)} ${totalMonthlyStaffCostFinal.toFixed(2).padStart(10)}`)
    lines.push('-'.repeat(outputWidth))
    lines.push(`${'GESAMT:'.padEnd(40)} ${totalVat.toFixed(2).padStart(10)} ${grandTotalMonthly.toFixed(2).padStart(10)}`)
    lines.push('='.repeat(outputWidth))
    lines.push(`${'TAGESKOSTEN MIT MwSt. AUFSCHLÜSSELUNG'.padStart(Math.floor(outputWidth / 2) + 19, '-')}`)
    lines.push(`${'Tägliche Kosten (Netto)'.padEnd(40)} ${'MwSt.'.padStart(10)} ${'Brutto'.padStart(10)}`)
    lines.push('-'.repeat(outputWidth))
    lines.push(`${'Fahrzeugspezifische Kosten:'.padEnd(40)} ${dailyVatVehicle.toFixed(2).padStart(10)} ${dailyVehicleCost.toFixed(2).padStart(10)}`)
    lines.push(`${'Betrieb & Gemeinkosten:'.padEnd(40)} ${dailyVatGeneral.toFixed(2).padStart(10)} ${dailyGeneralOpsCost.toFixed(2).padStart(10)}`)
    lines.push(`${'Personalkosten:'.padEnd(40)} ${dailyVatStaff.toFixed(2).padStart(10)} ${dailyStaffCost.toFixed(2).padStart(10)}`)
    lines.push('-'.repeat(outputWidth))
    lines.push(`${'GESAMT:'.padEnd(40)} ${totalDailyVat.toFixed(2).padStart(10)} ${totalDailyCost.toFixed(2).padStart(10)}`)
    lines.push('='.repeat(outputWidth))

    setOutput(lines.join('\n'))
  }

  // --- UI ---
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
      <div
        style={{
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          paddingRight: 8,
          borderRight: '1px solid #e2e8f0',
        }}
      >
        {/* Tour Type */}
        <section style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Tour-Typ auswählen:</div>
          <label style={{ marginRight: 16 }}>
            <input type="radio" checked={tourType === 'AL'} onChange={() => setTourType('AL')} /> Leasingsfahrzeug (AL)
          </label>
          <label>
            <input type="radio" checked={tourType === 'LL'} onChange={() => setTourType('LL')} /> Eigenfahrzeug (LL)
          </label>
        </section>

        {/* AL frame */}
        {tourType === 'AL' && (
          <fieldset style={{ marginBottom: 16 }}>
            <legend>Kosten Leasingsfahrzeug (AL) - Monatlich</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label title="Monatliche Leasingrate inklusive Mehrwertsteuer">
                Leasingrate (Brutto €):
                <input
                  value={leasingRate}
                  onChange={(e) => setLeasingRate(e.target.value)}
                  style={{ width: '100%', padding: 6 }}
                />
              </label>
              <label title="Netto-Werbezuschuss pro Monat">
                Werbezuschuss (Netto €):
                <input
                  value={adBonusNet}
                  onChange={(e) => setAdBonusNet(e.target.value)}
                  style={{ width: '100%', padding: 6 }}
                />
              </label>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={includeAccidentCost}
                  onChange={(e) => setIncludeAccidentCost(e.target.checked)}
                />
                Unfallkosten berücksichtigen
              </label>
            </div>
            {includeAccidentCost && (
              <div style={{ marginTop: 8 }}>
                <label title="Monatliche Pauschale für mögliche Unfallkosten und Schäden am Leasingfahrzeug">
                  Monatliche Unfallkosten (€):
                  <input
                    value={accidentCost}
                    onChange={(e) => setAccidentCost(e.target.value)}
                    style={{ width: '100%', padding: 6 }}
                  />
                </label>
              </div>
            )}
          </fieldset>
        )}

        {/* LL frame */}
        {tourType === 'LL' && (
          <fieldset style={{ marginBottom: 16 }}>
            <legend>Kosten Eigenfahrzeug (LL) - Monatlich</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label title="Monatliche Versicherungskosten">
                Versicherung (€):
                <input value={insurance} onChange={(e) => setInsurance(e.target.value)} style={{ width: '100%', padding: 6 }} />
              </label>
              <label title="Monatliche KFZ-Steuer">
                KFZ-Steuer (€):
                <input value={vehicleTax} onChange={(e) => setVehicleTax(e.target.value)} style={{ width: '100%', padding: 6 }} />
              </label>
              <label title="Sonstige monatliche Fahrzeugkosten, wie Rücklagen für Reparatur und TÜV">
                Sonstige spezif. LL-Kosten (€):
                <input
                  value={otherVehicleCosts}
                  onChange={(e) => setOtherVehicleCosts(e.target.value)}
                  style={{ width: '100%', padding: 6 }}
                />
              </label>
              <label title="Monatlicher Wertverlust des Fahrzeugs">
                Monatlicher Wertverlust (€):
                <input
                  value={vehicleDepreciation}
                  onChange={(e) => setVehicleDepreciation(e.target.value)}
                  style={{ width: '100%', padding: 6 }}
                />
              </label>
            </div>
          </fieldset>
        )}

        {/* Vehicle operation costs */}
        <fieldset style={{ marginBottom: 16 }}>
          <legend>Fahrzeug-Betriebskosten (pro Fahrzeug)</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label title="Durchschnittlicher Kraftstoffverbrauch in Litern pro 100km">
              Spritverbrauch (L/100km):
              <input value={fuelConsumption} onChange={(e) => setFuelConsumption(e.target.value)} style={{ width: '100%', padding: 6 }} />
            </label>
            <label title="Aktueller Kraftstoffpreis pro Liter inklusive Mehrwertsteuer">
              Spritpreis (€/Liter, Brutto):
              <input value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} style={{ width: '100%', padding: 6 }} />
            </label>
            <label title="AdBlue Verbrauch in Litern pro 5000km">
              AdBlue Verbrauch (L/5000km):
              <input value={adBlueConsumption} onChange={(e) => setAdBlueConsumption(e.target.value)} style={{ width: '100%', padding: 6 }} />
            </label>
            <label title="AdBlue Preis pro Liter inklusive Mehrwertsteuer">
              AdBlue Preis (€/Liter):
              <input value={adBluePrice} onChange={(e) => setAdBluePrice(e.target.value)} style={{ width: '100%', padding: 6 }} />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <label>Gefahrene Kilometer:</label>
            <input value={kilometers} onChange={(e) => setKilometers(e.target.value)} style={{ width: 100, padding: 6 }} />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="radio" checked={kmPeriod === 'Tag'} onChange={() => setKmPeriod('Tag')} />
              pro Tag
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="radio" checked={kmPeriod === 'Monat'} onChange={() => setKmPeriod('Monat')} />
              pro Monat
            </label>
          </div>

          <div style={{ marginTop: 8 }}>
            <label title="Monatliche Pauschale für Fahrzeugwartung und -pflege">
              Autoservice-Pauschale (monatl. €):
              <input
                value={autoServiceFlatrate}
                onChange={(e) => setAutoServiceFlatrate(e.target.value)}
                style={{ width: '100%', padding: 6 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={includeOilChange} onChange={(e) => setIncludeOilChange(e.target.checked)} />
              Ölwechsel berücksichtigen
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={includeTireChange} onChange={(e) => setIncludeTireChange(e.target.checked)} />
              Reifenwechsel berücksichtigen
            </label>
          </div>

          {includeOilChange && (
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label title="Kilometerintervall zwischen Ölwechseln">
                Ölwechsel Intervall (km):
                <input value={oilChangeKm} onChange={(e) => setOilChangeKm(e.target.value)} style={{ width: '100%', padding: 6 }} />
              </label>
              <label title="Kosten pro Ölwechsel inklusive Mehrwertsteuer">
                Ölwechsel Kosten (€):
                <input value={oilChangeCost} onChange={(e) => setOilChangeCost(e.target.value)} style={{ width: '100%', padding: 6 }} />
              </label>
            </div>
          )}

          {includeTireChange && (
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label title="Kilometerintervall zwischen Reifenwechseln">
                Reifenwechsel Intervall (km):
                <input value={tireChangeKm} onChange={(e) => setTireChangeKm(e.target.value)} style={{ width: '100%', padding: 6 }} />
              </label>
              <label title="Kosten pro Reifenwechsel inklusive Mehrwertsteuer">
                Reifenwechsel Kosten (€):
                <input value={tireChangeCost} onChange={(e) => setTireChangeCost(e.target.value)} style={{ width: '100%', padding: 6 }} />
              </label>
            </div>
          )}
        </fieldset>

        {/* Common costs */}
        <fieldset style={{ marginBottom: 16 }}>
          <legend>Weitere Gemeinkosten (pro Fahrzeug/Tour - Monatlich)</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label title="Monatliche Kosten für Routenplanungssoftware inklusive Mehrwertsteuer">
              Routensoftware (Brutto €):
              <input value={routeSoftwareCost} onChange={(e) => setRouteSoftwareCost(e.target.value)} style={{ width: '100%', padding: 6 }} />
            </label>
            <label title="Monatliche Kosten für Mobiltelefon inklusive Mehrwertsteuer">
              Mobiltelefon (Brutto €):
              <input value={mobileCost} onChange={(e) => setMobileCost(e.target.value)} style={{ width: '100%', padding: 6 }} />
            </label>
            <label title="Monatliche Pflegekosten inklusive Mehrwertsteuer">
              Pflegekosten (Brutto €):
              <input value={careCost} onChange={(e) => setCareCost(e.target.value)} style={{ width: '100%', padding: 6 }} />
            </label>
            <label title="Weitere monatliche Gemeinkosten inklusive Mehrwertsteuer">
              Weitere sonstige Kosten (€):
              <input
                value={otherGeneralCostsMonthly}
                onChange={(e) => setOtherGeneralCostsMonthly(e.target.value)}
                style={{ width: '100%', padding: 6 }}
              />
            </label>
          </div>
        </fieldset>

        {/* Staff costs */}
        <fieldset style={{ marginBottom: 16 }}>
          <legend>Personalkosten (pro Fahrer/Tour)</legend>
          <div style={{ marginBottom: 8 }}>
            <label style={{ marginRight: 16 }}>
              <input type="radio" checked={wageType === 'Teilzeit'} onChange={() => setWageType('Teilzeit')} />
              Teilzeit
            </label>
            <label>
              <input type="radio" checked={wageType === 'Aushilfe'} onChange={() => setWageType('Aushilfe')} />
              Aushilfe
            </label>
          </div>

        {wageType === 'Teilzeit' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label title="Bruttolohn pro Monat für Teilzeitbeschäftigte (Standard: 1200€)">
                  Brutto Monatslohn (€):
                  <input value={wageAmount} onChange={(e) => setWageAmount(e.target.value)} style={{ width: '100%', padding: 6 }} />
                </label>
                <label title="Lohnnebenkosten für Teilzeitbeschäftigte (24% des Bruttolohns)">
                  Lohnnebenkosten (monatl. €):
                  <input
                    value={payrollOverheadMonthlyAmount}
                    onChange={(e) => setPayrollOverheadMonthlyAmount(e.target.value)}
                    style={{ width: '100%', padding: 6 }}
                  />
                </label>
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={calculateTeilzeitTotal} style={{ padding: '8px 12px' }}>
                  Gesamtkosten berechnen
                </button>
                <div>Gesamtkosten: <strong>{calculatedTeilzeitTotalCost}</strong></div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label title="Anzahl der Aushilfsmitarbeiter für diese Tour">
                  Anzahl Aushilfsmitarbeiter:
                  <input value={tempWorkers} onChange={(e) => setTempWorkers(e.target.value)} style={{ width: '100%', padding: 6 }} />
                </label>
              </div>

              <fieldset style={{ marginTop: 12 }}>
                <legend>Aushilfsmitarbeiter Berechnung</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <label title="Durchschnittliche Tourzeit in Stunden pro Tag">
                    Tourzeit pro Tag (Stunden):
                    <input
                      value={tourHoursPerDay}
                      onChange={(e) => setTourHoursPerDay(e.target.value)}
                      style={{ width: '100%', padding: 6 }}
                    />
                  </label>
                  <label title="Arbeitstage pro Monat">
                    Arbeitstage pro Monat:
                    <input value={workDaysPerMonth} onChange={(e) => setWorkDaysPerMonth(e.target.value)} style={{ width: '100%', padding: 6 }} />
                  </label>
                  <label title="Maximale Arbeitsstunden pro Aushilfsmitarbeiter pro Monat">
                    Stunden pro Aushilfe pro Monat:
                    <input
                      value={tempWorkerHoursPerMonth}
                      onChange={(e) => setTempWorkerHoursPerMonth(e.target.value)}
                      style={{ width: '100%', padding: 6 }}
                    />
                  </label>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={calculateTempWorkers} style={{ padding: '8px 12px' }}>
                    Aushilfsmitarbeiter berechnen
                  </button>
                  <div>Benötigte Aushilfsmitarbeiter: <strong>{calculatedTempWorkers}</strong></div>
                  <div>Gesamtkosten: <strong>{calculatedTotalCost}</strong></div>
                  <button onClick={applyCalculatedWorkers} style={{ padding: '8px 12px' }}>
                    Übernehmen
                  </button>
                </div>
              </fieldset>
            </>
          )}
        </fieldset>

        {/* General settings */}
        <fieldset style={{ marginBottom: 16 }}>
          <legend>Allgemeine Einstellungen</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label title="Aktueller Mehrwertsteuersatz in Prozent">
              Umsatzsteuersatz (%):
              <input value={vatRate} onChange={(e) => setVatRate(e.target.value)} style={{ width: '100%', padding: 6 }} />
            </label>
            <label title="Durchschnittliche Anzahl der Arbeitstage pro Monat">
              Arbeitstage pro Monat:
              <input value={workDaysPerMonth} onChange={(e) => setWorkDaysPerMonth(e.target.value)} style={{ width: '100%', padding: 6 }} />
            </label>
          </div>
        </fieldset>

        <div style={{ marginTop: 16 }}>
          <button onClick={calculateCosts} style={{ padding: '10px 14px' }}>
            Kosten berechnen
          </button>
        </div>
      </div>

      {/* Output */}
      <div>
        <fieldset style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <legend>Ergebnis</legend>
          <textarea
            value={output}
            readOnly
            style={{
              flex: 1,
              width: '100%',
              minHeight: 'calc(100vh - 140px)',
              fontFamily: 'Courier New, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
              fontSize: 12,
              whiteSpace: 'pre',
              padding: 12,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            }}
          />
        </fieldset>
      </div>
    </div>
  )
}


