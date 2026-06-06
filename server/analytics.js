const MATERIAL_RECOVERY_RATE = {
  "Mobile phones": 0.82,
  Batteries: 0.65,
  Chargers: 0.72,
  "Circuit boards": 0.88,
  "Keyboards & mice": 0.76,
  Cables: 0.81,
  "Screens & monitors": 0.71
};

export function buildAnalytics(items, pickups) {
  const totalWeight = items.reduce((sum, item) => sum + Number(item.weight), 0);
  const recycledWeight = items
    .filter((item) => item.status === "Recycled")
    .reduce((sum, item) => sum + Number(item.weight), 0);

  const categoryMap = new Map();
  const statusMap = new Map();
  const monthlyMap = new Map();

  items.forEach((item) => {
    const category = categoryMap.get(item.category) || { name: item.category, weight: 0, quantity: 0 };
    category.weight += Number(item.weight);
    category.quantity += Number(item.quantity);
    categoryMap.set(item.category, category);

    statusMap.set(item.status, (statusMap.get(item.status) || 0) + Number(item.weight));

    const date = new Date(item.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(item.weight));
  });

  const recoveredMaterials = items.reduce(
    (sum, item) => sum + Number(item.weight) * (MATERIAL_RECOVERY_RATE[item.category] || 0.7),
    0
  );

  return {
    totals: {
      weight: Number(totalWeight.toFixed(1)),
      items: items.reduce((sum, item) => sum + Number(item.quantity), 0),
      recycledWeight: Number(recycledWeight.toFixed(1)),
      recoveryRate: totalWeight ? Number(((recycledWeight / totalWeight) * 100).toFixed(1)) : 0,
      activePickups: pickups.filter((pickup) => !["Completed", "Cancelled"].includes(pickup.status)).length,
      highRisk: items.filter((item) => item.hazard === "High" && item.status !== "Recycled").length
    },
    categories: [...categoryMap.values()]
      .map((value) => ({ ...value, weight: Number(value.weight.toFixed(1)) }))
      .sort((a, b) => b.weight - a.weight),
    statuses: [...statusMap].map(([name, value]) => ({ name, value: Number(value.toFixed(1)) })),
    monthly: [...monthlyMap]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, weight]) => ({
        month: new Date(`${month}-01T00:00:00`).toLocaleString("en", { month: "short" }),
        weight: Number(weight.toFixed(1))
      })),
    impact: {
      recoveredMaterials: Number(recoveredMaterials.toFixed(1)),
      landfillAvoided: Number((totalWeight * 0.94).toFixed(1)),
      co2Avoided: Number((recycledWeight * 2.7).toFixed(1)),
      treesEquivalent: Math.round(recycledWeight * 2.7 / 21)
    }
  };
}
