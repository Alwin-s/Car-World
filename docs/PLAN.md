# CarWorld: Exact Build Plan

**Brand (placeholder):** CarWorld. Booking numbers: `CW-YYMM-NNNNN` (example `CW-2611-00001`). Do not reuse Mycarboy's name, logo, images, or copy.
**Stack:** Vite + React + TypeScript (frontend) · Node.js/NestJS (API) · Prisma · hosted Neon PostgreSQL with PostGIS, citext, pgcrypto (already enabled). `.env` exists at the project root with `DATABASE_URL` (never commit or copy that value).
**Local constraints:** hosted Neon only (no local DB container). No Redis, no object storage, no CI for now. OTP, rate limits, slot holds, and background jobs use Postgres tables (and in-process timers). OTP codes are hashed in the DB and **logged to the API console** until a real SMS provider is plugged in. Photos/PDFs stay on local disk (or as data URLs in admin-entered VSH) until object storage is added.
**Maps:** Leaflet + OpenStreetMap / Nominatim (free).
**Pricing:** per package and vehicle segment; the same price in every district (`package_prices.district_id` stays NULL). Travel fee is 0 for every district for now.
**Payments:** Razorpay in **test mode only** for now.
**VSH:** admin enters records by hand. Do not claim “official” OEM records until a licensed source exists.
**Goal:** A functional equivalent of mycarboy.in with an entirely new, more attractive UI.

> This plan is based on three screenshots (home, services, booking step 1). Remaining assumptions (exact report layout, email/password alongside OTP) are marked **[ASSUMED]** where they still apply.

---

## 1. What the screenshots confirm

### 1.1 Navigation and layout
- Top bar: logo, **Home**, **Services** (dropdown), **Contact**, **About**, **Sign In**
- Floating **WhatsApp** button (bottom right)
- Hero carousel with 6 slides; first slide: "Your 'Brand-New' Car Is Actually 'Brand-New'?" with CTAs **Book Inspection Now** and **View All Services**
- "Why Choose MYCARBOY?" intro with a **Read More** button
- "Our Services" grid of 6 cards, each with image, title, short description, **View Details**

### 1.2 The six services
| Code | Service | Audience | Status |
|---|---|---|---|
| PDI | Pre-Delivery Inspection | Brand-new car buyers | Live |
| UCI | Used-Car Inspection ("360° deep-dive") | Used-car buyers | Live |
| VSH | Vehicle Service History (maintenance, mileage, odometer; admin-entered at first — do not market as official OEM records) | Used-car buyers | Live |
| SYC | Sell Your Car (professional evaluation, transparent pricing, fair market offer) | Sellers | Live |
| BUC | Buy Used Car | Buyers | **Coming soon** |
| B2B | B2B Inspection | Dealers/fleets | **Coming soon** |

### 1.3 Booking wizard (6 steps)
`Location → Car Details → Pricing → Your Info → Date & Time → Payment`
- Service badge shown at top (e.g., "Used-Car Inspection (UCI)")
- Step 1: **District** dropdown (Madurai shown, so coverage is by Tamil Nadu district, not just two cities), **Service Address** (autocomplete input), **Choose on Map**, latitude/longitude shown, and a **serviceability check** ("Your location is serviceable. Address and coordinates confirmed.")
- Back / Continue buttons

---

## 2. Product scope

### Phase 1 (build now)
Marketing site, auth, booking wizard for PDI/UCI/VSH, payments, user dashboard, inspector job app, admin panel, report generation, Sell Your Car lead flow.

### Phase 2 (mirror "coming soon")
Buy Used Car marketplace, B2B accounts with bulk booking and invoicing.

### Roles
`customer`, `inspector`, `admin`, `ops` (support), later `dealer`

---

## 3. New UI direction (deliberately different)

The reference uses a pale mint background with black pill buttons and flat illustrations. Go a different way:

