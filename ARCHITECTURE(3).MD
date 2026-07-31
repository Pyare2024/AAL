# AI Apex Launchpad — Technical Specifications

## Document Information

- **Project:** AI Apex Launchpad — Internship Provider & Management System
- **Document:** Technical Specifications / Architecture
- **Frontend:** React with Vite
- **Backend:** Supabase
- **Version:** 1.0 MVP
- **Primary Roles:** Intern, Admin, Super Admin

---

# 1. Tech Stack

The project should use a simple, modern stack that is easy for a student team to understand and maintain. The MVP should avoid unnecessary microservices, custom servers, and complex DevOps.

## 1.1 Frontend

### React 18+

Use React to build reusable dashboards, forms, tables, and role-based screens.

**Why:**
- Component-based development
- Large learning ecosystem
- Easy integration with Supabase
- Suitable for dashboards and management systems

### Vite

Use Vite as the frontend build tool and development server.

**Why:**
- Fast local development
- Simple setup
- Works well with React and TypeScript
- Easier than configuring Webpack manually

### TypeScript

Use TypeScript instead of plain JavaScript.

**Why:**
- Prevents many common data-type errors
- Makes database models easier to understand
- Improves maintainability as the project grows

### React Router DOM

Use React Router DOM for application routes and role-based navigation.

**Example routes:**

```text
/login
/register
/forgot-password

/onboarding/profile
/onboarding/questionnaire
/onboarding/learning
/onboarding/activities
/onboarding/interview
/onboarding/allocation

/intern/dashboard
/admin/dashboard
/super-admin/dashboard
```

### TanStack Query

Use TanStack Query for fetching, caching, invalidating, and refreshing Supabase data.

**Why:**
- Reduces repeated API-loading code
- Handles loading and error states
- Makes dashboards easier to refresh
- Avoids building a complex global state system

### React Hook Form + Zod

Use React Hook Form for forms and Zod for validation.

**Why:**
- Simple form handling
- Reusable validation rules
- Good TypeScript support
- Useful for registration, profile, attendance, diary, and admin forms

### Tailwind CSS

Use Tailwind CSS for styling.

**Why:**
- Fast UI development
- Consistent spacing and responsive design
- Easy to implement the APEX brand system

### shadcn/ui

Use shadcn/ui for accessible UI components.

**Recommended components:**
- Button
- Input
- Select
- Dialog
- Sheet
- Table
- Card
- Tabs
- Badge
- Dropdown Menu
- Alert Dialog
- Toast
- Form

### Lucide React

Use Lucide React for icons.

### date-fns

Use date-fns for attendance dates, diary dates, deadlines, and reports.

---

## 1.2 Backend and Database

### Supabase Authentication

Use Supabase Auth for:

- Email and password registration
- Login
- Password recovery
- Session management
- Authenticated user identity

### Supabase PostgreSQL

Use PostgreSQL tables for all application data.

### Supabase Row Level Security

Use RLS as the main authorization layer.

The frontend may hide pages, but RLS must make the final decision about what data a user can read or modify.

### Supabase Storage

Use Storage buckets for:

- Profile photos
- Pending-work files
- Activity submissions
- Resume or onboarding documents
- Community attachments, when enabled

### Supabase Edge Functions

Use Edge Functions only for secure server-side actions that must not run in the browser.

**Examples:**
- Creating Admin accounts
- Calling external Advanced LMS APIs
- Calling the Tenon API
- AI post generation
- Securely storing or using third-party API secrets

### Supabase Realtime

Use Realtime only where it adds clear value.

**Suitable MVP use cases:**
- New announcements
- Community post updates
- Attendance-session status updates

Do not use Realtime for every table.

---

## 1.3 Recommended Development Tools

- **Node.js:** Current LTS version
- **Package manager:** npm
- **Code editor:** VS Code
- **Version control:** Git and GitHub
- **API testing:** Supabase dashboard and Postman
- **Browser testing:** Chrome DevTools
- **Deployment:** Vercel for frontend and Supabase for backend

---

## 1.4 Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The following keys must never be added to frontend environment variables:

```env
SUPABASE_SERVICE_ROLE_KEY
ADVANCED_LMS_API_SECRET
TENON_API_SECRET
AI_PROVIDER_API_KEY
```

