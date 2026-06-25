export const MATERIALS = [
  { id: 'algodon_blanco', name: 'Algodón Blanco', family: 'Algodón', leadTimeAsia: 100, leadTimeArg: 60, hasLocal: true },
  { id: 'algodon_negro',  name: 'Algodón Negro',  family: 'Algodón', leadTimeAsia: 100, leadTimeArg: 60, hasLocal: true },
  { id: 'melange_5',      name: 'Melange 5%',     family: 'Melange', leadTimeAsia: 100, leadTimeArg: null, hasLocal: false },
  { id: 'melange_25',     name: 'Melange 25%',    family: 'Melange', leadTimeAsia: 100, leadTimeArg: null, hasLocal: false },
  { id: 'lycra_blanca',   name: 'Lycra Blanca',   family: 'Lycra',   leadTimeAsia: 80,  leadTimeArg: 45,  hasLocal: true },
  { id: 'lycra_negra',    name: 'Lycra Negra',    family: 'Lycra',   leadTimeAsia: 80,  leadTimeArg: 45,  hasLocal: true },
  { id: 'goma_blanca',    name: 'Goma Blanca',    family: 'Goma',    leadTimeAsia: 80,  leadTimeArg: 30,  hasLocal: true },
  { id: 'goma_negra',     name: 'Goma Negra',     family: 'Goma',    leadTimeAsia: 80,  leadTimeArg: 30,  hasLocal: true },
  { id: 'nylon_blanco',   name: 'Nylon Blanco',   family: 'Nylon',   leadTimeAsia: 80,  leadTimeArg: 45,  hasLocal: true },
  { id: 'nylon_negro',    name: 'Nylon Negro',    family: 'Nylon',   leadTimeAsia: 80,  leadTimeArg: 45,  hasLocal: true },
];

export const DEFAULT_PARAMS = Object.fromEntries(
  MATERIALS.map(m => [m.id, {
    leadTimeAsia: m.leadTimeAsia,
    leadTimeArg:  m.leadTimeArg,
    moqAsia:      14800,  // contenedor 40' — actualizar por material cuando se tenga el dato
    moqArg:       null,
    bufferAsia:   60,
    bufferArg:    30,
  }])
);

