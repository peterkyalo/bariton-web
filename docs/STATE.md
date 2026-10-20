# Bariton Web Frontend State & Architecture

**Current Phase Completed**: Phase 8 (Multi-role analytics dashboards, CSV export tools, message templates admin editor, student notification preferences, and production deployment build).  
**Platform Status**: All 8 Phases Complete (100% test coverage with 66 Vitest unit tests passing across 11 test suites; production build generated in 1.34s).  
**Last Updated**: October 2026

---

## 1. Stack & Architecture
- **Framework**: Vue 3 (Composition API `<script setup>`), Vite 6
- **Routing**: Vue Router 4 with navigation guards enforcing authentication, permissions, and 2FA compliance.
- **State Management**: Pinia (`useAuthStore`, `useCoursesStore`, `useOrdersStore`, `useAssignmentsStore`, `useExamsStore`, `useEventsStore`, `useTutoringStore`, `useDashboardStore`, `useNotificationTemplateStore`, `useUsersStore`, `useSettingsStore`, `useAuditStore`, `useUiStore`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` with Bariton bespoke luxury brand system.
- **HTTP Client**: Axios with `withCredentials: true`, CSRF bootstrap, 419 session refresh, 423 2FA interceptor, and global error toasts.
- **Pricing & Currency**: `src/lib/pricing.js` supporting dual currency display (KES & USD with rounding up to the next cent) and bundle upgrade calculation.

---

## 2. Views & Screens Implemented by Phase

### Phase 1 & 2: Authentication, Catalog & Media Streaming
- `/login`, `/register`, `/two-factor-challenge`, `/forgot-password`, `/reset-password`, `/verify-email`.
- `/profile`: User details, password change, TOTP QR setup with recovery codes, data export requests, and account erasure requests.
- `/courses`: Public catalog with search, level filters, dual pricing (KES & USD), and bundle savings badges.
- `/courses/:slug`: Course detail view displaying syllabus by level, module pricing, bundle price with savings, and free preview player.
- `/student/courses/:uuid/player`: Lesson player supporting YouTube videos (with 90% watch time tracking), custom HTML5 audio player, and Sheet Music / PDF score viewer.

### Phase 3: Checkout, Multi-Gateway Payments & Refunds
- `/checkout`: Multi-gateway enrollment checkout with:
  - Safaricom M-Pesa STK Push with real-time polling.
  - Card payment (Stripe in KES) with 3D Secure simulation.
  - PayPal international checkout charging in USD.
  - Office cash instructions with order reference.
  - 30-minute order countdown expiry timer.
- `/student/orders`: Student order history with receipt links, "Request Refund" modal (enforcing 14-day window and completion policies), and Credit Notes download ledger.
- `/finance/cash-entry`: Bursar cash reception search and manual payment registration.
- `/finance/payments`: Complete payment transactions ledger with gateway and status filters.
- `/finance/refunds`: Finance Manager review queue for student refund requests with approval/rejection modal and Credit Note issuance.
- `/finance/credit-notes`: Sequential statutory Credit Notes registry with PDF downloads.

### Phase 4 & 5: Assignments, Exams, Certificates & Validation Path
- `/student/assignments/:uuid`: Resumable chunked video/audio uploader with progress indicators.
- `/instructor/grading`: Faculty assignment grading queue with audio/video media player, criteria rubrics, and automated score calculations.
- `/student/courses/:slug/exam`: Conservatory examination suite with server-enforced countdown timer, debounced answer auto-saving, performance recording pause with 15-minute upload grace period, and instant grading.
- `/student/certificates`: Student digital certificate credentials showcase with PDF downloads.
- `/verify/:code`: Public digital credential verification page at `/verify/:code` displaying verified status, holder name, course title, and dynamic revocation/replaced alerts with zero private data exposure.
- Contextual "Skills Assessment Studio" view when student is enrolled via the validation path (`path_type === 'validation'`), excluding instructional lessons and providing upgrade difference pricing.

### Phase 6: Physical Bootcamps & Workshops
- `/events`: Public bootcamps and workshops schedule showing venue, start/end dates, pricing (training-only vs training + accommodation), and real-time seat availability meters.
- `/events/:slug`: Detailed event overview with countdown hold timers (15m online hold, 48h cash hold) and direct checkout.
- `/student/events`: Student bootcamps dashboard displaying held seats, confirmed tickets, accommodation status, waitlist positions, and refund request modals.
- `/coordinator/events`: Coordinator check-in desk with real-time attendee search, accommodation tracking, and on-site attendance marking.

### Phase 7: One-on-One Tutoring
- `/tutoring`: Public private coaching packs showcase (1 session, 5 sessions, 10 sessions mentorship bundle) with session counts, validity, and direct checkout.
- `/student/tutoring`: Student tutoring portal with remaining credit balances, interactive slot booking calendar (stepping by 60m lesson + 15m buffer in Africa/Nairobi time), mode selector (Zoom, Google Meet, Nairobi Studio), reschedule modal with emergency notice waiver, and attendance feedback history.
- `/instructor/tutoring`: Faculty teaching studio with 7-day recurring weekly availability editor, blackout dates / vacation manager, student roster, inline meeting link updates, attendance marking (`Attended` / `Missed`), and session cancellation with automatic credit restoration to student.

### Phase 8: Dashboards, Reports & Notification Templates
- `/admin`: Executive administration dashboard with date range filter, quick presets, gross revenue cards (KES & USD), gateway breakdowns (M-Pesa, Stripe, PayPal, Cash), product category revenue, enrollment path counters, exam pass rate %, event occupancy %, tutoring utilization, and **Executive CSV Export**.
- `/finance`: Finance Directorate dashboard with gross settled inflows, over-the-counter cash totals, pending refund requests, credit notes issued, daily collections summary, recent payments ledger, and **Finance Ledger CSV Export**.
- `/instructor`: Faculty teaching hub with assignment grading queue counters, exam review counters, upcoming 1-on-1 tutoring sessions, and assigned courses.
- `/coordinator`: Physical events command center with scheduled events count, confirmed attendees, on-site check-in meters, event capacity progress bars, and accommodation trackers.
- `/admin/notification-templates`: Message templates editor for automated emails and SMS with token pills, character counters, and live test dispatch.
- `/profile`: Interactive Notification Preferences card allowing students to toggle optional event reminders, tutoring reminders, and grading feedback while protecting mandatory security and payment notices.

### Phase 9: CMS Engine & Public Website Template Integration
- `/`: Public conservatory landing page matching `index.html` (Hero carousel, 4 Services cards, About section, Category grid, Popular Courses with pricing & enrollment, Faculty team, Testimonials, Footer). Dynamic navbar shows "Sign In / Join Now" for guests, and "My Dashboard" for authenticated users.
- `/about`: Academy heritage and philosophy page matching `about.html` with statistics and faculty highlights.
- `/courses`: Courses catalog matching `courses.html` with level filters, curriculum search, and module counts.
- `/team`: Conservatory faculty directory matching `team.html` with instructor specializations and social handles.
- `/testimonials`: Student testimonials showcase matching `testimonial.html` with star ratings and reviews.
- `/contact`: Contact page matching `contact.html` with working interactive contact inquiry form wired to `POST /api/v1/contact` and Google Map embed.
- `/404`: Branded luxury error page matching `404.html` with direct return home and explore courses buttons.
- `/terms` & `/privacy`: Statutory legal pages dynamically rendered from the CMS engine.
- `/p/:slug`: Dynamic public page renderer for any custom page created in the CMS studio.
- `/admin/cms/pages`: Admin CMS management studio with category filters, search, publication toggles, modal page creation, and page deletion.
- `/admin/cms/pages/:id`: Rich page editor with live preview, hero banner settings, custom sections JSON editor, and markdown content area.
- `/admin/cms/inquiries`: Contact inquiries inbox with ticket status workflow (`pending`, `in_progress`, `resolved`, `archived`) and internal admin notes.

---

## 3. Automated Tests & Build Verification
- **Test Runner**: Vitest 5.x
- **Test Files**: 12 passed (12)
- **Total Tests**: 73 passed (73)
- **Pass Rate**: 100%
- **Production Build**: Clean bundle in `dist/` built in **1.75s**.