These secrets must be stored in Supabase Edge Function secrets.

---

# 2. Folder Structure

```text
ai-apex-launchpad/
├── public/
│   ├── images/
│   └── logo/
│
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   ├── query-client.ts
│   │   └── providers.tsx
│   │
│   ├── assets/
│   │   ├── logo/
│   │   └── images/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── StatusBadge.tsx
│   │   │
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── intern/
│   │   ├── admin/
│   │   ├── super-admin/
│   │   └── ui/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── profiles/
│   │   ├── problem-statements/
│   │   ├── admin-management/
│   │   ├── attendance/
│   │   ├── daily-diary/
│   │   ├── todo/
│   │   ├── pending-work/
│   │   ├── learning/
│   │   ├── community/
│   │   ├── ai-posts/
│   │   ├── leaderboard/
│   │   ├── announcements/
│   │   ├── feedback/
│   │   └── reports/
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── InternLayout.tsx
│   │   ├── AdminLayout.tsx
│   │   └── SuperAdminLayout.tsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── intern/
│   │   ├── admin/
│   │   ├── super-admin/
│   │   └── system/
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCurrentProfile.ts
│   │   ├── useCurrentRole.ts
│   │   └── usePermissions.ts
│   │
│   ├── guards/
│   │   ├── AuthGuard.tsx
│   │   ├── RoleGuard.tsx
│   │   └── OnboardingGuard.tsx
│   │
│   ├── lib/
│   │   ├── permissions.ts
│   │   ├── routes.ts
│   │   ├── constants.ts
│   │   ├── validators.ts
│   │   └── utils.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── profile.service.ts
│   │   ├── onboarding.service.ts
│   │   ├── attendance.service.ts
│   │   └── reports.service.ts
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       ├── database.types.ts
│   │       └── storage.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── database.ts
│   │   └── common.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   ├── create-admin/
│   │   ├── advanced-lms-proxy/
│   │   ├── tenon-proxy/
│   │   └── generate-ai-post/
│   ├── seed.sql
│   └── config.toml
│
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Folder Rules

- Keep page-level files inside `pages`.
- Keep feature-specific logic inside `features`.
- Keep reusable UI elements inside `components`.
- Keep Supabase operations inside services or feature query files.
- Do not write long Supabase queries directly inside page components.
- Do not duplicate role-checking logic across pages.
- Store shared permission rules in `lib/permissions.ts`.

---

# 3. Database Schema

## 3.1 Database Conventions

- Primary keys use `uuid`.
- Dates use `date`.
- Date and time values use `timestamptz`.
- Table names use `snake_case`.
- Foreign-key columns end with `_id`.
- All operational tables include `created_at`.
- Important editable tables include `updated_at`.
- User identity comes from `auth.users`.
- Application user data is stored in `public.profiles`.

---

## 3.2 Enumerations

Recommended PostgreSQL enums:

```sql
create type app_role as enum ('intern', 'admin', 'super_admin');

create type account_status as enum (
  'pending',
  'active',
  'inactive',
  'suspended'
);

create type onboarding_status as enum (
  'registered',
  'profile_pending',
  'questionnaire_pending',
  'learning_pending',
  'activities_pending',
  'interview_pending',
  'allocation_pending',
  'completed'
);

create type submission_status as enum (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'resubmission_required'
);

create type attendance_status as enum (
  'present',
  'absent',
  'late',
  'leave'
);

create type visibility_scope as enum (
  'all',
  'interns',
  'admins',
  'problem_statement'
);
```

---

## 3.3 Core Identity Tables

### `profiles`

Stores the main profile of every Intern, Admin, and Super Admin.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key; references `auth.users.id` |
| `full_name` | `text` | Required |
| `email` | `text` | Required; unique |
| `mobile` | `text` | Nullable |
| `profile_photo_url` | `text` | Nullable |
| `college_name` | `text` | Nullable |
| `city` | `text` | Nullable |
| `degree_name` | `text` | Nullable |
| `degree_year` | `text` | Nullable |
| `date_of_birth` | `date` | Nullable |
| `gender` | `text` | Nullable |
| `blood_group` | `text` | Nullable |
| `account_status` | `account_status` | Default `pending` |
| `onboarding_status` | `onboarding_status` | Default `registered` |
| `problem_statement_id` | `uuid` | Nullable; references `problem_statements.id` |
| `internship_started_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

