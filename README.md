# DigiSakhi — Women's Personal Safety & Empowerment Platform

> **"For Her. With Her. Always."**  
> **Live Production Platform:** [https://safesphere-liart.vercel.app](https://safesphere-liart.vercel.app)

[![Production Status](https://img.shields.io/badge/Production-Live-success?style=flat-square)](https://safesphere-liart.vercel.app)
[![Tests Passing](https://img.shields.io/badge/QA%20Tests-43%2F43%20Passing-brightgreen?style=flat-square)](https://safesphere-liart.vercel.app)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%205.8-blue?style=flat-square)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38B2AC?style=flat-square)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF?style=flat-square)](https://vitejs.dev)
[![Database](https://img.shields.io/badge/Backend-Dual--Mode%20(Serverless%20%2B%20Supabase)-5517C8?style=flat-square)](https://supabase.com)

---

## 📌 Executive Summary

**DigiSakhi** is a privacy-first, proactive personal safety web application designed to empower women during daily commutes, solo travel, and vulnerable situations.

Traditional personal safety applications often suffer from critical operational flaws:
1. **Panic Induction & False Alarms:** Single-button SOS systems trigger extreme panic, immediately dispatching police or notifying entire contact lists for benign delays or missed check-ins.
2. **Expensive Telecom Gateways:** Most applications demand paid third-party SMS/voice gateway subscriptions (e.g., Twilio, AWS SNS), making them inaccessible or fragile when credentials expire.
3. **Invasive 24/7 Surveillance:** Constant background location tracking drains battery, creates anxiety, and exposes private routines to third-party servers.
4. **Static, Unresponsive Workflows:** When a distress situation escalates, static apps fail to sequence contact tiers (e.g., calling a primary contact first before escalating to secondary contacts or emergency helplines).

**DigiSakhi solves these challenges** through a proactive safety companion architecture:
- **Smart Check-ins with Grace Period Buffers:** Overdue check-ins enter an audible, non-alarmist grace period before alerting contacts, eliminating accidental false alarms.
- **Custom Safety Journeys:** Flexible transit monitoring with customizable intervals (5, 10, 15, 20, 30 min, or custom), countdown durations, and geofenced safe arrival verification.
- **Interactive 3-Button Response Engine:** Direct, 1-tap responses during transit (*"I'm Okay 💚"*, *"I Need Help 🟠"*, *"Urgent Help 🚨"*).
- **Zero-Cost Native Messaging:** Deep integration with WhatsApp (`https://wa.me/`) and device SMS apps (`sms:`) for contact invitations and emergency broadcasts with live Google Maps GPS coordinates without requiring paid external SMS API accounts.
- **Sequential Multi-Tier Escalation:** Automatically routes alerts to Tier 1 responders first, escalating to Tier 2 backup contacts only if Tier 1 does not acknowledge within the configured response window.
- **Discreet Emergency Camouflage:** Instant disguise mechanism (triggered via `Esc` key) covering the interface with an innocent Weather, Notes, or Calculator app, protected by a private PIN.

---

## 🌟 Live Demonstration

- **Production URL:** [https://safesphere-liart.vercel.app](https://safesphere-liart.vercel.app)
- **Deployment Platform:** Vercel Production
- **Cross-Platform Compatibility:** Tested and verified on iOS Safari, Android Chrome, macOS Safari/Chrome, and Windows Edge.

---

## 🚀 Implemented & Verified Features

DigiSakhi features a fully functional set of core features verified across desktop and mobile devices:

### 1. Real Authentication & Persistent Accounts
- **Account Registration & Login:** Create personal accounts secured by salted SHA-256 password hashing.
- **Cross-Device Account Recovery:** Persistent backend synchronization via `/api/account` allows users to log in on any computer or smartphone and retrieve their saved profile, trusted contacts, protocols, and active journeys.
- **Session Management:** Encrypted token persistence in local storage with automatic cleanup on sign-out.

### 2. 5-Step Guided First-Time Onboarding
- **Step 1 — Profile & Identity:** Full legal name, verified contact number, emergency medical notes (blood group, allergies).
- **Step 2 — Trusted Circle Setup:** Direct addition of primary trusted responders (name, phone, relationship, escalation tier).
- **Step 3 — Check-in Rules:** Configurable default check-in intervals (15 to 60 min), response deadlines, and audible grace periods.
- **Step 4 — Emergency Helpline Configuration:** Preferred emergency dialer destination (112 National Emergency, 1091 Women Helpline, 100 Police, or Primary Contact).
- **Step 5 — Verification & Activation:** Summary review, permission confirmation, and direct transition to the personalized safety dashboard.

### 3. Custom Safety Journey Engine
- **Flexible Journey Configuration:** Set custom route details (origin, destination), check-in intervals (5, 10, 15, 20, 30 min, or custom minutes), and response countdown windows (60s to 300s).
- **Tier 1 & Tier 2 Responder Assignment:** Explicitly assign who is called first when help is requested and who serves as the secondary backup.
- **3-Button Check-in Prompt:** When a scheduled check-in is due, an interactive prompt displays three distinct actions:
  - **I'M OKAY 💚:** Confirms safety, resets the timer, and schedules the next interval.
  - **I NEED HELP 🟠:** 1-click native dialer trigger for the assigned Tier 1 contact and logs a call action. If unanswered, an escalation button appears to call Tier 2.
  - **URGENT HELP 🚨:** 1-click native dialer trigger for emergency services (112 / 1091) and logs an urgent distress incident.
- **Missed Check-in Rule:** Configurable behavior when the countdown elapses: persistent in-app warning or automated Tier 1 escalation.

### 4. Preset Safety Plan Wizard
- **4-Step Rapid Launch Wizard:** Quick-select destination presets (e.g., *Montgomery St Station*, *University Campus Library*, *Home*).
- **Safe Arrival Geofencing:** Computes Haversine distance between current coordinates and destination perimeter (100m, 200m, 500m). When entered, prompts the user to confirm safe arrival before ending location sharing.

### 5. Trusted Safety Circle & Multi-Tier Escalation
- **Escalation Hierarchy:** Tier 1 (primary responder) and Tier 2 (secondary backup) ordering with visual drag/button reordering.
- **Public Recipient Verification Portal (`/invite?token=...`):** Trusted contacts receive a secure link allowing them to review permissions and accept or decline their role. Upon acceptance, the inviter's dashboard automatically reconciles their status from **Pending** to **Connected**.
- **Contact Isolation & Security:** Contacts only receive alerts specifically authorized by the user; unverified or pending contacts cannot view location broadcasts.

### 6. Zero-Cost User-Initiated Messaging (WhatsApp & Native SMS)
- **WhatsApp Click-to-Chat:** Generates official `https://wa.me/<number>?text=<encoded_msg>` URLs for 1-click sharing of invitation links and emergency broadcasts.
- **Native Device SMS Composer:** Uses platform-compliant RFC 5724 (`sms:<number>?body=...` on Android/standard browsers and `sms:<number>&body=...` on iOS) to launch the device's native messaging app with pre-filled recipient numbers and encrypted token URLs.
- **Strict Phone Number Normalization:** Automatically handles Indian 10-digit mobile numbers (`9876543210` → `+919876543210`), leading zero prefixes, and international formats without requiring paid external SMS gateways.

### 7. Emergency SOS Broadcast & Helpline Calling
- **1-Click Emergency SOS:** Broadcasts high-priority distress alerts embedding live Google Maps GPS coordinates, situation notes, and recipient numbers via WhatsApp or native SMS.
- **Emergency Helpline Dialers:** Native telephony links (`tel:112`, `tel:1091`, `tel:100`) that immediately launch the phone dialer pre-filled with national emergency or women safety helplines.

### 8. Centralized Safety Setup & Custom Protocols
- **Escalation Rules:** Customize grace period durations (120s to 300s), contact wait windows, and location auto-expiry windows (30 to 120 minutes).
- **Default Protocol Management:** Switch between active protocols or define specialized rules (e.g., *Night Commute Protocol*, *Solo Transit Rule*).

### 9. Discreet Quick Exit & Camouflage Mode
- **Instant Disguise (Esc Key):** Immediately replaces the safety dashboard with an innocent disguise app (*Metro Weather Forecast*, *Shopping Notes*, or *Working Calculator*).
- **Non-Disruptive Background Protection:** Active journeys, check-in countdowns, and scheduled escalations continue running silently while disguised.
- **PIN Unlock:** Enter a private 4-digit PIN (default `1234`) on the disguise screen to return to the active safety session.

### 10. Chronological Activity History & Security Audit Logs
- **Event Timeline:** Time-stamped logs of every check-in confirmation, missed deadline, grace period trigger, and responder call action.
- **Incident Audit Trail:** View all distress alerts with priority badges, resolution statuses, and responder notes.
- **Audit Data Export:** Export the complete historical activity log and profile data as an encrypted JSON backup file.

### 11. Responsive UI/UX Architecture
- **Mobile-First Layout:** On mobile viewports, the login/registration card appears **first** at the top of the screen; the three core features (*Trusted Circle*, *Smart Safety Check-ins*, *Emergency Support*) stack **vertically** in distinct rows.
- **Desktop/Laptop Optimization:** 2-column balanced layouts that fit 1024×768 and 1366×768 screens without unnecessary vertical scrolling.
- **Official Brand System:** Royal Purple (`#5517C8`), Deep Purple (`#351078`), Electric Blue (`#365BFF`), Cyan (`#08C9E8`), and Soft Lavender (`#F2EDFF`).

---

## 🛠️ Technology Stack & Dependencies

| Layer | Technologies / Packages | Purpose |
|---|---|---|
| **Core Framework** | React 18.3.1, TypeScript 5.8.2 | Component-based UI with strict end-to-end type safety |
| **Build Tooling** | Vite 6.2.0, PostCSS, Autoprefixer | Fast module bundling, HMR, and optimized production builds |
| **Styling & Design** | Tailwind CSS 3.4.17, clsx, tailwind-merge | Utility-first styling with custom DigiSakhi brand design tokens |
| **Icons** | Lucide React 1.16.0 | Clean, accessible SVG iconography |
| **Mapping & GIS** | Leaflet 1.9.4, @types/leaflet | Interactive OpenStreetMap rendering, geofencing, marker tracks |
| **Cloud Database (Optional)** | @supabase/supabase-js 2.49.1 | PostgreSQL backend with Row Level Security (RLS) policies |
| **Serverless Backend** | Vercel Serverless Functions (`api/account.ts`, `api/invitation.ts`) | Persistent multi-device user account recovery and invitation state |
| **Local Persistence** | `localStorage`, `BroadcastChannel` API | Standalone demo mode, instant cross-tab sync, offline fallback |
| **Testing** | Node.js Test Runner, esbuild | Automated comprehensive QA test suite (43 tests across 18 suites) |

---

## 📁 Repository Directory Structure

```
Prototype/
├── api/                                # Vercel Serverless API Functions
│   ├── account.ts                      # Multi-device user auth, profile recovery, & data sync
│   ├── invitation.ts                   # Invitation creation, token verification, & status reconciliation
│   ├── send-invite.ts                  # SMS dispatch handler
│   └── twilio-status-callback.ts       # Delivery receipt webhook handler
├── dist/                               # Production build output (generated by npm run build)
├── public/                             # Static public assets
│   ├── digisakhi-official-logo.png     # Official DigiSakhi brand logo
│   ├── favicon.svg                     # Browser favicon
│   └── manifest.json                   # Web app manifest metadata
├── scripts/
│   └── run_tests.mjs                   # Esbuild bundling & Node test runner script
├── src/
│   ├── components/                     # React UI Components
│   │   ├── auth/                       # WelcomeScreen, AuthModal
│   │   ├── checkin/                    # CheckInScreen, CheckInSetupModal
│   │   ├── common/                     # DigiSakhiLogo, StatusBadge, EmptyState, StepProgress
│   │   ├── contacts/                   # ContactList, AddContactModal, InvitationAcceptanceScreen
│   │   ├── dashboard/                  # UserDashboard, DistressActionPanel, ActiveIncidentsBanner
│   │   ├── history/                    # ActivityHistoryScreen
│   │   ├── incidents/                  # IncidentDetails, IncidentTimeline
│   │   ├── journey/                    # JourneyScreen, CustomJourneyCheckInPrompt, JourneySetupModal
│   │   ├── layout/                     # SidebarNav, MobileNav, MobileHeader, Navbar, QuickExitModal
│   │   ├── map/                        # SafetyMap (Leaflet OpenStreetMap integration)
│   │   ├── onboarding/                 # OnboardingWizard (5-step guided onboarding)
│   │   ├── protocol/                   # ProtocolBuilder
│   │   ├── safety/                     # SafetySetupScreen, EmergencyMessageModal, EmergencyCallModal
│   │   ├── settings/                   # ProfileAndSettingsScreen, PrivacyDiscreetSettings
│   │   └── trusted/                    # TrustedDashboard (Responder console)
│   ├── lib/                            # Business Logic & Infrastructure
│   │   ├── backend/                    # Dual-mode backend abstraction
│   │   │   ├── index.ts                # Backend service factory & active mode selector
│   │   │   ├── localAdapter.ts         # LocalStorage + /api/account persistent adapter
│   │   │   ├── supabaseAdapter.ts      # Supabase Cloud PostgreSQL client adapter
│   │   │   └── types.ts                # BackendAdapter interface definitions
│   │   ├── geolocation.ts              # Browser GPS query, coordinate tracking, Haversine formula
│   │   ├── messaging.ts                # Native SMS & WhatsApp URL builders with phone normalization
│   │   ├── notifications.ts            # Browser push notification service & lockscreen masking
│   │   ├── scheduler.ts                # Idempotent escalation engine & check-in monitor
│   │   ├── supabase.ts                 # Supabase client initializer & LocalStorageDB engine
│   │   ├── toast.ts                    # User notification toasts
│   │   └── utils.ts                    # Date formatting, distance calculations, ID generators
│   ├── store/
│   │   └── SafeSphereContext.tsx       # Global application state, action handlers, & event bus
│   ├── types/
│   │   └── index.ts                    # Core TypeScript definitions (User, Contact, Journey, etc.)
│   ├── App.tsx                         # Root router, screen transitions, & disguise layer
│   ├── index.css                       # Global Tailwind CSS directives & animations
│   └── main.tsx                        # React application bootstrap entrypoint
├── supabase/
│   └── migrations/                     # Production PostgreSQL DDL migrations
│       ├── 001_safesphere_schema.sql   # Tables, indexes, & Row Level Security (RLS) policies
│       ├── 002_invitations_and_sms.sql # Invitations table and status enums
│       └── 003_onboarding_and_auth.sql # Onboarding step and auth persistence fields
├── tests/
│   ├── qa_audit.test.ts                # 18 comprehensive end-to-end test suites (43 tests)
│   └── setup.ts                        # Browser environment mocks for Node test runtime
├── .env.example                        # Template for optional environment variables
├── package.json                        # Project dependencies, metadata, and scripts
├── tailwind.config.js                  # Tailwind design system configuration
├── tsconfig.json                       # TypeScript compiler options
└── vite.config.ts                      # Vite build and development configuration
```

---

## ⚡ Getting Started (Local Setup)

### Prerequisites
- **Node.js:** v18.0.0 or later (v20.x or v22.x recommended)
- **npm:** v9.0.0 or later
- **Git**

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Prototype
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Run the automated test suite:**
   ```bash
   npm test
   ```
   *Expected output: 43 tests passing across 18 test suites.*

5. **Build for production:**
   ```bash
   npm run build
   ```

6. **Preview the production build locally:**
   ```bash
   npm run preview
   ```

---

## ⚙️ Backend & Database Configuration

DigiSakhi features an architectural **Dual-Mode Backend** designed for instant zero-configuration local evaluation, while supporting enterprise Supabase Cloud deployments:

### Mode 1: Zero-Configuration Local / Standalone Mode (Default)
If no environment variables are provided, DigiSakhi automatically operates in **Standalone Local Mode**:
- **Persistence:** User accounts, safety protocols, check-ins, journeys, and contacts persist across browser reloads via `localStorage`.
- **Multi-Device Recovery:** In production (Vercel), user accounts and contacts synchronize through `/api/account` to support cross-device logins.
- **Cross-Tab Realtime Sync:** Tab instances communicate in real time using the browser `BroadcastChannel` API.
- **Zero Third-Party Cost:** Operates 100% free of charge without requiring API keys, credit cards, or external services.

### Mode 2: Supabase Cloud PostgreSQL Mode (Optional)
To connect DigiSakhi to your own Supabase Cloud backend:

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in your Supabase dashboard and execute the migration scripts in sequential order:
   - `supabase/migrations/001_safesphere_schema.sql`
   - `supabase/migrations/002_invitations_and_sms.sql`
   - `supabase/migrations/003_onboarding_and_auth.sql`
3. Copy your project URL and anonymous key.
4. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
5. Configure `.env` with your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   VITE_NOTIFICATION_PROVIDER=browser_push
   ```
6. Restart the development server (`npm run dev`). DigiSakhi will automatically detect the credentials and switch to `supabase_cloud` mode.

---

## 🧪 Comprehensive QA Test Suite

The project includes an automated end-to-end test suite (`tests/qa_audit.test.ts`) covering all 18 core security scenarios:

```bash
npm test
```

### Verified Test Suites (43/43 Passing):
1. **Authentication & Session Persistence:** Registration, PBKDF2/SHA-256 salted password hashing, credential validation, sign-out session purge.
2. **User & Trusted Contact Authorization & Isolation:** RLS enforcement, cross-account data isolation, location update permissions.
3. **All Distress Codes Verification:** Check on Me, Call Me, Urgent Assistance, Journey Check-in incident creation.
4. **Response Tracking, Acknowledgement & Resolution:** Contact acknowledgement logging, responder note capture, safe resolution.
5. **Smart Check-in & Protocol-Driven Escalation:** Grace period buffer verification, Tier 1 escalation, Tier 2 escalation upon wait window expiry.
6. **Scheduler Idempotency & Duplicate Prevention:** Verification that repeated scheduler cycles generate zero duplicate alerts.
7. **Safe Arrival Verification & Journey Completion:** Haversine geofence perimeter detection, arrival confirmation, location broadcast revocation.
8. **Location Sharing Expiry & Revocation:** Session auto-expiry, 1-click manual stop-sharing termination.
9. **Persistence After Refresh:** Local adapter state reload verification for contacts, journeys, and incidents.
10. **Discreet Quick Exit Integrity:** Verification that activating camouflage disguise does not terminate running safety sessions.
11. **Trusted Contact Invitation & SMS Delivery Lifecycle:** Token generation, pending state enforcement, recipient acceptance.
12. **User-Initiated Messaging (WhatsApp & Native SMS):** Strict phone number normalization for Indian 10-digit and international E.164 formats.
13. **Invitation Status Synchronization & Auto-Reconciliation:** Auto-reconciliation of pending contacts when invitations are accepted.
14. **Emergency Alerts & Calling:** Pre-formatted SOS broadcast construction with Google Maps links and situation notes.
15. **6-Section Navigation & Streamlined UX:** Navigation routing and dynamic setup checklist calculations.
16. **Custom Safety Journey & 3-Button Check-in Engine:** Interval scheduling, "I'm Okay", "I Need Help", "Urgent Help", missed check-in handling.
17. **Real Authentication & Multi-Device Recovery:** Cross-device profile, contact, and preference restoration.
18. **Escalation Protocol Customization:** Custom grace period and inverted escalation ordering execution.

---

## ⚠️ Known Technical Limitations & Browser Constraints

To ensure complete transparency during hackathon evaluation, the following operational and browser security constraints are documented:

1. **Browser Telephony Limitations:**
   - Web browsers (HTML5/JavaScript) cannot initiate silent background phone calls without user interaction due to operating system sandbox restrictions.
   - **How DigiSakhi handles this:** Pressing *"I Need Help"* or *"Urgent Help"* uses standard `tel:<number>` URI schemes to immediately launch the device's native dialer with the assigned contact or emergency helpline (112) pre-filled, requiring only a single tap from the user to connect.
2. **Silent Background SMS Delivery:**
   - Web browsers do not permit silent, automated background SMS transmission without expensive third-party telecom API gateways (e.g., Twilio).
   - **How DigiSakhi handles this:** DigiSakhi utilizes user-initiated messaging via native `sms:<phone>?body=...` and official WhatsApp click-to-chat (`https://wa.me/...`) protocols. This allows users to dispatch emergency broadcasts and invitations directly through their device messaging apps at **zero cost** with zero external credentials.
3. **Browser Geolocation & Accuracy:**
   - GPS coordinate accuracy depends on device hardware, satellite visibility, Wi-Fi triangulation, and whether the user grants location permission.
   - If location access is denied or unavailable, the application falls back to standard destination markers and informs the user.
4. **Mobile Background Tab Throttling:**
   - Mobile operating systems (iOS Safari and Android Chrome) throttle JavaScript timers (`setInterval` / `setTimeout`) when a browser tab is minimized or inactive.
   - **How DigiSakhi handles this:** The safety scheduler calculates absolute wall-clock timestamps rather than relying on elapsed timer ticks. When the browser tab is reactivated, DigiSakhi instantly recalculates elapsed time and processes any overdue check-ins or escalations.
5. **Browser Push Notification Permissions:**
   - System push notifications require explicit user approval via the browser's Notification Permissions prompt. If denied, alerts remain fully accessible within the in-app Activity and Notification Center.

---

## 👩‍⚖️ Hackathon Evaluation Scenario (Walkthrough for Judges)

For a complete, real-time evaluation of DigiSakhi, follow this 5-minute walkthrough:

1. **Open the Live Website:** Navigate to [https://safesphere-liart.vercel.app](https://safesphere-liart.vercel.app).
2. **Register a New Account:** Click **Create Account** and register with your name, email, and password.
3. **Complete Onboarding:** Follow the 5-step onboarding wizard to configure your profile, add a sample trusted contact, choose a check-in interval, and verify emergency settings.
4. **Inspect the Trusted Circle:**
   - Navigate to **Circle**.
   - Notice your added contact appears with a **Pending** status.
   - Click the **WhatsApp** or **SMS** button to see the pre-formatted invitation message.
   - Click **Review** to open the recipient invitation portal in a new tab and click **Accept Invitation**.
   - Return to your dashboard — notice the contact status instantly synchronizes to **Connected**.
5. **Start a Custom Safety Journey:**
   - Navigate to **Journeys** and select **Customize My Own Safety Plan**.
   - Set a 5-minute interval, assign your contact as Tier 1, and click **Start Custom Safety Journey**.
   - Notice the live transit ticker and countdown timer.
   - When the prompt appears, test the three response options: *"I'M OKAY 💚"*, *"I NEED HELP 🟠"*, or *"URGENT HELP 🚨"*.
6. **Test Emergency SOS Broadcast:**
   - Click the red **SOS** button in the header or navigation bar.
   - View the pre-formatted alert containing live Google Maps GPS coordinates and situation notes.
   - Select WhatsApp or SMS to test user-initiated dispatch.
7. **Test Discreet Quick Exit (Camouflage):**
   - Press the **Esc** key on your keyboard (or click **Exit** in the navigation header).
   - The screen instantly transforms into an innocuous Weather Forecaster or Shopping Notes app.
   - Enter PIN `1234` to safely unlock and return to your dashboard.

---

## 📄 License & Attribution

- **Project:** DigiSakhi Women's Safety & Empowerment Platform
- **Tagline:** *"For Her. With Her. Always."*
- **Built for:** Hackathon Presentation & Real-World Personal Security Evaluation
- **License:** MIT License — Open for evaluation and non-commercial safety research.
