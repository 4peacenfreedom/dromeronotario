import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchStats, fetchExpedientes } from '../lib/expedientes.js'

const TYPE_LABELS = {
  vehicle:  { label: '🚗 Vehículo',   cls: 'badge-vehicle'  },
  property: { label: '🏠 Propiedad',  cls: 'badge-property' },
  contract: { label: '📄 Contrato',   cls: 'badge-contract' },
  other:    { label: '📁 Otro',       cls: 'badge-other'    },
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, vehicles: 0, properties: 0, thisMonth: 0 })
  const [recent, setRecent] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error)
    fetchExpedientes().then(d => setRecent(d.slice(0, 8))).catch(console.error)
  }, [])

  return (
    <div>
      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-label">Expedientes totales</div>
        </div>
        <div className="stat-card green">
          <div className="stat-num">{stats.vehicles}</div>
          <div className="stat-label">Vehículos</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-num">{stats.properties}</div>
          <div className="stat-label">Propiedades</div>
        </div>
        <div className="stat-card navy">
          <div className="stat-num">{stats.thisMonth}</div>
          <div className="stat-label">Este mes</div>
        </div>
      </div>

      {/* RECENT */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Expedientes recientes</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/expedientes')}>
            Ver todos
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Cédula</th>
                <th>Escritura</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">⚖️</div>
                    <p>Sin expedientes aún. <button className="btn btn-primary btn-sm" onClick={() => navigate('/expedientes')}>Agregar uno</button></p>
                  </div>
                </td></tr>
              )}
              {recent.map(d => {
                const t = TYPE_LABELS[d.tipo] || TYPE_LABELS.other
                return (
                  <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/expedientes/${d.id}`)}>
                    <td><strong>{d.nombre}</strong></td>
                    <td><span className="code-tag">{d.cedula}</span></td>
                    <td>{d.escritura || '—'}</td>
                    <td><span className={`badge ${t.cls}`}>{t.label}</span></td>
                    <td>{d.placa || '—'}</td>
                    <td>{d.created_at ? new Date(d.created_at).toLocaleDateString('es-CR') : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
