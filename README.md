<div align="center">

# 🌱 NextStep Hub

### Step Confidently Into Your Next Chapter.

**Proprietary Virtual Mentorship and Counseling Platform for Kenyan Youth**

\*Exclusively Owned and Commissioned by **desolNurturers** • Founded & Directed by **Lucy Ngutiku Muguna\***

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary%20%7C%20All%20Rights%20Reserved-red.svg?style=for-the-badge)](./LICENSE)
[![Jurisdiction](https://img.shields.io/badge/Jurisdiction-Republic%20of%20Kenya-darkgreen?style=for-the-badge)](https://kenyalaw.org)
[![Copyright Act](https://img.shields.io/badge/Protected%20By-Copyright%20Act%20Cap%20130-blue?style=for-the-badge)](https://www.copyright.go.ke)
[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo)](https://expo.dev)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Compliance](https://img.shields.io/badge/Compliance-Kenya%20Data%20Protection%20Act%202019-orange?style=for-the-badge)](https://www.odpc.go.ke)

</div>

---

> ### ⚠️ PROPRIETARY & CONFIDENTIAL LEGAL WARNING
>
> **This software, source code, design architecture, workflows, and localized mentorship content are the exclusive, proprietary intellectual property of desolNurturers (Nairobi, Kenya), founded and owned by Lucy Ngutiku Muguna.**
>
> **THIS IS NOT OPEN-SOURCE, CHARITY, OR PUBLIC-DOMAIN SOFTWARE.**  
> Any unauthorized copying, cloning, decompilation, distribution, reverse engineering, publication, hosting on unauthorized servers, or commercial exploitation of this application—in whole or in part—is strictly prohibited and constitutes an immediate violation of the **Copyright Act (Cap. 130 of the Laws of Kenya)** and international copyright treaties. Violators will face immediate ex-parte injunctions, commercial damages claims, and criminal prosecution.

---

## 📖 About NextStep Hub

**NextStep Hub** is a commercial digital health, coaching, and psychological counseling mobile platform developed specifically for **desolNurturers**. Built under the clinical and professional guidance of **Lucy Ngutiku Muguna**, the platform addresses the high-anxiety transition periods faced by Kenyan youth: from high school exit and university admissions via KUCCPS to campus life, graduation, HELB debt management, and career advancement.

---

## 👥 Three-Tier Role Architecture

NextStep Hub enforces strict role-based routing and access segregation:

| Role             | Target Demographic                                           | Authorized Actions                                                                                                                                                                                     |
| :--------------- | :----------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🎓 **Client**    | High school graduates, university/TVET students, job seekers | Browse structured guidance tracks, book private 1-on-1 virtual or phone counseling sessions, register for workshops, submit session feedback, and manage personal profile & emergency contact records. |
| 🧑‍🏫 **Counselor** | Whitelisted therapists & certified mentors                   | Review assigned sessions, manage work schedule & block absent days, generate and attach virtual room links (Google Meet / Zoom), record clinical session notes, and track client reviews.              |
| 🛡️ **Admin**     | desolNurturers directors & supervisory staff                 | Manage counselor and admin whitelist registries, approve/suspend staff accounts, configure standard session pricing (KES), manage program schedules, and inspect global audit logs.                    |

---

## 🧭 Localized Kenyan Guidance Curriculum

The application comes pre-loaded with proprietary guidance modules created for the Kenyan educational and economic context:

### 1. 🏫 Pre-Campus Guidance (High School to University)

- **KUCCPS Placement & Cluster Points:** Calculating cluster points, cut-off revision strategies, and Inter-University Transfer (IUT) procedures.
- **Course vs. Career Alignment:** Mapping degree programs against actual Kenyan industry demand.
- **Hostel & Security Vetting:** Assessing on-campus vs. off-campus accommodation, sanitation, distance, and security protocols.
- **Campus Culture Readiness:** Independence, self-directed study, peer pressure management, and budgeting daily allowances.
- **Parent-Student Dynamic:** Navigating parental transition from direct control to guided autonomy.

### 2. 🎓 Post-Campus & Early Career Transition

- **Post-Graduation Mindset:** Handling the post-university transition, managing family expectations, and setting 6-month milestones.
- **ATS-Optimized Resumes & Portfolios:** Tailoring CVs to pass corporate Applicant Tracking Systems with impact metrics.
- **Interview Mastery & Job Hunting:** Hidden job markets, cold outreach, and STAR behavioral interview practice.
- **Financial Literacy & Independence:** Budgeting frameworks (50/30/20), managing HELB loan repayments, and introductory investments (Money Market Funds, SACCOs, emergency buffers).
- **Postgraduate & Scholarships:** Sourcing and applying for local and international postgraduate opportunities.

### 3. 💼 Career Guidance, Growth & Pivots

- **Ikigai Alignment:** Discovering the intersection of passion, innate strengths, societal impact, and financial viability.
- **Workplace Dynamics:** Corporate communication, office politics, performance reviews, and managing up.
- **Career Pivots:** Transitioning into high-growth sectors (Tech, Finance, Agribusiness) without starting from scratch.
- **Income Diversification & Side Gigs:** Setting freelance consulting rates and building complementary skills ethically.
- **Burnout & Career Resets:** Formulating safe exit strategies from toxic environments and rebuilding confidence.

---

## 🛠️ Technology Stack

- **Client Runtime:** [Expo SDK 57](https://expo.dev) with [React Native 0.86.3](https://reactnative.dev) & React 19
- **Navigation:** [Expo Router v57](https://docs.expo.dev/router/introduction) (Dynamic tab-based & modal routing with role guards)
- **Backend & Database:** [Supabase](https://supabase.com) (PostgreSQL, Supabase Auth, Row Level Security, Realtime, Storage)
- **Animations:** `react-native-reanimated` 4.5, `expo-linear-gradient`, `expo-haptics`
- **Calendar & Form Controls:** `react-native-calendars`, `@react-native-community/datetimepicker`
- **Security & Storage:** `expo-secure-store`, `@react-native-async-storage/async-storage`
- **Media & Hardware:** `expo-image-picker`, `expo-device`, `expo-splash-screen`

---

## 📁 Project Directory Structure

```text
nextstep-hub/
├── assets/                       # App icons, splash screens, illustration graphics
├── libs/                         # Core backend client setup and notification helpers
│   ├── appointmentsReminder.js   # Appointment alert helpers
│   ├── notifications.js          # In-app realtime notification handlers
│   └── supabase.js               # Supabase client with SecureStore adapter
├── src/
│   ├── app/                      # Application routes (Expo Router)
│   │   ├── (admin)/              # Admin layout, dashboard, staff, pricing, programs
│   │   ├── (auth)/               # Landing, login, multi-step signup, pending, suspended
│   │   ├── (client)/             # Client home, booking flow, appointments, programs, profile
│   │   ├── (counselor)/          # Counselor home, schedule, session actions, programs
│   │   ├── _layout.jsx           # Root layout, Supabase session restoration & role guards
│   │   └── index.jsx             # Cold-start mount view
│   ├── components/               # UI components, modals, cards, skeletons
│   │   ├── client/               # Category tiles, booking steps, program module data
│   │   ├── counselor/            # Session rows, action modals, review cards
│   │   ├── landing/              # Aurora blobs, shimmer buttons, rotating headlines
│   │   └── preLoader.jsx         # Custom seedling sprout intro animation
│   ├── context/                  # React contexts (NotificationsContext, AuthContext)
│   ├── hooks/                    # Reusable custom hooks
│   ├── services/                 # Email templates and delivery integration
│   └── styles/                   # Role-grouped UI stylesheets
├── app.json                      # Expo application manifest & plugin configuration
├── package.json                  # Dependencies and execution scripts
├── tsconfig.json                 # TypeScript compiler paths and aliases
└── LICENSE                       # Proprietary All Rights Reserved License
```

---

## 🚀 Internal Developer Setup

This section is strictly for authorized developers and contractors assigned by **desolNurturers**.

### 1. Prerequisites

- [Node.js](https://nodejs.org) (v20.19.0 or higher)
- [Git](https://git-scm.com)
- Active credentials to the official **desolNurturers** Supabase organization

### 2. Installation

```bash
git clone <authorized-private-repo-url>
cd nextstep-hub
npm install
```

### 3. Environment Variables

Create a local `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
EXPO_PUBLIC_EMAIL_SERVICE_URL=https://your-email-service.com/send
```

> ⚠️ **Strict Non-Disclosure:** Never share, export, or publish your `.env` credentials, API tokens, or keys.

---

## 🗄️ Database Schema Initialization (Supabase SQL)

Authorized administrators setting up a staging or production instance can run the following SQL script inside the Supabase **SQL Editor**:

```sql
-- 1. Create Profiles Table (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    surname TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'Client' CHECK (role IN ('Client', 'Counselor', 'Admin')),
    phone_no TEXT,
    alt_phone_no TEXT,
    gender TEXT,
    age INT,
    county TEXT,
    relationship_status TEXT,
    religion TEXT,
    emergency_phone TEXT,
    emergency_relationship TEXT,
    years_of_experience INT,
    specializations TEXT[],
    about TEXT,
    avatar_url TEXT,
    absent_days TEXT[] DEFAULT '{}',
    approved BOOLEAN DEFAULT FALSE,
    suspended BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff Whitelist Table (Pre-approved Counselors and Admins)
CREATE TABLE IF NOT EXISTS public.staff_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Counselor', 'Admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    counselor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    counseling_type TEXT NOT NULL,
    reasons TEXT[] DEFAULT '{}',
    other_reason TEXT,
    session_goals TEXT,
    had_therapy_before BOOLEAN,
    agreed_terms BOOLEAN DEFAULT TRUE,
    session_mode TEXT DEFAULT 'online' CHECK (session_mode IN ('online', 'phone')),
    client_call_phone TEXT,
    session_link TEXT,
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    scheduled_end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 50,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled_by_client', 'cancelled_by_counselor', 'rescheduled', 'rescheduled_requested', 'no_show', 'pending_payment')),
    payment_status TEXT DEFAULT 'completed',
    payment_amount NUMERIC(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'KES',
    mpesa_transaction_reference TEXT,
    notes TEXT,
    action_reason TEXT,
    action_by_role TEXT,
    action_at TIMESTAMPTZ,
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_1h_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Appointment Reviews & Clinical Notes Table
CREATE TABLE IF NOT EXISTS public.appointment_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('client', 'counselor', 'admin')),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    counselor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Programs & Workshops Table
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    location_type TEXT DEFAULT 'virtual' CHECK (location_type IN ('virtual', 'physical', 'phone')),
    location_details TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    amount NUMERIC(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'KES',
    poster_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Program Registrations Table
CREATE TABLE IF NOT EXISTS public.program_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(program_id, client_id)
);

-- 7. In-App Realtime Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Platform System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default appointment pricing
INSERT INTO public.system_settings (key, value)
VALUES ('session_pricing', '{"amount": 2500, "currency": "KES"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 9. Storage Bucket: Avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

---

## 📱 Development & Testing Commands

```bash
# Start local development server
npx expo start

# Run on Android handset or emulator
npx expo start --android

# Run on iOS simulator
npx expo start --ios

# Run in web browser
npx expo start --web
```

---

## 📦 Production Deployment (EAS Build)

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to authorized desolNurturers Expo organization
eas login

# Build production Android App Bundle (AAB for Google Play Console)
eas build --platform android --profile production

# Build preview APK for internal device testing
eas build --platform android --profile preview
```

---

## 🔒 Confidentiality & Crisis Notice

- **Kenya Data Protection Act, 2019:** All client records, clinical notes, and user data are strictly confidential.
- **Crisis Helpline Notice:** NextStep Hub is a counseling and mentorship platform, **not an emergency psychiatric or medical intervention service**. Users in acute emotional distress or immediate danger must contact local emergency services or the Kenya Red Cross hotline (**1199**).

---

## ⚖️ Legal & Copyright Enforcement

```text
Copyright © 2026 desolNurturers. All Rights Reserved.
Founder & Principal: Lucy Ngutiku Muguna
Headquarters: Nairobi, Kenya

Protected under:
- The Copyright Act (Cap. 130 of the Laws of Kenya)
- The Industrial Property Act of Kenya
- The Berne Convention for the Protection of Literary and Artistic Works
- The WIPO Copyright Treaty (WCT)
```

For authorized business discussions, institutional partnerships, or legal inquiries, contact:
**desolNurturers**  
Email: **nstephub@gmail.com**

---

<div align="center">

**NextStep Hub** • _Step Confidently Into Your Next Chapter_  
**Proprietary Software — desolNurturers (Lucy Ngutiku Muguna)**  
_All Rights Reserved. Unauthorized duplication is strictly prohibited._

</div>

<!---
# 📱 Google Play Store Listing Copy
Ready to copy and paste directly into Google Play Console:

### App Name (max 30 characters)
NextStep Hub: Youth Mentorship

### Short Description (max 80 characters)
Book private mentorship & counseling from high school to campus to your career.

### Full Description (max 4000 characters)
Step confidently into your next chapter with NextStep Hub.

NextStep Hub connects young people with trusted, verified mentors and counselors who guide you through life's biggest transitions: from high school exit and university admission, through campus life, and into the professional workplace.

🎓 GUIDANCE FOR EVERY MAJOR MILESTONE:
• Pre-Campus: KUCCPS portal navigation, cluster point calculations, course selection, hostel safety checklist, budgeting pocket money, and campus readiness.
• Post-Campus: Graduation mindset, CV and portfolio building for ATS systems, interview preparation, managing student loans (HELB), and introductory financial literacy (Money Market Funds & budgeting).
• Career Mentorship: Discover your strengths (Ikigai), explore high-demand industries, pivot careers smoothly, and build workplace confidence.

📅 BOOK PRIVATE VIRTUAL SESSIONS:
Choose the counseling format that fits your needs (Individual, Student, Teen, Career, or Family guidance), share your goals, select your mentor, and pick a convenient date and time. Sessions are held confidentially via online video call or phone call.

💬 SUPPORT DESIGNED FOR YOU:
• Talk through academic stress, career choices, relationships, campus life, and personal wellness.
• Easily reschedule, postpone, or manage your bookings in one central place.
• Receive session summaries and verified clinical notes.

🔒 PRIVATE & CONFIDENTIAL:
• Your personal information is handled in strict compliance with Kenya's Data Protection Act, 2019.
• Sessions remain private and confidential.
• Secure token authentication and encrypted device storage.

👩‍🏫 FOR COUNSELORS & MENTORS:
Verified counselors can set flexible working days, block absent dates, manage intake notes, and host virtual sessions with young Kenyans nationwide.

Download NextStep Hub today and take your next step with clarity and confidence.

Disclaimer: NextStep Hub provides guidance, life coaching, and counseling support. It is not an emergency psychiatric or medical intervention service. If you or someone you know is in immediate crisis, please contact local emergency hotlines immediately.
-->
