# MTS — Architecture & Turnover Documentation

> **MIS Ticketing System (MTS)** — Internal IT support ticketing platform built on Laravel + React/Inertia.js with real-time notifications, SSO authentication, and role-based access control.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Authentication & SSO Flow](#4-authentication--sso-flow)
5. [Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
6. [Ticket Lifecycle](#6-ticket-lifecycle)
7. [Database Architecture](#7-database-architecture)
8. [Backend Architecture](#8-backend-architecture)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Real-time Notifications](#10-real-time-notifications)
11. [API Routes Reference](#11-api-routes-reference)
12. [Key Data Flows](#12-key-data-flows)
13. [Security](#13-security)
14. [Deployment & Configuration](#14-deployment--configuration)
15. [Maintenance & Operations](#15-maintenance--operations)
16. [Troubleshooting Guide](#16-troubleshooting-guide)

---

## 1. System Overview

MTS is an **internal MIS IT support ticketing system**. Employees submit tickets for IT-related issues (hardware, software, network, etc.), and MIS support staff process, resolve, and close them. The system supports real-time notifications, analytics dashboards, and multi-role workflows.

**Core Features:**

- Ticket creation, tracking, and lifecycle management
- Role-based visibility and actions
- Real-time push notifications via WebSockets
- Analytics dashboard with charts (response time, closure rate, Pareto, ratings)
- Auto-close tickets after 24 hours of resolution without acknowledgement
- SSO integration with external Authify system
- Multi-database: main app, employee masterlist, SSO, inventory

---

## 2. Technology Stack

### Backend

| Technology      | Version | Purpose                                       |
| --------------- | ------- | --------------------------------------------- |
| Laravel         | 12.0    | PHP Framework                                 |
| PHP             | 8.2+    | Server Runtime                                |
| Inertia.js      | 2.0     | SPA adapter (renders React pages server-side) |
| Laravel Sanctum | —       | API authentication                            |
| Laravel Reverb  | —       | WebSocket server (broadcasting)               |

### Frontend

| Technology       | Version | Purpose                                   |
| ---------------- | ------- | ----------------------------------------- |
| React            | 18.2.0  | UI Library                                |
| Vite             | 6.2.4   | Build Tool                                |
| Ant Design       | 5.29.0  | UI Components (tables, forms, drawers)    |
| @inertiajs/react | 2.0     | Inertia React adapter                     |
| Tailwind CSS     | 3.2.1   | Utility CSS                               |
| DaisyUI          | 5.0.43  | Tailwind component library                |
| Recharts         | —       | Dashboard charts                          |
| Zustand          | 5.0.6   | State management (available, not primary) |

### Databases

| Connection Name   | Purpose                                     | Env Prefix |
| ----------------- | ------------------------------------------- | ---------- |
| `mysql` (default) | Tickets, logs, notifications, request types | `DB_*`     |
| `masterlist`      | Employee master records                     | `MDB_*`    |
| `authify`         | SSO session tokens                          | `ADB_*`    |
| `inventory`       | Hardware, printer, terminal assets          | `IDB_*`    |

---

## 3. Project Structure

```
mts/
├── app/
│   ├── Constants/
│   │   └── TicketRequestTypes.php       # Hardcoded request type definitions
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthenticationController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── TicketingController.php
│   │   │   ├── ApproverController.php
│   │   │   ├── TicketRequestTypeController.php
│   │   │   └── General/
│   │   │       ├── ProfileController.php
│   │   │       └── AdminController.php
│   │   ├── Middleware/
│   │   │   ├── AuthMiddleware.php       # SSO token validation
│   │   │   ├── SupportMiddleware.php    # Support/supervisor-only access
│   │   │   ├── AdminMiddleware.php      # Admin-only access
│   │   │   ├── HandleInertiaRequests.php# Shares session data to frontend
│   │   │   └── CorsMiddleware.php       # CORS for API
│   │   └── Requests/                    # Laravel FormRequest validators
│   ├── Models/
│   │   ├── Ticket.php                   # ticketing_support table
│   │   ├── User.php                     # employee_masterlist (masterlist DB)
│   │   ├── TicketLogs.php               # ticket_logs table
│   │   ├── NotificationUser.php         # notification_users table
│   │   ├── Hardware.php                 # inventory DB
│   │   ├── Printer.php                  # inventory DB
│   │   └── Terminal.php                 # inventory DB
│   ├── Repositories/
│   │   ├── TicketRepository.php
│   │   ├── TicketDashboardRepository.php
│   │   ├── UserRepository.php
│   │   ├── ApproverRepository.php
│   │   └── TicketRequestTypeRepository.php
│   └── Services/
│       ├── TicketService.php
│       ├── NotificationService.php
│       ├── UserRoleService.php
│       ├── DashboardService.php
│       ├── TicketStatusService.php
│       ├── TicketRequestTypeService.php
│       ├── ApproverService.php
│       └── DataTableService.php
├── routes/
│   ├── web.php                          # Root + requires sub-route files
│   ├── api.php                          # REST API + broadcast auth
│   ├── auth.php                         # Logout, unauthorized
│   ├── ticketing.php                    # Ticket CRUD
│   ├── admin.php                        # Admin-only routes
│   ├── general.php                      # Dashboard, profile
│   └── channels.php                     # Broadcast channel auth
├── resources/js/
│   ├── Pages/
│   │   ├── Dashboard/Dashboard.jsx
│   │   ├── Ticketing/
│   │   │   ├── Create.jsx
│   │   │   └── Table.jsx
│   │   ├── Admin/
│   │   │   ├── Admin.jsx
│   │   │   ├── RequestType.jsx
│   │   │   └── ApproverList.jsx
│   │   └── Authentication/Login.jsx
│   ├── Components/
│   │   ├── sidebar/
│   │   │   ├── SideBar.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── SidebarLink.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   └── ThemeToggler.jsx
│   │   ├── ticketing/
│   │   │   ├── TicketForm.jsx
│   │   │   ├── TicketDetailsDrawer.jsx
│   │   │   ├── TicketLogs.jsx
│   │   │   ├── TicketLogsModal.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── DurationCell.jsx
│   │   │   └── EmployeeInfo.jsx
│   │   ├── requestType/
│   │   │   └── RequestTypeDrawer.jsx
│   │   ├── NavBar.jsx
│   │   ├── NotificationBell.jsx
│   │   └── DataTable.jsx
│   ├── Hooks/
│   │   ├── useTicketForm.js
│   │   ├── useTicketTable.js
│   │   ├── useTicketDrawer.js
│   │   ├── useTicketActions.js
│   │   ├── useTicketColumns.js
│   │   ├── useRequestTypeDrawer.js
│   │   └── useRealtimeTicketUpdates.js
│   ├── Context/
│   │   ├── NotificationContext.jsx      # Real-time notifications
│   │   └── ThemeContext.jsx             # Dark/light mode
│   └── Layouts/
│       └── AuthenticatedLayout.jsx
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
└── config/
```

---

## 4. Authentication & SSO Flow

### Overview

MTS does **not** have its own login form. All authentication is handled by an external **Authify** SSO system at `http://192.168.2.221:8200`.

### Step-by-Step Auth Flow

```
Browser Request
      │
      ▼
AuthMiddleware.php
      │
      ├── Check token (3 sources, in priority order):
      │     1. Query param:  ?key={token}
      │     2. Cookie:       sso_token
      │     3. Session:      emp_data.token
      │
      ├── No token found?
      │     └─► Redirect to Authify: http://192.168.2.221:8200/login
      │          (Authify redirects back with ?key={token} after login)
      │
      ├── Token found → Validate against authify DB:
      │     SELECT * FROM authify_sessions WHERE token = ?
      │
      ├── Invalid token?
      │     └─► Clear session & redirect to Authify login
      │
      ├── emp_from field not empty?
      │     └─► Redirect to /unauthorized (access denied)
      │
      ├── Valid token → Load user data into session:
      │     session('emp_data') = {
      │       token, emp_id, emp_name, emp_firstname,
      │       emp_jobtitle, emp_dept, emp_prodline,
      │       emp_station, emp_system_roles, emp_user_roles
      │     }
      │
      ├── Store token in cookie (7 days)
      │
      └── Proceed to requested route
```

### Session Structure

```php
session('emp_data') = [
    'token'            => 'abc123...',          // SSO token
    'emp_id'           => 'EMP001',             // Employee ID
    'emp_name'         => 'DELA CRUZ, JUAN C.', // Full name
    'emp_firstname'    => 'Juan',               // First name
    'emp_jobtitle'     => 'MIS Support Technician',
    'emp_dept'         => 'MIS',
    'emp_prodline'     => 'PROD LINE A',
    'emp_station'      => 'Station 1',
    'emp_system_roles' => ['supervisor', 'support', 'senior approver'],
    'emp_user_roles'   => ['MIS_SUPERVISOR', 'SUPPORT_TECHNICIAN', 'SENIOR_APPROVER'],
]
```

### Logout Flow

```
User clicks Logout
      │
      ▼
AuthenticationController::logout()
      │
      ├── Get token from session
      ├── Clear session (emp_data)
      ├── Invalidate session
      └── Redirect to: http://192.168.2.221:8200/logout?token={token}&redirect={app_url}
```

---

## 5. Role-Based Access Control (RBAC)

### Role Determination

Roles are computed by `UserRoleService` based on the employee's **job title** from the Authify session and database lookups.

```
emp_jobtitle (from Authify)
      │
      ├── "MIS Senior Supervisor"     → system_role: supervisor
      │                                 user_role: MIS_SUPERVISOR
      │
      ├── "MIS Support Technician"    → system_role: support
      │   "Network Technician"          user_role: SUPPORT_TECHNICIAN
      │
      ├── ID exists in               → system_role: senior approver
      │   senior_support_approver      user_role: SENIOR_APPROVER
      │   table
      │
      ├── Operations Director         → user_role: OD
      │
      ├── ID in APPROVER1/2/3         → user_role: DEPARTMENT_HEAD
      │   of any employee
      │
      └── (none matched)              → user_role: UNKNOWN
```

> A user can have **multiple roles** simultaneously (e.g., a supervisor who is also a senior approver).

### Role Definitions & Permissions

| Role                   | Description               | Ticket Visibility                          | Actions Available                                                      |
| ---------------------- | ------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| **MIS_SUPERVISOR**     | MIS department head       | All tickets (all statuses)                 | View, Assign, all status transitions                                   |
| **SUPPORT_TECHNICIAN** | IT support staff          | All tickets                                | Process (Ongoing, Resolve), Assign; Support Services only for creation |
| **SENIOR_APPROVER**    | Senior approval authority | Support Services tickets (resolved/closed) | Close, Return on Support Services                                      |
| **OD**                 | Operations Director       | All tickets                                | Full access (same as supervisor)                                       |
| **DEPARTMENT_HEAD**    | Department-level approver | Own team's tickets + assigned to them      | Close, Return on their team's tickets                                  |
| **UNKNOWN**            | Regular employee          | Own tickets only                           | Create, Cancel, Close/Return (when assigned)                           |

### Middleware Guards

| Middleware          | Applied To              | Logic                                                              |
| ------------------- | ----------------------- | ------------------------------------------------------------------ |
| `AuthMiddleware`    | All routes              | Validates SSO token, loads session                                 |
| `SupportMiddleware` | Support & admin routes  | Requires `supervisor`, `support`, or `senior approver` system role |
| `AdminMiddleware`   | Admin management routes | Requires record in `admin` table                                   |

### Route-Level Access Matrix

| Route                | Public | AuthMiddleware | SupportMiddleware | AdminMiddleware |
| -------------------- | ------ | -------------- | ----------------- | --------------- |
| `/` (Dashboard)      |        | ✓              | ✓                 |                 |
| `/tickets` (Create)  |        | ✓              |                   |                 |
| `/tickets/datatable` |        | ✓              |                   |                 |
| `/tickets/action`    |        | ✓              |                   |                 |
| `/requestTypes`      |        |                | ✓                 |                 |
| `/approvers`         |        |                | ✓                 |                 |
| `/admin`             |        |                |                   | ✓               |
| `/unauthorized`      | ✓      |                |                   |                 |
| `/logout`            |        | ✓              |                   |                 |

### Frontend Menu Visibility (Navigation.jsx)

The sidebar navigation dynamically renders menu items based on `emp_user_roles`:

| Menu Item     | Visible To                                              |
| ------------- | ------------------------------------------------------- |
| Dashboard     | MIS_SUPERVISOR, SUPPORT_TECHNICIAN, OD, SENIOR_APPROVER |
| Create Ticket | All authenticated users                                 |
| View Tickets  | All authenticated users                                 |
| Request Types | Support staff (admin-managed)                           |
| Approver List | Admin-managed                                           |
| Admin Panel   | Users in `admin` table                                  |

### Ticket Visibility Rules (Data Layer)

Controlled by `TicketRepository::buildRoleBasedConditions()`:

| Role                | Visible Tickets                                                         |
| ------------------- | ----------------------------------------------------------------------- |
| MIS_SUPERVISOR / OD | **All tickets** regardless of status or requestor                       |
| SUPPORT_TECHNICIAN  | All tickets **except** Support Services until status 4+                 |
| SENIOR_APPROVER     | Support Services tickets when status ≥ 4, plus any ticket they actioned |
| DEPARTMENT_HEAD     | Tickets from their department + tickets assigned to them                |
| Regular Employee    | Only their own submitted tickets + tickets assigned to them             |

---

## 6. Ticket Lifecycle

### Status Map

| Status ID | Label                    | Color  | Meaning                                     |
| --------- | ------------------------ | ------ | ------------------------------------------- |
| 1         | Open                     | Blue   | Newly created, unassigned                   |
| 2         | On Process               | Blue   | Support staff is reviewing                  |
| 3         | Ongoing                  | Cyan   | Active work in progress                     |
| 4         | Awaiting Acknowledgement | Yellow | Resolved, awaiting requestor sign-off       |
| 5         | Closed                   | Green  | Completed and acknowledged                  |
| 6         | Returned                 | Gray   | Requestor rejected resolution, needs rework |
| 7         | Cancelled                | Red    | Cancelled before resolution                 |

> **Critical Flag:** Status 1 (Open) tickets created **more than 30 minutes ago** are flagged "Critical" (red highlight) in the UI.

### Status Transition Diagram

```
                    [CANCEL]
                ┌──────────────────────────────────► 7 (Cancelled)
                │
[CREATE] ──► 1 (Open) ──[ONGOING]──► 3 (Ongoing) ──[RESOLVE]──► 4 (Awaiting Ack.)
                │                         │                             │
                │         ┌───────────────┘                    [CLOSE] │ [RETURN]
                │         │                                             │
                │    [ONPROCESS]                               ┌────────┴────────┐
                │         │                                    ▼                 ▼
                │         ▼                              5 (Closed)        6 (Returned)
                └──► 2 (On Process)                                             │
                                                                          [ONGOING]
                                                                                │
                                                                                ▼
                                                                         3 (Ongoing) ──► ...
```

### Actions by Role and Status

**Status 1 — OPEN**

| Who                                 | Allowed Actions                      |
| ----------------------------------- | ------------------------------------ |
| Support Technician / Supervisor     | Ongoing, On Process, Resolve, Cancel |
| Requestor (Support Services ticket) | Ongoing, Resolve, Cancel             |
| Requestor (Regular ticket)          | View, Cancel                         |

**Status 2 — ON PROCESS**

| Who                             | Allowed Actions  |
| ------------------------------- | ---------------- |
| Support Technician / Supervisor | Ongoing, Resolve |
| Others                          | View only        |

**Status 3 — ONGOING**

| Who                             | Allowed Actions           |
| ------------------------------- | ------------------------- |
| Support Technician / Supervisor | Ongoing (update), Resolve |
| Others                          | View only                 |

**Status 4 — AWAITING ACKNOWLEDGEMENT**

| Who                                | Allowed Actions                       |
| ---------------------------------- | ------------------------------------- |
| Support Staff (not assigned)       | Assign (reassign to another employee) |
| Assigned employee                  | Close, Return                         |
| Requestor (Regular ticket)         | Close, Return                         |
| Senior Approver (Support Services) | Close, Return                         |
| Others                             | View only                             |

**Status 6 — RETURNED**

| Who                             | Allowed Actions  |
| ------------------------------- | ---------------- |
| Support Technician / Supervisor | Ongoing, Resolve |
| Others                          | View only        |

**Status 5, 7 — CLOSED / CANCELLED**

| Who | Allowed Actions  |
| --- | ---------------- |
| All | View / rate only |

### Auto-Close Logic

A scheduled command runs hourly:

1. Finds all tickets with **Status 4** where `handled_at` is **≥ 24 hours ago**
2. Updates status to **5 (Closed)**
3. Sets `closed_by` = original requestor's employee ID
4. Sets `closed_at` = current timestamp
5. Logs action with `action_type = AUTO_CLOSE` in `ticket_logs`

### Request Types

**Hardcoded Categories** (`app/Constants/TicketRequestTypes.php`):

| Category       | Sub-options                                                            |
| -------------- | ---------------------------------------------------------------------- |
| Network        | Telephone, CCTV, Biometrics, Access Door, Sound System, Internet/Wi-Fi |
| Mail           | Password Reset, New Account                                            |
| Hardware       | Desktop, Laptop, Server, E-Learn Thin Client                           |
| Software       | Portals/Apps, MS Office, SharePoint, Zoom, WhatsApp                    |
| Printer        | Consigned Printer, Barcode Printer                                     |
| Promis         | Account, Promis Terminal                                               |
| Other Services | Vendor Assist, Virus Scanning, Others                                  |

**Dynamic Category** (stored in `ticket_request_types` table):

| Category         | Visibility                                               |
| ---------------- | -------------------------------------------------------- |
| Support Services | **Only** visible to SUPPORT_TECHNICIAN (not supervisors) |

> Support Services tickets follow **special notification rules** — senior approvers are notified on resolution instead of the requestor.

---

## 7. Database Architecture

### Multi-Database Connections

```
Laravel Application
       │
       ├── mysql (default)      ← Tickets, logs, request types, notifications
       │     HOST: DB_HOST
       │     DB:   DB_DATABASE
       │
       ├── masterlist           ← Employee records (read-only)
       │     HOST: MDB_HOST
       │     DB:   MDB_DATABASE
       │
       ├── authify              ← SSO session tokens (read-only)
       │     HOST: ADB_HOST
       │     DB:   ADB_DATABASE
       │
       └── inventory            ← Hardware/printer assets (read-only)
             HOST: IDB_HOST
             DB:   IDB_DATABASE
```

### Primary Database Tables (`mysql`)

```sql
-- Main ticket table
ticketing_support
  id, ticket_id (TKTSPRT-YYYY-XXXX), employid, empname, department,
  prodline, station, type_of_request, request_option, item_name,
  details, status (1-7), rating (1-5),
  handled_by, handled_at,
  closed_by, closed_at,
  assigned_to, assigned_at, assigned_by,
  created_at, updated_at, deleted_at (soft delete)

-- Audit trail for every ticket action
ticket_logs
  id, loggable_type, loggable_id,
  action_type (CREATED|ONGOING|ONPROCESS|RESOLVE|CLOSE|RETURN|CANCEL|AUTO_CLOSE|ASSIGN),
  action_by (emp_id), action_at,
  remarks, old_values (JSON), new_values (JSON), metadata (JSON)

-- Dynamic request type definitions
ticket_request_types
  id, name, category, description, is_active, created_at, updated_at

-- Senior approver registry
senior_support_approver
  id, emp_id, emp_name, created_at, updated_at

-- Admin user registry
admin
  id, emp_id, emp_name, created_at, updated_at

-- Notification recipients
notification_users
  emp_id (PK), emp_name, created_at, updated_at
```

### Masterlist Database (`masterlist`)

```sql
employee_masterlist
  EMPLOYID (PK), EMPNAME, DEPARTMENT, JOB_TITLE,
  PRODLINE, STATION, EMAIL,
  APPROVER1, APPROVER2, APPROVER3,  ← determines DEPARTMENT_HEAD role
  ACCSTATUS, DATEHIRED
```

### Authify Database (`authify`)

```sql
authify_sessions
  token (PK), emp_id, emp_name, emp_jobtitle,
  emp_dept, emp_prodline, emp_station,
  emp_from,          ← non-empty = access denied
  created_at, expires_at
```

### Inventory Database (`inventory`)

```sql
hardware       -- id, hostname, type (Desktop/Laptop/Server/etc.), department, status
printer        -- id, model, type (Consigned/Barcode), department, status
promis_terminal -- id, terminal_name, department, status
```

### Ticket ID Format

```
TKTSPRT-2025-0001
   │      │    └── Sequential number (padded to 4 digits, resets per year)
   │      └─────── Year of creation
   └────────────── Fixed prefix
```

---

## 8. Backend Architecture

### Layer Overview

```
HTTP Request
    │
    ▼
Middleware (Auth → Support → Admin → HandleInertia)
    │
    ▼
Controller  (thin — validates input, calls service, returns Inertia response)
    │
    ▼
Service     (business logic — orchestrates repositories)
    │
    ▼
Repository  (database queries only — no business logic)
    │
    ▼
Model       (Eloquent ORM — relationships, casts)
```

### Services

#### `TicketService`

Central business logic for all ticket operations.

| Method                                                                      | Purpose                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------- |
| `getTicketFormData($userRoles)`                                             | Returns request types available for the user's role     |
| `createTicket($data, $empData)`                                             | Validates, creates ticket, logs, notifies               |
| `getTicketsDataTable($filters, $empData)`                                   | Role-filtered paginated ticket list                     |
| `ticketAction($ticketId, $userId, $action, $remarks, $rating, $assignedTo)` | Perform status transition with logging and notification |
| `getTicketDetails($ticketId, $empData)`                                     | Single ticket with computed action buttons              |
| `getTicketLogs($ticketId, $perPage)`                                        | Paginated audit trail                                   |
| `processAutoCloseTickets()`                                                 | Auto-close resolved tickets (called by scheduler)       |

#### `NotificationService`

Determines who gets notified and sends notifications.

| Action    | Regular Ticket Recipients          | Support Services Recipients |
| --------- | ---------------------------------- | --------------------------- |
| CREATED   | All support staff (except creator) | — (no notification)         |
| ONGOING   | All support staff (except actor)   | —                           |
| ONPROCESS | Requestor                          | —                           |
| RESOLVE   | Requestor                          | Senior Approvers            |
| RETURN    | All support staff (except actor)   | Requestor                   |
| CLOSE     | All support staff (except actor)   | Requestor                   |
| CANCEL    | Requestor or MIS support           | —                           |

#### `UserRoleService`

Computes roles from session/DB data.

| Method                          | Returns                 |
| ------------------------------- | ----------------------- |
| `getUserAccountTypes($empData)` | Array of all user_roles |
| `isMisSupport($empData)`        | bool                    |
| `isMISSupervisor($empData)`     | bool                    |
| `isSeniorApprover($empData)`    | bool                    |
| `isODAccount($empData)`         | bool                    |
| `isDepartmentHead($empData)`    | bool                    |
| `hasRole($empData, $role)`      | bool                    |

#### `TicketStatusService`

Static utility for status label/color mapping. Handles the 30-minute "Critical" threshold for Open tickets.

#### `DashboardService`

Aggregates analytics data. Supervisors/OD see company-wide data; all others see only their personal stats.

#### `TicketRequestTypeService`

CRUD for request types. Filters by category: Support Technicians only see "Support Services"; others see all regular categories.

### Repositories

| Repository                    | Responsibility                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `TicketRepository`            | All ticket queries (create, update, filter, paginate), auto-close queries, hardware/asset lookup |
| `TicketDashboardRepository`   | Analytics queries (response time, closure rate, Pareto, ratings)                                 |
| `UserRepository`              | Employee lookups, senior approver queries, department head checks                                |
| `ApproverRepository`          | CRUD for `senior_support_approver` table                                                         |
| `TicketRequestTypeRepository` | CRUD + filtered queries for request types                                                        |

### Key Models

| Model              | Table                 | Connection | Notes                                                                         |
| ------------------ | --------------------- | ---------- | ----------------------------------------------------------------------------- |
| `Ticket`           | `ticketing_support`   | mysql      | Soft deletes; has `handler`, `closer`, `assignee` BelongsTo; `logs` MorphMany |
| `TicketLogs`       | `ticket_logs`         | mysql      | Polymorphic — loggable_type/loggable_id                                       |
| `NotificationUser` | `notification_users`  | mysql      | Implements Laravel `Notifiable` trait for broadcasting                        |
| `User`             | `employee_masterlist` | masterlist | Primary key: `EMPLOYID`; static helpers for approver lookup                   |
| `Hardware`         | `hardware`            | inventory  | Read-only; used for item selection in ticket form                             |
| `Printer`          | `printer`             | inventory  | Read-only                                                                     |
| `Terminal`         | `promis_terminal`     | inventory  | Read-only                                                                     |

---

## 9. Frontend Architecture

### Inertia.js Pattern

Inertia.js bridges Laravel (server-side routing) and React (client-side rendering) **without a separate API**. Laravel controllers return `Inertia::render('PageName', $props)` instead of JSON, and the React component at `Pages/PageName.jsx` receives `$props` as component props.

```
Browser visit /tickets
       │
       ▼
Laravel Router → TicketingController::index()
       │
       └─► Inertia::render('Ticketing/Create', ['formData' => $data])
                   │
                   ▼
           React: Pages/Ticketing/Create.jsx
           receives props.formData automatically
```

### Page Components

| Page          | Path                             | Description                               |
| ------------- | -------------------------------- | ----------------------------------------- |
| Dashboard     | `Pages/Dashboard/Dashboard.jsx`  | Analytics charts, role-aware              |
| Create Ticket | `Pages/Ticketing/Create.jsx`     | Ticket submission form                    |
| Ticket Table  | `Pages/Ticketing/Table.jsx`      | Filterable ticket list with action drawer |
| Request Types | `Pages/Admin/RequestType.jsx`    | Manage dynamic request types              |
| Approver List | `Pages/Admin/ApproverList.jsx`   | Manage senior approvers                   |
| Admin         | `Pages/Admin/Admin.jsx`          | Manage admin users                        |
| Login         | `Pages/Authentication/Login.jsx` | SSO redirect page                         |
| Profile       | `Pages/Profile.jsx`              | User profile & password change            |
| Unauthorized  | `Pages/Unauthorized.jsx`         | Access denied page                        |

### Custom Hooks

| Hook                       | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `useTicketForm`            | Request type/option cascading, hardware selection, form state |
| `useTicketTable`           | Search, filter, sort, pagination state for ticket list        |
| `useTicketDrawer`          | Fetch ticket details/logs, perform actions, drawer open/close |
| `useTicketActions`         | Auto-process, fetch assigned approvers, row-click modals      |
| `useTicketColumns`         | Ant Design table column definitions                           |
| `useRequestTypeDrawer`     | Request type CRUD form state                                  |
| `useRealtimeTicketUpdates` | Handle WebSocket events → refresh table                       |

### Context Providers

#### `NotificationContext`

Wraps the entire app. Manages real-time notifications.

```javascript
// Provided values
const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
```

- On mount: connects to `Echo.private('users.{emp_id}')` and listens for `.notification.created`
- Fetches initial notifications from `GET /api/notifications`
- Increments unread count on new event
- Triggers ticket table refresh via `ticketUpdates` state

#### `ThemeContext`

Dark/light mode toggle. Persisted in `localStorage`. Applied as DaisyUI `data-theme` attribute.

### State Management Strategy

```
Global State:  React Context (notifications, theme)
Page State:    Custom hooks (form data, table filters, drawer state)
Server State:  Inertia props (ticket data, user session)
Local State:   useState in components (modal visibility, etc.)
```

### Layout

`AuthenticatedLayout.jsx` wraps all authenticated pages:

- Fixed sidebar (collapsible, mobile-responsive)
- Top NavBar with NotificationBell
- Page content area
- Theme provider

---

## 10. Real-time Notifications

### Architecture

```
Ticket Action (PHP)
       │
       ▼
NotificationService::notifyTicketAction()
       │
       ▼
NotificationUser::notifyNow(TicketNotification)
       │
       ▼
Laravel Broadcasting → Laravel Reverb (WebSocket server)
       │
       ▼
Private Channel: users.{emp_id}
Event: notification.created
       │
       ▼
Frontend: Laravel Echo listener (NotificationContext.jsx)
       │
       ▼
State update → NotificationBell badge increments
            → Ticket table auto-refreshes
```

### Broadcasting Auth

WebSocket connections to private channels require authentication:

```
POST /MTS/broadcasting/auth
     │
     ├── Reads session('emp_data')
     ├── Gets or creates NotificationUser record
     └── Returns Broadcast::auth() for the private channel
```

### Frontend Setup

```javascript
// NotificationContext.jsx
Echo.private(`users.${emp_id}`).listen(".notification.created", (event) => {
    // Add to notifications list
    // Increment unread count
    // Add to ticketUpdates (triggers table refresh)
});
```

### Notification API Endpoints

| Method | Endpoint                   | Purpose                |
| ------ | -------------------------- | ---------------------- |
| GET    | `/api/notifications`       | List all notifications |
| PUT    | `/api/notifications`       | Mark all as read       |
| GET    | `/api/notifications/count` | Unread count           |

---

## 11. API Routes Reference

### Ticketing Routes (`routes/ticketing.php`) — Requires `AuthMiddleware`

| Method | Path                    | Controller                          | Purpose                     |
| ------ | ----------------------- | ----------------------------------- | --------------------------- |
| GET    | `/tickets`              | `TicketingController@index`         | Ticket creation form        |
| POST   | `/tickets`              | `TicketingController@storeTicket`   | Create new ticket           |
| GET    | `/tickets/datatable`    | `TicketingController@dataTable`     | Paginated ticket list       |
| POST   | `/tickets/action`       | `TicketingController@ticketAction`  | Perform ticket action       |
| GET    | `/tickets/{id}/details` | `TicketingController@ticketDetails` | Single ticket detail (AJAX) |
| GET    | `/tickets/{id}/logs`    | `TicketingController@ticketLogs`    | Ticket audit trail (AJAX)   |

### Admin Routes (`routes/admin.php`) — Requires `SupportMiddleware`

| Method | Path                 | Controller                            | Purpose               |
| ------ | -------------------- | ------------------------------------- | --------------------- |
| GET    | `/requestTypes`      | `TicketRequestTypeController@index`   | List request types    |
| POST   | `/requestTypes`      | `TicketRequestTypeController@store`   | Create request type   |
| PUT    | `/requestTypes/{id}` | `TicketRequestTypeController@update`  | Update request type   |
| DELETE | `/requestTypes/{id}` | `TicketRequestTypeController@destroy` | Delete request type   |
| GET    | `/approvers`         | `ApproverController@index`            | List senior approvers |
| POST   | `/approvers`         | `ApproverController@store`            | Add approver          |
| DELETE | `/approvers/{id}`    | `ApproverController@destroy`          | Remove approver       |

### General Routes (`routes/general.php`) — Requires `AuthMiddleware`

| Method | Path               | Controller                         | Purpose           |
| ------ | ------------------ | ---------------------------------- | ----------------- |
| GET    | `/`                | `DashboardController@index`        | Main dashboard    |
| GET    | `/profile`         | `ProfileController@index`          | User profile page |
| POST   | `/change-password` | `ProfileController@changePassword` | Change password   |

### Auth Routes (`routes/auth.php`)

| Method | Path            | Controller                        | Purpose                   |
| ------ | --------------- | --------------------------------- | ------------------------- |
| GET    | `/logout`       | `AuthenticationController@logout` | Logout + Authify redirect |
| GET    | `/unauthorized` | —                                 | Access denied page        |

### API Routes (`routes/api.php`)

| Method | Path                                   | Auth    | Purpose                |
| ------ | -------------------------------------- | ------- | ---------------------- |
| POST   | `/MTS/broadcasting/auth`               | Session | Broadcast channel auth |
| GET    | `/api/notifications`                   | Session | List notifications     |
| PUT    | `/api/notifications`                   | Session | Mark all read          |
| GET    | `/api/notifications/count`             | Session | Unread count           |
| GET    | `/api/tickets/assigned/{empId}`        | Session | Assigned tickets       |
| GET    | `/api/tickets/count`                   | Session | Ticket counts          |
| GET    | `/api/tickets/{id}/assigned-approvers` | Session | Approval chain         |

---

## 12. Key Data Flows

### 12.1 Ticket Creation Flow

```
1. User opens /tickets
   └─► TicketingController::index()
         └─► TicketService::getTicketFormData($userRoles)
               └─► Returns: request types, hardware options, etc.
         └─► Inertia::render('Ticketing/Create', $formData)

2. User submits form (POST /tickets)
   └─► TicketingController::storeTicket()
         └─► Validate FormRequest
         └─► TicketService::createTicket($data, $empData)
               ├─► TicketRepository::generateTicketNumber()
               │     └─► SELECT MAX(ticket_id) for current year → increment
               ├─► TicketRepository::createTicket($ticketData)
               │     └─► INSERT into ticketing_support (status=1)
               ├─► Log action: ticket_logs (action_type=CREATED)
               └─► NotificationService::notifyTicketAction($ticket, 'CREATED', $actor)
                     └─► Find all MIS support staff
                     └─► For each: NotificationUser::notifyNow()
                     └─► Broadcasts to users.{emp_id}

3. Frontend receives success → shows ticket ID
```

### 12.2 Ticket Action Flow

```
1. User opens ticket drawer → clicks action button
   └─► POST /tickets/action  { ticket_id, action, remarks, rating?, assigned_to? }

2. TicketingController::ticketAction()
   └─► TicketService::ticketAction()
         ├─► Find ticket: TicketRepository::findTicketById()
         ├─► Validate action is allowed for current status + role
         ├─► Map action → new status:
         │     ONGOING   → status 3
         │     ONPROCESS → status 2
         │     RESOLVE   → status 4
         │     CLOSE     → status 5
         │     RETURN    → status 6
         │     CANCEL    → status 7
         │     ASSIGN    → status unchanged (updates assigned_to)
         ├─► Set timestamps: handled_at, closed_at, assigned_at
         ├─► TicketRepository::updateTicket()
         ├─► Log to ticket_logs (old_values JSON, new_values JSON)
         └─► NotificationService::notifyTicketAction()

3. Frontend reloads ticket table
```

### 12.3 Real-time Notification Flow

```
PHP Backend broadcasts
       │
       ▼
Reverb WebSocket Server
       │
       ▼
Frontend Echo listener (NotificationContext)
       │
       ├─► notifications state updated
       ├─► unreadCount incremented
       └─► ticketUpdates state updated
                   │
                   ▼
           useRealtimeTicketUpdates hook
                   │
                   ▼
           Ticket table auto-refreshes (GET /tickets/datatable)
```

### 12.4 Dashboard Data Flow

```
GET /
   │
   ▼
DashboardController::index()
   │
   ▼
DashboardService::getDashboardData($empData)
   │
   ├─► Is supervisor/OD?
   │     ├── Yes → query all tickets (no emp filter)
   │     └── No  → query only user's tickets
   │
   ├─► TicketDashboardRepository::getResponseTime()
   ├─► TicketDashboardRepository::getTicketsPerDay()
   ├─► TicketDashboardRepository::getTicketsHandled()
   ├─► TicketDashboardRepository::getClosureRate()
   ├─► TicketDashboardRepository::getParetoByRequestType()
   └─► TicketDashboardRepository::getAvgRatingPerEmployee()
         │
         ▼
Inertia::render('Dashboard/Dashboard', $data)
         │
         ▼
React: Recharts renders charts from props
```

---

## 13. Security

### Authentication Security

- No passwords stored in MTS — all auth delegated to Authify SSO
- SSO tokens validated on **every request** via `AuthMiddleware`
- Tokens stored in HTTP-only cookies (7-day expiry) and Laravel session
- Session invalidated on logout

### Authorization Security

- Middleware guards at route level (`AuthMiddleware`, `SupportMiddleware`, `AdminMiddleware`)
- Service-level role checks before any write operation
- Repository-level WHERE clauses enforce visibility — users cannot see unauthorized tickets even with direct URL manipulation

### CSRF Protection

- Laravel CSRF middleware active on all web routes
- Inertia.js automatically injects CSRF tokens in requests

### CORS

- Restricted to single internal origin: `http://192.168.2.221:8194`
- Handled by `CorsMiddleware`

### Data Integrity

- Tickets use **soft deletes** (`deleted_at`) — no data permanently lost
- Full audit trail in `ticket_logs` for every status change, with `old_values` and `new_values` JSON
- All writes tracked with `action_by` (employee ID) and `action_at` (timestamp)

### Input Validation

- Laravel FormRequest classes validate all form submissions
- Inertia/React validates client-side before submission

---

## 14. Deployment & Configuration

### Environment Variables

```env
# Application
APP_NAME=mts
APP_DISPLAY_NAME="MIS Ticketing System"
APP_URL=http://192.168.2.221:8194/MTS
APP_ENV=production

# Primary Database
DB_HOST=...
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

# Masterlist Database
MDB_HOST=...
MDB_DATABASE=...
MDB_USERNAME=...
MDB_PASSWORD=...

# Authify Database (SSO)
ADB_HOST=...
ADB_DATABASE=...
ADB_USERNAME=...
ADB_PASSWORD=...

# Inventory Database
IDB_HOST=...
IDB_DATABASE=...
IDB_USERNAME=...
IDB_PASSWORD=...

# SSO
AUTHIFY_URL=http://192.168.2.221:8200
SSO_COOKIE_NAME=sso_token

# Broadcasting (Reverb)
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=...
REVERB_APP_KEY=...
REVERB_APP_SECRET=...
REVERB_HOST=...
REVERB_PORT=...
```

### Setup Steps

```bash
# 1. Install PHP dependencies
composer install --optimize-autoloader --no-dev

# 2. Install Node dependencies
npm install

# 3. Configure environment
cp .env.example .env
php artisan key:generate

# 4. Run migrations (primary DB only — masterlist/authify/inventory are external)
php artisan migrate

# 5. Build frontend assets
npm run build

# 6. Optimize Laravel
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Start WebSocket server (in background)
php artisan reverb:start

# 8. Start queue worker (for notifications)
php artisan queue:work
```

### Scheduler Setup

Add to server crontab:

```cron
* * * * * cd /path/to/mts && php artisan schedule:run >> /dev/null 2>&1
```

The scheduler runs `TicketService::processAutoCloseTickets()` hourly to auto-close resolved tickets after 24 hours.

---

## 15. Maintenance & Operations

### Admin Management

Admins are managed via the `/admin` page (requires existing admin access):

- Admins can manage **Request Types** and **Senior Approvers**
- Admin status is stored in the `admin` table (not tied to job title)
- To bootstrap the first admin: manually INSERT into the `admin` table

### Request Type Management

Dynamic request types (`/requestTypes`) allow admins to add custom categories beyond the hardcoded ones in `TicketRequestTypes.php`.

| Field       | Description                                                |
| ----------- | ---------------------------------------------------------- |
| name        | Display name of the request type                           |
| category    | `Support Services` = support-only; anything else = regular |
| description | Optional description                                       |
| is_active   | Toggle visibility without deleting                         |

### Senior Approver Management

Managed at `/approvers`. Senior approvers are notified when Support Services tickets are resolved and have Close/Return authority on those tickets.

### Database Maintenance

```sql
-- Check for stuck tickets (Open > 1 hour)
SELECT ticket_id, empname, created_at
FROM ticketing_support
WHERE status = 1 AND created_at < NOW() - INTERVAL 1 HOUR;

-- Check auto-close candidates
SELECT ticket_id, empname, handled_at
FROM ticketing_support
WHERE status = 4 AND handled_at < NOW() - INTERVAL 24 HOUR;

-- Ticket volume by status
SELECT status, COUNT(*) as count
FROM ticketing_support
WHERE deleted_at IS NULL
GROUP BY status;
```

---

## 16. Troubleshooting Guide

### Authentication Issues

| Symptom                            | Likely Cause                             | Fix                                         |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------- |
| Infinite redirect loop to Authify  | Authify DB unreachable                   | Check `ADB_*` env vars and DB connectivity  |
| "Unauthorized" page on valid login | `emp_from` field set in authify_sessions | Contact Authify admin to clear the field    |
| Session keeps expiring             | Cookie not being set                     | Check `SSO_COOKIE_NAME` and domain settings |
| User has wrong role                | Job title mismatch in masterlist         | Verify `JOB_TITLE` in `employee_masterlist` |

### Ticket Visibility Issues

| Symptom                             | Likely Cause                   | Fix                                                           |
| ----------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| User can't see their own tickets    | Role not resolving correctly   | Check `emp_user_roles` in session (`dd(session('emp_data'))`) |
| Support staff can't see all tickets | Support Services filter active | Verify `emp_system_roles` includes `support`                  |
| Status 2 tickets not appearing      | Role-based WHERE clause        | Review `TicketRepository::buildRoleBasedConditions()`         |

### Notification Issues

| Symptom                             | Likely Cause                        | Fix                                                         |
| ----------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| No real-time notifications          | WebSocket server down               | Restart: `php artisan reverb:start`                         |
| WebSocket connects but no events    | Queue worker not running            | Restart: `php artisan queue:work`                           |
| "Unauthenticated" on broadcast auth | Session not available for API route | Ensure `session` middleware is on `broadcasting/auth` route |
| Missing notification_users record   | Auto-create failed                  | Manually INSERT into `notification_users` for the user      |

### Performance Issues

| Symptom                   | Likely Cause                            | Fix                                                 |
| ------------------------- | --------------------------------------- | --------------------------------------------------- |
| Ticket table slow to load | Missing indexes on `status`, `employid` | Add DB indexes                                      |
| Dashboard charts timeout  | Large dataset without date filter       | Add date range filter to repository queries         |
| N+1 on ticket list        | Missing eager loading                   | Add `with('handler', 'closer')` to repository query |

### Common Developer Commands

```bash
# Clear all caches
php artisan optimize:clear

# View recent logs
tail -f storage/logs/laravel.log

# Check scheduled tasks
php artisan schedule:list

# Run auto-close manually
php artisan tinker
>>> app(App\Services\TicketService::class)->processAutoCloseTickets()

# Check queue
php artisan queue:monitor

# Rebuild frontend
npm run build
```

---

_Last updated: 2026-05-18 | MIS Ticketing System v1.x | Laravel 12 + React 18_
