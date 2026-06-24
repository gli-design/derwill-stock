import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts';

export default function StockChart({ projection, prAsia, prArg, hasLocal, monthLabels }) {
  const data = projection.map((p, i) => ({
    mes: monthLabels[i],
    stock: p.stock,
    incoming: p.incoming || 0,
  }));

  const minStock = Math.min(...data.map(d => d.stock));
  const yMin = Math.min(minStock, prArg ?? prAsia) * 1.1;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString('es')} width={70} domain={[Math.min(0, yMin * 1.1), 'auto']} />
        <Tooltip
          formatter={(v, name) => [v.toLocaleString('es') + ' kg', name]}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />

        <ReferenceLine
          y={prAsia}
          stroke="#dc2626"
          strokeDasharray="6 3"
          label={{ value: `PR Asia ${prAsia.toLocaleString('es')}`, position: 'insideTopRight', fontSize: 10, fill: '#dc2626' }}
        />
        {hasLocal && prArg && (
          <ReferenceLine
            y={prArg}
            stroke="#f97316"
            strokeDasharray="6 3"
            label={{ value: `PR Arg ${prArg.toLocaleString('es')}`, position: 'insideTopRight', fontSize: 10, fill: '#f97316' }}
          />
        )}

        <Line
          type="monotone"
          dataKey="stock"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Stock proyectado (kg)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
