export const STARTING_LM = 200;

export const GAME_CONFIG = Object.freeze({
  currency: { name: "LM", startingBalance: STARTING_LM, maxSafePrice: 1_000_000_000 },
  capacities: { inventory: 15, npc: 20, market: 5 },
  cooldownMinutes: 20,
  boxes: {
    paid: { id: "paid", label: "Caixa Clássica", price: 50, quantityWeights: { 4: 20, 5: 50, 6: 20, 7: 9, 8: 1 }, excludedConditions: [] },
    premium: { id: "premium", label: "Caixa Lacrada", price: 500, quantityWeights: { 4: 20, 5: 50, 6: 20, 7: 9, 8: 1 }, excludedConditions: [], guaranteedSealed: 1 },
    free: { id: "free", label: "Caixa Gratuita", price: 0, quantityWeights: { 2: 100 }, excludedConditions: ["lacrado", "novo"] }
  },
  npcAutoSale: { minMinutes: 3, maxMinutes: 10, maxNotifications: 10 },
  conditions: {
    lacrado: { label: "LACRADO", weight: 1, npcValue: 50 },
    novo: { label: "NOVO", weight: 10, npcValue: 32 },
    seminovo: { label: "SEMINOVO", weight: 24, npcValue: 22 },
    usado: { label: "USADO", weight: 40, npcValue: 16 },
    desgastado: { label: "DESGASTADO", weight: 18, npcValue: 10 },
    danificado: { label: "DANIFICADO", weight: 7, npcValue: 5 }
  },
  // Valores provisórios de balanceamento.
  upgrades: {
    inventory: { label: "Inventário", increase: 5, initialCost: 150, multiplier: 1.7 },
    npc: { label: "Loja NPC", increase: 5, initialCost: 200, multiplier: 1.7 },
    market: { label: "Prateleira", increase: 1, initialCost: 300, multiplier: 2 }
  }
});

export function upgradeCost(type, level = 0) {
  const config = GAME_CONFIG.upgrades[type];
  return config ? Math.round(config.initialCost * config.multiplier ** level) : 0;
}
