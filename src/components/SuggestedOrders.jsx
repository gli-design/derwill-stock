import { useMemo } from 'react';
import { MATERIALS } from '../data/initialData';
import { calcReorderPoints, projectStock, getStatus } from '../engine/projection';

const MONTHS = 18;

function getMonthLabel(offsetFromNow) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetFromNow);
  return d.toLocaleString('es', { month: 'long', year: 'numeric' });
}

function getMonthKey(offsetFromNow) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function roundUpToMOQ(qty, moq) {
  if (!moq || moq <= 0) return { qty: Math.round(qty), rounded: false };
  const rounded = Math.ceil(qty / moq) * moq;
  return { qty: rounded, rounded: rounded !== Math.round(qty) };
}

// Simulates the full order schedule over the horizon using a rolling projection.
// Each time a yellow/orange month is detected, adds a suggested order and re-projects.
function generateOrderSchedule(mat, params, consumption, stockInitial, confirmedPurchases) {
  const { prAsia, prArg } = calcReorderPoints(consumption, params, mat.hasLocal);

  // Target stock at arrival = buffer months of consumption (not PR_Asia)
  const targetAsia = Math.round(consumption * (params.bufferAsia / 30));
  const targetArg  = Math.round(consumption * (params.bufferArg  / 30));

  const asiaMonths = Math.ceil((params.leadTimeAsia ?? 100) / 30);
  const argMonths  = Math.ceil((params.leadTimeArg  ?? 45)  / 30);

  let workingPurchases = [...confirmedPurchases];
  const suggestedOrders = [];
  const suggestedIds = new Set();

  for (let i = 0; i < MONTHS; i++) {
    const projection = projectStock(mat.id, stockInitial, consumption, workingPurchases, MONTHS);
    const status = getStatus(i, projection, prAsia, prArg, mat.hasLocal, params.leadTimeAsia, params.leadTimeArg);

    if (status === 'yellow') {
      const arrivalIdx = Math.min(i + asiaMonths, MONTHS - 1);
      const stockAtArrival = projection[arrivalIdx]?.stock ?? 0;
      const needed = Math.max(0, targetAsia - stockAtArrival);
      if (needed > 0) {
        const { qty, rounded } = roundUpToMOQ(needed, params.moqAsia);
        const arrivalKey = getMonthKey(arrivalIdx);
        const orderId = `sug_asia_${i}`;
        suggestedOrders.push({
          id: orderId,
          orderMonth: i,
          orderMonthLabel: getMonthLabel(i),
          arrivalMonth: arrivalIdx,
          arrivalLabel: getMonthLabel(arrivalIdx),
          origin: 'Asia',
          needed: Math.round(needed),
          qty,
          rounded,
          moq: params.moqAsia,
          urgent: false,
        });
        // Add to working purchases so next iterations account for it
        workingPurchases = [...workingPurchases, { materialId: mat.id, month: arrivalKey, qty, id: orderId }];
      }
    } else if (status === 'orange' && mat.hasLocal) {
      const arrivalIdx = Math.min(i + argMonths, MONTHS - 1);
      const stockAtArrival = projection[arrivalIdx]?.stock ?? 0;
      const needed = Math.max(0, targetArg - stockAtArrival);
      if (needed > 0) {
        const { qty, rounded } = roundUpToMOQ(needed, params.moqArg);
        const arrivalKey = getMonthKey(arrivalIdx);
        const orderId = `sug_arg_${i}`;
        suggestedOrders.push({
          id: orderId,
          orderMonth: i,
          orderMonthLabel: getMonthLabel(i),
          arrivalMonth: arrivalIdx,
          arrivalLabel: getMonthLabel(arrivalIdx),
          origin: 'Argentina',
          needed: Math.round(needed),
          qty,
          rounded,
          moq: params.moqArg,
          urgent: true,
        });
        workingPurchases = [...workingPurchases, { materialId: mat.id, month: arrivalKey, qty, id: orderId }];
      }
    }
  }

  return suggestedOrders;
}

