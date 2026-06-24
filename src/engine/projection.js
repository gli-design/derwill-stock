// Returns reorder points for a material given params and avg monthly consumption
export function calcReorderPoints(consumption, params, hasLocal) {
  const prAsia = consumption * (params.leadTimeAsia / 30 + params.bufferAsia / 30);
  const prArg  = hasLocal
    ? consumption * (params.leadTimeArg / 30 + params.bufferArg / 30)
    : null;
  return { prAsia, prArg };
}

// Returns array of { month (YYYY-MM), stock } projections
// purchases: [{ materialId, month: 'YYYY-MM', qty }]
export function projectStock(materialId, initialStock, consumption, purchases, months) {
  const result = [];
  let stock = initialStock;

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // add purchases arriving this month
    const incoming = purchases
      .filter(p => p.materialId === materialId && p.month === monthKey)
      .reduce((sum, p) => sum + p.qty, 0);

    stock = stock + incoming - consumption;
    result.push({ month: monthKey, stock: Math.round(stock), incoming });
  }
  return result;
}

// Returns semaphore status: 'green' | 'yellow' | 'orange' | 'red'
// monthIndex + projection allow looking ahead to check if stock survives until order arrives
export function getStatus(monthIndex, projection, prAsia, prArg, hasLocal, leadTimeAsia, leadTimeArg) {
  const stock = projection[monthIndex]?.stock ?? 0;

  if (stock < 0) return 'red';

  if (stock >= prAsia) return 'green';

  // Check if stock survives until an Asia order placed this month would arrive
  const asiaMonths = Math.ceil((leadTimeAsia ?? 100) / 30);
  const stockUntilAsia = projection
    .slice(monthIndex, monthIndex + asiaMonths)
    .map(p => p.stock);
  const survivesAsia = stockUntilAsia.length > 0 && Math.min(...stockUntilAsia) > 0;

  if (!hasLocal) {
    // No backup: yellow = below PR but Asia still viable, red = can't survive Asia lead time
    return survivesAsia ? 'yellow' : 'red';
  }

  if (survivesAsia) return 'yellow'; // below PR_Asia but Asia order still saves us

  // Asia too late — check if Argentina is viable
  const argMonths = Math.ceil((leadTimeArg ?? 45) / 30);
  const stockUntilArg = projection
    .slice(monthIndex, monthIndex + argMonths)
    .map(p => p.stock);
  const survivesArg = stockUntilArg.length > 0 && Math.min(...stockUntilArg) > 0;

  return survivesArg ? 'orange' : 'red';
}

// Suggested purchase qty rounded up to MOQ
export function suggestPurchase(targetStock, currentProjected, moq) {
  const needed = Math.max(0, targetStock - currentProjected);
  if (needed === 0) return { needed: 0, willReceive: 0 };
  if (!moq || moq <= 0) return { needed, willReceive: needed };
  const willReceive = Math.ceil(needed / moq) * moq;
  return { needed: Math.round(needed), willReceive };
}
