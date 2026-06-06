const EARTH_RADIUS_KM = 6371;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function distanceKm(a, b) {
  const latDistance = toRadians(b.lat - a.lat);
  const lngDistance = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const value =
    Math.sin(latDistance / 2) ** 2 +
    Math.sin(lngDistance / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(value));
}

function routeDistance(route) {
  return route.slice(1).reduce((sum, point, index) => sum + distanceKm(route[index], point), 0);
}

function nearestNeighbor(depot, stops) {
  const remaining = [...stops];
  const route = [depot];
  let current = depot;

  while (remaining.length) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    remaining.forEach((stop, index) => {
      const distance = distanceKm(current, stop);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    current = remaining.splice(nearestIndex, 1)[0];
    route.push(current);
  }
  route.push(depot);
  return route;
}

function twoOpt(route) {
  let best = [...route];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 2; i += 1) {
      for (let j = i + 1; j < best.length - 1; j += 1) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1)
        ];
        if (routeDistance(candidate) + 0.001 < routeDistance(best)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return best;
}

export function optimizeRoute(depot, stops) {
  if (!stops.length) {
    return { route: [depot], distance: 0, baselineDistance: 0, savings: 0 };
  }
  const baselineRoute = [depot, ...stops, depot];
  const optimized = twoOpt(nearestNeighbor(depot, stops));
  const baselineDistance = routeDistance(baselineRoute);
  const distance = routeDistance(optimized);

  return {
    route: optimized,
    distance: Number(distance.toFixed(1)),
    baselineDistance: Number(baselineDistance.toFixed(1)),
    savings: Number(Math.max(0, baselineDistance - distance).toFixed(1))
  };
}