**Relationships:**
- One `auth.users` record has one `profiles` record.
- One active Intern belongs to one Problem Statement.
- Admin and Super Admin profiles normally have `problem_statement_id = null`.

### `user_roles`

Stores the authoritative application role.

| Column | Type | Rules |
|---|---|---|
| `user_id` | `uuid` | Primary key; references `auth.users.id` |
| `role` | `app_role` | Required |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

**Business rule:** One authenticated user has exactly one role.

### `admin_problem_statements`

Maps Admins to one or more Problem Statements.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `admin_id` | `uuid` | References `profiles.id` |
| `problem_statement_id` | `uuid` | References `problem_statements.id` |
| `assigned_by` | `uuid` | References `profiles.id` |
| `assigned_at` | `timestamptz` | Default `now()` |

**Constraint:**

```sql
unique (admin_id, problem_statement_id)
```

---

## 3.4 Problem Statement Tables

### `problem_statements`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Required; unique |
| `slug` | `text` | Required; unique |
| `description` | `text` | Nullable |
| `status` | `account_status` | Default `active` |
| `created_by` | `uuid` | References `profiles.id` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

### `intern_problem_statement_history`

Maintains allocation and transfer history.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `intern_id` | `uuid` | References `profiles.id` |
| `problem_statement_id` | `uuid` | References `problem_statements.id` |
| `allocated_by` | `uuid` | References `profiles.id` |
| `allocated_at` | `timestamptz` | Default `now()` |
| `removed_at` | `timestamptz` | Nullable |
| `allocation_note` | `text` | Nullable |

---

## 3.5 Onboarding Tables

### `onboarding_progress`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `intern_id` | `uuid` | Unique; references `profiles.id` |
| `profile_completed` | `boolean` | Default `false` |
| `questionnaire_completed` | `boolean` | Default `false` |
| `learning_intro_completed` | `boolean` | Default `false` |
| `activities_completed` | `boolean` | Default `false` |
| `interview_completed` | `boolean` | Default `false` |
| `problem_statement_allocated` | `boolean` | Default `false` |
| `completion_percentage` | `integer` | Default `0`; check `0–100` |
| `completed_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Default `now()` |

### `questionnaires`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Required |
| `description` | `text` | Nullable |
| `is_active` | `boolean` | Default `true` |
| `created_by` | `uuid` | References `profiles.id` |
| `created_at` | `timestamptz` | Default `now()` |

### `questionnaire_questions`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `questionnaire_id` | `uuid` | References `questionnaires.id` |
| `question_text` | `text` | Required |
| `question_type` | `text` | Required |
| `options` | `jsonb` | Nullable |
| `is_required` | `boolean` | Default `true` |
| `display_order` | `integer` | Required |

### `questionnaire_responses`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `questionnaire_id` | `uuid` | References `questionnaires.id` |
| `question_id` | `uuid` | References `questionnaire_questions.id` |
| `intern_id` | `uuid` | References `profiles.id` |
| `response_text` | `text` | Nullable |
| `response_json` | `jsonb` | Nullable |
| `submitted_at` | `timestamptz` | Default `now()` |

### `onboarding_activities`

Defines the seven onboarding activities.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Required |
| `description` | `text` | Nullable |
| `activity_order` | `integer` | Required; unique |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | Default `now()` |

### `onboarding_activity_submissions`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `activity_id` | `uuid` | References `onboarding_activities.id` |
| `intern_id` | `uuid` | References `profiles.id` |
| `submission_text` | `text` | Nullable |
| `submission_url` | `text` | Nullable |
| `status` | `submission_status` | Default `submitted` |
| `reviewed_by` | `uuid` | Nullable; references `profiles.id` |
| `review_note` | `text` | Nullable |
| `submitted_at` | `timestamptz` | Default `now()` |
| `reviewed_at` | `timestamptz` | Nullable |

### `interviews`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `intern_id` | `uuid` | References `profiles.id` |
| `scheduled_by` | `uuid` | References `profiles.id` |
| `interviewer_id` | `uuid` | Nullable; references `profiles.id` |
| `scheduled_at` | `timestamptz` | Required |
| `meeting_link` | `text` | Nullable |
| `status` | `text` | Required |
| `score` | `numeric(5,2)` | Nullable |
| `feedback` | `text` | Nullable |
| `completed_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |

