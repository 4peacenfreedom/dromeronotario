import { useState } from 'react'
import { bulkInsert } from '../lib/expedientes.js'
import toast from 'react-hot-toast'

export default function Importar() {
  const [csvText, setCsvText]   = useState('')
  const [preview, setPreview]   = useState([])
  const [busy, setBusy]         = useState(false)
  const [imported, setImported] = useState(null)

  const parseCsv = (text) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || []
      const obj = {}
      headers.forEach((h, i) => {
        obj[h] = (vals[i] || '').replace(/^"|"$/g, '').trim()
      })
      return obj
    })
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target.result
      setCsvText(text)
      try {
        const rows = parseCsv(text)
        setPreview(rows.slice(0, 5))
      } catch {
        toast.error('No se pudo leer el CSV')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvText) return
    setBusy(true)
    try {
      const rows = parseCsv(csvText)
      // Map CSV columns to DB columns
      const mapped = rows.map(r => ({
        nombre:          r.nombre         || r.Nombre         || '',
        tipo_doc:        r.tipo_doc       || 'cedula',
        cedula:          r.cedula         || r.Cedula         || '',
        escritura:       r.escritura      || r.Escritura      || '',
        fecha_escritura: r.fecha_escritura|| '',
        notas:           r.notas          || r.Notas          || '',
        tipo:            r.tipo           || 'other',
        placa:           r.placa          || r.Placa          || '',
        finca:           r.finca          || r.Finca          || '',
        factura:         r.factura        || r.Factura        || '',
        monto:           r.monto          || r.Monto          || null,
      })).filter(r => r.nombre || r.cedula)

      const result = await bulkInsert(mapped)
      setImported(result.length)
      toast.success(`${result.length} expedientes importados`)
      setCsvText('')
      setPreview([])
    } catch (e) {
      toast.error('Error importando: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* INFO */}
      <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--blue)' }}>
        <div className="card-body">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>📥 Importación masiva de datos</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>
            Use esta herramienta para importar expedientes desde un archivo CSV.
            El CSV debe tener las columnas: <code>nombre, cedula, escritura, tipo, placa, finca, factura, monto, notas</code>.
            <br/>Los datos del protocolo (extraídos del PDF) y las facturas pueden importarse aquí una vez procesados con el script Python.
          </p>
        </div>
      </div>

      {/* TEMPLATE DOWNLOAD */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">1️⃣ Plantilla CSV</span></div>
        <div className="card-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', marginBottom: 12 }}>
            Descargue la plantilla, llénela con los datos, y luego súbala abajo.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const header = 'nombre,tipo_doc,cedula,escritura,fecha_escritura,tipo,placa,finca,factura,monto,notas'
            const example = 'María Castillo González,cedula,2-0301-0619,2,2025-03-17,vehicle,MOT-51487,,,90000,Venta moto Honda'
            const blob = new Blob([header + '\n' + example], { type: 'text/csv' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
            a.download = 'plantilla_expedientes.csv'; a.click()
          }}>
            ⬇️ Descargar plantilla CSV
          </button>
        </div>
      </div>

      {/* UPLOAD */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">2️⃣ Subir archivo CSV</span></div>
        <div className="card-body">
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Seleccionar archivo</label>
          <input type="file" accept=".csv,text/csv"
            style={{ padding: '8px', border: '1.5px solid var(--border)', borderRadius: 6, background: 'var(--bg)', width: '100%' }}
            onChange={handleFile} />

          {preview.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>Vista previa (primeras 5 filas):</div>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>{Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i}>{Object.values(r).map((v, j) => <td key={j}>{v || '—'}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleImport} disabled={busy}>
                  {busy ? '⏳ Importando...' : '⬆️ Importar al sistema'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setCsvText(''); setPreview([]) }}>Cancelar</button>
              </div>
            </div>
          )}

          {imported !== null && (
            <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: 'var(--green)', fontSize: '0.875rem' }}>
              ✅ Se importaron <strong>{imported}</strong> expedientes correctamente.
            </div>
          )}
        </div>
      </div>

      {/* SCRIPT INFO */}
      <div className="card" style={{ borderLeft: '4px solid var(--amber)' }}>
        <div className="card-header"><span className="card-title">🐍 Script Python para el PDF del protocolo</span></div>
        <div className="card-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', marginBottom: 12 }}>
            El script <code>scripts/extraer_protocolo.py</code> en el repositorio puede leer el PDF del protocolo
            y generar automáticamente el CSV listo para importar aquí.
          </p>
          <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: 14, borderRadius: 8, fontSize: '0.8rem', overflow: 'auto' }}>
{`# Instalar dependencias:
pip install pdfplumber openai pandas

# Ejecutar:
python scripts/extraer_protocolo.py protocolo.pdf

# Genera: protocolo_extraido.csv`}
          </pre>
        </div>
      </div>
    </div>
  )
}
