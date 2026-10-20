# Bariton Web Frontend State & Architecture

**Current Phase Completed**: Phase 3b (M-Pesa STK push, Card Stripe in KES, PayPal in USD, Receipts, and Refunds Lifecycle with Credit Notes).
**Last Updated**: October 2026

---

## 1. Stack & Architecture
- **Framework**: Vue 3 (Composition API `<script setup>`), Vite 6
- **Routing**: Vue Router 4 with navigation guards checking authentication, permissions, and 2FA compliance.
- **State Management**: Pinia (`useAuthStore`, `useCoursesStore`, `useOrdersStore`, `useUsersStore`, `useSettingsStore`, `useAuditStore`, `useUiStore`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` with Bariton bespoke luxury brand system.
- **HTTP Client**: Axios with `withCredentials: true`, CSRF bootstrap, 419 session refresh, 423 2FA interceptor, and global error toasts.
- **Pricing & Currency**: `src/lib/pricing.js` supporting dual currency display (KES & USD with rounding up to the next cent) and bundle upgrade calculation.

---

## 2. Views & Screens Implemented
- **Public & Guest**:
  - `/courses`: Public catalog with search, level filters, dual pricing (KES & USD), and bundle savings badges.
  - `/courses/:slug`: Course detail view displaying syllabus by level, individual module pricing in KES and USD, bundle price with savings calculation, upgrade price card for enrolled students, and free preview player.
- **Student Portal**:
  - `/checkout`: Multi-gateway enrollment checkout with:
    - Safaricom M-Pesa STK Push with real-time status polling.
    - Card payment (Stripe in KES) with test card autofill and 3D Secure simulation.
    - PayPal international checkout charging in USD at the locked order exchange rate.
    - Office cash instructions with order reference.
    - 30-minute order countdown expiry timer.
  - `/student/courses`: Enrolled courses grid with progress percentage bar and resume learning action.
  - `/student/courses/:uuid/player`:
    - Embedded YouTube player with YouTube IFrame API auto-tracking 90% watch time.
    - Custom HTML5 audio player tracking duration, seek, and 90% play threshold.
    - Sheet Music / PDF score viewer with download option and "Mark as Complete" action.
    - Curriculum drawer showing module progress and overall course completion percentage.
  - `/student/orders`: Student order history with receipt links, "Request Refund" modal (enforcing 14-day window and completion policies), and Credit Notes download ledger.
- **Finance Operations**:
  - `/finance/cash-entry`: Bursar cash reception search and manual payment registration with immediate enrollment activation.
  - `/finance/payments`: Complete payment transactions ledger with gateway and status filters.
  - `/finance/refunds`: Finance Manager review queue for student refund requests with approval/rejection modal, manual references, and automated Credit Note issuance.
  - `/finance/credit-notes`: Sequential statutory Credit Notes registry with PDF downloads.
- **Instructor Portal**:
  - `/instructor/courses`: Assigned courses list with curriculum and module breakdowns.
- **Admin Management**:
  - `/admin/courses`: Course management table with status badges and filters.
  - `/admin/courses/create` & `/admin/courses/:id/edit`: Course form with dynamic bundle discount simulator, level progression toggle, and module/lesson manager with audio/PDF file uploads.

---

## 3. Automated Tests
- Test Runner: Vitest
- Suites Passing:
  - `tests/lib/menu.test.js`: Permission-based menu filtering.
  - `tests/lib/pricing.test.js`: Dual price formatting, USD ceil conversion, and bundle upgrade calculations.
  - `tests/stores/courses.test.js`: Catalog fetching, single course detail, and progress recording.
  - `tests/stores/orders.test.js`: Order creation, M-Pesa STK push, Stripe card checkout, PayPal USD checkout, student refund requests, finance review, and credit notes.
  - `tests/stores/auth.test.js`: Auth state mutations, login, 2FA challenge transitions, logout.
- Total Vitest tests: **29 passed across 5 test files (100% pass rate)**.
