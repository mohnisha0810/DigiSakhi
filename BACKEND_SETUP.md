# SafeSphere Backend & Supabase Integration Guide

SafeSphere features a dual-mode backend foundation:
1. **Live Supabase Cloud Mode**: Uses real PostgreSQL with 12 normalized tables, Row Level Security (RLS) enforcement, Supabase Auth (JWT), and Realtime Postgres Changes.
2. **Local Development Adapter Mode**: When Supabase credentials are not configured, SafeSphere automatically switches to a fully persistent browser storage adapter with multi-tab `BroadcastChannel` synchronization.

> [!WARNING]
> **Production Security Disclaimer**:
> The local development adapter provides realistic persistent workflows and client-side authorization filtering for rapid demonstration and UI/UX testing, but it does **not** provide cryptographic backend Row Level Security. For production security guarantees, connect to a configured Supabase project.

---

## 1. Supabase Cloud Setup (Production)

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **Anon Public Key** from `Project Settings` -> `API`.

### Step 2: Run Database Migrations
1. In the Supabase Dashboard, open the **SQL Editor**.
2. Copy the entire contents of `supabase/migrations/001_safesphere_schema.sql` and run it.
3. This creates:
   - 12 PostgreSQL tables with foreign keys and indexes.
   - Comprehensive Row Level Security (RLS) policies for user privacy.
   - The `handle_new_user()` trigger on `auth.users` that automatically creates a user profile and default safety protocol upon registration.

### Step 3: Configure Environment Variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Restart the development server:
```bash
npm run dev
```
SafeSphere will automatically detect the Supabase credentials and switch to **Live Supabase Cloud Mode**.

---

## 2. Row Level Security (RLS) Policies Breakdown

| Table | Policy Summary |
| :--- | :--- |
| `profiles` | Users can only view and edit their own profile (`auth.uid() = id`). |
| `trusted_contacts` | Users manage their own contacts (`auth.uid() = user_id`). Contacts can query their own contact link (`auth.uid() = contact_user_id`). |
| `contact_invitations` | Inviters manage invitations. Anyone with a valid token can view pending invites. |
| `safety_protocols` | Users manage their own protocols (`auth.uid() = user_id`). |
| `check_ins` | Users manage their own check-ins (`auth.uid() = owner_user_id`). |
| `journeys` | Users manage their own journeys (`auth.uid() = owner_user_id`). |
| `incidents` | Owners manage incidents. Authorized contacts can view incidents where they are assigned as recipients. Authorized contacts can update acknowledgement and response notes. |
| `incident_recipients` | Recipient contacts can view and update their own response status. |
| `incident_events` | Owners and assigned recipients can view the chronological event timeline and insert new audit events. |
| `location_shares` | Owners manage their location sharing sessions (`auth.uid() = user_id`). |
| `location_updates` | Authorized contacts can only read active coordinates when `can_view_location = true` and the session has not expired. |
| `notification_records` | Users manage their own notification records. |

---

## 3. Local Development Adapter (Fallback / Demo)

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, SafeSphere activates the local persistent adapter:
- **Persistence**: Data is saved to `localStorage` under `safesphere_db_v1_*`. Data survives page refreshes and browser restarts.
- **Realtime**: Multi-tab synchronization is powered by the HTML5 `BroadcastChannel` API (`safesphere_realtime_sync`).
- **Demo Accounts**: Pre-seeds Elena Rostova (`elena@safesphere.demo`), Maya Patel (`maya@safesphere.demo`), and David Chen (`david@safesphere.demo`) with realistic relationships, verified contact status, and protocols.
- **Custom Accounts**: New accounts can be registered and logged in with any email and password. All data is scoped to the authenticated user ID.
