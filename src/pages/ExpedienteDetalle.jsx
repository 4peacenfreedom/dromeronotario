import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchExpedienteById, deleteExpediente } from '../lib/expedientes.js'
import ExpedienteModal from '../components/ExpedienteModal.jsx'
import toast from 'react-hot-toast'

const TYPE = {
  vehicle:  '🚗 Vehículo / Tránsito',
  property: '🏠 Bien raíz / Propiedad',
  contract: '📄 Contrato general',
  other:    '📁 Otro trámite',
}
const DOC = { cedula: 'Cédula de identidad', pasaporte: 'Pasaporte', dimex: 'DIMEX', juridica: 'Cédula jurídica' }

export default function ExpedienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [d, setD] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

  const load = () => fetchExpedienteById(id).then(setD).catch(() => toast.error('No encontrado'))

  useEffect(() => { load() }, [id])

  if (!d) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el expediente de ${d.nombre}?`)) return
    await deleteExpediente(d.id)
    toast.success('Eliminado')
    navigate('/expedientes')
  }

  const ImgOrPlaceholder = ({ src, label }) => src
    ? <img src={src} className="detail-img" alt={label} onClick={() => window.open(src, '_blank')} />
    : <div className="img-placeholder">📷 {label}</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/expedientes')}>← Volver</button>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', flex: 1 }}>{d.nombre}</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setEditOpen(true)}>✏️ Editar</button>
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑 Eliminar</button>
      </div>

      <div className="detail-grid">
        {/* CLIENTE */}
        <div className="detail-card">
          <div className="detail-card-header">👤 Datos del cliente</div>
          <div className="detail-card-body">
            <div className="detail-row"><span className="detail-key">Nombre</span><span className="detail-val">{d.nombre}</span></div>
            <div className="detail-row"><span className="detail-key">Tipo doc.</span><span className="detail-val">{DOC[d.tipo_doc] || d.tipo_doc}</span></div>
            <div className="detail-row"><span className="detail-key">Número</span><span className="detail-val"><span className="code-tag">{d.cedula}</span></span></div>
            <div style={{ marginTop: 12 }}><ImgOrPlaceholder src={d.img_cedula} label="Sin foto de documento" /></div>
          </div>
        </div>

        {/* PROTOCOLO */}
        <div className="detail-card">
          <div className="detail-card-header">📜 Protocolo</div>
          <div className="detail-card-body">
            <div className="detail-row"><span className="detail-key">Escritura Nº</span><span className="detail-val">{d.escritura || '—'}</span></div>
            <div className="detail-row"><span className="detail-key">Fecha</span><span className="detail-val">{d.fecha_escritura ? new Date(d.fecha_escritura + 'T12:00:00').toLocaleDateString('es-CR') : '—'}</span></div>
            <div className="detail-row"><span className="detail-key">Tipo</span><span className="detail-val">{TYPE[d.tipo]}</span></div>
            {d.notas && <div style={{ marginTop: 10, padding: 10, background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem', color: 'var(--text-mid)', borderLeft: '3px solid var(--blue)' }}>{d.notas}</div>}
          </div>
        </div>

        {/* BIEN */}
        <div className="detail-card">
          <div className="detail-card-header">🔎 Referencia del bien</div>
          <div className="detail-card-body">
            <div className="detail-row"><span className="detail-key">Placa</span><span className="detail-val">{d.placa || '—'}</span></div>
            <div className="detail-row"><span className="detail-key">Finca</span><span className="detail-val">{d.finca || '—'}</span></div>
            <div style={{ marginTop: 12 }}><ImgOrPlaceholder src={d.img_referencia} label="Sin foto de referencia" /></div>
          </div>
        </div>

        {/* FACTURA */}
        <div className="detail-card">
          <div className="detail-card-header">🧾 Factura electrónica</div>
          <div className="detail-card-body">
            <div className="detail-row"><span className="detail-key">Número</span><span className="detail-val">{d.factura || '—'}</span></div>
            <div className="detail-row"><span className="detail-key">Monto</span><span className="detail-val">{d.monto ? '₡' + Number(d.monto).toLocaleString('es-CR') : '—'}</span></div>
            <div style={{ marginTop: 12 }}><ImgOrPlaceholder src={d.img_factura} label="Sin imagen de factura" /></div>
          </div>
        </div>
      </div>

      <ExpedienteModal open={editOpen} expediente={d} onClose={() => setEditOpen(false)} onSaved={load} />
    </div>
  )
}
