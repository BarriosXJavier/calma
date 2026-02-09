# Calma

A modern scheduling and booking application built with Next.js 16, similar to Calendly. Allow users to set their availability, share booking links, and sync with Google Calendar.

## Features

- **Public Booking Flow** - Shareable booking pages at `/book/[username]/[meeting-type]` with date/time selection and guest form
- **Authentication** - Clerk-powered sign-in/sign-up with webhook sync to database
- **Google Calendar Integration** - Connect Google accounts, sync events, auto-create meetings with Google Meet links
- **Booking Management** - Create, view, and cancel bookings with calendar event sync
- **Availability Settings** - Set weekly availability schedules with time blocks per day
- **Meeting Types** - Configure different meeting durations, descriptions, and booking links
- **Multi-tier Plans** - Free, Starter, and Pro tiers with usage limits
- **Admin Dashboard** - Protected admin routes for managing feedback

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, React 19)
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Calendar**: Google Calendar API
- **Styling**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **Validation**: Zod
- **Linting/Formatting**: Biome

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- A [Google Cloud](https://console.cloud.google.com) project with Calendar API enabled

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/bookings
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/bookings

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Calendar OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# Encryption key for storing Google tokens (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run format` | Format code with Biome |
| `npm run check` | Run all Biome checks |

## Project Structure

```
calma/
├── app/
│   ├── (app)/              # Authenticated app routes
│   │   ├── availability/   # Availability settings page
│   │   ├── bookings/       # Bookings list page
│   │   ├── meeting-types/  # Meeting types management
│   │   └── settings/       # User settings (profile, calendars, plan)
│   ├── (auth)/             # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── admin/              # Admin dashboard (protected)
│   ├── api/
│   │   ├── calendar/       # Google Calendar OAuth endpoints
│   │   └── webhooks/       # Clerk webhook handler
│   ├── book/               # Public booking pages
│   │   └── [slug]/         # Host profile and meeting type booking
│   └── pricing/            # Public pricing page
├── components/
│   ├── availability/       # Availability management components
│   ├── booking/            # Public booking flow components
│   ├── calendar/           # Calendar and booking components
│   ├── feedback/           # Feedback form components
│   ├── meeting-types/      # Meeting types CRUD components
│   ├── settings/           # Settings page components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── actions/            # Server actions (booking, calendar, user, etc.)
│   ├── google/             # Google OAuth and Calendar utilities
│   └── supabase/           # Supabase client and types
└── proxy.ts                # Next.js 16 proxy (auth middleware)
```

## Database Schema

The app uses Supabase with the following tables:

| Table | Description |
|-------|-------------|
| `users` | User profiles synced from Clerk (id, clerk_id, email, name, slug, timezone, subscription_tier, is_admin) |
| `connected_accounts` | Google Calendar connections with encrypted tokens |
| `availability` | Weekly availability blocks (day_of_week, start_time, end_time) |
| `meeting_types` | Meeting type definitions (name, slug, duration_minutes, description) |
| `bookings` | Scheduled bookings with Google Calendar event IDs |
| `feedback` | User feedback submissions |

### Subscription Tiers

| Tier | Calendars | Bookings/Month |
|------|-----------|----------------|
| Free | 1 | 2 |
| Starter | 3 | 10 |
| Pro | Unlimited | Unlimited |

## Clerk Webhook Setup

Configure a Clerk webhook pointing to `/api/webhooks/clerk` with the following events:
- `user.created`
- `user.updated`
- `user.deleted`

Add the webhook signing secret to your environment:
```env
CLERK_WEBHOOK_SECRET=whsec_...
```

## Google Calendar Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/calendar/callback`
5. Copy Client ID and Client Secret to `.env.local`

## Public Booking Flow

The app provides shareable booking pages for guests to schedule meetings:

1. **Host Profile Page** (`/book/[username]`) - Lists all active meeting types for a host
2. **Booking Page** (`/book/[username]/[meeting-type]`) - 3-step booking flow:
   - Select a date from the calendar (30-day window, respects host availability)
   - Choose an available time slot (filters out booked slots and past times)
   - Enter guest details (name, email, optional notes)
3. **Confirmation Page** - Shows booking details and Google Meet link

Bookings automatically:
- Create a Google Calendar event with Meet link on the host's connected calendar
- Store the booking in the database with event reference
- Display in the host's Bookings dashboard

## License

MIT License - see [LICENSE](LICENSE) for details.
