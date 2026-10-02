# SCOMS Mobile API Reference

Both mobile apps talk to the mobile gateway (`scoms-app-backend`), not directly to
`Student_Backend`/`Staff_backend`. See `docs/mobile-architecture.md` for why.

- **Base URL**: `http://<host>:5005` (`MOBILE_PORT`, default `5005`)
- **Student app prefix**: `/api/v1/mobile/student`
- **Staff app prefix**: `/api/v1/mobile/staff`
- **Health check**: `GET /health` (no auth)

Every route below is relative to its app's prefix, e.g. `GET /attendance` for the
student app is really `GET /api/v1/mobile/student/attendance`.

## Response envelope

Every response (success or failure) is JSON with this shape:

```json
// success
{ "success": true, "message": "...", "data": { }, "meta": { } }

// error
{ "success": false, "message": "...", "code": "VALIDATION_ERROR", "errors": [] }
```

`meta` is only present on paginated list endpoints. Common `code` values:
`VALIDATION_ERROR`, `AUTHENTICATION_ERROR`, `AUTHORIZATION_ERROR`, `NOT_FOUND`,
`BUSINESS_RULE_ERROR`, `PAYMENT_ERROR`, `INTERNAL_ERROR`.

## Auth

All routes below `/auth/login`, `/auth/forgot-password`, `/auth/verify-otp`,
`/auth/reset-password`, `/auth/refresh`, `/auth/logout` are public. Every other route
requires `Authorization: Bearer <accessToken>` and is additionally gated by
`requireTenant` (institution comes from the JWT, never the request body) and, for
optional-module routes, `requireModule('<key>')`.

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | Body: `{ identifier, password }`. Returns `{ user, accessToken, refreshToken, redirectUrl }`. |
| POST | `/auth/forgot-password` | Body: `{ identifier }`. Always returns the same generic message (no account enumeration). |
| POST | `/auth/verify-otp` | Body: `{ identifier, otp }`. |
| POST | `/auth/reset-password` | Body: `{ identifier, otp, newPassword }`. Forces logout on all devices. |
| POST | `/auth/refresh` | Body: `{ refreshToken }`. Rotates the refresh token; returns a new pair. |
| POST | `/auth/logout` | Body: `{ refreshToken }`. |
| GET | `/auth/me` | Returns the full user + `institution.enabledModules`. |
| POST | `/auth/change-password` | Body: `{ oldPassword, newPassword }`. |
| PATCH | `/auth/profile` | Body: `{ avatar }` (base64 data URI, or `""` to remove). |

## Push notifications (mobile-only)

Not present on the web app — see `docs/mobile-architecture.md` §6.

| Method | Path | Notes |
|---|---|---|
| POST | `/notifications/device-token` | Body: `{ token, platform: "ANDROID" \| "IOS" }`. Upserts by token. |
| DELETE | `/notifications/device-token` | Body: `{ token }`. Scoped to the caller's own token. |
| GET | `/notifications` | Query: `limit` (max 100, default 30). |
| GET | `/notifications/unread-count` | |
| PATCH | `/notifications/:id/read` | |
| PATCH | `/notifications/read-all` | |

## Student app endpoints