export const DEFAULT_PURCHASES = [
  // Algodón Blanco
  { id: 1, materialId: 'algodon_blanco', month: '2026-06', qty: 20208, origin: 'asia' },
  { id: 2, materialId: 'algodon_blanco', month: '2026-07', qty: 7750,  origin: 'asia' },
  { id: 3, materialId: 'algodon_blanco', month: '2026-08', qty: 15500, origin: 'asia' },
  { id: 4, materialId: 'algodon_blanco', month: '2026-09', qty: 15500, origin: 'asia' },
  // Algodón Negro
  { id: 5, materialId: 'algodon_negro',  month: '2026-06', qty: 49105, origin: 'asia' },
  { id: 6, materialId: 'algodon_negro',  month: '2026-07', qty: 23250, origin: 'asia' },
  { id: 7, materialId: 'algodon_negro',  month: '2026-08', qty: 15500, origin: 'asia' },
  { id: 8, materialId: 'algodon_negro',  month: '2026-09', qty: 15500, origin: 'asia' },
  // Melange
  { id: 9,  materialId: 'melange_5',  month: '2026-06', qty: 9900, origin: 'asia' },
  { id: 10, materialId: 'melange_25', month: '2026-06', qty: 9900, origin: 'asia' },
  // Lycra
  { id: 11, materialId: 'lycra_blanca', month: '2026-07', qty: 6200, origin: 'asia' },
  { id: 12, materialId: 'lycra_blanca', month: '2026-08', qty: 3400, origin: 'asia' },
  { id: 13, materialId: 'lycra_negra',  month: '2026-07', qty: 6600, origin: 'asia' },
  { id: 14, materialId: 'lycra_negra',  month: '2026-08', qty: 3100, origin: 'asia' },
  // Goma
  { id: 15, materialId: 'goma_blanca', month: '2026-06', qty: 7000, origin: 'asia' },
  { id: 16, materialId: 'goma_blanca', month: '2026-08', qty: 3000, origin: 'asia' },
  { id: 17, materialId: 'goma_negra',  month: '2026-06', qty: 7000, origin: 'asia' },
  { id: 18, materialId: 'goma_negra',  month: '2026-08', qty: 3000, origin: 'asia' },
  // Nylon
  { id: 19, materialId: 'nylon_blanco', month: '2026-06', qty: 8000, origin: 'asia' },
  { id: 20, materialId: 'nylon_blanco', month: '2026-07', qty: 7000, origin: 'asia' },
  { id: 21, materialId: 'nylon_negro',  month: '2026-06', qty: 7000, origin: 'asia' },
  { id: 22, materialId: 'nylon_negro',  month: '2026-07', qty: 7000, origin: 'asia' },
  // Algodón — nuevas OC Asia (SC 9.001–9.007, shipment + 60 días)
  { id: 23, materialId: 'algodon_negro',  month: '2026-09', qty: 14800, origin: 'asia', supplier: 'SC 9.001' },
  { id: 24, materialId: 'algodon_blanco', month: '2026-09', qty: 7400,  origin: 'asia', supplier: 'SC 9.002' },
  { id: 25, materialId: 'algodon_negro',  month: '2026-09', qty: 7400,  origin: 'asia', supplier: 'SC 9.002' },
  { id: 26, materialId: 'algodon_blanco', month: '2026-10', qty: 14800, origin: 'asia', supplier: 'SC 9.003' },
  { id: 27, materialId: 'algodon_negro',  month: '2026-10', qty: 14800, origin: 'asia', supplier: 'SC 9.004' },
  { id: 28, materialId: 'algodon_blanco', month: '2026-10', qty: 14800, origin: 'asia', supplier: 'SC 9.005' },
  { id: 29, materialId: 'algodon_negro',  month: '2026-11', qty: 14800, origin: 'asia', supplier: 'SC 9.006' },
  { id: 30, materialId: 'algodon_blanco', month: '2026-11', qty: 7400,  origin: 'asia', supplier: 'SC 9.007' },
  { id: 31, materialId: 'algodon_negro',  month: '2026-11', qty: 7400,  origin: 'asia', supplier: 'SC 9.007' },
  // Algodón — compras RONTALTEX (Argentina)
  { id: 32, materialId: 'algodon_blanco', month: '2026-07', qty: 5000,  origin: 'arg', supplier: 'Rontaltex' },
  { id: 33, materialId: 'algodon_blanco', month: '2026-09', qty: 13000, origin: 'arg', supplier: 'Rontaltex' },
  { id: 34, materialId: 'algodon_blanco', month: '2026-10', qty: 22200, origin: 'arg', supplier: 'Rontaltex' },
  { id: 35, materialId: 'algodon_blanco', month: '2026-11', qty: 22200, origin: 'arg', supplier: 'Rontaltex' },
  { id: 36, materialId: 'algodon_negro',  month: '2026-07', qty: 20500, origin: 'arg', supplier: 'Rontaltex' },
  { id: 37, materialId: 'algodon_negro',  month: '2026-08', qty: 20000, origin: 'arg', supplier: 'Rontaltex' },
  { id: 38, materialId: 'algodon_negro',  month: '2026-09', qty: 20000, origin: 'arg', supplier: 'Rontaltex' },
  { id: 39, materialId: 'algodon_negro',  month: '2026-10', qty: 37000, origin: 'arg', supplier: 'Rontaltex' },
  { id: 40, materialId: 'algodon_negro',  month: '2026-11', qty: 22200, origin: 'arg', supplier: 'Rontaltex' },
];

export const DEFAULT_CONSUMPTION = {
  algodon_blanco: 23500,
  algodon_negro:  23500,
  melange_5:      1500,
  melange_25:     500,
  lycra_blanca:   3000,
  lycra_negra:    3000,
  goma_blanca:    3000,
  goma_negra:     3000,
  nylon_blanco:   2000,
  nylon_negro:    2000,
};