**Concept: "Trust, made visible."** Dark-confident hero, bright data-driven sections, and a strong emphasis on the inspection report as the product.

| Token | Value |
|---|---|
| Primary | Deep indigo `#1E1B4B` |
| Accent | Electric amber `#FBBF24` (CTAs, highlights) |
| Success / Warning / Danger | `#22C55E` / `#F59E0B` / `#EF4444` (used for inspection statuses) |
| Surface | Warm off-white `#FAFAF7`, cards pure white with soft shadow |
| Dark sections | `#0B0A1F` with subtle gradient mesh |
| Headings font | **Sora** |
| Body font | **Inter** |
| Radius | 16px cards, 12px inputs, full-round chips |
| Motion | Framer Motion: scroll reveals, count-up stats, animated score ring |

**Signature UI ideas**
1. **Hero with a live "report preview" card**: an animated vehicle score ring (e.g., 87/100) with checkpoint chips ticking green, instead of an illustration carousel.
2. **Interactive car diagram** (SVG) in the report: tap a panel (bonnet, door, bumper) to see findings and photos.
3. **Service picker**: large cards with icon, "Best for", price-from, and a "Compare" toggle. Coming-soon services shown as dimmed cards with a "Notify me" button (captures email/phone).
4. **Booking wizard** as a split layout: form on the left, a sticky live summary (service, car, price, slot) on the right; progress bar with micro-animations; on mobile, a bottom sheet summary.
5. **Trust strip**: checkpoints count, inspections done, cities/districts covered, average report time (all from the DB, animated).
6. **Report page** with grade badge, severity filters (All / Issues / OK), photo lightbox, "Share on WhatsApp" and PDF download.
7. Dark mode toggle (tokens defined via CSS variables from day one).
8. Bilingual toggle: English / தமிழ் (i18n-ready from the start).

---

## 4. Architecture

```
Vite + React + TS  ──HTTPS──>  NestJS REST API  ──>  Neon PostgreSQL (+ PostGIS) via Prisma
        │                          │   │
        │                          │   ├──> Postgres tables (OTP, rate limit, slot holds, job queue)
        │                          │   ├──> Local disk for photos/PDFs (object storage later)
        │                          │   ├──> Razorpay (payments + webhooks; test mode for now)
        │                          │   ├──> OTP: hash + console log (SMS/WhatsApp provider later)
        │                          │   └──> Leaflet + OSM/Nominatim (geocoding, autocomplete)
        └── Inspector PWA (same React app, /inspector routes, offline-capable)
```

### Technology choices
| Concern | Choice | Reason |
|---|---|---|
| Frontend build | Vite + React 18 + TypeScript (strict) | Fast DX |
| SEO | Keep Vite; add `react-helmet-async` and optional pre-render later. Next.js is out. | decided |
| Routing | React Router v6 | |
| Server state | TanStack Query | caching, retries |
| Client state | Zustand (wizard draft, UI) | |
| Forms | React Hook Form + Zod (schemas shared with backend via a `shared` package) | |
| UI | Tailwind CSS + Radix UI primitives (shadcn/ui as a base) | accessible, fully restyleable |
| Animation | Framer Motion | |
| Maps | Leaflet + OpenStreetMap / Nominatim | free; decided |
| Charts (admin) | Recharts | |
| Backend | NestJS + TypeScript | structure, guards, DTO validation |
| ORM | Prisma | decided |
| DB | Hosted Neon PostgreSQL + PostGIS (citext, pgcrypto already enabled) | geo serviceability; `DATABASE_URL` in `.env` |
| Cache/queue | Postgres tables now (add a dedicated cache/queue later if needed) | notifications, PDF jobs, slot holds |
| Auth | Phone OTP + email/password; JWT access (15 min) + refresh (httpOnly cookie, rotated). OTP is hashed and printed in the API console (dev); SMS later. | |
| Files | Local disk for now; no S3/R2 | skip object storage |
| PDF | Puppeteer rendering an HTML report template | pixel-consistent with web report |
| Monitoring | pino logs for now; Sentry later | |
| Deploy | Manual for now. Later: frontend on Vercel/Netlify/Cloudflare Pages; API on a Node host; DB is Neon. | skip CI |
| CI | None for now | skip |