---

## 3.6 Attendance Tables

### `attendance_sessions`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Required |
| `attendance_date` | `date` | Required |
| `start_time` | `timestamptz` | Required |
| `end_time` | `timestamptz` | Required |
| `problem_statement_id` | `uuid` | Nullable; references `problem_statements.id` |
| `attendance_password_hash` | `text` | Nullable |
| `latitude` | `numeric(10,7)` | Nullable |
| `longitude` | `numeric(10,7)` | Nullable |
| `radius_meters` | `integer` | Nullable |
| `is_active` | `boolean` | Default `true` |
| `created_by` | `uuid` | References `profiles.id` |
| `created_at` | `timestamptz` | Default `now()` |

### `attendance_records`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `session_id` | `uuid` | References `attendance_sessions.id` |
| `intern_id` | `uuid` | References `profiles.id` |
| `status` | `attendance_status` | Required |
| `marked_at` | `timestamptz` | Default `now()` |
| `latitude` | `numeric(10,7)` | Nullable |
| `longitude` | `numeric(10,7)` | Nullable |
| `remarks` | `text` | Nullable |
| `marked_by` | `uuid` | References `profiles.id` |
| `is_manual` | `boolean` | Default `false` |

**Constraint:**

```sql
unique (session_id, intern_id)
```

---

## 3.7 Productivity Tables

### `daily_diary_entries`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `intern_id` | `uuid` | References `profiles.id` |
| `entry_date` | `date` | Required |
| `work_summary` | `text` | Required |
| `learning_summary` | `text` | Nullable |
| `challenges` | `text` | Nullable |
| `next_plan` | `text` | Nullable |
| `hours_worked` | `numeric(4,2)` | Nullable |
| `status` | `submission_status` | Default `submitted` |
| `reviewed_by` | `uuid` | Nullable; references `profiles.id` |
| `review_note` | `text` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

**Constraint:**

```sql
unique (intern_id, entry_date)
```

### `todo_items`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `intern_id` | `uuid` | References `profiles.id` |
| `title` | `text` | Required |
| `description` | `text` | Nullable |
| `due_date` | `date` | Nullable |
| `priority` | `text` | Default `medium` |
| `is_completed` | `boolean` | Default `false` |
| `completed_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

### `pending_work_items`

Used when Admin or Super Admin assigns work to an intern.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Required |
| `description` | `text` | Nullable |
| `assigned_to` | `uuid` | References `profiles.id` |
| `assigned_by` | `uuid` | References `profiles.id` |
| `problem_statement_id` | `uuid` | References `problem_statements.id` |
| `due_at` | `timestamptz` | Nullable |
| `status` | `submission_status` | Default `draft` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

### `pending_work_submissions`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pending_work_id` | `uuid` | References `pending_work_items.id` |
| `intern_id` | `uuid` | References `profiles.id` |
| `submission_text` | `text` | Nullable |
| `submission_url` | `text` | Nullable |
| `file_path` | `text` | Nullable |
| `status` | `submission_status` | Default `submitted` |
| `reviewed_by` | `uuid` | Nullable; references `profiles.id` |
| `review_note` | `text` | Nullable |
| `submitted_at` | `timestamptz` | Default `now()` |
| `reviewed_at` | `timestamptz` | Nullable |

---

## 3.8 Learning Tables

### `learning_resources`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Required |
| `description` | `text` | Nullable |
| `resource_type` | `text` | Required |
| `resource_url` | `text` | Nullable |
| `problem_statement_id` | `uuid` | Nullable; references `problem_statements.id` |
| `is_active` | `boolean` | Default `true` |
| `created_by` | `uuid` | References `profiles.id` |
| `created_at` | `timestamptz` | Default `now()` |

