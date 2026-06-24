import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_PARAMS, DEFAULT_CONSUMPTION, DEFAULT_PURCHASES, MATERIALS } from '../data/initialData';

const API_URL = 'https://script.google.com/a/macros/derwill.com.ar/s/AKfycbxJREQNw9bh55IJQtSRoTsK06Nd-safyKr0Ei--pWjgVuQ_zKXLBXJynV33meS6XI-f/exec';
const CACHE_KEY = 'derWillStock_cache';

function getDefaultState() {
  return {
    params:       DEFAULT_PARAMS,
    consumption:  DEFAULT_CONSUMPTION,
    stockInitial: Object.fromEntries(MATERIALS.map(m => [m.id, 0])),
    purchases:    DEFAULT_PURCHASES,
    cutoffDate:   new Date().toISOString().slice(0, 7),
  };
}

function mergeWithDefaults(saved) {
  const def = getDefaultState();
  return {
    params:       saved?.params       ?? def.params,
    consumption:  saved?.consumption  ?? def.consumption,
    stockInitial: saved?.stockInitial ?? def.stockInitial,
    purchases:    saved?.purchases    ?? def.purchases,
    cutoffDate:   saved?.cutoffDate   ?? def.cutoffDate,
  };
}

async function fetchFromSheets() {
  const res = await fetch(API_URL);
  const text = await res.text();
  if (!text || text === '{}') return null;
  return JSON.parse(text);
}

async function saveToSheets(data) {
  await fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function useStore() {
  // Start from localStorage cache for instant render, then sync with Sheets
  const [state, setState] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return mergeWithDefaults(JSON.parse(cached));
    } catch {}
    return getDefaultState();
  });
  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState(false);
  const saveTimer = useRef(null);
  const isFirstLoad = useRef(true);

  // Load from Sheets on mount
  useEffect(() => {
    fetchFromSheets()
      .then(data => {
        if (data) {
          const merged = mergeWithDefaults(data);
          setState(merged);
          localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        }
      })
      .catch(() => setSyncError(true))
      .finally(() => setSyncing(false));
  }, []);

  // Save to Sheets on every state change (debounced 1.5s), skip first render
  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToSheets(state).catch(() => setSyncError(true));
    }, 1500);
  }, [state]);

  const updateParams = useCallback((materialId, field, value) => {
    setState(s => ({
      ...s,
      params: { ...s.params, [materialId]: { ...s.params[materialId], [field]: value === '' ? null : Number(value) } },
    }));
  }, []);

  const updateConsumption = useCallback((materialId, value) => {
    setState(s => ({ ...s, consumption: { ...s.consumption, [materialId]: Number(value) } }));
  }, []);

  const updateStockInitial = useCallback((materialId, value) => {
    setState(s => ({ ...s, stockInitial: { ...s.stockInitial, [materialId]: Number(value) } }));
  }, []);

  const addPurchase = useCallback((purchase) => {
    setState(s => ({ ...s, purchases: [...s.purchases, { ...purchase, id: Date.now() }] }));
  }, []);

  const removePurchase = useCallback((id) => {
    setState(s => ({ ...s, purchases: s.purchases.filter(p => p.id !== id) }));
  }, []);

  const importData = useCallback((data) => {
    setState(s => ({ ...s, ...data }));
  }, []);

  return {
    ...state,
    syncing,
    syncError,
    updateParams,
    updateConsumption,
    updateStockInitial,
    addPurchase,
    removePurchase,
    importData,
  };
}
