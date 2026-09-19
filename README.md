<div align="center">

# 🌱 NextStep Hub

### Step confidently into your next chapter.

Virtual mentorship and counseling for youth, from high school to campus to career.

_By desolNurturers_

![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)
![Platforms](https://img.shields.io/badge/Platforms-Android%20%7C%20iOS%20%7C%20Web-blue)

</div>

---

## 📖 About

**NextStep Hub** is a mobile app that connects young people with trusted mentors and counselors at every major life transition. Whether you are choosing a university course, settling into campus life, planning your career, or simply need someone to talk to, NextStep Hub makes it easy to learn, get guided, and book a private one-on-one virtual session.

The app serves three types of users, each with their own tailored experience:

| Role             | Who they are                                | What they can do                                                             |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| 🎓 **Client**    | Students, graduates and young professionals | Explore guidance programs, book sessions, manage appointments, leave reviews |
| 🧑‍🏫 **Counselor** | Verified mentors and counselors             | Manage sessions, set availability, run programs, view client feedback        |
| 🛡️ **Admin**     | Platform administrators                     | Approve staff, set pricing, oversee appointments and programs                |

---

## ✨ Features

### For Clients

- **Guided learning tracks** covering three journeys:
  - **Pre-Campus**: high school to university transition, course selection, hostel booking, campus life, study skills, relationships, parent-student dynamics and KUCCPS application support.
  - **Post-Campus**: life after graduation, postgraduate study and scholarships, CV and portfolio building, job market and interview prep, entrepreneurship, financial management and mental health.
  - **Career Guidance**: career discovery, industry exposure, career pivots, leadership growth, income diversification, purpose and passion (Ikigai), and career reset.
- **Easy step-by-step booking**: choose a counseling type (Individual, Group, Couple, Family, Student, Teen), share your reasons and goals, accept the terms, pick a counselor, then choose a date and time.
- **Smart scheduling rules**: sessions are Monday to Friday, 8:00 AM to 5:00 PM, with a lunch break from 1:00 PM to 2:00 PM.
- **Appointment management**: view upcoming sessions, cancel with a reason, leave a review after a session, or delete old records.
- **Personal profile** with photo upload and emergency contact details.
- **Privacy first**: confidentiality terms aligned with Kenya's Data Protection Act, 2019.

### For Counselors

- **Dashboard** with upcoming sessions and one-tap **Join Virtual Room** (Google Meet or Zoom).
- **Calendar control**: block out unavailable dates; weekends are non-working by default.
- **Session actions**: mark as attended (with notes), postpone, transfer, or cancel, with a full history log.
- **Program management**: create, edit and delete mentorship programs, view registered participants and mark attendance.
- **Client reviews** with star ratings and session details.
- **Professional profile** with specializations, bio and experience.

### For Admins

- **Overview dashboard** with quick actions, upcoming events and recent activity.
- **Appointments archive** organized by year and month, including counselor remarks and client reviews.
- **Programs & events** split into upcoming and past.
- **Staff management**: whitelist counselor and admin emails, approve, suspend, reactivate or remove staff.
- **Pricing control**: set the standard session fee with quick presets.
- **Settings**: notifications, biometric unlock and database backup controls.

### Security & Access

- Email and password sign-in powered by **Supabase Auth**.
- **Role-based routing**: every user is taken to the right experience automatically.
- **Approval workflow**: counselor and admin accounts must be approved before use.
- **Suspension support**: suspended accounts are blocked with a clear message.
- Session tokens stored securely with **Expo SecureStore**.

---

## 🛠️ Tech Stack

- **Framework:** [Expo](https://expo.dev) (SDK 57) with [React Native](https://reactnative.dev) 0.86 and React 19
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction) (file-based routing)
- **Backend:** [Supabase](https://supabase.com) (Auth, Postgres database, Storage)
- **UI & UX:** Ionicons, React Native Reanimated, custom animated preloader
- **Utilities:** `react-native-calendars`, `@react-native-community/datetimepicker`, `expo-image-picker`, `expo-secure-store`, AsyncStorage

---

## 📁 Project Structure

```
├── libs/
│   └── supabase.js              # Supabase client setup
├── src/
│   ├── app/                     # Screens (Expo Router)
│   │   ├── (auth)/              # Landing, login, signup, pending & suspended screens
│   │   ├── (client)/            # Client home, appointments, programs, profile
│   │   ├── (counselor)/         # Counselor dashboard, appointments, programs, profile
│   │   ├── (admin)/             # Admin dashboard, staff, pricing, programs, settings
│   │   └── _layout.jsx          # Root layout, auth context & role guard
│   ├── components/              # Shared components and program content data
│   └── styles/                  # Screen stylesheets grouped by role
├── assets/                      # Images and icons
└── app.json                     # Expo configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20.19 or newer
- npm
- A [Supabase](https://supabase.com) project
- [Expo Go](https://expo.dev/go) on your phone, or an Android emulator / iOS simulator

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/nextstep-hub.git
cd nextstep-hub
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### 3. Set up Supabase

Create the following in your Supabase project:

**Table: `profiles`**: one row per user (linked to the auth user ID)

`id`, `email`, `first_name`, `middle_name`, `surname`, `full_name`, `role`, `phone_no`, `alt_phone_no`, `gender`, `age`, `county`, `relationship_status`, `religion`, `emergency_phone`, `emergency_relationship`, `years_of_experience`, `specializations`, `about`, `avatar_url`, `approved`, `suspended`, `updated_at`

**Table: `staff_whitelist`**: emails pre-approved for staff roles

`id`, `email`, `role` (`Counselor` or `Admin`)

**Storage bucket: `avatars`**: public bucket for profile pictures, with policies letting users upload into their own `<user-id>/` folder.

Enable Row Level Security and add policies appropriate to each role.

> 💡 **Creating the first admin:** add your email to `staff_whitelist` with the role `Admin`, sign up in the app, then set `approved = true` on your row in `profiles`.

### 4. Run the app

```bash
npx expo start
```

Then press `a` for Android, `i` for iOS, `w` for web, or scan the QR code with Expo Go.

---

## 📦 Building for Release

The app uses [EAS Build](https://docs.expo.dev/build/introduction/).

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

Upload the generated `.aab` file to the Google Play Console.

---

## 🧭 Roadmap

- [ ] Live M-Pesa payment integration (the payment step is currently simulated)
- [ ] Connect appointments, programs and reviews to the Supabase database (some screens use sample data)
- [ ] Push notifications for reminders and approvals
- [ ] In-app chat between clients and counselors
- [ ] Automated Google Meet link generation
- [ ] Swahili language support

---

## ⚠️ Important Notice

NextStep Hub provides mentorship and counseling support but **is not an emergency service**. If you or someone you know is in immediate danger or crisis, please contact your local emergency services or a crisis helpline right away.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📬 Support

Questions or issues? Email **support@nextstep.org** or open an issue on GitHub.

---

## 📄 License

Add your chosen license here (for example, MIT) and include a `LICENSE` file in the repository.

---

<div align="center">

Made with 💚 by **desolNurturers** to help young people take their next step with confidence.

</div>

---

<!---

# 📱 Google Play Store Listing Copy

*Ready to paste into the Play Console.*

### App name (max 30 characters)
```
NextStep Hub: Youth Mentorship
```

### Short description (max 80 characters)
```
Book private mentorship & counseling from high school to campus to career.
```

### Full description (max 4000 characters)

```
Step confidently into your next chapter with NextStep Hub.

NextStep Hub connects young people with trusted mentors and counselors who guide you through life's biggest transitions: from high school to university, through campus life, and into your career.

🎓 GUIDANCE FOR EVERY STAGE
• Pre-Campus: course selection, KUCCPS application support, hostel tips, campus readiness, study skills and budgeting
• Post-Campus: CV building, job search and interview prep, scholarships, entrepreneurship and financial independence
• Career Guidance: discover your strengths, pivot careers, grow into leadership and find purpose in your work

📅 BOOK IN MINUTES
Choose the type of session that fits you (Individual, Group, Couple, Family, Student or Teen), share what you'd like to work on, pick your counselor, and select a time that suits you. Sessions are held online through video call, so you can join from anywhere.

💬 SUPPORT THAT'S PERSONAL
• Talk about career, relationships, family, finances, mental health and campus life
• Manage, reschedule or cancel your appointments easily
• Leave feedback after each session

🔒 PRIVATE AND SECURE
• Your information is handled in line with Kenya's Data Protection Act, 2019
• Sessions are confidential
• Secure sign-in and role-based access

👩‍🏫 FOR COUNSELORS AND ADMINS
Counselors can manage sessions, set availability, run programs and view client feedback. Admins can approve staff, manage pricing and oversee the platform.

Download NextStep Hub today and take your next step with confidence.

Note: NextStep Hub is not an emergency service. If you are in crisis or immediate danger, please contact your local emergency services.
```

### Suggested category & tags
- **Category:** Education (alternative: Lifestyle)
- **Tags:** mentorship, counseling, career guidance, student, youth, university, jobs
- **Contact email:** support@nextstep.org

### Store assets checklist
- [ ] App icon: 512 × 512 PNG
- [ ] Feature graphic: 1024 × 500 PNG
- [ ] At least 4 phone screenshots (suggested: Home, Programs, Booking flow, Appointments)
- [ ] Privacy Policy URL (required, especially since the app collects personal data)
- [ ] Data safety form: declare email, name, phone number, age, location (county), profile photo and emergency contact
- [ ] Content rating questionnaire

-->
