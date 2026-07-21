export const STARTING_LM = 200;

export const GAME_CONFIG = Object.freeze({
  currency: { name: "LM", startingBalance: STARTING_LM, maxSafePrice: 1_000_000_000 },
  capacities: { inventory: 15, market: 5 },
  boxes: {
    paid: { id: "paid", label: "Caixa Clássica", price: 50, hourlyStock: 3, quantityWeights: { 4: 20, 5: 50, 6: 20, 7: 9, 8: 1 }, excludedConditions: [] },
    premium: { id: "premium", label: "Caixa Lacrada", price: 500, hourlyStock: 1, quantityWeights: { 4: 20, 5: 50, 6: 20, 7: 9, 8: 1 }, excludedConditions: [], guaranteedSealed: 1 },
    free: { id: "free", label: "Caixa Gratuita", price: 0, hourlyStock: 1, quantityWeights: { 2: 100 }, excludedConditions: ["lacrado", "novo"] }
  },
  conditions: {
    lacrado: { label: "LACRADO", weight: 1, saleValue: 50 },
    novo: { label: "NOVO", weight: 10, saleValue: 32 },
    seminovo: { label: "SEMINOVO", weight: 24, saleValue: 22 },
    usado: { label: "USADO", weight: 40, saleValue: 16 },
    desgastado: { label: "DESGASTADO", weight: 18, saleValue: 10 },
    danificado: { label: "DANIFICADO", weight: 7, saleValue: 5 }
  },
  // Valores provisórios de balanceamento.
  upgrades: {
    inventory: { label: "Inventário", increase: 5, initialCost: 150, multiplier: 1.7 },
    market: { label: "Prateleira", increase: 1, initialCost: 300, multiplier: 2 }
  }
});

export function upgradeCost(type, level = 0) {
  const config = GAME_CONFIG.upgrades[type];
  return config ? Math.round(config.initialCost * config.multiplier ** level) : 0;
}

export function brasiliaHourKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}`;
}

export function freshHourlyBoxStock() {
  return Object.fromEntries(Object.values(GAME_CONFIG.boxes).map((box) => [box.id, box.hourlyStock]));
}
