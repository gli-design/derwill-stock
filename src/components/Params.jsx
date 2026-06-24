import { MATERIALS } from '../data/initialData';

const FIELD_LABELS = {
  leadTimeAsia: 'Lead Asia (días)',
  leadTimeArg:  'Lead Arg (días)',
  moqAsia:      'MOQ Asia (kg)',
  moqArg:       'MOQ Arg (kg)',
  bufferAsia:   'Buffer Asia (días)',
  bufferArg:    'Buffer Arg (días)',
};

export default function Params({ params, consumption, stockInitial, updateParams, updateConsumption, updateStockInitial }) {
  const families = [...new Set(MATERIALS.map(m => m.family))];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Parámetros por material</h2>

      {families.map(fam => (
        <div key={fam} style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{fam}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, color: '#6b7280' }}>Material</th>
                  <th style={{ padding: '6px 8px', fontWeight: 500, color: '#6b7280' }}>Consumo/mes (kg)</th>
                  <th style={{ padding: '6px 8px', fontWeight: 500, color: '#6b7280' }}>Stock inicial (kg)</th>
                  {Object.keys(FIELD_LABELS).map(f => (
                    <th key={f} style={{ padding: '6px 8px', fontWeight: 500, color: '#6b7280' }}>{FIELD_LABELS[f]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATERIALS.filter(m => m.family === fam).map(mat => (
                  <tr key={mat.id} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 10px', fontWeight: 500 }}>{mat.name}</td>
                    <td style={{ padding: '4px 6px' }}>
                      <input
                        type="number"
                        value={consumption[mat.id] ?? ''}
                        onChange={e => updateConsumption(mat.id, e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <input
                        type="number"
                        value={stockInitial[mat.id] ?? ''}
                        onChange={e => updateStockInitial(mat.id, e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    {Object.keys(FIELD_LABELS).map(field => (
                      <td key={field} style={{ padding: '4px 6px' }}>
                        {field === 'leadTimeArg' && !mat.hasLocal ? (
                          <span style={{ color: '#d1d5db', paddingLeft: 8 }}>—</span>
                        ) : field === 'moqArg' && !mat.hasLocal ? (
                          <span style={{ color: '#d1d5db', paddingLeft: 8 }}>—</span>
                        ) : (
                          <input
                            type="number"
                            value={params[mat.id]?.[field] ?? ''}
                            onChange={e => updateParams(mat.id, field, e.target.value)}
                            placeholder={field.startsWith('moq') ? 'vacío' : ''}
                            style={inputStyle}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

const inputStyle = {
  width: 80,
  padding: '3px 6px',
  border: '0.5px solid #d1d5db',
  borderRadius: 4,
  fontSize: 12,
  textAlign: 'right',
};
