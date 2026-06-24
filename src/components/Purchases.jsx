import { useState, useMemo } from 'react';
import { MATERIALS } from '../data/initialData';
import { calcReorderPoints, projectStock, suggestPurchase, getStatus } from '../engine/projection';

function getMonthOptions(n) {
  const options = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('es', { month: 'long', year: 'numeric' });
    options.push({ key, label });
  }
  return options;
}

const MONTHS_OPTIONS = getMonthOptions(18);

export default function Purchases({ state, addPurchase, removePurchase }) {
  const [form, setForm] = useState({ materialId: MATERIALS[0].id, month: MONTHS_OPTIONS[0].key, qty: '', origin: 'asia', supplier: '' });
  const [simulating, setSimulating] = useState(false);
  const [filterMat, setFilterMat] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  const availableMonths = useMemo(() =>
    [...new Set(state.purchases.map(p => p.month))].sort(),
    [state.purchases]
  );

  const availableSuppliers = useMemo(() =>
    [...new Set(state.purchases.map(p => p.supplier).filter(Boolean))].sort(),
    [state.purchases]
  );

  const filteredPurchases = useMemo(() =>
    [...state.purchases]
      .filter(p =>
        (!filterMat || p.materialId === filterMat) &&
        (!filterMonth || p.month === filterMonth) &&
        (!filterSupplier || p.supplier === filterSupplier)
      )
      .sort((a, b) => a.month.localeCompare(b.month)),
    [state.purchases, filterMat, filterMonth, filterSupplier]
  );

  const mat = MATERIALS.find(m => m.id === form.materialId);
  const params = state.params[form.materialId];
  const consumption = state.consumption[form.materialId] ?? 0;

  const { prAsia, prArg } = useMemo(() =>
    calcReorderPoints(consumption, params, mat?.hasLocal),
    [consumption, params, mat]
  );

  const moq = form.origin === 'asia' ? params?.moqAsia : params?.moqArg;
  const targetStock = form.origin === 'asia' ? prAsia : (prArg ?? prAsia);
  const suggestion = useMemo(() => {
    const projection = projectStock(form.materialId, state.stockInitial[form.materialId] ?? 0, consumption, state.purchases, 18);
    const monthIndex = MONTHS_OPTIONS.findIndex(m => m.key === form.month);
    const projected = projection[monthIndex]?.stock ?? 0;
    return suggestPurchase(targetStock, projected, moq);
  }, [form, state, consumption, targetStock, moq]);

  const simPurchases = useMemo(() => {
    if (!simulating || !form.qty) return state.purchases;
    return [...state.purchases, { materialId: form.materialId, month: form.month, qty: Number(form.qty), id: '__sim__' }];
  }, [simulating, form, state.purchases]);

  const simProjection = useMemo(() => {
    if (!simulating) return null;
    return projectStock(form.materialId, state.stockInitial[form.materialId] ?? 0, consumption, simPurchases, 18);
  }, [simulating, simPurchases, form.materialId, state.stockInitial, consumption]);

  function handleAdd() {
    if (!form.qty || Number(form.qty) <= 0) return;
    addPurchase({ materialId: form.materialId, month: form.month, qty: Number(form.qty), origin: form.origin, supplier: form.supplier });
    setForm(f => ({ ...f, qty: '', supplier: '' }));
    setSimulating(false);
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Compras y simulación</h2>

      {/* Form */}
      <div style={{ border: '0.5px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>Nueva compra</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={labelStyle}>
            Material
            <select value={form.materialId} onChange={e => setForm(f => ({ ...f, materialId: e.target.value }))} style={selectStyle}>
              {MATERIALS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Origen
            <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} style={selectStyle}>
              <option value="asia">Asia</option>
              {mat?.hasLocal && <option value="arg">Argentina</option>}
            </select>
          </label>
          <label style={labelStyle}>
            Llegada estimada
            <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} style={selectStyle}>
              {MONTHS_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Cantidad (kg)
            <input
              type="number"
              value={form.qty}
              onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
              placeholder="ej: 50000"
              style={{ ...selectStyle, width: 110 }}
            />
          </label>
          <label style={labelStyle}>
            Proveedor
            <input
              type="text"
              value={form.supplier}
              onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
              placeholder="ej: Textil SA"
              style={{ ...selectStyle, width: 130 }}
            />
          </label>
          <button onClick={() => setSimulating(true)} style={{ ...btnStyle, background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
            Simular impacto
          </button>
          <button onClick={handleAdd} style={{ ...btnStyle, background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}>
            Confirmar compra
          </button>
        </div>

        {/* Suggestion */}
        <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
          {suggestion.needed > 0 ? (
            <>
              Para volver al stock objetivo ({targetStock.toLocaleString('es')} kg) necesitás{' '}
              <strong>{suggestion.needed.toLocaleString('es')} kg</strong>.
              {moq && suggestion.willReceive !== suggestion.needed && (
                <> Redondeado al MOQ ({moq.toLocaleString('es')} kg) → vas a recibir <strong>{suggestion.willReceive.toLocaleString('es')} kg</strong>.</>
              )}
              {!moq && <> (Sin MOQ cargado — completá en parámetros para redondeo automático.)</>}
            </>
          ) : (
            <span style={{ color: '#15803d' }}>Stock proyectado ese mes ya cubre el punto de reorden.</span>
          )}
        </div>

        {/* Sim result */}
        {simulating && simProjection && (
          <div style={{ marginTop: 14, padding: 12, background: '#eff6ff', borderRadius: 8, fontSize: 12 }}>
            <strong>Impacto de la simulación — stock proyectado con esta compra:</strong>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {simProjection.map((p, i) => {
                const status = getStatus(i, simProjection, prAsia, prArg, mat?.hasLocal, params?.leadTimeAsia, params?.leadTimeArg);
                const colors = { green: '#d1fae5', yellow: '#fef9c3', orange: '#ffedd5', red: '#fee2e2' };
                return (
                  <div key={i} style={{ textAlign: 'center', background: colors[status], borderRadius: 4, padding: '4px 8px', minWidth: 52 }}>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{MONTHS_OPTIONS[i]?.label.split(' ')[0]}</div>
                    <div style={{ fontWeight: 500 }}>{p.stock.toLocaleString('es')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Purchase list */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontWeight: 500, fontSize: 14 }}>Compras registradas</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Material:</label>
          <select value={filterMat} onChange={e => setFilterMat(e.target.value)} style={selectStyle}>
            <option value="">Todos</option>
            {MATERIALS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Mes:</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={selectStyle}>
            <option value="">Todos</option>
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {availableSuppliers.length > 0 && <>
            <label style={{ fontSize: 12, color: '#6b7280' }}>Proveedor:</label>
            <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={selectStyle}>
              <option value="">Todos</option>
              {availableSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </>}
          {(filterMat || filterMonth || filterSupplier) && (
            <button onClick={() => { setFilterMat(''); setFilterMonth(''); setFilterSupplier(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}>✕ limpiar</button>
          )}
        </div>
        {filteredPurchases.length > 0 && (
          <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>
            Total: <strong>{filteredPurchases.reduce((s, p) => s + Number(p.qty), 0).toLocaleString('es')} kg</strong>
            {' · '}{filteredPurchases.length} {filteredPurchases.length === 1 ? 'compra' : 'compras'}
          </span>
        )}
      </div>
      {filteredPurchases.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>
          {state.purchases.length === 0 ? 'No hay compras registradas todavía.' : 'Ninguna compra coincide con el filtro.'}
        </p>
      ) : (
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #e5e7eb' }}>
              <th style={thStyle}>Material</th>
              <th style={thStyle}>Llegada</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Cantidad (kg)</th>
              <th style={thStyle}>Origen</th>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.map(p => {
              const m = MATERIALS.find(x => x.id === p.materialId);
              return (
                <tr key={p.id} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                  <td style={tdStyle}>{m?.name ?? p.materialId}</td>
                  <td style={tdStyle}>{p.month}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{Number(p.qty).toLocaleString('es')}</td>
                  <td style={tdStyle}>{p.origin === 'asia' ? 'Asia' : 'Argentina'}</td>
                  <td style={{ ...tdStyle, color: p.supplier ? '#374151' : '#d1d5db' }}>{p.supplier || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => removePurchase(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#374151' };
const selectStyle = { padding: '5px 8px', border: '0.5px solid #d1d5db', borderRadius: 6, fontSize: 12, background: 'white' };
const btnStyle = { padding: '6px 14px', borderRadius: 6, border: '0.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 500 };
const thStyle = { textAlign: 'left', padding: '6px 10px', fontWeight: 500, color: '#6b7280' };
const tdStyle = { padding: '6px 10px' };
