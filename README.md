# SafeSphere — Women's Personal Safety Platform

> **“Your safety. Your rules. Your trusted circle.”**

SafeSphere is a privacy-first personal safety web platform built for high-stakes, real-world personal security. Unlike blunt, single-button SOS apps that trigger panic or summon emergency dispatch inappropriately, SafeSphere supports nuanced distress scenarios, customizable safety protocols, persistent check-in timers with idempotent multi-tier escalations, privacy-controlled geofencing, and discreet emergency camouflage.

---

## 🌟 Hackathon Demonstration Guide

SafeSphere features an integrated **Hackathon Judge Control Bar** at the top of the interface that allows judges to fast-forward time, trigger overdue check-ins, simulate safe arrival within geofence boundaries, and switch instantly between the protected user (**Elena Rostova**) and authorized circle responders (**Maya Patel** and **David Chen**).

### Quick Demo Walkthrough (10-Step Scenario):

1. **Safety Protocol Configuration**:
   - Navigate to **Protocols**. Notice the active *“Late Night Commute Protocol”*: 2-minute reminder lead, 3-minute grace period, sequential escalation to Contact 1 (Maya), then Contact 2 (David) if unacknowledged after 3 minutes.
2. **Start a Monitored Journey**:
   - Click **Start Journey** from the dashboard or navigate to **Journeys**.
   - Select destination preset *“Montgomery St Station”* (ETA: 20 minutes, Safe Radius: 200m).
   - SafeSphere launches the journey and creates a linked check-in deadline.
3. **Trigger Distress Code**:
   - Click **“Distress Codes”** or the center red quick-action button on mobile.
   - Test **“Check on Me”** (discreet request for non-urgent text check-in) or **“Call Me”** (pretext exit phone call).
   - Click **“Urgent Assistance”** — note the intentional anti-accidental confirmation dialog requiring explicit intent before alerting contacts.
4. **Responder Receipt**:
   - Switch active account using the Judge Bar from **Elena (User)** to **Maya (Contact)**.
   - Maya's Responder Console updates in real time with the alert and map snippet.
5. **Contact Acknowledgement**:
   - Click **“Acknowledge Alert (I Am Aware)”**.
   - Maya's acknowledgement is permanently logged to the database and timestamped.
6. **Active Response Tracking**:
   - Click **“I Am Responding / En Route”**.
   - Switch back to Elena (User) — her banner immediately confirms *“Maya Patel is responding: On way”*.
7. **Time Acceleration & Overdue Escalation**:
   - Start a check-in or journey. In the Judge Bar, click **“+3m (Overdue)”**.
   - The persistent scheduler detects deadline expiry, transitions through the grace period, and dispatches a Tier 1 alert.
   - Click **“+3m (Overdue)”** again without acknowledging: the scheduler automatically escalates to Tier 2 (David Chen).
8. **Geofenced Safe Arrival Verification**:
   - With an active journey running, click **“Trigger Arrival Prompt”** in the Judge Bar.
   - SafeSphere detects user has entered the 200m radius and prompts: *“You've arrived near your destination. Confirm safe?”* (Note: Safety is never automatically presumed).
9. **Safe Arrival Confirmation**:
   - Click **“Yes, I Have Safely Arrived”**.
   - Journey completes, linked check-in resolves, and active location sharing terminates.
10. **Discreet Quick Exit**:
    - Press **ESC** or click the **Quick Exit** button in the navbar.
    - The screen instantly transforms into an innocuous *“Metro Weather & Daily Planner”*.
    - Active background safety check-ins continue uninterrupted.
    - Enter default PIN `1234` to resume SafeSphere.
11. **Automated 11-Step Self-Test Suite**:
    - In the Judge Bar, click **“Run Self-Test Suite”** (with the `FileCheck2` icon).
    - SafeSphere executes all 11 critical workflows end-to-end in real time: distress code dispatch, acknowledgement, responder notes, resolution, deadline escalation, geofence verification, and privacy revocation.

---

## 🛠️ Technology Architecture

- **Frontend**: React 18, Vite 6, TypeScript 5.8
- **Styling**: Tailwind CSS with custom Midnight Navy, Restrained Teal, and Emergency Coral palette
- **Icons**: Lucide React
- **Mapping & Geofencing**: Leaflet with OpenStreetMap tiles
- **Database & Backend**:
  - Full PostgreSQL schema with 12 normalized tables and Row Level Security (RLS) policies in `supabase/migrations/001_safesphere_schema.sql`
  - Dual-mode client: connects to Supabase Cloud if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, or uses persistent local storage with multi-tab `BroadcastChannel` realtime synchronization.
