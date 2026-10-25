# Nurture Care - Agent Guide

This document provides essential architectural context, technical specifications, and development guidelines for developers and AI agents working on the **Nurture Care** platform.

> [!CAUTION]
> ### STRICT INSTRUCTION FOR AGENTS: NO AUTOMATED BROWSER / DOM CHECKS
> **DO NOT** launch automated browser subagents (`browser_subagent`) or perform automated DOM inspection / UI automation scripts autonomously.
> **ALWAYS ask the user for explicit permission** before running any browser subagent, opening browser pages, or doing DOM checks. Verify frontend/backend logic using direct API requests (e.g. Node scripts, curl, PowerShell), test suites, or by letting the user interact directly with the running dev server in their browser.

---

## 1. Project Overview

**Nurture Care** is a digital healthcare platform that connects patients and families with verified paramedical professionals (registered nurses, physiotherapists, lab technicians, geriatric attendants) for scheduled and on-demand in-home clinical care.

### Core Architecture Highlights
- **Multi-Agency Marketplace & White-Label Dual Mode**:
  - **Marketplace Mode**: Multiple certified healthcare agencies list their services and packages side-by-side, allowing patients to compare pricing, ratings, and response times.
  - **White-Label Mode**: Agencies can operate dedicated branded portals (custom logos, theme colors, agency-specific subdomains/paths).
- **Dynamic Multi-Stage Radial Dispatch** (target design: `implementation.md` §6):
  - Target: broadcast offers to eligible staff within **5 km**, expand in **+5 km** steps up to the agency max radius, first-to-accept wins, then escalate.
  - **Current prototype** (`runStagedDispatch` in `backend/main.go`): no offers/accept flow — after 3 s it auto-assigns the closest online staff within 5 km, else retries at 10 km after another 3 s, else marks the booking `ESCALATED`.
- **Service & Package Architecture**:
  - Master catalogue of standalone clinical procedures (e.g., IV drip, wound dressing, catheterization, vitals check).
  - Standard bundled packages (e.g., Post-Surgical Recovery, Elderly Wellness).
  - On-demand customized packages curated by agency care coordinators with customizable discount margins.
- **Live Visit AV Broadcasting & AI Intelligence**:
  - Encrypted real-time audio/video streaming during visits allowing authorized family members to tune in remotely.
  - Clinical visit notes, vitals recording (BP, SpO2, pulse), OCR data capture, and visit summaries.
- **Integrated In-App Communication**:
  - Real-time messaging between patients and assigned caregivers for confirmed visits.

---

## 2. Tech Stack

