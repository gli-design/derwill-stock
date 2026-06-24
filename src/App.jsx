import { useState } from 'react';
import { useStore } from './store/useStore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Params from './components/Params';
import Purchases from './components/Purchases';
import ImportExport from './components/ImportExport';

const TABS = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'params',       label: 'Parámetros' },
  { id: 'purchases',    label: 'Compras' },
  { id: 'importexport', label: 'Importar / Exportar' },
];

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('dw_auth') === '1');
  const [tab, setTab] = useState('dashboard');
  const store = useStore();

  if (!loggedIn) {
    return <Login onLogin={() => { sessionStorage.setItem('dw_auth', '1'); setLoggedIn(true); }} />;
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', background: '#fafafa' }}>
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e5e7eb', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ padding: '14px 0' }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>Der Will S.A.</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Gestión de stock · Materia prima</div>
          </div>
          <nav style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '16px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: tab === t.id ? 600 : 400,
                  color: tab === t.id ? '#111827' : '#6b7280',
                  borderBottom: tab === t.id ? '2px solid #111827' : '2px solid transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div style={{ marginLeft: 'auto', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
            {store.syncError ? (
              <span style={{ color: '#ef4444' }}>⚠ Sin conexión a Google Sheets</span>
            ) : store.syncing ? (
              <span style={{ color: '#9ca3af' }}>Sincronizando...</span>
            ) : (
              <span style={{ color: '#10b981' }}>✓ Sincronizado</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>
        {tab === 'dashboard'    && <Dashboard state={store} />}
        {tab === 'params'       && (
          <Params
            params={store.params}
            consumption={store.consumption}
            stockInitial={store.stockInitial}
            updateParams={store.updateParams}
            updateConsumption={store.updateConsumption}
            updateStockInitial={store.updateStockInitial}
          />
        )}
        {tab === 'purchases'    && <Purchases state={store} addPurchase={store.addPurchase} removePurchase={store.removePurchase} />}
        {tab === 'importexport' && <ImportExport state={store} importData={store.importData} />}
      </div>
    </div>
  );
}