export default function SuggestedOrders({ state }) {
  const allSuggestions = useMemo(() => {
    return MATERIALS.flatMap(mat => {
      const params = state.params[mat.id];
      const consumption = state.consumption[mat.id] ?? 0;
      const orders = generateOrderSchedule(
        mat, params, consumption,
        state.stockInitial[mat.id] ?? 0,
        state.purchases
      );
      return orders.map(o => ({ mat, ...o }));
    });
  }, [state]);

  if (allSuggestions.length === 0) {
    return (
      <div style={{ marginTop: 32, padding: 16, background: '#f0fdf4', borderRadius: 10, fontSize: 13, color: '#15803d' }}>
        Todos los materiales tienen stock suficiente en el horizonte proyectado.
      </div>
    );
  }

  // Group by orderMonth for a timeline view
  const byMonth = {};
  allSuggestions.forEach(s => {
    const key = s.orderMonth;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(s);
  });

  const urgentNow = allSuggestions.filter(s => s.urgent && s.orderMonth === 0);

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Plan de compras sugerido</h2>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
        Cantidades calculadas para mantener <strong>2 meses de stock</strong> al momento de cada llegada.
        Incluye múltiples órdenes a lo largo del horizonte de 18 meses.
      </p>

      {urgentNow.length > 0 && (
        <div style={{ marginBottom: 20, padding: '10px 14px', background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: 8, fontSize: 12, color: '#9a3412' }}>
          <strong>Atención:</strong> {urgentNow.map(s => s.mat.name).join(', ')} — la ventana Asia ya cerró para este mes. Pedido urgente a Argentina.
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #e5e7eb' }}>
              <th style={th}>Material</th>
              <th style={th}>Ejecutar en</th>
              <th style={th}>Llegada</th>
              <th style={th}>Origen</th>
              <th style={{ ...th, textAlign: 'right' }}>Necesitás (kg)</th>
              <th style={{ ...th, textAlign: 'right' }}>Vas a recibir (kg)</th>
              <th style={{ ...th, textAlign: 'right' }}>Contenedores</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(byMonth).sort((a, b) => Number(a) - Number(b)).flatMap(monthIdx => {
              const rows = byMonth[monthIdx];
              return rows.map((s, ri) => {
                const isNow = s.orderMonth === 0;
                const containers = s.moq ? Math.round(s.qty / s.moq) : null;
                return (
                  <tr key={s.id} style={{ borderBottom: '0.5px solid #f3f4f6', background: isNow ? '#fefce8' : 'transparent' }}>
                    <td style={td}>{s.mat.name}</td>
                    <td style={td}>
                      <span style={{
                        background: isNow ? '#fef3c7' : s.urgent ? '#ffedd5' : '#f9fafb',
                        color: isNow ? '#92400e' : s.urgent ? '#9a3412' : '#374151',
                        padding: '2px 8px', borderRadius: 4, fontWeight: isNow ? 600 : 400,
                      }}>
                        {s.orderMonthLabel}{isNow ? ' ★' : ''}
                      </span>
                    </td>
                    <td style={td}>{s.arrivalLabel}</td>
                    <td style={td}>
                      <span style={{
                        background: s.origin === 'Argentina' ? '#ffedd5' : '#eff6ff',
                        color: s.origin === 'Argentina' ? '#9a3412' : '#1d4ed8',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                      }}>
                        {s.origin}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#6b7280' }}>{s.needed.toLocaleString('es')}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>
                      {s.qty.toLocaleString('es')}
                      {s.rounded && <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 4 }}>↑</span>}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {containers !== null ? (
                        <span style={{ fontWeight: 500 }}>
                          {containers} × 40'
                          <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>
                            ({s.moq.toLocaleString('es')} kg c/u)
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: '#d1d5db' }}>sin MOQ</span>
                      )}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { textAlign: 'left', padding: '6px 10px', fontWeight: 500, color: '#6b7280' };
const td = { padding: '7px 10px' };
