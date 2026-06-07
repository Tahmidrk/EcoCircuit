import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { buildAnalytics } from "./analytics.js";
import { optimizeRoute } from "./optimization.js";
import { ensureStore, nextId, publicUser, readStore, writeStore } from "./store.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const jwtSecret = process.env.JWT_SECRET || "ecocircuit-development-secret";
const currentDir = path.dirname(fileURLToPath(import.meta.url));

ensureStore();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Authentication required." });
  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Your session has expired." });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    return next();
  };
}

function validateCoordinates(lat, lng) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "EcoCircuit API" }));

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = readStore().users.find((candidate) => candidate.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  const profile = publicUser(user);
  const token = jwt.sign(profile, jwtSecret, { expiresIn: "8h" });
  return res.json({ token, user: profile });
});

app.get("/api/overview", authenticate, authorize("admin"), (_req, res) => {
  const data = readStore();
  res.json({
    analytics: buildAnalytics(data.items, data.pickups),
    recentItems: [...data.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    pickups: [...data.pickups].sort((a, b) => a.preferredDate.localeCompare(b.preferredDate)).slice(0, 5),
    centers: data.centers
  });
});

app.get("/api/collector/overview", authenticate, authorize("collector"), (req, res) => {
  const data = readStore();
  const assigned = data.pickups
    .filter((pickup) => pickup.assignedTo === req.user.id && pickup.status !== "Cancelled")
    .sort((a, b) => a.preferredDate.localeCompare(b.preferredDate));
  const active = assigned.filter((pickup) => pickup.status !== "Completed");
  res.json({
    assigned,
    active,
    completed: assigned.filter((pickup) => pickup.status === "Completed").length,
    totalLoad: Number(active.reduce((sum, pickup) => sum + pickup.estimatedWeight, 0).toFixed(1)),
    highRiskItems: data.items.filter((item) => item.hazard === "High" && item.status !== "Recycled").slice(0, 5),
    center: data.centers[0]
  });
});

app.get("/api/user/overview", authenticate, authorize("user"), (req, res) => {
  const data = readStore();
  const requests = data.pickups
    .filter((pickup) => pickup.requestedBy === req.user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totalWeight = requests.reduce((sum, pickup) => sum + pickup.estimatedWeight, 0);
  res.json({
    requests,
    totals: {
      requests: requests.length,
      active: requests.filter((pickup) => !["Completed", "Cancelled"].includes(pickup.status)).length,
      completed: requests.filter((pickup) => pickup.status === "Completed").length,
      weight: Number(totalWeight.toFixed(1))
    },
    impact: {
      landfillAvoided: Number((totalWeight * 0.94).toFixed(1)),
      co2Avoided: Number((requests.filter((pickup) => pickup.status === "Completed").reduce((sum, pickup) => sum + pickup.estimatedWeight, 0) * 2.7).toFixed(1))
    },
    centers: data.centers.map(({ currentLoad, capacity, ...center }) => center)
  });
});

app.get("/api/items", authenticate, (req, res) => {
  if (req.user.role === "user") {
    return res.status(403).json({ message: "Inventory is available to operations staff only." });
  }
  const { search = "", status = "All", category = "All" } = req.query;
  const query = search.toLowerCase();
  const items = readStore().items
    .filter((item) => status === "All" || item.status === status)
    .filter((item) => category === "All" || item.category === category)
    .filter((item) => [item.id, item.category, item.location, item.source].some((value) => value.toLowerCase().includes(query)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(items);
});

app.post("/api/items", authenticate, authorize("admin", "collector"), (req, res) => {
  const { location, lat, lng, source } = req.body;
  const wasteItems = Array.isArray(req.body.wasteItems)
    ? req.body.wasteItems
    : [{ category: req.body.category, quantity: req.body.quantity, weight: req.body.weight, condition: req.body.condition, hazard: req.body.hazard }];
  const validItems = wasteItems.filter(
    (item) => item.category && Number(item.quantity) > 0 && Number(item.weight) > 0
  );
  if (!validItems.length || !location || !source || !validateCoordinates(lat, lng)) {
    return res.status(400).json({ message: "Add at least one valid waste type and choose a source and location." });
  }
  const data = readStore();
  const collectionGroupId = `COL-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const created = validItems.map((entry) => {
    const item = {
      id: nextId("EW", data.items),
      collectionGroupId,
      category: entry.category,
      quantity: Number(entry.quantity),
      weight: Number(entry.weight),
      location,
      lat: Number(lat),
      lng: Number(lng),
      condition: entry.condition || "Used",
      hazard: entry.hazard || "Low",
      status: "Pending",
      source,
      createdAt
    };
    data.items.push(item);
    return item;
  });
  writeStore(data);
  return res.status(201).json({ collectionGroupId, items: created });
});

app.patch("/api/items/:id/status", authenticate, (req, res) => {
  const allowed = ["Pending", "Collected", "Processing", "Recycled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid status." });
  const data = readStore();
  const item = data.items.find((candidate) => candidate.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found." });
  if (req.user.role === "collector" && !(item.status === "Pending" && req.body.status === "Collected")) {
    return res.status(403).json({ message: "Collectors can only mark pending batches as collected." });
  }
  item.status = req.body.status;
  writeStore(data);
  return res.json(item);
});

app.get("/api/pickups", authenticate, (req, res) => {
  const pickups = readStore().pickups
    .filter((pickup) =>
      req.user.role === "admin" ||
      (req.user.role === "collector" && pickup.assignedTo === req.user.id) ||
      (req.user.role === "user" && pickup.requestedBy === req.user.id)
    )
    .sort((a, b) => a.preferredDate.localeCompare(b.preferredDate));
  res.json(pickups);
});

app.post("/api/pickups", authenticate, authorize("admin", "user"), (req, res) => {
  const { requester, phone, address, location, lat, lng, preferredDate, notes } = req.body;
  const wasteItems = Array.isArray(req.body.wasteItems)
    ? req.body.wasteItems
    : [{ category: req.body.category, quantity: req.body.quantity || 1, weight: req.body.estimatedWeight }];
  const validItems = wasteItems.filter(
    (item) => item.category && Number(item.quantity) > 0 && Number(item.weight) > 0
  );
  if (!requester || !phone || !address || !location || !preferredDate || !validItems.length || !validateCoordinates(lat, lng)) {
    return res.status(400).json({ message: "Please complete every required pickup field." });
  }
  const data = readStore();
  const estimatedWeight = validItems.reduce((sum, item) => sum + Number(item.weight), 0);
  const pickup = {
    id: nextId("PK", data.pickups),
    requester,
    phone,
    address,
    location,
    lat: Number(lat),
    lng: Number(lng),
    preferredDate,
    category: validItems.length === 1 ? validItems[0].category : `${validItems.length} waste types`,
    wasteItems: validItems.map((item) => ({
      category: item.category,
      quantity: Number(item.quantity),
      weight: Number(item.weight)
    })),
    estimatedWeight: Number(estimatedWeight.toFixed(1)),
    notes: notes || "",
    status: "Pending",
    assignedTo: null,
    requestedBy: req.user.role === "user" ? req.user.id : null,
    createdAt: new Date().toISOString()
  };
  data.pickups.push(pickup);
  writeStore(data);
  return res.status(201).json(pickup);
});

app.patch("/api/pickups/:id/status", authenticate, (req, res) => {
  const allowed = ["Pending", "Scheduled", "Completed", "Cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid status." });
  const data = readStore();
  const pickup = data.pickups.find((candidate) => candidate.id === req.params.id);
  if (!pickup) return res.status(404).json({ message: "Pickup not found." });
  if (req.user.role === "collector") {
    const canComplete = pickup.assignedTo === req.user.id && pickup.status === "Scheduled" && req.body.status === "Completed";
    if (!canComplete) {
      return res.status(403).json({ message: "Collectors can only complete their assigned scheduled pickups." });
    }
  }
  if (req.user.role === "user") {
    const canCancel = pickup.requestedBy === req.user.id && pickup.status === "Pending" && req.body.status === "Cancelled";
    if (!canCancel) {
      return res.status(403).json({ message: "Users can only cancel their own pending pickup requests." });
    }
  }
  const wasNotAlreadyCompleted = pickup.status !== "Completed" && req.body.status === "Completed";
  pickup.status = req.body.status;
  if (wasNotAlreadyCompleted && pickup.wasteItems && pickup.wasteItems.length) {
    const collectionGroupId = `COL-${Date.now()}`;
    const createdAt = new Date().toISOString();
    pickup.wasteItems.forEach((entry) => {
      const item = {
        id: nextId("EW", data.items),
        collectionGroupId,
        category: entry.category,
        quantity: Number(entry.quantity),
        weight: Number(entry.weight),
        location: pickup.location,
        lat: pickup.lat,
        lng: pickup.lng,
        condition: "Used",
        hazard: "Low",
        status: "Collected",
        source: pickup.requester,
        createdAt
      };
      data.items.push(item);
    });
  }
  writeStore(data);
  return res.json(pickup);
});

app.patch("/api/pickups/:id/assignment", authenticate, authorize("admin"), (req, res) => {
  const data = readStore();
  const pickup = data.pickups.find((candidate) => candidate.id === req.params.id);
  if (!pickup) return res.status(404).json({ message: "Pickup not found." });
  const collector = data.users.find((user) => user.id === req.body.collectorId && user.role === "collector");
  if (req.body.collectorId && !collector) return res.status(400).json({ message: "Collector not found." });
  pickup.assignedTo = collector?.id || null;
  if (collector && pickup.status === "Pending") pickup.status = "Scheduled";
  writeStore(data);
  return res.json(pickup);
});

app.get("/api/collectors", authenticate, authorize("admin"), (_req, res) => {
  res.json(readStore().users.filter((user) => user.role === "collector").map(publicUser));
});

app.get("/api/analytics", authenticate, authorize("admin"), (_req, res) => {
  const data = readStore();
  res.json(buildAnalytics(data.items, data.pickups));
});

app.get("/api/centers", authenticate, (req, res) => {
  const centers = readStore().centers;
  res.json(req.user.role === "admin" ? centers : centers.map(({ currentLoad, capacity, ...center }) => center));
});

app.post("/api/routes/optimize", authenticate, (req, res) => {
  const data = readStore();
  const depot = data.centers.find((center) => center.id === req.body.centerId) || data.centers[0];
  const requestedIds = Array.isArray(req.body.pickupIds) ? req.body.pickupIds : [];
  const stops = data.pickups.filter(
    (pickup) =>
      requestedIds.includes(pickup.id) &&
      !["Completed", "Cancelled"].includes(pickup.status) &&
      (req.user.role === "admin" || pickup.assignedTo === req.user.id)
  );
  const result = optimizeRoute(depot, stops);
  res.json({
    ...result,
    estimatedMinutes: Math.round((result.distance / 24) * 60 + stops.length * 12),
    fuelLiters: Number((result.distance / 9.5).toFixed(1)),
    totalLoad: Number(stops.reduce((sum, stop) => sum + stop.estimatedWeight, 0).toFixed(1))
  });
});

app.use(express.static(path.resolve(currentDir, "../dist")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  return res.sendFile(path.resolve(currentDir, "../dist/index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

app.listen(port, () => {
  console.log(`EcoCircuit API listening on http://localhost:${port}`);
});