### Monorepo layout
```
/apps
  /web            React + TS (customer site, inspector PWA, admin)
  /api            NestJS
/packages
  /shared         Zod schemas, types, enums, constants
  /ui             (optional) shared components
/infra            Prisma/SQL migrations and seed scripts (no local DB container)
```

---

## 5. Database design (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------- Enums ----------
CREATE TYPE user_role        AS ENUM ('customer','inspector','admin','ops','dealer');
CREATE TYPE service_code     AS ENUM ('PDI','UCI','VSH','SYC','BUC','B2B');
CREATE TYPE booking_status   AS ENUM ('draft','pending_payment','confirmed','inspector_assigned',
                                      'en_route','in_progress','report_ready','completed',
                                      'cancelled','refunded');
CREATE TYPE payment_status   AS ENUM ('created','authorized','paid','failed','refunded','partially_refunded');
CREATE TYPE item_status      AS ENUM ('ok','minor','major','critical','not_applicable','not_checked');
CREATE TYPE fuel_type        AS ENUM ('petrol','diesel','cng','electric','hybrid','lpg');
CREATE TYPE transmission     AS ENUM ('manual','automatic','amt','cvt','dct','ev');
CREATE TYPE vehicle_segment  AS ENUM ('hatchback','sedan','suv','muv','luxury','ev');

-- ---------- Users & auth ----------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL,
  phone         TEXT UNIQUE NOT NULL,            -- E.164
  email         CITEXT UNIQUE,
  password_hash TEXT,                            -- null for OTP-only users
  role          user_role NOT NULL DEFAULT 'customer',
  preferred_lang TEXT NOT NULL DEFAULT 'en',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  phone_verified_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,                         -- login | signup | booking
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON otp_codes (phone, created_at DESC);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  user_agent TEXT, ip INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Geography ----------
CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Tamil Nadu',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,      -- serviceable or not
  boundary geography(MultiPolygon, 4326),        -- optional precise serviceability
  UNIQUE (name, state)
);
CREATE INDEX districts_boundary_gix ON districts USING GIST (boundary);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  district_id INT NOT NULL REFERENCES districts(id),
  line TEXT NOT NULL,
  landmark TEXT,
  pincode TEXT,
  location geography(Point, 4326) NOT NULL,      -- lat/lng from the map picker
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX addresses_location_gix ON addresses USING GIST (location);

-- ---------- Catalogue ----------
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  code service_code UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description_md TEXT,
  hero_image_url TEXT,
  is_bookable BOOLEAN NOT NULL DEFAULT TRUE,
  is_coming_soon BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE packages (                           -- e.g. UCI Basic / Standard / Premium
  id SERIAL PRIMARY KEY,
  service_id INT NOT NULL REFERENCES services(id),
  name TEXT NOT NULL,
  checkpoints_count INT,
  inclusions JSONB NOT NULL DEFAULT '[]',
  est_duration_min INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE package_prices (                     -- price by package + vehicle segment; same in every district
  id SERIAL PRIMARY KEY,
  package_id INT NOT NULL REFERENCES packages(id),
  segment vehicle_segment NOT NULL,
  district_id INT REFERENCES districts(id),       -- always NULL for now (kept for a later district surcharge)
  base_price_paise INT NOT NULL,
  travel_fee_paise INT NOT NULL DEFAULT 0,        -- 0 for every district for now
  gst_percent NUMERIC(4,2) NOT NULL DEFAULT 18.00,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  UNIQUE (package_id, segment)
);

CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  code CITEXT UNIQUE NOT NULL,
  percent_off NUMERIC(5,2), flat_off_paise INT,
  max_uses INT, used_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ, valid_to TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------- Vehicles ----------
CREATE TABLE vehicle_makes   (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, logo_url TEXT);
CREATE TABLE vehicle_models  (id SERIAL PRIMARY KEY, make_id INT NOT NULL REFERENCES vehicle_makes(id),
                              name TEXT NOT NULL, segment vehicle_segment NOT NULL, UNIQUE (make_id, name));
CREATE TABLE vehicle_variants(id SERIAL PRIMARY KEY, model_id INT NOT NULL REFERENCES vehicle_models(id),
                              name TEXT NOT NULL, fuel fuel_type NOT NULL, transmission transmission NOT NULL);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id),
  make_id INT REFERENCES vehicle_makes(id),
  model_id INT REFERENCES vehicle_models(id),
  variant_id INT REFERENCES vehicle_variants(id),
  registration_no TEXT,                           -- required for UCI/VSH, optional for PDI
  vin TEXT,
  manufacture_year INT,
  color TEXT,
  odometer_km INT,
  owners_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON vehicles (registration_no);

