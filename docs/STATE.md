# Bariton Web Frontend State & Architecture

**Current Phase Completed**: Phase 2 (Courses, modules, levels, pricing and lessons).
**Last Updated**: October 2026

---

## 1. Stack & Architecture
- **Framework**: Vue 3 (Composition API `<script setup>`), Vite 6
- **Routing**: Vue Router 4 with navigation guards checking authentication, permissions, and 2FA compliance.
- **State Management**: Pinia (`useAuthStore`, `useCoursesStore`, `useUsersStore`, `useSettingsStore`, `useAuditStore`, `useUiStore`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` with Bariton bespoke luxury brand system.
- **HTTP Client**: Axios with `withCredentials: true`, CSRF bootstrap, 419 session refresh, 423 2FA interceptor, and global error toasts.
- **Pricing & Currency**: `src/lib/pricing.js` supporting dual currency display (KES & USD with rounding up to the next cent) and bundle upgrade calculation.

---

## 2. Views & Screens Implemented
- **Public & Guest**:
  - `/courses`: Public catalog with search, level filters, dual pricing (KES & USD), and bundle savings badges.
  - `/courses/:slug`: Course detail view displaying syllabus by level, individual module pricing in KES and USD, bundle price with savings calculation, upgrade price card for enrolled students, and free preview player.
- **Student Portal**:
  - `/student/courses`: Enrolled courses grid with progress percentage bar and resume learning action.
  - `/student/courses/:uuid/player`:
    - Embedded YouTube player with YouTube IFrame API auto-tracking 90% watch time.
    - Custom HTML5 audio player tracking duration, seek, and 90% play threshold.
    - Sheet Music / PDF score viewer with download option and "Mark as Complete" action.
    - Curriculum drawer showing module progress and overall course completion percentage.
- **Instructor Portal**:
  - `/instructor/courses`: Assigned courses list with curriculum and module breakdowns.
- **Admin Management**:
  - `/admin/courses`: Course management table with status badges and filters.
  - `/admin/courses/create` & `/admin/courses/:id/edit`: Course form with dynamic bundle discount simulator, level progression toggle, and module/lesson manager with audio/PDF file uploads.

---

## 3. Automated Tests
- Test Runner: Vitest
- Suites Passing:
  - `tests/lib/menu.test.js`: Permission-based menu filtering including `courses.teach` and `courses.manage-all`.
  - `tests/lib/pricing.test.js`: KES formatting, USD conversion with ceil rounding, dual price formatting, and upgrade pricing formulas.
  - `tests/stores/courses.test.js`: Catalog fetching, single course detail, and progress recording with local state mutations.
  - `tests/stores/auth.test.js`: Auth state mutations, login, 2FA challenge transitions, logout.
- Total Vitest tests: **19 passed across 4 test files**.