### Backend (`/backend`)
- **Language**: Go (`1.22+` / `1.27`)
- **Web Framework**: [Gin Web Framework](https://github.com/gin-gonic/gin) (`github.com/gin-gonic/gin`)
- **Database**: Embedded SQLite via [`modernc.org/sqlite`](https://gitlab.com/cznic/sqlite) (zero external dependencies required for local execution; writes to `backend/nurture_care.db`)
- **Authentication**: JWT token-based authentication (`github.com/golang-jwt/jwt/v5`) with OAuth2 password grant flow
- **Password Security**: `golang.org/x/crypto/bcrypt`
- **Unique Identifiers**: UUID v4 (`github.com/google/uuid`)
- **Concurrency & Geospatial**: In-memory concurrency locks (`sync.Mutex`) and Haversine formula calculation for geo-radius filtering

### Frontend (`/web`)
- **Framework**: React 19 + TypeScript + [Vite](https://vitejs.dev/)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`)
- **Icons**: [Lucide React](https://lucide.react.dev/) (`lucide-react`)
- **Routing**: React Router DOM (`react-router-dom`)
- **Dev Server**: Vite with built-in reverse proxy forwarding `/api` to the Go backend at `http://localhost:8080`

### Mobile (Architecture & Roadmap)
- Cross-platform patient and paramedic applications specified in `implementation.md` and `requirement.md` using React Native + Expo.

---

## 3. Project Structure

```
nurture-care/
├── backend/                             # Go backend service
│   ├── cmd/
│   │   └── api/
│   │       └── main.go                 # Alternative modular binary entry
│   ├── internal/
│   │   ├── modules/
│   │   │   ├── catalog/                # Catalog models and logic
│   │   │   └── dispatch/               # Haversine distance & dispatch math
│   │   └── platform/
│   │       └── db/
│   │           └── sqlite.go           # SQLite schema, tables, and seed data
│   ├── go.mod                          # Go module dependencies
│   ├── go.sum                          # Go checksums
│   ├── main.go                         # Primary API server & router setup (:8080)
│   └── nurture_care.db                 # Auto-generated SQLite database file
├── web/                                # React + Vite frontend application
│   ├── src/
│   │   ├── App.tsx                     # Main application UI, routing, and role views
│   │   ├── main.tsx                    # React DOM root entry
│   │   ├── index.css                   # Tailwind styles and custom styling
│   │   └── vite-env.d.ts               # Vite environment types
│   ├── index.html                      # HTML template
│   ├── package.json                    # Frontend dependencies & npm scripts
│   ├── tsconfig.json                   # TypeScript compiler configuration
│   └── vite.config.ts                  # Vite config with Tailwind & /api proxy
├── requirement.md                      # Complete product requirements document (PRD)
├── implementation.md                   # Technical design & architecture specification
└── agent.md                            # This developer and AI agent guide
```

---

## 4. Getting Started & Local Development

### Prerequisites
- **Go**: Version 1.22 or higher installed ([golang.org](https://go.dev/))
- **Node.js**: Version 18+ and `npm` installed ([nodejs.org](https://nodejs.org/))

### 1. Running the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Start the Go server:
   ```bash
   go run main.go
   ```
3. The server will automatically:
   - Create or open `backend/nurture_care.db`
   - Run SQLite schema migrations
   - Seed default agencies, services, packages, staff, alerts, and demo users
   - Listen on **`http://localhost:8080`**

### 2. Running the Frontend
1. Open a second terminal and navigate to the web directory:
   ```bash
   cd web
   ```
2. Install dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web application in your browser at:
   - **`http://localhost:5173`**
   - API requests to `/api/*` are automatically forwarded to `http://localhost:8080` via Vite's proxy.

---

## 5. Seeded Roles & Test Credentials

The database automatically seeds 5 distinct role profiles with password `12345`:

| Role | Username | Password | Display Name | Associated Entity / Scope |
|---|---|---|---|---|
| **Platform Admin** | `admin` | `12345` | Platform Administrator | Super-admin analytics, global agencies, master catalog, alerts |
| **Agency Director** | `agency` | `12345` | LifeCare Agency Director | LifeCare Home Health (`AG-01`), staff roster, agency services |
| **Care Coordinator** | `care` | `12345` | LifeCare Care Coordinator | LifeCare Home Health (`AG-01`), custom client package builder |
| **Paramedic Staff** | `paramedical` | `12345` | Pooja Sharma, RN | Staff `STF-101`, mobile simulation, active visits, vitals entry |
| **Patient / Family** | `customer` | `12345` | Priya Sharma | Patient `USR-005`, marketplace booking, live tracking, chat |
| **New Customer (OTP)** | Any valid phone/email | Dynamic 6-digit OTP | Customer (`<contact>`) | Auto-provisioned `PATIENT`, passwordless login, unique OTP per contact, scoped bookings/packages |

### Customer Passwordless OTP Flow
- **Request OTP**: `POST /api/v1/auth/otp/request` with `{ "contact": "+91 9999999999" }`. Generates a unique 6-digit random code, broadcasts live via SSE (`/api/v1/notifications/stream`), and records in `user_notifications`.
- **Verify & Auto-Provision**: `POST /api/v1/auth/otp/verify` with `{ "contact": "...", "code": "..." }`. Validates the dynamic code against the latest record. Returns JWT access token and user session (auto-creates `PATIENT` record if first login).
- **Inline Notification Banners**: Both the Booking and Package Enrollment modals show an inline visual notification banner with the dispatched OTP and 1-click Auto-Fill.
- **Strict Data Scoping**: `/api/v1/package-enrollments?role=PATIENT&patientPhone=...` ensures new customers see an isolated dashboard without leaking other accounts' records.


---

## 6. API Reference

All backend endpoints are prefixed with `/api/v1`.

### Authentication
- `POST /api/v1/oauth/token`: Authenticate user using username and password; returns JWT `access_token` and user profile.
- `GET /api/v1/healthz`: Healthcheck endpoint reporting DB and server status.

> [!WARNING]
> No auth middleware exists yet — the JWT is issued but never verified, and the web app does not send it. All routes below are effectively public.

### Catalogs & Packages
- `GET /api/v1/services?agencyId=&customerView=`: Master services and agency-specific services (filtered by agency enablement and custom prices).
- `POST /api/v1/services` / `PUT /api/v1/services/:id`: Create/edit master services or procedures.
- `POST /api/v1/agencies/:id/services`: Toggle agency service enablement and set custom pricing overrides.
- `GET /api/v1/packages?agencyId=&forCustomer=&all=`: List packages (supports both public agency packages and custom packages tagged to `customerId`).
- `POST /api/v1/packages` / `PUT /api/v1/packages/:id`: Create/edit packages with unified service inclusions (`items` array: `serviceId`, `serviceName`, `visits`, `unitPrice`), auto-calculated totals, bundle discount %, and optional `customerId`.

### Agencies & Super-Admin
- `GET /api/v1/agencies` / `POST /api/v1/agencies` / `PUT /api/v1/agencies/:id`
- `GET /api/v1/agency-alerts?agencyId=` / `POST /api/v1/agency-alerts`
- `GET /api/v1/admin/metrics`

### Staff (Paramedical Lifecycle & Dispatch)
- `GET /api/v1/staff?agencyId=` / `POST /api/v1/staff` / `PUT /api/v1/staff/:id`: Staff CRUD supporting multi-select **Clinical Categories** (e.g., `'Nursing, Physiotherapy'`).
- `PATCH /api/v1/staff/:id/duty`: Toggle staff on-duty / off-duty status (`online`).
- `POST /api/v1/staff/:id/verify`: **Step 2 Verification** (`status: 'VERIFIED' | 'REJECTED'`, `comment: string`).
- `POST /api/v1/staff/:id/enable`: **Step 3 Dispatch Enablement** (`enable: boolean`). Requires staff profile to be `VERIFIED` before it can be enabled for live dispatch.

### Bookings, Dispatch & Staff Assignment
- `GET /api/v1/bookings?staffId=&patientPhone=&agencyId=`
- `GET /api/v1/bookings/:id`
- `POST /api/v1/bookings`: Create booking (`SEARCHING`) storing `bookingTime`, default 5.0 km radius, and triggering `runStagedDispatch`.
- `PATCH /api/v1/bookings/:id`: Update status, notes, vitals, prescription, AV fields, and `assignedStaffId` (used by Agency Customer Care for manual staff assignment/reassignment).
- `POST /api/v1/bookings/:id/accept`: **Paramedic One-Click Claim** (`staffId`): Paramedic claims an open/escalated request matching their area and clinical category. Atomically locks and updates booking to `CONFIRMED`.
- `POST /api/v1/bookings/:id/cancel`:
  - `cancelledBy: 'CUSTOMER'`: Cancels booking immediately (`CANCELLED`).
  - `cancelledBy: 'STAFF'`: Tracks declined staff ID and increments `retry_count`.
    - If `retry_count < 3`: posts system notification to chat, resets to `SEARCHING`, and re-triggers `runStagedDispatch` to assign the next available paramedic.
    - If `retry_count >= 3`: permanently cancels booking (`CANCELLED`), clears staff, and posts cancellation notification.

### Chat
- `GET /api/v1/chat-summary`
- `GET /api/v1/bookings/:id/chat` / `POST /api/v1/bookings/:id/chat`

---

## 7. Key Business Logic & Algorithms

### 1. Paramedical Staff 3-Step Onboarding & Dispatch Lifecycle
1. **Step 1: Onboard / Register (`POST /staff`)**: Onboarded in `PENDING` verification status with `is_enabled = 0`. Supports multi-select clinical categories (`Nursing`, `Physiotherapy`, `Elderly Care`, `Lab & Diagnostics`).
2. **Step 2: Credential Verification (`POST /staff/:id/verify`)**: Agency admin reviews licenses, police verification, and credentials, marking the staff `VERIFIED` with an audit comment.
3. **Step 3: Live Dispatch Enablement (`POST /staff/:id/enable`)**: Profile is activated for live matching and dispatch routing. Only verified and enabled staff can receive automated broadcasts or claim visits.

### 2. Unified Package Creation & Pricing Engine
- Single, shared package creation experience across Agency Admin and Customer Care (`showAddModal === 'package'`).
- **Dynamic Inclusions**: Supports picking individual procedures from the catalogue, setting custom visit/session counts, and automatically calculating the retail subtotal.
- **Bundle Discount**: Dynamic % discount slider calculates the net package price and highlights patient savings.
- **Dual Target Scope**: Can be published as a **Public Agency Package** (visible to all customers) or tagged to a specific **Customer/Patient** (with 14-day auto-expiry notice).

### 3. Agency Care Staff Assignment vs. Paramedic Vitals Logging
- **Agency Customer Care Desk**: Provides direct **"Assign Staff" / "Reassign Staff"** modal for open, pending, or escalated visits. Displays eligible on-duty staff sorted with real-time distance (km) and category matching.
- **Paramedic Visit Execution**: Paramedics have exclusive access to the **Vitals Logging form** (BP, $\text{SpO}_2$, Pulse, clinical observations) and visit sign-off. Agency Care and Admin users see a read-only audit log of completed visit notes and AV consultation transcripts.

### 4. Staged Dispatch & Multi-Cancellation Search
Located in `runStagedDispatch` / `findEligibleStaffWithFilter` / `confirmBookingAtomic` in `backend/main.go`:
1. `POST /bookings` inserts the booking as `SEARCHING` with `search_radius_km = 5.0` and specified `booking_time`.
2. Scans `online = 1` staff matching agency and clinical category (excluding busy staff on active bookings and previously declined staff).
3. Closest eligible staff within 5.0 km is assigned.
4. If none found, expands to 10.0 km. If still none found, marks `ESCALATED`.
5. Upon staff cancellation (`POST /bookings/:id/cancel`), up to 3 automated search iterations find the next available caregiver. On the 3rd staff cancellation, the booking is permanently cancelled.

### 5. Booking Status Values
```
SEARCHING ──► CONFIRMED (Staff Assigned) ──► EN_ROUTE (Visit Started) ──► REACHED (Arrived) ──► COMPLETED
    ├──► ESCALATED (Unassigned / Out of Range)
    └──► CANCELLED (By customer or after 3 consecutive staff declines)
```
Transitions are set by the web app via `PATCH /bookings/:id`; the backend does not validate them.

---

## 8. Common Developer Commands

### Backend
```bash
# Run server
cd backend && go run main.go

# Check formatting
cd backend && go fmt ./...

# Build binary
cd backend && go build -o api.exe main.go

# Reset database (deletes local SQLite database; recreated on next run)
rm backend/nurture_care.db
```

### Frontend
```bash
# Install dependencies
cd web && npm install

# Start Vite dev server
cd web && npm run dev

# Type check and build bundle
cd web && npm run build

# Preview production build locally
cd web && npm run preview
```

---

## 9. Troubleshooting & Gotchas

1. **Port Conflicts**:
   - Backend requires port `8080`. If another service occupies port 8080, modify the port parameter in `backend/main.go` and update `vite.config.ts` proxy target accordingly.
   - Frontend runs on port `5173`.
2. **Database Reset**:
   - If schema changes are made to `internal/platform/db/sqlite.go`, delete `backend/nurture_care.db` and re-run `go run main.go` to recreate tables with fresh seed data.
3. **Session Persistence**:
   - The frontend stores the authenticated user in `localStorage` under the key `nc_oauth_user`. If you experience stale authentication state, click **Log Out** in the UI header or clear `localStorage`.
4. **Vite Proxying**:
   - Direct browser calls to `/api/v1/*` are proxied by Vite in development mode. Ensure the backend server is running before testing API requests from the frontend.

---

*This guide serves as the single source of truth for AI agents and human developers maintaining Nurture Care. Keep it updated as new modules or services are introduced.*
