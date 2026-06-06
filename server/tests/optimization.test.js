import test from "node:test";
import assert from "node:assert/strict";
import { distanceKm, optimizeRoute } from "../optimization.js";

test("distance calculation returns zero for the same point", () => {
  assert.equal(distanceKm({ lat: 23.8, lng: 90.4 }, { lat: 23.8, lng: 90.4 }), 0);
});

test("optimized route starts and ends at the depot", () => {
  const depot = { id: "D", lat: 23.77, lng: 90.41 };
  const stops = [
    { id: "A", lat: 23.82, lng: 90.44 },
    { id: "B", lat: 23.75, lng: 90.38 },
    { id: "C", lat: 23.88, lng: 90.38 }
  ];
  const result = optimizeRoute(depot, stops);
  assert.equal(result.route[0].id, "D");
  assert.equal(result.route.at(-1).id, "D");
  assert.equal(result.route.length, 5);
  assert.ok(result.distance <= result.baselineDistance);
});
