# HRMS Attendance Engine

> High-throughput enterprise attendance engine with Haversine geofence verification, biometric punch debouncing, shift matching, and overtime calculation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

---

## Architectural Overview

The **HRMS Attendance Engine** is designed for enterprise workforces operating across physical campuses, factory floors, and distributed offices. It ingests high-frequency clock-in and clock-out punches from biometric terminals and mobile applications, executing sub-millisecond geofence verification and shift schedule reconciliation.

```
[Biometric Terminal / Mobile App]
                │
                ▼ (POST /api/attendance/punch)
      [Haversine Geofence Validator]
      ├── Radius check against campus polygon
      └── Reject out-of-boundary spoofed punches
                │
                ▼
       [Punch Debounce Filter]
       ├── Suppress accidental duplicate punches (<60s)
       └── Atomic sequence ordering (IN before OUT)
                │
                ▼
      [Shift Policy Engine]
      ├── Match against scheduled shift hours & grace window
      └── Compute regular work hours vs overtime threshold
```

---

## Core Capabilities

1. **Haversine Geofencing**: Computes exact geodesic distance between punch coordinates and authorized facility centers, rejecting attempts outside radius boundaries.
2. **Biometric Debouncing**: High-volume punch buffer prevents double-logging when employees rapidly swipe badges or retry mobile check-ins.
3. **Automated Overtime Reconciliation**: Applies shift-specific grace periods, late arrival flags, and overtime allocation rules.

---

## Quick Start & Installation

```bash
# Clone the repository
git clone https://github.com/monkey9-Cyber-cat-Spidy/hrms-attendance-engine.git
cd hrms-attendance-engine

# Install dependencies
npm install

# Run test suite
npm test

# Build production bundle
npm run build

# Start server
npm start
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status |
| `POST` | `/api/attendance/punch` | Ingest employee punch with GPS and biometric metadata |
| `GET` | `/api/attendance/summary/:employeeId` | Retrieve daily attendance reconciliation and overtime math |

---

## Author

**Kuncham Venkata Satya Manikanta**
* Portfolio: [aiengineer.kunchamvenkatasatyamanikanta.online](https://aiengineer.kunchamvenkatasatyamanikanta.online/)
* GitHub: [@monkey9-Cyber-cat-Spidy](https://github.com/monkey9-Cyber-cat-Spidy)
* LinkedIn: [kuncham-venkata-satya-manikanta](https://www.linkedin.com/in/kuncham-venkata-satya-manikanta-9715a4321/)
