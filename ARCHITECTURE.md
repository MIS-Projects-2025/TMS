# MTS (Maintenance Ticketing System) Architecture Documentation

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Architecture](#database-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Real-time Features](#real-time-features)
- [Component Patterns](#component-patterns)
- [API Routes](#api-routes)
- [Development Workflow](#development-workflow)

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Laravel | 12.0 | PHP Framework |
| PHP | 8.2+ | Server Runtime |
| Inertia.js | 2.0 | Server-side rendering adapter |
| Laravel Sanctum | - | API Authentication |
| Laravel Reverb | - | WebSocket Broadcasting |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI Library |
| Vite | 6.2.4 | Build Tool |
| Ant Design | 5.29.0 | UI Component Library |
| @inertiajs/react | 2.0 | Inertia adapter |
| Tailwind CSS | 3.2.1 | Utility-first CSS |
| DaisyUI | 5.0.43 | Tailwind Component Library |
| Zustand | 5.0.6 | State Management (available) |

### Database
| Technology | Purpose |
|------------|---------|
| MySQL (default) | Main application database |
| MySQL (masterlist) | Employee master list |
| MySQL (inventory) | Inventory data |
| MySQL (authify) | SSO authentication |

---

## Project Structure

```
mts/
├── app/                          # Laravel application code
│   ├── Constants/               # Application constants
│   ├── Console/                 # Artisan commands
│   ├── Helpers/                 # Helper functions
│   ├── Http/
│   │   ├── Controllers/         # HTTP controllers
│   │   ├── Middleware/          # Custom middleware
│   │   └── Requests/            # Form requests
│   ├── Models/                  # Eloquent models
│   ├── Notifications/           # Notification classes
│   ├── Providers/               # Service providers
│   ├── Repositories/            # Data access layer
│   ├── Services/                # Business logic
│   └── Traits/                  # Shared traits
├── config/                       # Laravel configuration
├── database/
│   ├── migrations/              # Database migrations
│   ├── seeders/                 # Database seeders
│   └── factories/               # Model factories
├── resources/
│   └── js/                      # React/JS code
│       ├── Components/          # React components
│       ├── Context/              # React Context providers
│       ├── Hooks/               # Custom React hooks
│       ├── Layouts/             # Page layouts
│       └── Pages/              # Inertia page components
├── routes/                       # Route definitions
├── public/                       # Public assets
└── tests/                        # Test files
```

---

## Frontend Architecture

### Component Organization (shadcn/ui Pattern)

```
resources/js/Components/
├── Modal.jsx                     # Reusable modal wrapper
├── DataTable.jsx                # Reusable data table
├── TextInput.jsx                # Reusable text input
├── InputLabel.jsx               # Label component
├── InputError.jsx               # Error message component
├── LoadingScreen.jsx            # Loading state
├── NavBar.jsx                   # Top navigation bar
├── NotificationBell.jsx         # Notification bell dropdown
├── ThemeContext.jsx             # Theme provider (light/dark)
│
├── sidebar/                     # Sidebar navigation
│   ├── SideBar.jsx
│   ├── Navigation.jsx
│   ├── SidebarLink.jsx
│   ├── Dropdown.jsx
│   └── ThemeToggler.jsx
│
├── ticketing/                    # Ticketing components
│   ├── TicketForm.jsx
│   ├── TicketDetailsDrawer.jsx
│   ├── TicketLogs.jsx
│   ├── TicketLogsModal.jsx
│   ├── StatCard.jsx
│   ├── DurationCell.jsx
│   ├── EmployeeInfo.jsx
│   └── TableSkeleton.jsx
│
└── requestType/                  # Request type components
    └── RequestTypeDrawer.jsx
```

### State Management

1. **React Context** - Primary state management
   - `ThemeContext` - Light/dark theme (localStorage persisted)
   - `NotificationContext` - Real-time notifications

2. **Zustand** - Available but not actively used

### Custom Hooks Pattern

```javascript
resources/js/Hooks/
├── useTicketForm.js         // Ticket form logic
├── useTicketTable.js       // Data table logic
├── useTicketDrawer.js      // Drawer state management
├── useTicketActions.js     // Ticket CRUD operations
└── useRealtimeTicketUpdates.js  // Real-time updates
```

### Pages Structure

```
resources/js/Pages/
├── Authentication/
│   └── Login.jsx
├── Dashboard/
│   └── Dashboard.jsx
├── Ticketing/
│   ├── Create.jsx
│   └── Table.jsx
└── Admin/
    ├── Admin.jsx
    ├── ApproverList.jsx
    └── RequestType.jsx
```

---

## Backend Architecture

### Service/Repository Pattern

```
app/
├── Http/Controllers/
│   ├── AuthenticationController.php
│   ├── DashboardController.php
│   ├── TicketingController.php
│   ├── ApproverController.php
│   └── TicketRequestTypeController.php
│
├── Services/
│   ├── TicketService.php
│   ├── NotificationService.php
│   ├── UserRoleService.php
│   ├── TicketStatusService.php
│   └── DashboardService.php
│
├── Repositories/
│   ├── TicketRepository.php
│   ├── UserRepository.php
│   └── ApproverRepository.php
│
└── Models/
    ├── Ticket.php
    ├── User.php
    ├── TicketLogs.php
    └── NotificationUser.php
```

### Middleware Stack

| Middleware | Purpose |
|------------|---------|
| AuthMiddleware | SSO token validation |
| SupportMiddleware | Support role access |
| AdminMiddleware | Admin role access |
| CORS | Cross-origin requests |

---

## Database Architecture

### Multi-Database Connections

| Connection | Purpose | Env Variables |
|------------|---------|--------------|
| `default` | Main app (tickets, logs) | DB_* |
| `masterlist` | Employee data | MDB_* |
| `inventory` | Inventory data | IDB_* |
| `authify` | SSO auth | ADB_* |

### Key Tables

```sql
-- ticketing_support (main ticket table)
ticketing_support: ID, TICKET_ID, EMPLOYID, EMPNAME, DEPARTMENT,
                   PRODLINE, STATION, TYPE_OF_REQUEST, DETAILS,
                   STATUS, RATING, HANDLED_BY, CLOSED_BY, etc.

-- ticketing_support_workflow
-- ticketing_support_remarks
-- notifications
-- notification_users
-- ticket_request_types
```

---

## Authentication & Authorization

### Authentication Flow

1. **SSO Token Validation** - Token from query params, cookie, or session
2. **Token Validation** - Validates against `authify` database
3. **Role Determination** - Maps job title to system roles
4. **Session Creation** - Stores user data in Laravel session
5. **Access Control** - Via middleware (SupportMiddleware, AdminMiddleware)

### User Roles

| Role | Description |
|------|-------------|
| MIS_SUPERVISOR | Department supervisor |
| SUPPORT_TECHNICIAN | IT support staff |
| DEPARTMENT_HEAD | Department head |
| SENIOR_APPROVER | Senior approver |

---

## Real-time Features

### WebSocket Implementation

- **Laravel Reverb** - WebSocket server
- **Pusher** - Real-time broadcasting
- **Laravel Echo** - Client-side listener

### Channels

| Channel | Purpose |
|---------|---------|
| `users.{userId}` | User-specific notifications |
| `.notification.created` | New notification events |

---

## Component Patterns

### UI Component Pattern

```jsx
// resources/js/Components/Modal.jsx
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      {/* Modal content */}
    </div>,
    document.body
  );
}
```

### Form Pattern

```jsx
// Using Ant Design + custom hooks
import { useTicketForm } from '@/Hooks/useTicketForm';

export function TicketForm() {
  const { form, submit, loading } = useTicketForm();

  return (
    <Form form={form} onFinish={submit}>
      {/* Form fields */}
    </Form>
  );
}
```

### Data Table Pattern

```jsx
// resources/js/Components/DataTable.jsx
import { Table } from 'antd';

export function DataTable({ columns, dataSource, loading }) {
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      // pagination, sorting, etc.
    />
  );
}
```

---

## API Routes

### Route Files

| File | Purpose |
|------|---------|
| `web.php` | Main entry routes |
| `auth.php` | Authentication (logout) |
| `general.php` | Profile, dashboard |
| `ticketing.php` | Ticket CRUD |
| `admin.php` | Admin functions |
| `api.php` | RESTful API |

### Key Routes

| Path | Controller | Purpose |
|------|------------|---------|
| `/` | DashboardController | Main dashboard |
| `/profile` | ProfileController | User profile |
| `/tickets` | TicketingController | Create ticket |
| `/tickets/datatable` | TicketingController | Ticket list |
| `/requestTypes` | TicketRequestTypeController | Request types |
| `/approvers` | ApproverController | Approver management |

---

## Development Workflow

### Prerequisites

- PHP 8.2+
- Node.js 18+
- MySQL 8.0+
- Composer
- npm

### Setup Steps

```bash
# 1. Install PHP dependencies
composer install

# 2. Install npm dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Generate application key
php artisan key:generate

# 5. Run migrations
php artisan migrate

# 6. Start development servers
php artisan serve
npm run dev
```

### Building for Production

```bash
# Build frontend
npm run build

# Optimize Laravel
php artisan optimize
```

---

## Common Patterns

### Making API Calls

```javascript
// Using Inertia for page navigation
import { useForm } from '@inertiajs/react';

const form = useForm({ data: {} });
form.post('/route');
```

### Real-time Notifications

```javascript
// Using NotificationContext
import { useNotification } from '@/Context/NotificationContext';

function Component() {
  const { notifications, markAsRead } = useNotification();
}
```

### Form Validation

```php
// Laravel FormRequest
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TicketRequest extends FormRequest
{
    public function authorize() { return true; }

    public function rules() {
        return [
            'TYPE_OF_REQUEST' => 'required',
            'DETAILS' => 'required|min:10',
        ];
    }
}
```