### `learning_progress`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `intern_id` | `uuid` | References `profiles.id` |
| `resource_id` | `uuid` | References `learning_resources.id` |
| `status` | `text` | Required |
| `progress_percentage` | `integer` | Default `0`; check `0–100` |
| `started_at` | `timestamptz` | Nullable |
| `completed_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Default `now()` |

### `external_learning_integrations`

Stores non-secret integration configuration.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `provider_name` | `text` | `advanced_lms` or `tenon` |
| `display_name` | `text` | Required |
| `base_url` | `text` | Nullable |
| `is_enabled` | `boolean` | Default `false` |
| `created_by` | `uuid` | References `profiles.id` |
| `updated_at` | `timestamptz` | Default `now()` |

**Important:** API secrets must not be stored in this table. Store them as Edge Function secrets.

### `external_learning_access_logs`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `intern_id` | `uuid` | References `profiles.id` |
| `provider_name` | `text` | Required |
| `action` | `text` | Required |
| `external_reference` | `text` | Nullable |
| `accessed_at` | `timestamptz` | Default `now()` |
| `response_status` | `text` | Nullable |

---

## 3.9 Engagement Tables

### `community_posts`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `author_id` | `uuid` | References `profiles.id` |
| `problem_statement_id` | `uuid` | Nullable; references `problem_statements.id` |
| `title` | `text` | Nullable |
| `content` | `text` | Required |
| `attachment_path` | `text` | Nullable |
| `is_pinned` | `boolean` | Default `false` |
| `is_hidden` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

### `community_comments`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `post_id` | `uuid` | References `community_posts.id` |
| `author_id` | `uuid` | References `profiles.id` |
| `content` | `text` | Required |
| `is_hidden` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

### `ai_post_generations`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `intern_id` | `uuid` | References `profiles.id` |
| `prompt_text` | `text` | Required |
| `generated_content` | `text` | Required |
| `provider_name` | `text` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |

### `announcements`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Required |
| `content` | `text` | Required |
| `visibility` | `visibility_scope` | Default `all` |
| `problem_statement_id` | `uuid` | Nullable; references `problem_statements.id` |
| `published_at` | `timestamptz` | Nullable |
| `expires_at` | `timestamptz` | Nullable |
| `is_active` | `boolean` | Default `true` |
| `created_by` | `uuid` | References `profiles.id` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

### `feedback_submissions`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `submitted_by` | `uuid` | References `profiles.id` |
| `problem_statement_id` | `uuid` | Nullable; references `problem_statements.id` |
| `assigned_admin_id` | `uuid` | Nullable; references `profiles.id` |
| `category` | `text` | Required |
| `subject` | `text` | Required |
| `message` | `text` | Required |
| `status` | `text` | Default `open` |
| `response` | `text` | Nullable |
| `responded_by` | `uuid` | Nullable; references `profiles.id` |
| `responded_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |

---

## 3.10 Leaderboard Tables

### `leaderboard_points`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `intern_id` | `uuid` | References `profiles.id` |
| `points` | `integer` | Required |
| `reason` | `text` | Required |
| `source_type` | `text` | Required |
| `source_id` | `uuid` | Nullable |
| `awarded_by` | `uuid` | References `profiles.id` |
| `created_at` | `timestamptz` | Default `now()` |

### `points_audit_logs`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `leaderboard_point_id` | `uuid` | Nullable; references `leaderboard_points.id` |
| `intern_id` | `uuid` | References `profiles.id` |
| `old_points` | `integer` | Nullable |
| `new_points` | `integer` | Required |
| `action` | `text` | Required |
| `changed_by` | `uuid` | References `profiles.id` |
| `reason` | `text` | Required |
| `created_at` | `timestamptz` | Default `now()` |

The leaderboard should be calculated as the sum of `leaderboard_points.points` grouped by `intern_id`.

---

## 3.11 Settings and Audit Tables

### `user_settings`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Unique; references `profiles.id` |
| `email_notifications` | `boolean` | Default `true` |
| `announcement_notifications` | `boolean` | Default `true` |
| `language` | `text` | Default `en` |
| `updated_at` | `timestamptz` | Default `now()` |

