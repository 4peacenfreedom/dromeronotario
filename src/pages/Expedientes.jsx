import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchExpedientes, deleteExpediente } from '../lib/expedientes.js'
import ExpedienteModal from '../components/ExpedienteModal.jsx'
import toast from 'react-hot-toast'

const TYPE = {
  vehicle:  ['badge-vehicle',  '🚗 Vehículo'],
  property: ['badge-property', '🏠 Propiedad'],
  contract: ['badge-contract', '📄 Contrato'],
  other:    ['badge-other',    '📁 Otro'],
}

export default function Expedientes() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState({ cedula: '', nombre: '', placa: '', factura: '' })
  const [modal, setModal]     = useState({ open: false, exp: null })
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchExpedientes(search)
      setData(rows)
    } catch (e) {
      toast.error('Error cargando expedientes')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar el expediente de ${nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await deleteExpediente(id)
      toast.success('Expediente eliminado')
      load()
    } catch { toast.error('No se pudo eliminar') }
  }

  const s = (k) => (e) => setSearch(p => ({ ...p, [k]: e.target.value }))
  const clearSearch = () => setSearch({ cedula: '', nombre: '', placa: '', factura: '' })

  return (
    <div>
      {/* SEARCH */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingBottom: 12 }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 10 }}>
            🔍 Buscar expediente
          </div>
          <div className="search-bar">
            <div className="input-wrap">
              <label>Cédula / Pasaporte</label>
              <span className="input-icon">🪪</span>
              <input className="input" value={search.cedula} onChange={s('cedula')} placeholder="Ej. 1-0234-5678" />
            </div>
            <div className="input-wrap">
              <label>Nombre del cliente</label>
              <span className="input-icon">👤</span>
              <input className="input" value={search.nombre} onChange={s('nombre')} placeholder="Nombre completo" />
            </div>
            <div className="input-wrap">
              <label>Placa del vehículo</label>
              <span className="input-icon">🚗</span>
              <input className="input" value={search.placa} onChange={s('placa')} placeholder="Ej. ABC-123" />
            </div>
            <div className="input-wrap">
              <label>Factura electrónica</label>
              <span className="input-icon">🧾</span>
              <input className="input" value={search.factura} onChange={s('factura')} placeholder="Ej. FE-00001" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={clearSearch}>✕ Limpiar</button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {!loading && `${data.length} resultado(s)`}
            </span>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Expedientes registrados</span>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, exp: null })}>
            ＋ Nuevo expediente
          </button>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚖️</div>
              <p>No se encontraron expedientes.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Cédula / Pasaporte</th>
                  <th>Escritura Nº</th>
                  <th>Tipo</th>
                  <th>Placa</th>
                  <th>Factura</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map(d => {
                  const [cls, lbl] = TYPE[d.tipo] || TYPE.other
                  return (
                    <tr key={d.id}>
                      <td><strong>{d.nombre}</strong></td>
                      <td><span className="code-tag">{d.cedula}</span></td>
                      <td>{d.escritura || '—'}</td>
                      <td><span className={`badge ${cls}`}>{lbl}</span></td>
                      <td>{d.placa || '—'}</td>
                      <td>{d.factura || '—'}</td>
                      <td>{d.created_at ? new Date(d.created_at).toLocaleDateString('es-CR') : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-navy btn-sm" onClick={() => navigate(`/expedientes/${d.id}`)}>👁</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal({ open: true, exp: d })}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id, d.nombre)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ExpedienteModal
        open={modal.open}
        expediente={modal.exp}
        onClose={() => setModal({ open: false, exp: null })}
        onSaved={load}
      />
    </div>
  )
}
