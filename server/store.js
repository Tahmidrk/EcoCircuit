import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, "../data");
const databasePath = path.join(dataDir, "database.json");

const seed = {
  users: [
    {
      id: "usr_admin",
      name: "Ariana Rahman",
      email: "admin@ecocircuit.local",
      passwordHash: bcrypt.hashSync("admin123", 10),
      role: "admin"
    },
    {
      id: "usr_collector",
      name: "Collection Team",
      email: "collector@ecocircuit.local",
      passwordHash: bcrypt.hashSync("collect123", 10),
      role: "collector"
    },
    {
      id: "usr_user",
      name: "Green Heights Resident",
      email: "user@ecocircuit.local",
      passwordHash: bcrypt.hashSync("user123", 10),
      role: "user"
    }
  ],
  items: [
    { id: "EW-1048", category: "Mobile phones", quantity: 18, weight: 4.6, location: "Dhanmondi", lat: 23.7465, lng: 90.376, condition: "Damaged", hazard: "Medium", status: "Recycled", source: "Mobile repair shop", createdAt: "2026-01-12T09:30:00.000Z" },
    { id: "EW-1049", category: "Batteries", quantity: 42, weight: 11.8, location: "Mirpur", lat: 23.8223, lng: 90.3654, condition: "Leaking risk", hazard: "High", status: "Processing", source: "Campus laboratory", createdAt: "2026-02-03T12:15:00.000Z" },
    { id: "EW-1050", category: "Chargers", quantity: 31, weight: 6.2, location: "Uttara", lat: 23.8759, lng: 90.3795, condition: "Used", hazard: "Low", status: "Collected", source: "Household drive", createdAt: "2026-02-22T08:10:00.000Z" },
    { id: "EW-1051", category: "Circuit boards", quantity: 15, weight: 9.4, location: "Tejgaon", lat: 23.7634, lng: 90.4068, condition: "Broken", hazard: "High", status: "Pending", source: "Electronics market", createdAt: "2026-03-08T10:40:00.000Z" },
    { id: "EW-1052", category: "Keyboards & mice", quantity: 24, weight: 13.1, location: "Mohakhali", lat: 23.7808, lng: 90.4071, condition: "Obsolete", hazard: "Low", status: "Recycled", source: "Office campus", createdAt: "2026-03-19T14:20:00.000Z" },
    { id: "EW-1053", category: "Cables", quantity: 57, weight: 17.5, location: "Banani", lat: 23.7937, lng: 90.4066, condition: "Mixed", hazard: "Low", status: "Processing", source: "Repair shop", createdAt: "2026-04-02T11:05:00.000Z" },
    { id: "EW-1054", category: "Screens & monitors", quantity: 9, weight: 47.8, location: "Gulshan", lat: 23.7925, lng: 90.4254, condition: "Cracked", hazard: "Medium", status: "Pending", source: "Corporate office", createdAt: "2026-04-21T07:45:00.000Z" },
    { id: "EW-1055", category: "Batteries", quantity: 28, weight: 8.9, location: "Bashundhara", lat: 23.8196, lng: 90.4383, condition: "Used", hazard: "High", status: "Collected", source: "Community center", createdAt: "2026-05-09T16:00:00.000Z" },
    { id: "EW-1056", category: "Mobile phones", quantity: 21, weight: 5.1, location: "Wari", lat: 23.7174, lng: 90.4173, condition: "Obsolete", hazard: "Medium", status: "Recycled", source: "Household drive", createdAt: "2026-05-27T09:10:00.000Z" },
    { id: "EW-1057", category: "Circuit boards", quantity: 12, weight: 7.7, location: "Farmgate", lat: 23.7572, lng: 90.3898, condition: "Damaged", hazard: "High", status: "Pending", source: "Computer market", createdAt: "2026-06-04T13:25:00.000Z" }
  ],
  pickups: [
    { id: "PK-2041", requester: "North South University Lab", phone: "+880 1711-221144", address: "Bashundhara R/A, Dhaka", location: "Bashundhara", lat: 23.8196, lng: 90.4383, preferredDate: "2026-06-08", category: "Batteries", estimatedWeight: 8.9, notes: "Two sealed storage boxes.", status: "Scheduled", createdAt: "2026-06-02T08:00:00.000Z" },
    { id: "PK-2042", requester: "TechFix Repair Center", phone: "+880 1819-447721", address: "Tejgaon Industrial Area, Dhaka", location: "Tejgaon", lat: 23.7634, lng: 90.4068, preferredDate: "2026-06-07", category: "Circuit boards", estimatedWeight: 9.4, notes: "Loading assistance available.", status: "Pending", createdAt: "2026-06-03T10:30:00.000Z" },
    { id: "PK-2043", requester: "Green Heights Residents", phone: "+880 1912-887733", address: "Road 11, Dhanmondi, Dhaka", location: "Dhanmondi", lat: 23.7465, lng: 90.376, preferredDate: "2026-06-09", category: "Mixed electronics", estimatedWeight: 14.2, notes: "Call security at arrival.", status: "Pending", createdAt: "2026-06-04T15:00:00.000Z" },
    { id: "PK-2044", requester: "Metro Corporate Office", phone: "+880 1677-336655", address: "Gulshan Avenue, Dhaka", location: "Gulshan", lat: 23.7925, lng: 90.4254, preferredDate: "2026-06-10", category: "Screens & monitors", estimatedWeight: 47.8, notes: "Freight elevator reserved.", status: "Scheduled", createdAt: "2026-06-05T09:45:00.000Z" }
  ],
  centers: [
    { id: "CTR-1", name: "EcoCircuit Central Hub", address: "Tejgaon, Dhaka", lat: 23.769, lng: 90.4106, capacity: 1200, currentLoad: 684, phone: "+880 2-55001234" },
    { id: "CTR-2", name: "North Collection Point", address: "Uttara, Dhaka", lat: 23.8759, lng: 90.3795, capacity: 650, currentLoad: 281, phone: "+880 2-58991120" },
    { id: "CTR-3", name: "East Recycling Depot", address: "Bashundhara, Dhaka", lat: 23.8196, lng: 90.4383, capacity: 800, currentLoad: 433, phone: "+880 2-8419902" }
  ]
};

export function ensureStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(databasePath)) {
    fs.writeFileSync(databasePath, JSON.stringify(seed, null, 2));
    return;
  }

  const data = JSON.parse(fs.readFileSync(databasePath, "utf8"));
  let changed = false;
  if (!data.users.some((user) => user.role === "user")) {
    data.users.push(seed.users.find((user) => user.role === "user"));
    changed = true;
  }
  data.pickups.forEach((pickup) => {
    if (!Object.prototype.hasOwnProperty.call(pickup, "assignedTo")) {
      pickup.assignedTo = ["Scheduled", "Completed"].includes(pickup.status) ? "usr_collector" : null;
      changed = true;
    }
    if (!Object.prototype.hasOwnProperty.call(pickup, "requestedBy")) {
      pickup.requestedBy = pickup.id === "PK-2043" ? "usr_user" : null;
      changed = true;
    }
  });
  if (changed) fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

export function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(databasePath, "utf8"));
}

export function writeStore(data) {
  const tempPath = `${databasePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, databasePath);
}

export function nextId(prefix, records) {
  const max = records.reduce((highest, record) => {
    const value = Number(record.id.split("-").pop());
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return `${prefix}-${max + 1}`;
}

export const publicUser = ({ passwordHash, ...user }) => user;