### `system_settings`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `setting_key` | `text` | Required; unique |
| `setting_value` | `jsonb` | Required |
| `description` | `text` | Nullable |
| `updated_by` | `uuid` | References `profiles.id` |
| `updated_at` | `timestamptz` | Default `now()` |

### `audit_logs`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key |
| `actor_id` | `uuid` | Nullable; references `profiles.id` |
| `action` | `text` | Required |
| `entity_type` | `text` | Required |
| `entity_id` | `uuid` | Nullable |
| `old_data` | `jsonb` | Nullable |
| `new_data` | `jsonb` | Nullable |
| `ip_address` | `inet` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |

---

## 3.12 Storage Buckets

| Bucket | Access |
|---|---|
| `profile-photos` | User can manage own photo; authorized roles can view |
| `pending-work` | Intern uploads own submission; assigned Admin and Super Admin can read |
| `activity-submissions` | Intern uploads own files; Admins can review based on visibility rules |
| `community-attachments` | Authenticated access with content moderation rules |
| `onboarding-documents` | Intern and authorized Admin/Super Admin access |

---

# 4. User Roles and Authentication

## 4.1 Authentication Process

1. User enters email and password.
2. Supabase Auth validates the credentials.
3. The application retrieves the user’s record from `user_roles`.
4. The application retrieves the user’s `profiles` record.
5. React redirects the user according to role and onboarding state.

```text
intern + onboarding incomplete → /onboarding/current-step
intern + onboarding complete   → /intern/dashboard
admin                           → /admin/dashboard
super_admin                     → /super-admin/dashboard
```

## 4.2 Role Source of Truth

The `user_roles` table is the only source of truth for application roles.

Do not trust:

- A role selected in the login form
- A role stored only in localStorage
- A URL such as `/admin/dashboard`
- Hidden buttons in React
- Client-side JavaScript checks alone

## 4.3 Frontend Route Guards

### `AuthGuard`

- Confirms a Supabase session exists.
- Redirects unauthenticated users to `/login`.

### `RoleGuard`

- Receives allowed roles.
- Redirects unauthorized users to `/unauthorized`.

### `OnboardingGuard`

- Checks `profiles.onboarding_status`.
- Prevents interns from skipping mandatory onboarding steps.

Frontend guards improve user experience, but they do not replace RLS.

## 4.4 RLS Permission Rules

### Intern

An Intern can:

- Read and update their own profile
- Read and write their own diary, to-do, submissions, and feedback
- Read announcements intended for them
- Read allowed community posts
- Read the leaderboard
- Mark attendance only for their own user ID

### Admin — Onboarding Intern Visibility

An Admin can read all Intern profiles whose onboarding is not completed:

```text
profiles.onboarding_status != 'completed'
```

This visibility applies only to onboarding-related information required for monitoring.

Admins must not automatically receive permission to modify every onboarding Intern.

### Admin — Allocated Intern Visibility

After the Intern receives `profiles.problem_statement_id`, the Admin can read and manage the Intern only when a matching record exists in `admin_problem_statements`.

Relationship:

```text
profiles.problem_statement_id
=
admin_problem_statements.problem_statement_id
```

and:

```text
admin_problem_statements.admin_id
=
auth.uid()
```

### Super Admin

A Super Admin can read and manage all platform records.

## 4.5 Recommended Database Helper Functions

```sql
get_my_role()
is_super_admin()
is_admin()
is_intern()
admin_has_problem_statement(target_problem_statement_id uuid)
admin_can_access_intern(target_intern_id uuid)
is_onboarding_intern(target_intern_id uuid)
```

These functions should use `auth.uid()` and be used in RLS policies.

## 4.6 Admin Account Creation

Admin creation must run through a Supabase Edge Function.

```text
Super Admin submits Create Admin form
→ Edge Function verifies caller is Super Admin
→ Supabase Admin API creates auth user
→ Function inserts profiles record
→ Function inserts user_roles record with role = admin
→ Function inserts admin_problem_statements allocations
→ Function returns success
```

Never put the Supabase service-role key in the React application.

---

# 5. Module List

## 5.1 Authentication Module

### Pages
- Login
- Register
- Forgot Password
- Reset Password
- Unauthorized
- Session Expired

## 5.2 Intern Onboarding Module