- **Persistent Background Scheduler**:
  - Idempotent state machine in `src/lib/scheduler.ts`
  - Evaluates deadline warnings, grace periods, sequential multi-tier escalation, and proximity geofences.
- **Notification System**:
  - Real browser Push Notification API support (`Notification.requestPermission`)
  - Explicit delivery tracking ("Delivered to active browser tray" vs "Notification delivery unconfirmed (In-App Safety Inbox only)")
  - Masked lockscreen notification preview mode.

---

## 🚀 Getting Started

### Prerequisites:
- Node.js 18+ (tested with Node.js v20.18.0)
- npm 9+

### Installation & Execution:

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

Open `http://localhost:5173` in your browser.

---

## 📁 Repository Structure

```
├── supabase/
│   └── migrations/
│       └── 001_safesphere_schema.sql  # Production PostgreSQL DDL with RLS policies
├── src/
│   ├── types/
│   │   └── index.ts                  # Comprehensive TypeScript interfaces
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client & persistent storage
│   │   ├── scheduler.ts              # Idempotent escalation engine & virtual demo clock
│   │   ├── notifications.ts          # Multi-channel notification service
│   │   ├── geolocation.ts            # Browser geolocation & Leaflet coordinate handler
│   │   └── utils.ts                  # Haversine distance, formatting, mask helpers
│   ├── store/
│   │   └── SafeSphereContext.tsx     # Reactive state management & event broadcaster
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # Global navigation, role badge, quick exit
│   │   │   ├── MobileNav.tsx         # Mobile bottom safety navigation bar
│   │   │   ├── DemoControlsBar.tsx   # Hackathon Judge control bar
│   │   │   └── QuickExitModal.tsx    # Emergency camouflage disguise screen
│   │   ├── dashboard/
│   │   │   ├── UserDashboard.tsx     # Primary protected user dashboard
│   │   │   ├── DistressActionPanel.tsx # 4 distinct distress codes
│   │   │   ├── ActiveCheckInCard.tsx # Persistent countdown timer & grace period
│   │   │   ├── ActiveJourneyCard.tsx # Monitored journey & safe arrival verification
│   │   │   ├── ActiveIncidentsBanner.tsx # Live responder status banner
│   │   │   └── ProtocolSummaryCard.tsx # Active rule summary
│   │   ├── trusted/
│   │   │   └── TrustedDashboard.tsx  # Trusted responder console
│   │   ├── incidents/
│   │   │   ├── IncidentDetails.tsx   # Detailed incident overview
│   │   │   └── IncidentTimeline.tsx  # Chronological audit trail
│   │   ├── contacts/
│   │   │   ├── ContactList.tsx       # Circle escalation chain manager
│   │   │   └── AddContactModal.tsx   # Unverified contact invite workflow
│   │   ├── checkin/
│   │   │   ├── CheckInScreen.tsx     # Check-in engine screen
│   │   │   └── CheckInSetupModal.tsx # Check-in setup form
│   │   ├── journey/
│   │   │   ├── JourneyScreen.tsx     # Monitored journey screen
│   │   │   └── JourneySetupModal.tsx # Journey configuration form
│   │   ├── map/
│   │   │   └── SafetyMap.tsx         # Leaflet live map & sharing controls
│   │   ├── protocol/
│   │   │   └── ProtocolBuilder.tsx   # Guided 5-step safety rule builder
│   │   ├── notifications/
│   │   │   └── NotificationInbox.tsx # Notification delivery audit tray
│   │   └── settings/
│   │       ├── PrivacyDiscreetSettings.tsx # Camouflage & lockscreen masking
│   │       └── AccountDataSettings.tsx     # Medical info, JSON export & purge
│   ├── App.tsx                       # Master screen router
│   ├── main.tsx                      # React root
│   └── index.css                     # Tailwind & Leaflet styles
```

---

## 🔒 Security & Privacy Guarantees

1. **No Silent Auto-Assumption**: Arriving within a destination radius never assumes you are safe without explicit confirmation.
2. **Anti-Accidental Protection**: Urgent Assistance requires a confirmation dialog to eliminate false alarms.
3. **Verified Contacts Only**: Unverified pending invitations cannot receive distress alerts until accepted.
4. **Transparent Delivery Receipts**: We never claim an external SMS was delivered unless validated by the carrier gateway.
5. **Session Continuity**: Using Quick Exit switches the screen to a discreet camouflage without terminating active background timers or escalation workflows.