| Module | Method | Path | Optional module gate |
|---|---|---|---|
| Parent | GET | `/parent/children` | — |
| Profile | GET/PATCH | `/profile` | — |
| Profile | GET | `/profile/id-card` | — |
| Profile | GET | `/degrees` | `convocation` |
| Profile | GET | `/subjects` | — |
| Attendance | GET | `/attendance` | `attendance` |
| Fees | GET | `/fees` | `fee` |
| Fees | POST | `/fees/pay/initiate` | `fee` |
| Fees | POST | `/fees/pay/verify` | `fee` |
| AI Tutor | POST | `/ai/ask` | `ai_tutor` |
| AI Tutor | GET | `/ai/topics` | `ai_tutor` |
| Announcements | GET | `/announcements` | `communication` |
| Timetable | GET | `/timetable` | `timetable` |
| Examination | GET | `/exams/schedule`, `/exams/results` | `examination` |
| Campus | GET | `/library`, `/transport`, `/hostel` | `library`/`transport`/`hostel` |
| Campus | POST | `/library/renew` | `library` |
| Homework | GET | `/assignments` | `homework` |
| Homework | POST | `/assignments/submit` | `homework` |
| Events/Clubs | GET/POST | `/events`, `/events/register`, `/clubs`, `/clubs/join` | `events_clubs` |
| Grievances | GET/POST | `/grievances` | `grievance_feedback` |
| Materials | GET | `/materials` | — |
| Leave | GET | `/leave/types`, `/leave` | — |
| Leave | POST | `/leave` | — |
| Certificates | GET | `/certificates`, `/certificate-requests` | `certificates` |
| Certificates | POST | `/certificate-requests` | `certificates` |
| Messages | GET/POST | `/messages/teachers`, `/messages/conversation`, `/messages` | `messaging` |
| Question Bank | GET | `/question-bank` | `examination` |
| Resume | GET/PUT | `/resume` | `career_portfolio` |
| Achievements | GET/POST | `/achievements` | `career_portfolio` |
| Feedback | GET/POST | `/feedback/subjects`, `/feedback` | `grievance_feedback` |
| Appointments | GET/POST | `/appointments/teachers`, `/appointments` | `counselling` |
| Placement | GET/POST | `/postings`, `/postings/apply`, `/postings/my-applications` | `placement` |
| Gallery | GET | `/gallery/albums`, `/gallery/albums/:id/photos` | `gallery` |
| Academic Calendar | GET | `/academic-calendar` | `academic_calendar` |

## Staff app endpoints

