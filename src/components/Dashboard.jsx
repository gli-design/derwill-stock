import { useState, useMemo } from 'react';
import { MATERIALS } from '../data/initialData';
import { calcReorderPoints, projectStock, getStatus } from '../engine/projection';
import StockChart from './StockChart';
import SuggestedOrders from './SuggestedOrders';

const STATUS_COLORS = {
  green:  { bg: '#d1fae5', text: '#065f46', label: 'OK' },
  yellow: { bg: '#fef9c3', text: '#854d0e', label: 'Ventana cerrándose' },
  orange: { bg: '#ffedd5', text: '#9a3412', label: 'Pedir urgente Arg' },
  red:    { bg: '#fee2e2', text: '#991b1b', label: 'Riesgo quiebre' },
};

const MONTHS = 12;

function getMonthLabels(n) {
  const labels = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    labels.push(`${d.toLocaleString('es', { month: 'short' })} ${d.getFullYear()}`);
  }
  return labels;
}

export default function Dashboard({ state }) {
  const [selected, setSelected] = useState(null); // { materialId, monthIndex }
  const monthLabels = useMemo(() => getMonthLabels(MONTHS), []);

  const rows = useMemo(() => {
    return MATERIALS.map(mat => {
      const params = state.params[mat.id];
      const consumption = state.consumption[mat.id] ?? 0;
      const { prAsia, prArg } = calcReorderPoints(consumption, params, mat.hasLocal);
      const projection = projectStock(
        mat.id,
        state.stockInitial[mat.id] ?? 0,
        consumption,
        state.purchases,
        MONTHS
      );
      const cells = projection.map((p, idx) => ({
        stock: p.stock,
        status: getStatus(idx, projection, prAsia, prArg, mat.hasLocal, params.leadTimeAsia, params.leadTimeArg),
        incoming: p.incoming,
        month: p.month,
      }));
      return { mat, prAsia, prArg, projection, cells };
    });
  }, [state]);

  const selectedRow = selected ? rows.find(r => r.mat.id === selected.materialId) : null;

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Proyección de stock — próximos 12 meses</h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%', minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, color: '#6b7280', minWidth: 140 }}>Material</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 500, color: '#6b7280' }}>PR Asia (kg)</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 500, color: '#6b7280' }}>PR Arg (kg)</th>
              {monthLabels.map((lbl, i) => (
                <th key={i} style={{ textAlign: 'center', padding: '6px 4px', fontWeight: 500, color: '#6b7280', minWidth: 72 }}>{lbl}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ mat, prAsia, prArg, cells }) => (
              <tr key={mat.id} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                <td style={{ padding: '5px 10px', fontWeight: 500 }}>
                  {mat.name}
                  {!mat.hasLocal && (
                    <span style={{ marginLeft: 6, fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 4 }}>sin backup</span>
                  )}
                </td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: '#374151' }}>{prAsia.toLocaleString('es')}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: '#374151' }}>{prArg ? prArg.toLocaleString('es') : '—'}</td>
                {cells.map((cell, i) => {
                  const col = STATUS_COLORS[cell.status];
                  const isSelected = selected?.materialId === mat.id && selected?.monthIndex === i;
                  return (
                    <td
                      key={i}
                      onClick={() => setSelected(isSelected ? null : { materialId: mat.id, monthIndex: i })}
                      style={{
                        textAlign: 'center',
                        padding: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        background: col.bg,
                        color: col.text,
                        borderRadius: 4,
                        padding: '3px 4px',
                        fontSize: 11,
                        fontWeight: 500,
                        outline: isSelected ? '2px solid #2563eb' : 'none',
                        outlineOffset: 1,
                      }}>
                        {cell.stock < 0 ? '−' : ''}{Math.abs(cell.stock).toLocaleString('es')}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: 11 }}>
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: v.bg, border: `1px solid ${v.text}33`, display: 'inline-block' }} />
            <span style={{ color: '#4b5563' }}>{v.label}</span>
          </span>
        ))}
      </div>

      <SuggestedOrders state={state} />

      {selectedRow && (
        <div style={{ marginTop: 24, border: '0.5px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 500, fontSize: 15 }}>{selectedRow.mat.name} — proyección completa</h3>
            <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
          </div>
          <StockChart
            projection={selectedRow.projection}
            prAsia={selectedRow.prAsia}
            prArg={selectedRow.prArg}
            hasLocal={selectedRow.mat.hasLocal}
            monthLabels={monthLabels}
          />
        </div>
      )}
    </div>
  );
}