### Pages
- Registration
- Basic Profile
- Questionnaire
- Learning Introduction
- Seven Activities
- Interview Status
- Problem Statement Allocation Status
- Onboarding Progress

## 5.3 Intern Dashboard Module

### Pages
- Dashboard
- Attendance
- Daily Diary
- To-Do
- Pending Work
- Learning Activities
- Advanced LMS
- Tenon
- Community
- AI Post Generator
- Leaderboard
- Announcements
- Feedback & Suggestions
- Profile
- Settings

## 5.4 Admin Dashboard Module

### Pages
- Dashboard
- All Onboarding Interns
- Allocated Active Interns
- Intern Details
- Questionnaire Review
- Activity Review
- Attendance Review
- Daily Diary Review
- Pending Work Review
- Learning Management
- Community
- AI Post Management
- Leaderboard
- Announcements
- Feedback
- Profile
- Settings

## 5.5 Super Admin Dashboard Module

### Pages
- Dashboard
- Admin List
- Create Admin
- Edit Admin
- Admin Allocation
- Problem Statement List
- Create/Edit Problem Statement
- All Onboarding Interns
- All Active Interns
- Intern Allocation
- Intern Transfer
- Attendance Management
- Daily Diary Management
- Pending Work Management
- Learning Management
- External Integration Settings
- Community Moderation
- Leaderboard Management
- Announcement Management
- Feedback Management
- Reports & Analytics
- Audit Logs
- System Settings
- Profile

## 5.6 Reports Module

### Reports
- Attendance Report
- Intern Progress Report
- Learning Progress Report
- Pending Work Report
- Daily Diary Report
- Problem Statement Report
- Leaderboard Report
- Admin Performance Report

---

# 6. Key Data Flows

## 6.1 Flow 1 — New Intern Registration and Onboarding

### Step 1: Registration

The Intern submits email and password.

```text
React Registration Form
→ Supabase Auth signUp()
→ auth.users record created
→ profiles record created
→ user_roles record created with role = intern
→ onboarding_progress record created
```

Initial values:

```text
profiles.account_status = pending
profiles.onboarding_status = registered
profiles.problem_statement_id = null
```

### Step 2: Onboarding Completion

The Intern completes:

1. Basic profile
2. Questionnaire
3. Learning introduction
4. Seven activities
5. Interview

Each completed step updates:

- `onboarding_progress`
- `profiles.onboarding_status`
- `onboarding_progress.completion_percentage`

### Step 3: Admin Visibility During Onboarding

Every Admin can view the Intern while:

```text
profiles.onboarding_status != completed
```

Admins can monitor allowed onboarding data, questionnaire status, activity status, and interview status.

### Step 4: Problem Statement Allocation

The Super Admin allocates a Problem Statement:

```text
profiles.problem_statement_id = selected_problem_statement_id
```

The system also inserts a row into:

```text
intern_problem_statement_history
```

Then:

```text
profiles.onboarding_status = completed
profiles.account_status = active
onboarding_progress.problem_statement_allocated = true
onboarding_progress.completed_at = now()
```

### Step 5: Visibility Changes

After allocation:

- The Intern disappears from the common onboarding list.
- Only the Admins mapped to that Problem Statement can view the Intern.
- The Super Admin continues to view the Intern.
- The Intern enters `/intern/dashboard`.

---

## 6.2 Flow 2 — Super Admin Creates an Admin and Assigns Problem Statements

### Step 1: Form Submission

The Super Admin enters:

- Full name
- Email
- Mobile
- Temporary password
- Status
- One or more Problem Statements

### Step 2: Secure Function Call

React calls the `create-admin` Edge Function.

The function verifies:

```text
auth.uid() belongs to role = super_admin
```

### Step 3: Account and Role Creation

The Edge Function:

1. Creates the user in Supabase Auth.
2. Inserts a row in `profiles`.
3. Inserts `role = admin` in `user_roles`.
4. Inserts one row per allocation in `admin_problem_statements`.
5. Writes an `audit_logs` record.

### Step 4: Admin Login

The Admin logs in using the same shared login page.

The application redirects the Admin to:

```text
/admin/dashboard
```

### Step 5: Data Access

The Admin can:

