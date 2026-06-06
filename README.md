# EcoCircuit

EcoCircuit is a full-stack e-waste collection, tracking, analytics, and route-optimization platform. It covers the project guideline's web, backend, database, dashboard, logistics, reporting, and environmental-impact requirements. Machine-learning image classification is intentionally excluded.

## Features

- Secure role-aware login with JWT sessions
- Separate administrator and collector workspaces with server-enforced permissions
- Persistent e-waste inventory with search and filters
- Multi-type collections from one source, linked under one collection group
- Interactive map picking for inventory and pickup coordinates
- Manual category, hazard, condition, quantity, weight, source, and location recording
- Pickup request scheduling and status workflow
- Nearest-neighbor plus 2-opt collection-route optimization
- Interactive OpenStreetMap maps with collection centers and route stops
- Dashboard analytics for weight, categories, processing status, and monthly trends
- Estimated recovered material, landfill diversion, and CO2 avoidance
- CSV inventory export and printable analytics report
- Responsive desktop, tablet, and mobile UI
- Seeded demo data for an immediate presentation

## Quick Start

Requirements: Node.js 18 or newer.

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

Demo administrator:

```text
Email: admin@ecocircuit.local
Password: admin123
```

Collector account:

```text
Email: collector@ecocircuit.local
Password: collect123
```

Household/vendor user:

```text
Email: user@ecocircuit.local
Password: user123
```

## Role Permissions

| Capability | Administrator | Collector | User |
| --- | --- | --- | --- |
| Organization dashboard and analytics | Yes | No | No |
| Personal recycling dashboard | No | No | Yes |
| Create pickup requests | Yes | No | Yes |
| Assign pickups to collectors | Yes | No | No |
| View all pickups | Yes | No | No |
| View relevant pickups | All | Assigned | Own requests |
| Optimize collection routes | All active pickups | Assigned pickups only | No |
| Record collected e-waste | Yes | Yes | No |
| Update full recycling workflow | Yes | No | No |
| Mark pending inventory as collected | Yes | Yes | No |
| Complete assigned scheduled pickups | Yes | Yes | No |
| Cancel own pending request | No | No | Yes |
| View drop-off centers | Yes | No | Yes |
| Export inventory | Yes | No | No |

## Production Build

```powershell
npm run build
npm start
```

Open `http://localhost:4000`. Set `JWT_SECRET` to a private value before deploying.

## Verification

```powershell
npm test
npm run build
```

## Project Structure

```text
.
|-- data/                 Persistent JSON database (created on first run)
|-- documentation/        Architecture and API documentation
|-- server/
|   |-- analytics.js      Dashboard and impact calculations
|   |-- index.js          Express REST API
|   |-- optimization.js   Route optimization algorithms
|   |-- store.js          Persistent store and seed data
|   `-- tests/            Node test suite
|-- src/
|   |-- api.js            Authenticated API client
|   |-- App.jsx           Application pages and workflows
|   |-- main.jsx          React entry point
|   `-- styles.css        Responsive visual design system
`-- vite.config.js        Client build and API proxy
```

## Data Persistence

The server creates `data/database.json` on first start. Writes use a temporary file followed by an atomic rename to reduce the risk of a partially written database. Delete this generated file to restore the seeded demonstration data.

## Guideline Coverage

| Guideline area | Implementation |
| --- | --- |
| Central database | Persistent inventory, pickups, users, and collection centers |
| Backend APIs | Auth, inventory, pickup, analytics, center, and optimization endpoints |
| Search/filter | Inventory keyword, category, and status filtering |
| Dashboard | KPIs, charts, recent batches, pickup calendar, and environmental impact |
| Route optimization | Nearest-neighbor baseline improved with 2-opt |
| Map view | OpenStreetMap/Leaflet centers, stops, and optimized route |
| User features | Record waste, request pickup, track status, export data |
| Multi-type collection | Add multiple categories, quantities, and weights at one mapped location |
| Safety | Hazard levels and operational safety guidance in documentation |
| ML classification | Skipped by request; categories are selected manually |

## Important Notes

- Impact figures are planning estimates, not audited carbon-accounting claims.
- Map route lines connect coordinates directly. A production deployment can add a road-routing provider such as OSRM.
- The file-backed store is ideal for a classroom demo. For multi-server production deployment, replace it with PostgreSQL or MySQL.
