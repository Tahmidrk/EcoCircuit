# System Architecture

## Overview

EcoCircuit follows a client-server architecture:

```text
React web application
        |
        | JSON over authenticated REST APIs
        v
Express application server
        |
        +-- Authentication and validation
        +-- Analytics and environmental estimates
        +-- Collection-route optimization
        |
        v
Persistent JSON data store
```

The browser never reads or writes the data file directly. All data changes pass through the API, which validates fields and controls status values.

## Main Workflows

### E-Waste Registration

1. An authenticated user opens Inventory.
2. The user selects the category manually and records quantity, weight, condition, hazard, source, and coordinates.
3. The API validates positive quantities, positive weight, and valid numeric coordinates.
4. The record receives a unique batch ID and starts at `Pending`.
5. Status can progress through `Collected`, `Processing`, and `Recycled`.

### Pickup Management

1. A user submits requester, contact, location, date, category, and estimated load.
2. The request starts at `Pending`.
3. Operations staff schedule, complete, or cancel it.
4. Active requests become available in the route planner.

### Route Optimization

1. Staff select a collection center and active pickup requests.
2. Nearest-neighbor constructs a fast initial route.
3. A 2-opt local search repeatedly removes route crossings and shorter alternatives.
4. The API returns ordered stops, distance, baseline savings, time, fuel, and expected load.

The distance model uses the Haversine formula. Estimated driving time assumes 24 km/h plus 12 minutes of service time per pickup. Fuel assumes 9.5 km/L.

## Analytics

Analytics are calculated from the live inventory:

- Total recorded weight and item quantity
- Recycled weight and recycling rate
- Active pickup count
- Unrecycled high-risk batch count
- Category and status breakdowns
- Monthly collection trend
- Estimated recoverable material
- Estimated landfill diversion and CO2 avoidance

These environmental values are educational estimates and should be replaced with locally audited factors for official reporting.

## Security

- Passwords are stored as bcrypt hashes.
- Login returns an eight-hour JWT.
- Protected API endpoints require `Authorization: Bearer <token>`.
- Administrators see organization-wide data, collectors see assigned work, and
  household/vendor users see only pickup requests owned by their account.
- Request payloads are validated before persistence.
- Allowed workflow statuses are enforced server-side.

For production, also add HTTPS, rate limiting, secure cookie sessions or hardened token storage, password reset, audit logs, and database backups.

## Safety Guidance

- Do not handle swollen, punctured, or leaking batteries without trained personnel.
- Keep batteries dry, isolate terminals, and use fire-resistant containers where required.
- Wear gloves when handling circuit boards and broken screens.
- Do not dismantle hazardous devices during collection.
- Store categories separately and label high-risk batches.
- Follow applicable municipal and national e-waste regulations.

## Machine Learning Scope

Image classification is deliberately omitted. Users choose the e-waste category in the registration form. The API and database model can later accept fields such as `classificationSource`, `modelVersion`, and `confidence` without changing the core workflows.