- View all onboarding Interns
- View active Interns only for allocated Problem Statements
- Review only the allowed records belonging to those Interns

RLS blocks access to active Interns from all other Problem Statements.

---

## 6.3 Flow 3 — Intern Marks Attendance and Admin Reviews It

### Step 1: Session Creation

An authorized Admin or Super Admin creates an `attendance_sessions` record.

The session contains:

- Date
- Start time
- End time
- Optional Problem Statement
- Optional attendance password
- Optional location and radius
- Active status

### Step 2: Intern Opens Attendance

The Intern dashboard queries active sessions that apply to:

- All Interns, or
- The Intern’s allocated Problem Statement

### Step 3: Validation

Before inserting attendance, the system checks:

- User role is Intern
- Session is active
- Current time is inside the allowed time range
- Intern belongs to the required Problem Statement
- Attendance has not already been marked
- Password is correct, when enabled
- Location is inside the permitted radius, when enabled

### Step 4: Record Creation

A row is inserted into `attendance_records`:

```text
session_id
intern_id = auth.uid()
status
marked_at
latitude
longitude
marked_by = auth.uid()
is_manual = false
```

### Step 5: Admin Review

- Super Admin can review all attendance.
- Admin can review attendance only for allocated active Interns.
- The Intern can review only their own attendance history.

Manual changes by Admin or Super Admin must create an `audit_logs` entry.

---

# 7. Important Implementation Rules

- Build Authentication and RLS before dashboard modules.
- Do not expose service-role or third-party secret keys in React.
- Every important table must have RLS enabled.
- Test permissions using separate Intern, Admin, and Super Admin accounts.
- Use database foreign keys instead of joining records only in React.
- Use Edge Functions for privileged operations and external APIs.
- Keep the MVP focused; do not add payments, certificates, chat, or predictive AI.
- Generate Supabase TypeScript types after schema changes.
- Add database indexes to frequently filtered foreign keys.

Recommended indexes:

```sql
create index idx_profiles_problem_statement
on profiles(problem_statement_id);

create index idx_profiles_onboarding_status
on profiles(onboarding_status);

create index idx_admin_ps_admin
on admin_problem_statements(admin_id);

create index idx_admin_ps_problem_statement
on admin_problem_statements(problem_statement_id);

create index idx_attendance_records_intern
on attendance_records(intern_id);

create index idx_daily_diary_intern_date
on daily_diary_entries(intern_id, entry_date);

create index idx_pending_work_assigned_to
on pending_work_items(assigned_to);

create index idx_learning_progress_intern
on learning_progress(intern_id);
```

---

# 8. Recommended Build Sequence

1. React, TypeScript, Vite, Tailwind, and Supabase setup
2. Database migrations for `profiles`, `user_roles`, and `problem_statements`
3. Authentication and shared login
4. Role and onboarding route guards
5. Supabase RLS helper functions and policies
6. Super Admin account bootstrap
7. Admin creation Edge Function
8. Problem Statement and Admin allocation
9. Intern registration and onboarding
10. Allocation-based Admin visibility
11. Intern dashboard foundation
12. Attendance
13. Daily Diary
14. To-Do
15. Pending Work
16. Learning and API integrations
17. Community and engagement
18. Reports
19. Audit logs
20. Security and acceptance testing

---

# 9. Module Documentation Prompt

Use the following prompt after this architecture has been approved:

```text
You are helping me build AI Apex Launchpad — Internship Provider & Management System.

Here is the PRD:
[Paste AI_Apex_Launchpad_PRD.md]

Here is the Architecture:
[Paste ARCHITECTURE.md]

Generate a detailed module document for the [MODULE NAME] with these sections:

1. Module Purpose
2. Pages / Screens in this module
3. For each screen:
   - Data shown
   - Actions available
   - Role access
4. React Component List
5. Supabase queries and data operations
6. Validation rules
7. Row Level Security requirements
8. Loading, empty, success, and error states
9. Edge cases
10. Build order
11. Acceptance criteria

Use the exact table and column names from ARCHITECTURE.md.
Do not introduce duplicate tables or alternative column names.
Keep the implementation compatible with React, TypeScript, Vite, TanStack Query, Tailwind CSS, shadcn/ui, and Supabase.
```
