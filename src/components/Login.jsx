import { useState } from 'react';

const PASSWORD = 'derwill2026';

export default function Login({ onLogin }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (input === PASSWORD) {
      onLogin();
    } else {
      setError(true);
      setInput('');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12,
        padding: '40px 48px', width: 340, textAlign: 'center',
      }}>
        <div style={{ fontWeight: 600, fontSize: 20, color: '#111827', marginBottom: 4 }}>Der Will S.A.</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 32 }}>Gestión de stock · Materia prima</div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="Contraseña"
            autoFocus
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14,
              border: `1px solid ${error ? '#fca5a5' : '#d1d5db'}`,
              borderRadius: 8, outline: 'none', marginBottom: 12,
              background: error ? '#fff5f5' : '#fff',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>
              Contraseña incorrecta
            </div>
          )}
          <button type="submit" style={{
            width: '100%', padding: '10px', fontSize: 14, fontWeight: 500,
            background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
          }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
