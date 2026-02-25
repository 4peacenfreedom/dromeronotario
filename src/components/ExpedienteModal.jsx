import { useState, useRef, useEffect } from 'react'
import { saveExpediente } from '../lib/expedientes.js'
import toast from 'react-hot-toast'

const EMPTY = {
  id: null, nombre: '', tipo_doc: 'cedula', cedula: '',
  escritura: '', fecha_escritura: '', notas: '',
  tipo: 'vehicle', placa: '', finca: '',
  factura: '', monto: '',
  img_cedula: '', img_referencia: '', img_factura: '',
}

export default function ExpedienteModal({ open, onClose, onSaved, expediente }) {
  const [form, setForm]   = useState(EMPTY)
  const [files, setFiles] = useState({})
  const [busy, setBusy]   = useState(false)
  const [previews, setPreviews] = useState({})

  useEffect(() => {
    if (expediente) {
      setForm({ ...EMPTY, ...expediente })
      setPreviews({
        cedula:     expediente.img_cedula     || '',
        referencia: expediente.img_referencia || '',
        factura:    expediente.img_factura    || '',
      })
    } else {
      setForm(EMPTY)
      setPreviews({})
      setFiles({})
    }
  }, [expediente, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = (key, file) => {
    if (!file) return
    setFiles(f => ({ ...f, [key]: file }))
    const url = URL.createObjectURL(file)
    setPreviews(p => ({ ...p, [key]: url }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setBusy(true)
    try {
      await saveExpediente(form, files)
      toast.success(form.id ? 'Expediente actualizado' : 'Expediente creado')
      onSaved()
      onClose()
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{form.id ? 'Editar expediente' : 'Nuevo expediente'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* CLIENTE */}
            <div className="form-section">
              <div className="form-section-title">👤 Datos del cliente</div>
              <div className="form-section-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Nombre completo *</label>
                    <input className="form-input" required value={form.nombre}
                      onChange={e => set('nombre', e.target.value)} placeholder="Nombre completo" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo de documento</label>
                    <select className="form-input" value={form.tipo_doc} onChange={e => set('tipo_doc', e.target.value)}>
                      <option value="cedula">Cédula de identidad</option>
                      <option value="pasaporte">Pasaporte</option>
                      <option value="dimex">DIMEX</option>
                      <option value="juridica">Cédula jurídica</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número de documento *</label>
                    <input className="form-input" required value={form.cedula}
                      onChange={e => set('cedula', e.target.value)} placeholder="Ej. 1-0234-5678" />
                  </div>
                </div>
                <Dropzone label="Foto de cédula / pasaporte" icon="🪪"
                  preview={previews.cedula} onChange={f => handleFile('cedula', f)} />
              </div>
            </div>

            {/* PROTOCOLO */}
            <div className="form-section">
              <div className="form-section-title">📜 Protocolo</div>
              <div className="form-section-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Número de escritura</label>
                    <input className="form-input" value={form.escritura}
                      onChange={e => set('escritura', e.target.value)} placeholder="Ej. 235" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de escritura</label>
                    <input className="form-input" type="date" value={form.fecha_escritura}
                      onChange={e => set('fecha_escritura', e.target.value)} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Notas / descripción</label>
                    <textarea className="form-input" value={form.notas}
                      onChange={e => set('notas', e.target.value)} placeholder="Notas sobre el trámite..." />
                  </div>
                </div>
              </div>
            </div>

            {/* BIEN */}
            <div className="form-section">
              <div className="form-section-title">🔎 Referencia del bien</div>
              <div className="form-section-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Tipo de consulta</label>
                    <select className="form-input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                      <option value="vehicle">🚗 Vehículo / Tránsito</option>
                      <option value="property">🏠 Bien raíz / Propiedad</option>
                      <option value="contract">📄 Contrato general</option>
                      <option value="other">📁 Otro trámite</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Placa del vehículo</label>
                    <input className="form-input" value={form.placa}
                      onChange={e => set('placa', e.target.value)} placeholder="Ej. ABC-123" />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Número de finca / propiedad</label>
                    <input className="form-input" value={form.finca}
                      onChange={e => set('finca', e.target.value)} placeholder="Número de finca o matrícula" />
                  </div>
                </div>
                <Dropzone label="Foto de referencia (vehículo o propiedad)" icon="📷"
                  preview={previews.referencia} onChange={f => handleFile('referencia', f)} />
              </div>
            </div>

            {/* FACTURA */}
            <div className="form-section">
              <div className="form-section-title">🧾 Factura electrónica</div>
              <div className="form-section-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Número de factura</label>
                    <input className="form-input" value={form.factura}
                      onChange={e => set('factura', e.target.value)} placeholder="Ej. FE-00001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto (₡)</label>
                    <input className="form-input" type="number" value={form.monto}
                      onChange={e => set('monto', e.target.value)} placeholder="50000" />
                  </div>
                </div>
                <Dropzone label="Imagen de la factura" icon="🧾"
                  preview={previews.factura} onChange={f => handleFile('factura', f)} accept="image/*,application/pdf" />
              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? '⏳ Guardando...' : '💾 Guardar expediente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Dropzone({ label, icon, preview, onChange, accept = 'image/*' }) {
  const ref = useRef()
  return (
    <div style={{ marginTop: 12 }}>
      <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>{label}</label>
      <div className="dropzone" onClick={() => ref.current.click()}>
        <input ref={ref} type="file" accept={accept}
          style={{ display: 'none' }}
          onChange={e => onChange(e.target.files[0])} />
        {preview
          ? <img src={preview} style={{ maxHeight: 100, borderRadius: 6, objectFit: 'cover' }} alt="preview" />
          : <div className="dropzone-label"><div className="dropzone-icon">{icon}</div>Clic para seleccionar archivo</div>
        }
      </div>
    </div>
  )
}
