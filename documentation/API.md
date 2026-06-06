# REST API Reference

Base URL during development: `http://localhost:4000/api`

Except for health and login, endpoints require:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

Role authorization is enforced by the API. Administrator-only endpoints return
`403 Forbidden` for collector tokens.

## Authentication

### `POST /auth/login`

```json
{
  "email": "admin@ecocircuit.local",
  "password": "admin123"
}
```

Returns a JWT and public user profile.

## Overview

### `GET /overview`

Administrator only. Returns dashboard analytics, recent inventory, upcoming
pickups, and centers.

### `GET /collector/overview`

Collector only. Returns assigned work, expected load, completed count, safety
priorities, and the return hub.

### `GET /user/overview`

User only. Returns the authenticated user's request totals, latest request
history, personal impact estimates, and public collection-center information.

## Inventory

### `GET /items`

Optional query parameters: `search`, `status`, and `category`.

### `POST /items`

```json
{
  "location": "Dhanmondi",
  "lat": 23.7465,
  "lng": 90.376,
  "source": "Campus laboratory",
  "wasteItems": [
    {
      "category": "Batteries",
      "quantity": 12,
      "weight": 4.5,
      "condition": "Used",
      "hazard": "High"
    },
    {
      "category": "Chargers",
      "quantity": 8,
      "weight": 1.6,
      "condition": "Damaged",
      "hazard": "Low"
    }
  ]
}
```

Each waste type becomes an individual traceable inventory batch. All batches
created in the same request share a `collectionGroupId` and mapped location.

### `PATCH /items/:id/status`

Allowed values: `Pending`, `Collected`, `Processing`, `Recycled`.

```json
{ "status": "Collected" }
```

## Pickups

### `GET /pickups`

Administrators receive all pickup requests. Collectors receive only requests
assigned to their user ID. Users receive only requests owned by their account.

### `POST /pickups`

Administrator and user roles. User-created requests automatically store the
authenticated account as `requestedBy`.

```json
{
  "requester": "Example University",
  "phone": "+880 1700-000000",
  "address": "Dhaka",
  "location": "Dhanmondi",
  "lat": 23.7465,
  "lng": 90.376,
  "preferredDate": "2026-06-12",
  "wasteItems": [
    { "category": "Mobile phones", "quantity": 4, "weight": 1.2 },
    { "category": "Cables", "quantity": 10, "weight": 3.5 }
  ],
  "notes": "Call before arrival."
}
```

`estimatedWeight` is calculated by the server from the waste-item rows.

### `PATCH /pickups/:id/status`

Allowed values: `Pending`, `Scheduled`, `Completed`, `Cancelled`.

Collectors may only change their own assigned pickup from `Scheduled` to
`Completed`.

Users may only change their own request from `Pending` to `Cancelled`.

### `PATCH /pickups/:id/assignment`

Administrator only. Assigns or unassigns a collector. Assigning a pending
request automatically schedules it.

### `GET /collectors`

Administrator only. Returns collector profiles for assignment controls.

## Analytics and Centers

### `GET /analytics`

Administrator only. Returns totals, category/status/monthly series, and impact
estimates.

### `GET /centers`

Returns all collection centers and capacity data.

## Route Optimization

### `POST /routes/optimize`

```json
{
  "centerId": "CTR-1",
  "pickupIds": ["PK-2041", "PK-2042", "PK-2043"]
}
```

Returns the ordered route, total and baseline distances, savings, estimated time, fuel, and load.

## Health

### `GET /health`

Returns API availability and service name.
