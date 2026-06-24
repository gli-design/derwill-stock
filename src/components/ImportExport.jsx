import { useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { MATERIALS } from '../data/initialData';
import { calcReorderPoints, projectStock, getStatus } from '../engine/projection';

function getMonthKeys(n) {
  const keys = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

export default function ImportExport({ state, importData }) {
  const csvRef = useRef();

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const consumption = {};
        const stockInitial = {};
        data.forEach(row => {
          const mat = MATERIALS.find(m =>
            m.name.toLowerCase().replace(/\s/g, '') === (row.material ?? '').toLowerCase().replace(/\s/g, '')
          );
          if (!mat) return;
          if (row.consumo_mensual) consumption[mat.id] = Number(row.consumo_mensual);
          if (row.stock_inicial) stockInitial[mat.id] = Number(row.stock_inicial);
        });
        importData({
          ...(Object.keys(consumption).length ? { consumption: { ...state.consumption, ...consumption } } : {}),
          ...(Object.keys(stockInitial).length ? { stockInitial: { ...state.stockInitial, ...stockInitial } } : {}),
        });
        alert(`Importado: ${Object.keys(consumption).length} consumos, ${Object.keys(stockInitial).length} stocks iniciales.`);
      },
    });
    e.target.value = '';
  }

  function exportExcel() {
    const monthKeys = getMonthKeys(12);
    const monthLabels = monthKeys.map(k => {
      const [y, m] = k.split('-');
      return new Date(y, m - 1).toLocaleString('es', { month: 'short', year: 'numeric' });
    });

    const header = ['Material', 'PR Asia (kg)', 'PR Arg (kg)', ...monthLabels];
    const statusLabel = { green: 'OK', yellow: 'Ventana cerrándose', orange: 'Pedir urgente Arg', red: 'Riesgo quiebre' };

    const rows = MATERIALS.map(mat => {
      const params = state.params[mat.id];
      const consumption = state.consumption[mat.id] ?? 0;
      const { prAsia, prArg } = calcReorderPoints(consumption, params, mat.hasLocal);
      const projection = projectStock(mat.id, state.stockInitial[mat.id] ?? 0, consumption, state.purchases, 12);
      return [
        mat.name,
        Math.round(prAsia),
        prArg ? Math.round(prArg) : '—',
        ...projection.map(p => `${p.stock.toLocaleString('es')} (${statusLabel[getStatus(p.stock, prAsia, prArg, mat.hasLocal)]})`),
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, ...monthLabels.map(() => ({ wch: 26 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');

    // Purchases sheet
    const phdr = ['Material', 'Llegada', 'Cantidad (kg)', 'Origen'];
    const prows = state.purchases.map(p => {
      const m = MATERIALS.find(x => x.id === p.materialId);
      return [m?.name ?? p.materialId, p.month, p.qty, p.origin === 'asia' ? 'Asia' : 'Argentina'];
    });
    const ws2 = XLSX.utils.aoa_to_sheet([phdr, ...prows]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Compras');

    XLSX.writeFile(wb, `DerWill_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Importar / Exportar</h2>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ border: '0.5px solid #e5e7eb', borderRadius: 10, padding: 20, flex: 1, minWidth: 260 }}>
          <h3 style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Importar desde CSV</h3>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>
            El CSV debe tener columnas: <code>material</code>, <code>consumo_mensual</code>, <code>stock_inicial</code>.<br />
            El nombre del material debe coincidir con los de la tabla (ej: "Algodón Blanco").
          </p>
          <input type="file" accept=".csv" ref={csvRef} onChange={handleCSV} style={{ display: 'none' }} />
          <button onClick={() => csvRef.current.click()} style={btnStyle}>Seleccionar CSV</button>
        </div>

        <div style={{ border: '0.5px solid #e5e7eb', borderRadius: 10, padding: 20, flex: 1, minWidth: 260 }}>
          <h3 style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Exportar a Excel</h3>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>
            Exporta la tabla de proyección a 12 meses con semáforos y la lista de compras registradas.
          </p>
          <button onClick={exportExcel} style={{ ...btnStyle, background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}>
            Descargar Excel
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, border: '0.5px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
        <h3 style={{ fontWeight: 500, fontSize: 14, marginBottom: 10 }}>Formato CSV de ejemplo</h3>
        <pre style={{ fontSize: 11, background: '#f9fafb', padding: 12, borderRadius: 6, overflowX: 'auto', lineHeight: 1.6 }}>
{`material,consumo_mensual,stock_inicial
Algodón Blanco,23500,125000
Algodón Negro,23500,90000
Melange 5%,1500,8000
Melange 25%,500,2000
Lycra Blanca,3000,14000
Lycra Negra,3000,9500
Goma Blanca,3000,12000
Goma Negra,3000,9000
Nylon Blanco,2000,6500
Nylon Negro,2000,5000`}
        </pre>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '7px 16px',
  borderRadius: 6,
  border: '0.5px solid #d1d5db',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  background: '#f9fafb',
  color: '#374151',
};