-- ---------- Bookings ----------
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_no TEXT UNIQUE NOT NULL,                -- human-friendly e.g. CW-2611-00001 (CW-YYMM-NNNNN)
  user_id UUID REFERENCES users(id),
  service_id INT NOT NULL REFERENCES services(id),
  package_id INT NOT NULL REFERENCES packages(id),
  vehicle_id UUID REFERENCES vehicles(id),
  address_id UUID REFERENCES addresses(id),
  contact_name TEXT, contact_phone TEXT, contact_email CITEXT,
  seller_or_dealer_name TEXT, seller_phone TEXT,  -- who holds the car at inspection time
  slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ,
  inspector_id UUID REFERENCES users(id),
  status booking_status NOT NULL DEFAULT 'draft',
  price_base_paise INT, price_travel_paise INT, discount_paise INT DEFAULT 0,
  gst_paise INT, total_paise INT,
  coupon_id INT REFERENCES coupons(id),
  wizard_step INT NOT NULL DEFAULT 1,             -- resume drafts
  notes TEXT,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON bookings (user_id, created_at DESC);
CREATE INDEX ON bookings (inspector_id, slot_start);
CREATE INDEX ON bookings (status, slot_start);

CREATE TABLE booking_status_history (
  id BIGSERIAL PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status booking_status, to_status booking_status NOT NULL,
  changed_by UUID REFERENCES users(id), note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Scheduling ----------
CREATE TABLE inspector_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  home_district_id INT REFERENCES districts(id),
  service_district_ids INT[] NOT NULL DEFAULT '{}',
  certifications JSONB DEFAULT '[]',
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE slot_templates (                     -- recurring daily slots per district
  id SERIAL PRIMARY KEY,
  district_id INT NOT NULL REFERENCES districts(id),
  weekday SMALLINT NOT NULL,                      -- 0=Sun
  start_time TIME NOT NULL, end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 2
);

CREATE TABLE slot_blackouts (
  id SERIAL PRIMARY KEY,
  district_id INT REFERENCES districts(id),
  on_date DATE NOT NULL, reason TEXT
);

-- ---------- Payments ----------
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT UNIQUE, provider_payment_id TEXT UNIQUE,
  amount_paise INT NOT NULL,
  status payment_status NOT NULL DEFAULT 'created',
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  amount_paise INT NOT NULL, reason TEXT,
  provider_refund_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Inspection engine ----------
CREATE TABLE checklist_templates (
  id SERIAL PRIMARY KEY,
  service_id INT NOT NULL REFERENCES services(id),
  version INT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (service_id, version)
);
CREATE TABLE checklist_sections (
  id SERIAL PRIMARY KEY,
  template_id INT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL, sort_order INT NOT NULL, weight NUMERIC(5,2) NOT NULL DEFAULT 1
);
CREATE TABLE checklist_items (
  id SERIAL PRIMARY KEY,
  section_id INT NOT NULL REFERENCES checklist_sections(id) ON DELETE CASCADE,
  label TEXT NOT NULL, help_text TEXT,
  requires_photo BOOLEAN NOT NULL DEFAULT FALSE,
  severity_weight NUMERIC(5,2) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
  template_id INT NOT NULL REFERENCES checklist_templates(id),
  inspector_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  overall_score NUMERIC(5,2), grade TEXT,          -- e.g. A/B/C/D
  recommendation TEXT,                             -- buy / negotiate / avoid
  flags JSONB DEFAULT '{}',                        -- accident, flood, odometer_suspect...
  summary TEXT,
  report_pdf_url TEXT, share_token TEXT UNIQUE
);
CREATE TABLE inspection_results (
  id BIGSERIAL PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_id INT NOT NULL REFERENCES checklist_items(id),
  status item_status NOT NULL DEFAULT 'not_checked',
  note TEXT, estimated_repair_paise INT,
  UNIQUE (inspection_id, item_id)
);
CREATE TABLE inspection_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_id INT REFERENCES checklist_items(id),
  url TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'photo',
  caption TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Vehicle Service History (VSH) ----------
CREATE TABLE vsh_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE REFERENCES bookings(id),
  registration_no TEXT NOT NULL, vin TEXT,
  status TEXT NOT NULL DEFAULT 'queued',           -- queued | processing | ready | failed (admin fills records; no external provider yet)
  summary JSONB, report_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE vsh_records (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES vsh_requests(id) ON DELETE CASCADE,
  service_date DATE, odometer_km INT, workshop TEXT,
  work_done TEXT, cost_paise INT, source TEXT       -- always 'manual' until a licensed provider exists
);

-- ---------- Sell Your Car (SYC) ----------
CREATE TABLE sell_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  address_id UUID REFERENCES addresses(id),
  expected_price_paise INT,
  status TEXT NOT NULL DEFAULT 'new',              -- new|evaluation_scheduled|offer_made|accepted|rejected|closed
  offer_price_paise INT, offer_valid_till TIMESTAMPTZ,
  notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Coming soon: waitlist, B2B, listings ----------
CREATE TABLE waitlist (
  id SERIAL PRIMARY KEY, service_id INT NOT NULL REFERENCES services(id),
  name TEXT, phone TEXT, email CITEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE b2b_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL, gstin TEXT, owner_user_id UUID REFERENCES users(id),
  credit_days INT DEFAULT 0, is_approved BOOLEAN DEFAULT FALSE
);
CREATE TABLE listings (                            -- Buy Used Car (Phase 2)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  seller_user_id UUID REFERENCES users(id),
  inspection_id UUID REFERENCES inspections(id),
  price_paise INT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
  district_id INT REFERENCES districts(id),
  published_at TIMESTAMPTZ
);

-- ---------- Misc ----------
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY, user_id UUID REFERENCES users(id),
  channel TEXT NOT NULL, template TEXT NOT NULL, payload JSONB,
  status TEXT NOT NULL DEFAULT 'queued', sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cms_content (                         -- hero slides, FAQs, testimonials, About text
  id SERIAL PRIMARY KEY, kind TEXT NOT NULL, title TEXT, body_md TEXT,
  image_url TEXT, sort_order INT DEFAULT 0, is_published BOOLEAN DEFAULT TRUE
);
CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY, name TEXT, phone TEXT, email CITEXT, message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY, actor_id UUID, action TEXT, entity TEXT, entity_id TEXT,
  diff JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Serviceability check (Step 1 of the wizard)**
```sql
-- point inside an active district boundary?
SELECT d.id FROM districts d
WHERE d.is_active AND ST_Covers(d.boundary, ST_SetSRID(ST_MakePoint($lng,$lat),4326)::geography);
-- fallback if no polygon: district chosen in dropdown AND is_active = true
```

---

## 6. Booking wizard: exact behaviour

State is saved server-side as a `draft` booking after each step so users can resume. Steps and validation (Zod, shared with the API):

| # | Step | Fields | Rules / API |
|---|---|---|---|
| 1 | **Location** | district, address text (Nominatim autocomplete), map pin (Leaflet + OSM, lat/lng) | `POST /serviceability/check`, blocks Continue until serviceable; inactive districts show "Notify me when we arrive" |
| 2 | **Car details** | make → model → variant (cascading selects), year, fuel, transmission, registration no. (UCI/VSH), expected km, owners | Reg. no. regex `^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$` (normalised uppercase); PDI may skip reg. no. and ask for VIN/dealer name |
| 3 | **Pricing** | package choice (Basic/Standard/Premium), coupon code | `POST /pricing/quote` uses package + vehicle segment only (district does not change price); travel fee is **0 for every district for now**; returns base + travel + GST - discount; price locked for 15 minutes via `quote_id` |
| 4 | **Your info** | name, phone (OTP-verified), email, on-site contact (seller/dealer name + phone) | If not logged in: OTP sign-in inline, no separate signup page. OTP is verified against the hashed code; the plaintext code is logged on the API console until SMS is wired. |
| 5 | **Date & time** | calendar + slot chips | `GET /slots?district=&date=`; slot reserved (Postgres row + expiry, 10 min) when selected |
| 6 | **Payment** | summary, Razorpay checkout (UPI/cards/netbanking) | Booking moves `pending_payment → confirmed` only on **verified webhook** |

Service-specific variants: **PDI** (dealer/showroom details, VIN, delivery date), **UCI** (seller details, registration), **VSH** (no address or slot needed; reg. no. + payment only, report delivered digitally), **SYC** (no payment; submit details, evaluation slot, offer follows).

**After payment:** confirmation screen, email (and later WhatsApp/SMS), calendar `.ics`, auto-assign inspector (nearest available in the district, manual override in admin). Booking number format `CW-YYMM-NNNNN`.

---

## 7. API surface (REST, `/api/v1`)

```
AUTH
POST /auth/otp/request            { phone, purpose }   // hash + console log; no SMS yet
POST /auth/otp/verify             { phone, code }          -> access + refresh
POST /auth/register               { name, phone, email?, password? }
POST /auth/login                  { email|phone, password }
POST /auth/refresh   POST /auth/logout
GET  /me      PATCH /me

PUBLIC / CATALOGUE
GET  /services                    (includes coming-soon flags)
GET  /services/:code              GET /services/:code/packages
GET  /districts?active=true
GET  /vehicles/makes   /makes/:id/models   /models/:id/variants
GET  /cms/hero  /cms/faqs  /cms/testimonials
GET  /stats/public                (trust strip numbers)
POST /waitlist     POST /contact

BOOKING
POST /serviceability/check        { districtId, lat, lng }
POST /bookings                    (create draft)
PATCH /bookings/:id/step/:n       (save step)
POST /pricing/quote               { packageId, segment, couponCode? }  // district ignored for price
GET  /slots?districtId=&date=
POST /bookings/:id/slot-hold      { slotStart }
POST /bookings/:id/pay            -> Razorpay order
POST /webhooks/razorpay           (signature-verified, idempotent)
GET  /bookings   GET /bookings/:id   POST /bookings/:id/cancel   POST /bookings/:id/reschedule

REPORTS
GET  /inspections/:id             (owner)
GET  /reports/:shareToken         (public read-only link)
GET  /inspections/:id/pdf

VSH / SYC
POST /vsh/requests   GET /vsh/requests/:id
PUT  /admin/vsh/requests/:id/records      (manual entry)
POST /sell-leads     GET /sell-leads/:id   POST /sell-leads/:id/accept-offer

INSPECTOR
GET  /inspector/jobs?date=
POST /inspector/jobs/:id/start
GET  /inspector/jobs/:id/checklist
PUT  /inspector/jobs/:id/results      (batch upsert, offline sync)
POST /inspector/jobs/:id/media            (multipart to local disk; no object storage yet)
POST /inspector/jobs/:id/complete

ADMIN (role-guarded)
CRUD: services, packages, package_prices, coupons, districts (+ activate),
      slot_templates, blackouts, checklist templates, cms_content, users, inspectors
GET  /admin/bookings?filters     POST /admin/bookings/:id/assign
POST /admin/bookings/:id/refund  GET /admin/analytics/*
```

---

## 8. Frontend structure

```
apps/web/src
  app/            router.tsx, providers (Query, i18n, Theme, Auth), layouts
  pages/
    public/       Home, Services, ServiceDetail, About, Contact, FAQ, Pricing, SampleReport
    auth/         SignIn (OTP + password), Register
    booking/      BookingWizard + steps/ (Location, CarDetails, Pricing, YourInfo, Slot, Payment), Success
    account/      Dashboard, Bookings, BookingDetail, ReportView, Profile, Addresses
    sell/         SellYourCar (own mini-wizard)
    vsh/          VehicleHistoryLookup
    inspector/    Jobs, JobDetail, ChecklistRunner (offline PWA)
    admin/        Dashboard, Bookings, Inspectors, Pricing, Slots, Districts, Checklists, CMS, Users, VshEntry
  features/       booking/ auth/ reports/ catalogue/ (hooks + api + components per feature)
  components/     ui/ (Button, Input, Select, Stepper, Modal, Sheet, Toast, Badge, ScoreRing)
                  layout/ (Navbar, Footer, WhatsAppFab)  map/ (LocationPicker)
  lib/            apiClient.ts (axios + refresh interceptor), queryClient.ts, formatters.ts
  store/          bookingDraft.ts, ui.ts
  i18n/           en.json, ta.json
  styles/         tokens.css, tailwind.css
```

**Key components to build first:** `Stepper`, `LocationPicker` (Leaflet + Nominatim + serviceability banner), `CarSelector` (cascading selects with search), `SlotPicker`, `PriceSummary` (sticky), `ScoreRing`, `ChecklistSection`, `CarDiagram` (SVG hotspots), `ReportViewer`.

---

## 9. Inspector app (PWA)
- Installable, works offline: results and photos queue in IndexedDB and sync on reconnect
- One-hand mobile UI: section list with progress ring, tri-state buttons (OK / Minor / Major), camera capture, voice note to text (optional)
- Photos upload to the API and are stored on local disk (object storage later)
- Required photos enforced per item (`requires_photo`)
- "Complete" blocked until all mandatory items are answered
- On complete: score calculated server-side, PDF written to disk, customer notified (email now; SMS later)

**Scoring (starting rule):** `score = 100 - Σ(severity_weight × status_penalty × section_weight)`, with penalties `minor=1, major=3, critical=8`. Grade: A ≥ 85, B ≥ 70, C ≥ 55, D below. Any `critical` on structure/airbag/flood flag caps the grade at C. Tune with real data.

---

## 10. Security, quality, compliance
- OTP: 6 digits, hashed, 5-minute expiry, max 5 attempts, per-phone and per-IP rate limits (Postgres). In this phase the plaintext code is also logged to the server console so login works without SMS. Never log OTPs once a provider is live.
- Passwords: argon2id; refresh token rotation with reuse detection
- All inputs validated with the shared Zod schemas; parameterised queries via Prisma
- Role guards on every route; row-level ownership checks (customers see only their bookings)
- Razorpay: verify signature, idempotent webhook handling, never trust the client for payment success
- Uploads to local disk: MIME and size checks, strip EXIF location from public report images. Presigned URLs when object storage is added.
- Privacy policy, terms, refund policy pages; consent checkbox (India DPDP Act); data export and delete on request
- Accessibility: WCAG AA contrast, keyboard navigable wizard, focus management between steps
- Testing: Vitest + React Testing Library (units), Playwright (booking E2E later), Jest + Supertest (API). No CI pipeline yet.
- Observability: structured pino logs; Sentry later

---

## 11. Delivery plan (suggested 12 weeks, one full-stack dev; faster with a team)

| Week | Deliverable | Done when |
|---|---|---|
| 1 | Monorepo, Prisma schema + migrations against Neon, seed script (districts, makes/models, services, packages, segment prices) | `pnpm -F api prisma migrate dev` + seed on Neon; booking numbers `CW-…` |
| 2 | Design system: tokens, core UI components, Navbar/Footer/WhatsApp FAB, Storybook (optional) | Components documented and responsive; brand string CarWorld |
| 3 | Auth (OTP console-log + password), JWT/refresh, `/me`, protected routes | Can sign up, sign in, stay logged in using the console OTP |
| 4 | Home, Services, ServiceDetail, About, Contact, FAQ (CMS-driven), waitlist for coming-soon services | Marketing site usable |
| 5 | Booking wizard steps 1-3 (Leaflet location, car selector, package+segment quote) | Serviceability and quote APIs working end to end |
| 6 | Steps 4-6 (identity, slots with holds, Razorpay test-mode checkout + webhook) | Paid booking becomes `confirmed` with a `CW-YYMM-NNNNN` number |
| 7 | Customer dashboard: bookings list/detail, reschedule, cancel, refunds | Full lifecycle visible to user |
| 8 | Admin panel v1: bookings, assignment, pricing (segment, not district), slots, districts, CMS, manual VSH entry | Ops can run the business without DB access |
| 9 | Inspector PWA + checklist engine + local-disk media | Inspector completes a job offline |
| 10 | Scoring, report web view, PDF on disk, share links, email notifications | Customer receives a report |
| 11 | VSH customer request + admin fill, Sell Your Car flow | Both services bookable |
| 12 | Manual QA and a simple production deploy (no CI yet) | Launch checklist signed off |

**Phase 2 (after launch):** Buy Used Car marketplace (listings, filters, enquiries, "inspected" badge), B2B accounts (company onboarding, bulk upload, invoicing), Tamil localisation polish, referral/coupon engine, customer reviews.

---

## 12. Decisions (locked)
1. **ORM:** Prisma.
2. **Frontend:** Vite + React (not Next.js).
3. **Maps:** Leaflet + OpenStreetMap / Nominatim.
4. **OTP:** hash in Postgres and log the code in the API console; real SMS later.
5. **Files / CI:** skip object storage and CI for now.
6. **Pricing:** per package and vehicle segment; identical in every district. Travel fee is **0 for every district** for now.
7. **VSH:** admin types records in; no licensed data provider yet — copy must not say “official records”.
8. **Brand:** placeholder name CarWorld. Booking numbers `CW-YYMM-NNNNN` (e.g. `CW-2611-00001`). Original copy/logo/images stay unused.
9. **Payments:** Razorpay, **test mode only** for now. Verify signatures and webhooks; never trust the client for payment success.
10. **Heading font:** Sora (body remains Inter).

---

## 13. First-day commands (reference)
```bash
# repo is already CarWorld; .env with DATABASE_URL is at the project root — do not copy it
pnpm dlx create-turbo@latest . --skip-install     # or plain pnpm workspaces in this folder
pnpm create vite apps/web --template react-ts
pnpm dlx @nestjs/cli new apps/api --package-manager pnpm
pnpm add -F api prisma @prisma/client zod argon2 razorpay
pnpm add -F web react-router-dom @tanstack/react-query zustand react-hook-form zod \
         @hookform/resolvers framer-motion tailwindcss leaflet react-leaflet i18next react-i18next
pnpm -F api prisma migrate dev
```