| Module | Method | Path | Optional module gate |
|---|---|---|---|
| Profile | GET/PATCH | `/profile/me` | — |
| Profile | POST | `/profile/qualifications`, `/profile/experience` | — |
| Leave | GET | `/leave/types`, `/leave` | — |
| Leave | POST | `/leave` | — |
| Attendance | GET | `/attendance/self`, `/attendance/sms-status`, `/attendance/my-classes`, `/attendance/roster`, `/attendance/session`, `/attendance/history`, `/attendance/monthly-grid` | `attendance` |
| Attendance | POST | `/attendance/mark` | `attendance` |
| Attendance | PATCH | `/attendance/:sessionId` | `attendance` |
| Homework | GET | `/assignments/my-classes`, `/assignments`, `/assignments/:id`, `/assignments/:id/submissions` | `homework` |
| Homework | POST | `/assignments` | `homework` |
| Homework | PATCH | `/assignments/submissions/:submissionId/evaluate` | `homework` |
| Questions | GET | `/questions`, `/questions/my-subjects` | `examination` |
| Questions | POST | `/questions`, `/questions/generate-paper` | `examination` |
| Examination | GET | `/exams/my-schedules`, `/exams/subject-performance`, `/exams/student-performance`, `/exam-schedules/:scheduleId/roster` | `examination` |
| Examination | POST | `/exam-schedules/:scheduleId/marks`, `/exam-schedules/:scheduleId/publish`, `/exam-schedules/:scheduleId/import` (multipart) | `examination` |
| Announcements | GET/POST | `/announcements` | `communication` |
| Timetable | GET | `/timetable/my` | `timetable` |
| Library | GET | `/library/students`, `/library/books`, `/library/issues`, `/library/fines` | `library` |
| Library | POST | `/library/issue`, `/library/return` | `library` |
| Library | PATCH | `/library/fines/:id/collect` | `library` |
| Events | GET | `/events`, `/events/:eventId/registrations` | `events_clubs` |
| Events | POST | `/events/:eventId/attendance` | `events_clubs` |
| Lab | GET | `/lab/assets`, `/lab/issues` | `inventory` |
| Lab | POST | `/lab/assets`, `/lab/issue` | `inventory` |
| Lab | PATCH | `/lab/issues/:issueId/return` | `inventory` |
| Appointments | GET/PATCH | `/appointments`, `/appointments/:id` | `counselling` |
| Parent Meetings | GET/POST | `/parent-meetings` | `ptm` |
| SMS | POST | `/sms/broadcast`, `/sms/send-to-parent` | — |
| SMS | GET | `/sms/history`, `/sms/parent-contacts` | — |
| Achievements | GET/POST | `/achievements` | `career_portfolio` |
| Clubs | GET | `/clubs` | `events_clubs` |
| Materials | GET | `/materials/my-subjects`, `/materials` | — |
| Materials | POST/DELETE | `/materials`, `/materials/:id` | — |
| Student Leave | GET/PATCH | `/student-leave`, `/student-leave/:id` | — |
| Messages | GET/POST | `/messages/students`, `/messages/conversation`, `/messages` | `messaging` |
| Research | GET/POST/PATCH/DELETE | `/research`, `/research/:id` | `research` |
| Gallery | GET/POST | `/gallery/albums`, `/gallery/albums/:id/photos` | `gallery` |
| Academic Calendar | GET | `/academic-calendar` | — |
| **Exam Setup** (Exam Admin) | GET | `/exam-setup/academic-years`, `/exam-setup/exams` | `examination` |
| **Exam Setup** | POST/PATCH/DELETE | `/exam-setup/exams`, `/exam-setup/exams/:id/status`, `/exam-setup/schedules`, `/exam-setup/schedules/:id` | `examination` |
| **Fee Desk** (Accountant) | GET | `/fee-desk/structures`, `/fee-desk/assignments`, `/fee-desk/installments`, `/fee-desk/receipts/:id`, `/fee-desk/challans`, `/fee-desk/pending`, `/fee-desk/dashboard`, `/fee-desk/daybook`, `/fee-desk/refunds` | `fee` |
| **Fee Desk** | POST/PATCH | `/fee-desk/challans`, `/fee-desk/collect`, `/fee-desk/refunds`, `/fee-desk/refunds/:id` | `fee` |
| Expenses | GET | `/expenses`, `/expenses/summary` | — |
| Expenses | POST/DELETE | `/expenses`, `/expenses/:id` | — |
| **Transport** (Transport Manager) | GET | `/transport/vehicles`, `/transport/routes`, `/transport/mappings`, `/transport/trips` | `transport` |
| **Transport** | POST | `/transport/vehicles`, `/transport/routes`, `/transport/mappings`, `/transport/trips/complete` | `transport` |
| **Hostel** (Hostel Warden) | GET | `/hostel/hostels`, `/hostel/students`, `/hostel/beds`, `/hostel/attendance`, `/hostel/mess-fees`, `/hostel/visitors` | `hostel` |
| **Hostel** | POST | `/hostel/hostels`, `/hostel/beds`, `/hostel/beds/allocate`, `/hostel/attendance`, `/hostel/visitors/checkin` | `hostel` |
| **Hostel** | PATCH | `/hostel/beds/:id/vacate`, `/hostel/visitors/:id/checkout` | `hostel` |
| **Placement** (Placement Officer) | GET | `/postings`, `/postings/:id/applications` | `placement` |
| **Placement** | POST | `/postings` | `placement` |
| **Placement** | PATCH | `/postings/:id/close`, `/postings/applications/:id` | `placement` |

`/hostel/students` and `/exam-setup/academic-years` (bold module rows above) are the
two lookup endpoints added specifically to unblock the mobile allocate-bed and
create-exam screens — see `docs/mobile-architecture.md` §1 and the Staff_backend
controllers (`hostelController.searchStudents`, `examAdminController.getAcademicYears`)
for the full ownership/scoping logic.

## Internal-only route (not for either app)

| Method | Path | Auth |
|---|---|---|
| POST | `/internal/push/dispatch` | `x-internal-secret` header, must equal `INTERNAL_PUSH_SECRET` — never called from a mobile client. |
