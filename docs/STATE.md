# Bariton Web Frontend State & Architecture

**Current Phase Completed**: Phase 5 (Professional validation path, assessment package checkout, lessons exclusion, assessment-only eligibility for Certificate of Skills Validation, and full course upgrade pricing difference).  
**Last Updated**: October 2026

---

## 1. Stack & Architecture
- **Framework**: Vue 3 (Composition API `<script setup>`), Vite 6
- **Routing**: Vue Router 4 with navigation guards checking authentication, permissions, and 2FA compliance.
- **State Management**: Pinia (`useAuthStore`, `useCoursesStore`, `useOrdersStore`, `useAssignmentsStore`, `useExamsStore`, `useUsersStore`, `useSettingsStore`, `useAuditStore`, `useUiStore`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` with Bariton bespoke luxury brand system.
- **HTTP Client**: Axios with `withCredentials: true`, CSRF bootstrap, 419 session refresh, 423 2FA interceptor, and global error toasts.
- **Pricing & Currency**: `src/lib/pricing.js` supporting dual currency display (KES & USD with rounding up to the next cent) and bundle upgrade calculation.
- **Professional Validation Path (Phase 5)**:
  - `src/views/catalog/CourseDetailView.vue`: Displays "Professional Skills Validation" option card when course is marked open for validation, allowing students/professionals to buy the assessment package directly. For enrolled validation students, displays the "Upgrade to Full Course" credit card calculating the exact price difference (`bundle_price - validation_price`).
  - `src/views/student/LessonPlayerView.vue`: Contextual "Skills Assessment Studio" view when student is enrolled via the validation path (`path_type === 'validation'`). Highlights direct assessment progress, explains that lessons are excluded, provides an upgrade banner, and exposes assignments and final certification exam navigation.
  - `src/views/student/StudentCoursesView.vue`: Contextual track badge ("Skills Validation Track" vs "Conservatory Track") and dedicated "Go to Assessment Studio" button.
  - `src/views/public/CertificateVerificationView.vue`: Displays credential track badge ("Skills Validation Track (Assessment Only)") and formal statement that the holder completed assessment examination only without instructional coursework.
  - `tests/stores/validation_path.test.js`: Comprehensive Pinia store unit test suite covering validation pricing, assessment package orders, curriculum access controls, and certificate verification.
- **Assessment, Exams & Certificates (Phases 4a & 4b)**:
  - `src/stores/exams.js`: Full examination lifecycle, server-enforced countdown timer, debounced answer auto-saving, performance recording timer pause with 15-minute grace period, attempt limit tracking, retake package checkout, and credential verification.
  - `src/views/student/StudentExamView.vue`: Interactive conservatory examination suite with question navigators, multiple choice, theory analysis, performance recorder uploader, and instant results view.
  - `src/views/student/StudentCertificatesView.vue`: Student certificates showcase with direct PDF downloads and public verification links.
  - `src/views/public/CertificateVerificationView.vue`: Public digital credential verification page at `/verify/:code` displaying verified status, holder name, course title, and dynamic revocation/replaced alerts with zero private data exposure.
  - `src/views/instructor/InstructorExamGradingQueueView.vue` & `InstructorExamGradingView.vue`: Faculty exam evaluation studio with audio/video recital media streaming, interactive rubric criteria levels, and live grade calculators.
  - `src/views/admin/AdminCertificatesView.vue`: Conservatory credential registry with search, status filters, revocation modals, and reissue workflows.

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
