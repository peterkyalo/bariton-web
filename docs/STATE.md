# Bariton Web Frontend State & Architecture

**Current Phase Completed**: Phase 1 (Foundation, multi-role auth, security, baseline UI, settings & notifications).
**Last Updated**: October 2026

---

## 1. Stack & Architecture
- **Framework**: Vue 3 (Composition API `<script setup>`), Vite 6
- **Routing**: Vue Router 4 with navigation guards checking authentication, permissions, and 2FA compliance.
- **State Management**: Pinia (`useAuthStore`, `useUsersStore`, `useSettingsStore`, `useAuditStore`, `useUiStore`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` with Bariton bespoke luxury brand system (Deep Navy `#0a0e1a`, Brass Gold `#d4af37`, Aria Purple `#8b5cf6`, Glassmorphism, and responsive tables).
- **HTTP Client**: Axios with `withCredentials: true`, automatic XSRF cookie synchronization, 419 session refresh, 423 two-factor interceptor, and global error toasts.

---

## 2. Implemented Views & Routes
- **Public & Guest**:
  - `/login`: Email + password login with lockout handling and redirect to 2FA challenge if enabled.
  - `/register`: Adult vs Minor student toggle. Minor mode displays guardian consent fields and information banner.
  - `/two-factor-challenge`: TOTP code verification with recovery code fallback option.
  - `/forgot-password` & `/reset-password`: Self-service password recovery flow.
  - `/verify-email`: Email verification callback handler and resend link trigger.
  - `/guardian-confirm/:token`: Public guardian consent portal displaying minor details and one-click consent approval.
- **Protected Layouts**:
  - `StudentLayout`: Student portal navbar, progress overview, and profile link.
  - `StaffLayout`: Adaptive sidebar navigation filtered by Spatie user permissions, active 2FA banner, role badge, and account menu.
- **Role Dashboards**:
  - `/student/dashboard`: Student course schedule, lessons, practice logs, and invoices.
  - `/instructor/dashboard`: Instructor schedule, student roster, attendance, and lesson logs.
  - `/finance/dashboard`: Revenue overview, pending reconciliation, and transaction logs.
  - `/coordinator/dashboard`: Academy operations, enrollment requests, and batch scheduling.
  - `/admin/dashboard`: Platform metrics, security alerts, and system health.
- **Admin Views**:
  - `/admin/users`: User management table with search, role filter, status filter, and Create User modal.
  - `/admin/settings`: Tabbed settings editor (General, Academy, Financials, Notifications) with SMS test modal.
  - `/admin/activity-logs`: Auditing table with subject, causer, and JSON properties inspector.
  - `/admin/notification-logs`: Notification delivery logs with channel and status tracking.
- **Profile & Self-Service**:
  - `/profile`: Personal info, password update, interactive 2FA setup with SVG QR code & recovery code modal, GDPR JSON download, and account deletion modal.
- **Error Pages**:
  - `/403`: Forbidden access state.
  - `/:pathMatch(.*)*`: 404 Not Found state.

---

## 3. Automated Tests
- Test Runner: Vitest
- Suites:
  - `tests/stores/auth.test.js`: Auth state mutations, login, 2FA challenge transitions, logout.
  - `tests/lib/menu.test.js`: Permission-based menu filtering and landing page resolution for all 5 roles.
