# ГРАНТ — Дом изнутри (Grant Agency)

A hyperlocal real-estate agency site **and** back office for **Khamovniki, Moscow**. The public side is an address-first database of buildings with editorial pages for owners and buyers. The private side is a complete in-house CRM: a ten-stage lead funnel, communications, message sequences, meetings, tasks, documents, reports and Yandex Metrica — all in a bilingual (RU/EN) interface.

- Live app: <https://grant-home-inside.base44.app>
- Русская версия документа: [README.ru.md](README.ru.md)

> The public interface is Russian by default; English is available through the RU/EN switch in the site header and in the admin sidebar. **Client-facing content** (WhatsApp greetings, e-mail subjects, CSV sample rows, stored database notes) stays Russian by design — it is content, not interface.

---

## Contents

1. [Overview](#1-overview) · 2. [Product principles](#2-product-principles) · 3. [Stack](#3-stack) · 4. [Public website](#4-public-website) · 5. [Lead capture](#5-lead-capture) · 6. [Admin workspace](#6-admin-workspace) · 7. [Lead funnel](#7-lead-funnel) · 8. [First-response SLA](#8-first-response-sla) · 9. [Tasks](#9-tasks) · 10. [Communications hub](#10-communications-hub) · 11. [Message sequences](#11-message-sequences) · 12. [Meetings](#12-meetings) · 13. [Documents](#13-documents) · 14. [Reports and digest](#14-reports-and-digest) · 15. [Yandex Metrica](#15-yandex-metrica) · 16. [Audit log](#16-audit-log) · 17. [Data model](#17-data-model) · 18. [Backend functions](#18-backend-functions) · 19. [Shared server modules](#19-shared-server-modules) · 20. [Workflows](#20-workflows) · 21. [Bilingual interface](#21-bilingual-interface) · 22. [SEO](#22-seo) · 23. [Events and analytics](#23-events-and-analytics) · 24. [Design system](#24-design-system) · 25. [Project structure](#25-project-structure) · 26. [Authentication and access](#26-authentication-and-access) · 27. [Local development](#27-local-development) · 28. [Operations runbook](#28-operations-runbook) · 29. [Known limitations](#29-known-limitations) · 30. [Glossary](#30-glossary) · 31. [Docs and support](#31-docs-and-support)

---

## 1. Overview

| | |
| --- | --- |
| **Product** | Hyperlocal real-estate agency for Khamovniki (Moscow): public website + internal CRM |
| **Primary language** | Russian; English interface available (1 272 dictionary keys per language, in sync) |
| **Entities** | 24 schemas in `base44/entities/` |
| **Backend functions** | 18 in `base44/functions/` |
| **Shared server modules** | 6 in `base44/shared/` |
| **Workflows** | 3 in `base44/workflows/` (2 daily, 1 every 15 minutes) |
| **Page files** | 35 in `src/pages/` (10 public, 5 auth, 1 platform consent, 19 admin) |
| **Frontend** | React 18 + Vite, React Router 7, Tailwind + shadcn/ui, TanStack Query |
| **Backend** | Base44 entities/functions/auth, Deno runtime, in-app secrets |

The site is built around **the building, not the listing**, and around **one district**: Khamovniki is the first cluster the agency works in. Instead of an automated valuation the site leads to a conversation — one lead form opens everywhere and creates a request that lands in the admin CRM.

## 2. Product principles

These are product rules, not preferences. Changing them is a product decision.

1. **No automated valuations.** No price is ever calculated from square metres. A price appears only as a hand-written expert note (`OwnerAnalysis.price_range_note`).
2. **No promised outcomes.** The interface never promises a selling timeline, a number of viewings, a discount, "the best agency" or "the lowest commission".
3. **The owner comes first.** Owner flows come before buyer flows in navigation and on the homepage; the buyer funnel exists to serve the owner's sale.
4. **One district, deliberately.** Khamovniki (`cluster: "khamovniki"`) is the target cluster; everything else is `other` with `area_flag` marking it.
5. **Discretion.** Address, photographs and price of private portfolio items are published only with the owner's consent; client data is never passed to third parties (`Lead`, `Document`).
6. **Unlaunched services are labelled "Планируем" (`planned`)**, never presented as available. The `Service.status` field drives this.
7. **Quiet premium tone.** No realtor clichés, no exclamation marks, no superlatives; specific facts about a specific house instead.
8. **Data over decoration.** Every number shown to the admin comes from the database or from Metrica; narrative conclusions are typed by a human.

## 3. Stack

| Layer | Choice |
| --- | --- |
| UI | React 18, React Router 7, Tailwind CSS, shadcn/ui (Radix primitives), lucide-react |
| Data fetching | Base44 SDK entities (`@/api/base44Client`) + TanStack Query provider |
| Charts | recharts |
| Maps | react-leaflet + CARTO dark basemap (no API key) |
| Drag & drop | `@hello-pangea/dnd` (Kanban) |
| Dates | date-fns + moment (legacy helpers) |
| Documents | jsPDF / html2canvas available; printing uses CSS `@media print` |
| Server | Base44 backend functions on Deno (`base44/functions/*/entry.ts`) |
| Storage | Base44 public file storage (site media) and private storage with signed URLs (client documents) |
| Analytics | Self-hosted `Events` entity + Yandex Metrica (counter, goals, offline conversions) |

### npm scripts

```bash
npm run dev        # vite dev server (usually started by `base44 dev`)
npm run build      # production build into ./dist
npm run lint       # eslint, quiet mode
npm run lint:fix   # eslint with --fix
npm run typecheck  # tsc -p ./jsconfig.json
npm run preview    # preview the built bundle
```

`base44/config.jsonc` wires these into the platform: `installCommand: npm install`, `buildCommand: npm run build`, `serveCommand: npm run dev`, `outputDirectory: ./dist`.

## 4. Public website

### 4.1 Routes

| Route | Page file | What it is |
| --- | --- | --- |
| `/` | `pages/Home.jsx` | Hero with address search, agency story, owner/buyer paths, owner form, building discovery, map, services, premium collections, video, contacts |
| `/search` | `pages/Search.jsx` | Portfolio with URL-driven filters, list and map views, capture of unknown addresses |
| `/house/:id` | `pages/House.jsx` | Building page: facts, features, apartment notes, gallery, video, map, lead actions |
| `/khamovniki` | `pages/Khamovniki.jsx` | Cluster landing page: why Khamovniki, how the work is organised, limits, contact, form |
| `/sobstvennikam` | `pages/Owners.jsx` | For owners: what owners ask, how the consultation goes, what we do not do, form |
| `/pokupatelyam` | `pages/Buyers.jsx` | For buyers: what buyers ask, pre-purchase checklist, form |
| `/uslugi` | `pages/Services.jsx` | Active and planned services from `Service`, plus the roadmap |
| `/o-nas` | `pages/About.jsx` | Positioning, story, three pillars, team (`TeamMember.is_public`), verified claims (`Claim.is_verified`) |
| `/kontakty` | `pages/Contacts.jsx` | Phone, e-mail, office address and landmark, office map, form |
| `/politika-konfidencialnosti` | `pages/Privacy.jsx` | Privacy policy (152-FZ structure, marked as a draft) |
| `/login` · `/register` · `/forgot-password` · `/reset-password` · `/mfa` | auth pages | Sign-in, sign-up with OTP, password recovery, two-factor authentication |
| `/admin/*` | `pages/admin/*` | Back office — see [section 6](#6-admin-workspace) |
| `*` | `lib/PageNotFound.jsx` | 404 with a `prerender-status-code: 404` meta tag |

`pages/OAuthConsent.jsx` is a seeded platform page for OAuth consent; it is not routed in `App.jsx`.

Public pages render inside the shared shell `components/Layout.jsx` (Header + `LeadProvider` + `<Outlet />` + Footer). Every public page loads `SiteSettings` through `useSiteSettings()` so contacts are edited in one place.

**Publishing rule:** only buildings with `is_published !== false` are visible. `useBuilding(id)` returns `null` for a draft, so an unpublished record behaves like a 404 — it is not reachable by direct link.

### 4.2 Homepage composition

`src/components/home/*`, copy in `src/content/homepage.js` (per-language object merged into `t.homepage`):

| # | Section | Purpose |
| --- | --- | --- |
| 1 | `KhamovnikiHero` | Marker, headline, address search, primary/secondary CTA, cover photo, trust line, contact strip |
| 2 | `AgencySection` | Who the agency is; local knowledge framing |
| 3 | `HelpSection` + `HelpCard` | Two paths: owner and buyer |
| 4 | `OwnerFormSection` | Owner questions, what the consultation gives, inline lead form |
| 5 | `BuildingsDiscoverySection` | Discovery card + `FeaturedBuildingCard`s |
| 6 | `MapSection` | Leaflet map of published buildings |
| 7 | `ServicesSection` | Services from the `Service` entity |
| 8 | `PremiumCollections` | Three `PropertyCollection` bands: offices & corporate housing, apartments & penthouses, country houses & estates |
| 9 | `VideosSection` | Video tours from `Building.videos` |
| 10 | `ContactsSection` | Phone, e-mail, hours, office landmark |

Data is loaded once in `Home.jsx` with `useBuildingList({ limit: 60 })` (published only) and split by `lib/khamovniki.js`:

- `isKhamovniki(building)` — matches the district/street/cluster fields;
- `publishedKhamovniki(buildings)` — published + cluster;
- `byPriority(a, b)` — priority first, then `expert_verified`, then year;
- `featuredBuildings(buildings)` — `is_featured` only, ordered by `featured_order`.

The hero cover falls back to `HERO_IMAGE` from `lib/sample-buildings.js` when the database has no photo; the About map uses `MAP_IMAGE` from the same file. Those files hold **assets and sample records only** — the live site reads the database.

### 4.3 Address search

`components/AddressSearch.jsx` matches the typed text against the already loaded buildings (address, street, district, city).

- **Match** → navigates to `/house/:id`.
- **No match** → navigates to `/search?q=…`, where the empty state offers to leave the address as a request.
- Both outcomes fire `address_search` with `matched: true|false`.

### 4.4 Search page

Filters live in the URL, so any view is shareable:

| Param | Meaning |
| --- | --- |
| `q` | Full-text over address, street, district, city |
| `district` | District filter |
| `street` | Street filter |
| `group` | `offices` \| `residences` \| `estates` (maps `property_type` via `PROPERTY_GROUPS`) |
| `deal` | `sale` \| `rent` |

Views: **list** (cards) and **map**. `PROPERTY_GROUPS` in `lib/price.js`: `offices → office, corporate_housing`; `residences → apartment, penthouse`; `estates → dacha, estate`. `residential` (a generic house) is reachable without a group filter.

### 4.5 Building page

Sections in order: facts at a glance (year, floors, entrances, apartments, series, area, price, deal type, ceilings, lift, metro), editorial description, features (`Building.features[]`), apartment notes (`ApartmentNote`: layout type, area range, typical questions, liquidity note), photo gallery, video, Leaflet map, and three decision buttons that open the lead form **pre-filled** with the address and the right request type (`owner_appraise`, `owner_sell`, `buyer_buy`).

Price formatting (`lib/price.js`): `1 200 000 ₽`, with `per month` appended for `deal_type: "rent"`; an empty price renders `Price on request`.

### 4.6 Content pages

- **Owners** — the six questions owners arrive with, "how the consultation goes" (request → preparation → conversation → decision), "what we do not do" (no automatic valuation, no promised timelines, no publication without consent), a form, and a link to the cluster page.
- **Buyers** — the six buyer questions plus an eight-point pre-purchase checklist (ownership and encumbrances, chain of ownership, structure, utilities, original details, approvals, neighbours and management, plans around the house).
- **Khamovniki (cluster)** — hero, four reasons for one-cluster work, the four-step process (request → qualified conversation → agreement → deal), four stated limits, the contact block with the responsible person and hours, search and form.
- **Services** — `Service` records split by `status` into "available now" and "planned" (`planned` is visibly labelled), plus a four-stage roadmap (website → first requests → content → further services).
- **About** — positioning, four-paragraph story, three pillars, `TeamMember` cards (`is_public: true` only), and `Claim` records where `is_verified: true` with proof notes.
- **Contacts** — office address, landmark, hours, map, and the lead form.
- **Privacy** — eight sections (data collected, purpose, legal basis, transfers, retention, rights, call recording, channels) with an explicit note that the text needs company details and legal review.

## 5. Lead capture

One form (`components/LeadForm.jsx`) inside one dialog (`components/LeadDialog.jsx`), opened from anywhere through `LeadProvider` / `useLead()`: header CTA, hero buttons, building page, cluster page, search empty state, owners / buyers / contacts pages, and admin-side prompts.

### 5.1 Fields

| Field | Type | Notes |
| --- | --- | --- |
| `type` | enum | `owner_appraise`, `owner_sell`, `buyer_buy`, `buyer_check`, `general`, `rent` |
| `address_text` | text | Suggestions come from the loaded buildings; free text is allowed |
| `name` | text | ≥ 2 characters, required |
| `phone` | text | Normalised to 11 digits, required |
| `preferred_contact` | enum | `phone` (default), `telegram`, `whatsapp` in the public form; `max`, `email` also exist on the entity |
| `sell_timeline` | enum | `asap`, `month`, `quarter`, `later`, `undecided` (owner flows) |
| `message` | textarea | Optional comment |
| consent checkbox | boolean | Required; stores `consent_at` and `consent_text_version` |
| honeypot | hidden input | Any value → silent success, nothing stored |

### 5.2 Server contract (`functions/submitLead`)

1. **Validation** — name ≥ 2 characters, 11-digit phone, `consent === true`; otherwise a 400 with a field error.
2. **Honeypot** — filled → `{ ok: true }` with nothing written. Bots learn nothing.
3. **Rate limit** — per IP inside a 10-minute window; exceeding it returns `429 { error: "rate_limited" }`. The UI shows a "too many requests, call us instead" message.
4. **Building match** — the typed address is matched to a `Building` and stored as `building_id` when found.
5. **Inference** — `pipeline` (`owner_sale` / `buyer_search` / `rental`), `cluster` (`khamovniki` / `other`) and `person_role` (`owner` / `buyer` / `tenant` / `other`) are derived from the request type and the address; `area_flag` records `in_target` / `outside` / `unknown`.
6. **Attribution** — UTM parameters (persisted in `sessionStorage` for the session), otherwise `referrer`, otherwise `direct`; `utm_*`, `referrer`, `page_path` and the Metrica **ClientID** are stored on the lead (`client_id`).
7. **Creation** — `status: "new_inquiry"`, `consent_at`, and the first `StatusHistory` record.
8. **Notification** — e-mail to `AdminSettings.default_responsible`, falling back to `SiteSettings.admin_email`.

After a successful send the visitor sees a confirmation with a "what happens next" block (archives → contact → meeting).

## 6. Admin workspace

Routes in `src/pages/admin/*`; shell, navigation and the language switch in `AdminLayout.jsx`. The sidebar is grouped by workflow:

- **Every day** — Dashboard, Today, Tasks, Requests, Pipeline
- **Clients** — Meetings, Sequences, Reports
- **Catalog** — Buildings, Services, Team
- **System** — Analytics, Metrica, Integrations, Project launch, Settings

The footer holds "To the site", sign-out and the signed-in e-mail; on phones the same menu opens from the header button.

### 6.1 Dashboard — `/admin`

Loads up to 300 leads, the first `AdminSettings` record and up to 200 open tasks, then renders four priority tiers:

1. **Action Center** (`components/admin/dashboard/ActionCenter.jsx`) — SLA-overdue first responses, tasks due today / overdue (with up to three urgent tasks and a one-click "Done" toggle that strikes the task through), and new enquiries without a reply.
2. **Funnel Health** (`FunnelHealth.jsx`) — the ten stages grouped into "in progress" and "outcome", Khamovniki share, owners vs buyers, qualified conversations.
3. **Distribution** (`DistributionCard.jsx` + `BarRow.jsx`) — two cards: requests by type and by source (UTM), top five with the rest folded into "others".
4. **Recent requests** (`RecentLeads.jsx`) — the last five entries with type, status and date; on phones the type moves to its own line.

### 6.2 Sections

| Section | Capability |
| --- | --- |
| `/admin/today` | Operational list: SLA-overdue first responses with worked time, new enquiries, today's calls, today's meetings, next actions due, enquiries with no next step; filter by responsible (all / mine / backup); backup-owner reminder |
| `/admin/leads` | Request log (up to 300 records): table (`LeadsTable`) and Kanban (`LeadsKanban`, nine funnel columns + a non-target column, drag to move), filters by status / type / cluster / source, date range, search by name / phone / address, CSV export (logged to the audit trail), status transition dialog, quick preview dialog (`LeadDetail`) |
| `/admin/pipeline` | The same Kanban restricted to one pipeline via `?pipeline=owner_sale\|buyer_search\|rental` (kept in the URL); pipeline definitions come from the `Pipeline` entity |
| `/admin/leads/:id` | Lead workspace, six tabs — **overview** (contacts, funnel panel, deal value and commission, attribution, responsible and next step, journey checklist, tasks card), **communications** (timeline, quick actions, sequence suggestion, Metrica conversion card), **analysis** (manual owner analysis, print, e-mail), **meetings**, **history** (status changes), **documents** |
| `/admin/meetings` | List and calendar (`MeetingsCalendar`), create / edit, results, `.ics` export per meeting |
| `/admin/reports` | Weekly / monthly reports: period metrics computed automatically, six narrative blocks, save, print / PDF, e-mail the report, send the digest now, history of saved reports |
| `/admin/tasks` | Today and overdue, "my tasks", filters by assignee / status / priority / overdue, bulk complete or cancel, lead-scoped view (`?lead_id=`), create / edit (`TaskDialog`), manual "send reminders" |
| `/admin/sequences` | Per sequence and channel: auto-send toggle, delay in hours, template, active switch; 7-day send summary; "send queued" flush; plus a **Message templates** section (create, edit, delete) showing each template's channel, text and the sequences that use it |
| `/admin/buildings` | Create / edit / delete (`BuildingForm`), photo upload, coordinate picker on the map, publish / priority / expert flags, homepage placement (`BuildingPlacementFields`), CSV export and import |
| `/admin/services` | CRUD for `Service`: title, short description, audience, status (`active` / `planned`), order |
| `/admin/team` | CRUD for `TeamMember`: name, role, local bio, photo, `is_public` |
| `/admin/analytics` | Last 30 days over the 800 newest events, 500 newest leads and 200 buildings: top searches, unmatched searches, most viewed buildings, qualified conversations by source and landing page, funnel conversion, owners vs buyers, cluster split, rejection reasons, form start → submit drop-off, plus a by-agent table (7 / 30 / 90 days: requests, qualified, meetings held, contracts, deals, deal sum, commission) |
| `/admin/metrica` | Metrica next to the CRM: visits, users and goals for 7 / 30 / 90 days or a custom range, sources joined to requests and deals, pages producing qualified conversations |
| `/admin/integrations` | SMS and telephony providers, sender names, admin number for two-step calls and tests, provider status and test sends, delivery webhook address, Metrica counter / goals / token badge, editable contact details |
| `/admin/launch` | Launch checklist in twelve groups with statuses, owners and due dates; one-click seeding from `lib/launchDefaults.js` |
| `/admin/settings` | Site contacts and the notification e-mail, plus the read-only audit log (last 100 entries) |

### 6.3 Uploads in the admin

- Building photos and team photos use `UploadPublicFile` — **stored publicly (anyone with the link can open them)**, because they are displayed on the public site.
- Client documents use `UploadPrivateFile` — **stored privately**, opened only through a short-lived signed URL issued by `getDocumentUrl`.

### 6.4 Buildings CSV

Export writes every building with `features` joined by `; `. Import matches rows by `address` (case-insensitive): existing addresses are updated, new ones are created, and the dialog reports created / updated / failed counts.

Imported columns: `address`, `property_type`, `deal_type`, `price`, `area`, `district`, `street`, `house_number`, `year_built`, `series_or_type`, `floors`, `entrances`, `apartments_count`, `description`, `features`, `latitude`, `longitude`, `is_priority`, `expert_verified`, `verified_at`, `verified_by`; `is_published` is honoured when present (`"false"` keeps a row as a draft). Photo and video arrays are never overwritten by an import.

## 7. Lead funnel

Ten statuses, mirrored on the client (`src/lib/leadStatus.js`) and on the server (`base44/shared/leadFunnel.ts`):

| # | Status | Russian label | Meaning |
| --- | --- | --- | --- |
| 1 | `new_inquiry` | Новое обращение | Just received, nobody has replied yet |
| 2 | `contact_made` | Контакт установлен | First outbound contact logged |
| 3 | `target_inquiry` | Целевое обращение | Object and person fit the agency's target cluster |
| 4 | `qualified_conversation` | Квалифицированный разговор | A conversation on the substance happened — **this is the KPI** |
| 5 | `meeting_scheduled` | Встреча назначена | Meeting agreed and in the calendar |
| 6 | `meeting_held` | Встреча проведена | Meeting took place |
| 7 | `contract_signed` | Договор подписан | Agency or exclusive agreement signed |
| 8 | `listed_or_search_started` | В продаже / подбор начат | Property listed or buyer search started |
| 9 | `deal_closed` | Сделка | Deal completed |
| 10 | `non_target` | Нецелевое обращение | Rejected; requires a reason |

Rules enforced by `functions/changeLeadStatus` (and mirrored client-side by `needsTransitionData`):

- **Kanban** shows the first nine as columns; `non_target` has its own column and is reached through the transition dialog.
- `qualified_conversation` requires the checklist `owner_need_confirmed`, `object_confirmed`, `real_intent`, `timeframe_recorded`, `meeting_agreed`, `terms_fit`.
- `target_inquiry` for a lead with `area_flag: "outside"` also requires the checklist (this is the cluster exception).
- `contract_signed` requires `contract_type` (`agency` / `exclusive`) and `contract_url`.
- `non_target` requires `rejection_reason` (managed in the `RejectionReason` entity).
- Every change stamps `first_response_at` (first outbound touch) and `qualified_at`, writes a `StatusHistory` record with the actor, then triggers the Metrica offline conversion and the status-based sequence. **Integration failures never block the status change.**
- Legacy statuses (`new`, `contacted`, `qualified`, `meeting_set`, `agreement`, `closed`, `spam`) are mapped on read (`LEGACY_STATUS_MAP`); `migrateLeadStatuses` rewrites them in the database (dry-run unless told otherwise).
- Queries filter by status through `statusQuery()` so old records still match a new status.

The lead workspace shows a **journey checklist** (`lib/leadJourney.js`) whose steps depend on `person_role`: owner, buyer, or a generic five-step path. `journeyProgress` computes the completed steps.

**Deal economics** (`lib/deal.js`): `deal_value` + `deal_currency` (`RUB`, `USD`, `EUR`), `commission_percent`, derived `commission_amount`, `commission_note` for textual terms, `expected_close_date`, `closed_at`.

## 8. First-response SLA

`src/lib/sla.js` counts **working minutes only**: Monday to Friday inside the window from `AdminSettings` (`working_hours_start` 10:00, `working_hours_end` 20:00), always in Moscow time (`MSK_OFFSET_MIN = 180`).

- Target: `first_response_sla_minutes`, default **30**.
- Closed statuses (`non_target`, `deal_closed`) are never overdue.
- A lead with no `first_response_at` whose worked minutes exceed the target is **overdue**; `slaState()` returns the state, the worked minutes and the remaining/overdue amount.
- The number appears in three places: the Action Center on `/admin`, the `/admin/today` list (with worked time), and the daily digest e-mail.

## 9. Tasks

`Task` records: `title`, `due_at` (date + time), `assignee` (admin e-mail), `priority` (`low` / `normal` / `high`), `status` (`open` / `done` / `cancelled`), optional `lead_id`, `notes`, `created_by`, `reminder_sent`.

- Managed on `/admin/tasks` (`TasksTable` + `TaskDialog`), from the lead overview (`LeadTasksCard`), from `/admin/today` (`TasksPanel`), and from the dashboard Action Center.
- `lib/tasks.js` holds the enums, tone maps, `isOverdue`, `isDueToday`, `dueLabel`, `leadLabel` and `sortTasks`.
- **TaskReminders** workflow (daily 09:30 MSK) calls `sendTaskReminders`: open tasks due today or overdue are grouped per assignee, each person receives one e-mail, and `reminder_sent` prevents repeats. The same send can be triggered by hand from `/admin/tasks`.

## 10. Communications hub

Every lead has a timeline of `Communication` records: `channel` (`email`, `sms`, `call`, `telegram`, `whatsapp`, `max`, `note`), `direction` (`in` / `out`), `subject`, `body`, `status` (`queued`, `sent`, `delivered`, `failed`, `answered`, `missed`), `provider_id`, `duration_seconds`, `recording_url`, `created_by`, `scheduled_at`, `sent_at`, `sequence_key`.

| Channel | Mechanism |
| --- | --- |
| **Email** | `sendEmail` merges a `MessageTemplate` placeholders (`{имя}`, `{адрес}`, `{ответственный}`, `{телефон}`, `{время_встречи}`), sends it and writes the `Communication`. Built-in delivery, no keys needed. Until a custom domain is connected, mail reaches registered app users only. |
| **SMS** | `sendSms` uses the provider chosen on `/admin/integrations`: sms.ru, SMSC.ru or Twilio. Marketing texts require the client's consent. |
| **Calls** | `startCall` is click-to-call: the provider rings the administrator first, then the client. Supported: Zadarma, Novofon, Telphin, Mango Office. |
| **Delivery statuses** | `commsWebhook` accepts provider callbacks (delivered / answered / missed / failed …) and updates the record; protected by a secret token, reachable at `/functions/commsWebhook?token=…`. |
| **Manual logging** | Any call, message or note can be logged by hand when no provider is connected (`CommsLogDialog`, `CommsQuickActions`). WhatsApp works as a link plus a manual entry. |
| **Sequence suggestion** | The lead card proposes a ready text for the current status and sends it in one click per channel (`SequenceSuggestPanel`). |

Provider keys live in app **Secrets** and never reach the browser:

`SMSRU_API_ID` · `SMSC_LOGIN` + `SMSC_PASSWORD` · `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM` · `ZADARMA_KEY` + `ZADARMA_SECRET` · `NOVOFON_KEY` + `NOVOFON_SECRET` · `TELPHIN_TOKEN` · `MANGO_API_KEY` + `MANGO_API_SALT` · `COMMS_WEBHOOK_TOKEN` · `METRICA_OAUTH_TOKEN`.

## 11. Message sequences

`SequenceSetting` — one record per sequence **and** channel (`email`, `sms`, `whatsapp`) with `template_key`, `auto_send`, `delay_hours`, `is_active`. Logic in `base44/shared/sequences.ts`.

| Sequence | Trigger |
| --- | --- |
| `first_reply` | status `new_inquiry` |
| `meeting_confirmation` | status `meeting_scheduled` |
| `thank_you_after_meeting` | status `meeting_held` |
| `no_answer` | status `contact_made` with no answered outbound call in the last 24 hours |
| `price_analysis_followup` | status `qualified_conversation` once the owner analysis has content |

Rules:

- `first_reply` and `meeting_confirmation` are **transactional** (`TRANSACTIONAL_KEYS`) and need no consent; the other three require `consent_at`.
- Outside working hours (10:00–20:00 MSK) an auto-send is queued for the next working morning instead of going out immediately.
- A delay greater than zero also queues the message; `dispatchSequences` (every 15 minutes) sends everything that is due and marks failures instead of retrying forever.
- WhatsApp has no API here: the message is prepared as a link and marked as sent by hand.
- Nothing is sent twice: rows with `sent_at` are skipped.

## 12. Meetings

`Meeting` records: `type` (`in_apartment`, `office`, `video`), `starts_at`, `address`, `responsible`, `status` (`planned`, `held`, `cancelled`, `no_show`), `result_notes`.

- Created from the lead workspace (`LeadMeetingsTab`) or from `/admin/meetings`; the calendar and list are the same data in two views (`MeetingsCalendar`).
- Scheduling moves the lead to `meeting_scheduled`; marking it held moves it to `meeting_held`.
- A confirmation message can be sent while scheduling; skipping the confirmation is allowed.
- `.ics` export per meeting (`lib/ics.js`) works from both screens.
- Meetings feed the dashboard, `/admin/today` and the digest.

## 13. Documents

`Document` records belong to a lead: `doc_type` (`contract`, `passport`, `extract`, `valuation`, `other`), `title`, `file_ref` (private `file_uri`), `external_link`, `file_size`, `uploaded_by`, `notes`.

- Files are uploaded with `UploadPrivateFile` — **stored privately**: there is no public URL and the browser never receives a permanent link.
- `getDocumentUrl` issues a short-lived signed URL and writes `document.url_issued` to the audit log; `deleteDocument` writes `document.deleted`.
- The Documents tab (`LeadDocumentsTab`, `DocumentUploadDialog`) lists title, type, author, date and size and supports open / download / delete. An external link can be stored instead of a file.
- The UI carries an explicit caution: documents contain personal data, access is audited, and passport scans are uploaded only when the regulations require them.

## 14. Reports and digest

- `/admin/reports` builds a weekly or monthly `Report`: `period_start` / `period_end`, `metrics` (JSON string computed from the CRM), plus six narrative blocks typed by hand — `done_text`, `implemented_text`, `checked_text`, `data_text`, `blocked_text`, `next_text`. A report can be saved, printed to PDF (`@media print` targets `#report-print`) and e-mailed (`sendDigest` with `mode: "report"`).
- **DailyDigest** workflow runs every day at **09:30 Europe/Moscow** and calls `sendDigest` with `mode: "digest"`: new enquiries, SLA-overdue first responses, today's meetings and next actions, with deep links into the app.
- Recipients are `AdminSettings.admin_email`, `default_responsible`, `backup_responsible` and the app's admin users, de-duplicated.
- The same digest can be triggered manually from `/admin/reports`.

## 15. Yandex Metrica

Configuration lives in `IntegrationSettings` (single record), edited on `/admin/integrations`; the OAuth token exists only in Secrets as `METRICA_OAUTH_TOKEN`.

- **Client side** — with `metrica_enabled`, `Layout` / `hooks/useThirdPartyTags.js` inject the counter; `lib/track.js` fires interface events and client goals (`lead_submit`, `phone_click`, `form_start`) via `ym('reachGoal')`. Goal IDs come from `metrica_goal_ids` (keys: `lead_submit`, `phone_click`, `form_start`, `qualified_conversation`, `contract_signed`, `deal_closed`). The ClientID is captured on the lead (`client_id`) — it is what makes offline conversions possible.
- **Offline conversions** — `uploadOfflineConversion` sends `qualified_conversation`, `contract_signed` and `deal_closed` by ClientID (with the deal value for a closed deal). It fires automatically from `changeLeadStatus` and can be sent by hand from the lead overview (`MetricaConversionCard`). `Lead.offline_conversions_sent[]` blocks duplicates; the attempt is audited (`metrica.offline_conversion`, `metrica.offline_conversion_failed`).
- **Reporting** — `fetchMetricaStats` reads the Metrica Reporting API and caches responses for **10 minutes** for `/admin/metrica`; `metricaConfig` validates the counter, saves settings and reports whether the token is present.
- Without a token the counter, goals and ClientID capture still work; only reporting and offline conversions are unavailable.

## 16. Audit log

`AuditLog` records `actor` (admin e-mail or `demo`), `action`, `entity`, `entity_id`, `meta`, `at`. It is read-only on `/admin/settings` (`AuditLogPanel`, last 100 entries) and is admin-only at the entity level.

Actions written today: `document.url_issued`, `document.deleted`, `lead.exported`, `metrica.offline_conversion`, `metrica.offline_conversion_failed`.

## 17. Data model

### 17.1 Entities

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `Building` | Address database | `address` (unique), `city`, `district`, `street`, `house_number`, `property_type`, `deal_type`, `price`, `area`, `year_built`, `series_or_type`, `floors`, `entrances`, `apartments_count`, `ceilings`, `has_lift`, `metro`, `description`, `features[]`, `photos[]`, `videos[]`, `latitude`, `longitude`, `is_published`, `is_priority`, `expert_verified`, `is_featured`, `featured_order`, `neighborhood_group`, `verified_at`, `verified_by`, `source_url`, `updated_at` |
| `ApartmentNote` | Editorial notes per building | `building_id`, `layout_type`, `area_range`, `typical_issues`, `liquidity_note` |
| `Lead` | Requests and the whole funnel | `type`, `pipeline`, `cluster`, `person_role`, `area_flag`, `building_id`, `address_text`, `name`, `phone`, `email`, `telegram_username`, `preferred_contact`, `message`, `status`, `rejection_reason`, `sell_timeline`, `timeframe_hint`, `intent_rating`, `agreement`, `contract_type`, `contract_url`, `deal_value`, `deal_currency`, `commission_percent`, `commission_note`, `expected_close_date`, `closed_at`, `meeting_result`, `qualified_at`, `first_response_at`, `consent_at`, `consent_text_version`, `responsible`, `next_action_date`, `next_action_note`, `client_id`, `offline_conversions_sent[]`, `is_repeat`, `tags[]`, UTM fields, `referrer`, `page_path`, `is_meaningful`, `admin_notes` |
| `StatusHistory` | Funnel audit trail | `lead_id`, `from_status`, `to_status`, `changed_by`, `note` |
| `Pipeline` | Funnel definitions | `key` (`owner_sale` / `buyer_search` / `rental`), `title_ru`, `title_en`, `is_active`, `sort_order` |
| `OwnerAnalysis` | Manual owner analysis | `lead_id`, `price_range_note`, `liquidity`, `competitors`, `long_sale_reasons`, `market_risks`, `objections_and_answers`, `recommended_strategy` |
| `Communication` | Communication timeline | `lead_id`, `channel`, `direction`, `subject`, `body`, `status`, `provider_id`, `duration_seconds`, `recording_url`, `created_by`, `scheduled_at`, `sent_at`, `sequence_key` |
| `MessageTemplate` | Message templates | `channel`, `name`, `subject`, `body` |
| `SequenceSetting` | Message automation | `key`, `channel`, `template_key`, `auto_send`, `delay_hours`, `is_active` |
| `RejectionReason` | Non-target reasons | `label`, `is_active`, `sort_order` |
| `Task` | To-dos with reminders | `lead_id`, `title`, `due_at`, `assignee`, `status`, `priority`, `reminder_sent`, `notes`, `created_by` |
| `Meeting` | Meetings and calendar | `lead_id`, `type`, `starts_at`, `address`, `responsible`, `status`, `result_notes` |
| `Document` | Lead files | `lead_id`, `title`, `doc_type`, `file_ref` (private `file_uri`), `external_link`, `file_size`, `uploaded_by`, `notes` |
| `AuditLog` | Sensitive-action trail | `actor`, `action`, `entity`, `entity_id`, `meta`, `at` |
| `Report` | Weekly / monthly reports | `period_type`, `period_start`, `period_end`, `metrics`, `done_text`, `implemented_text`, `checked_text`, `data_text`, `blocked_text`, `next_text`, `sent_at`, `author` |
| `LaunchItem` | Launch checklist | `group` (`contract`, `edo`, `access`, `developer`, `ads_history`, `buildings`, `youtube`, `terms`, `claims`, `backup`, `crm`, `plan`), `title`, `status`, `owner`, `due_date`, `notes`, `sort_order` |
| `Claim` | Verifiable agency claims | `text`, `is_verified`, `proof_note`, `approved_by` |
| `Service` | Services catalogue | `title`, `short_description`, `audience`, `status` (`active` / `planned`), `sort_order` |
| `TeamMember` | People on the About page | `name`, `role`, `local_bio`, `photo_url`, `is_public` |
| `SiteSettings` | Public contacts (single record) | `phone`, `email`, `office_address`, `office_landmark`, `working_hours`, `telegram`, `whatsapp`, `vk`, `admin_email`, `metrica_counter_id`, `gsc_verification` |
| `AdminSettings` | Internal rules (single record) | `target_districts`, `target_streets[]`, `first_response_sla_minutes`, `working_hours_start` / `working_hours_end`, `timezone`, `default_responsible`, `backup_responsible`, `sms_provider`, `sms_sender`, `telephony_provider`, `call_first_number`, `email_from_name`, `comms_webhook_path`, `digest_enabled` |
| `IntegrationSettings` | Metrica and GSC (single record) | `metrica_counter_id`, `metrica_goal_ids`, `metrica_enabled`, `gsc_verification`, `updated_at` |
| `Events` | Interface analytics | `event_name`, `path`, `session_id`, `building_id`, `search_query`, `matched`, `meta` |
| `User` | Built-in platform entity | `role`: `admin` / `user` |

### 17.2 Relationships

```
Building 1 ── n ApartmentNote
Building 1 ── n Lead             (building_id, optional)
Lead     1 ── n StatusHistory
Lead     1 ── n Communication
Lead     1 ── n Task             (optional)
Lead     1 ── n Meeting
Lead     1 ── n Document
Lead     1 ── 1 OwnerAnalysis
Lead     n ── 1 Pipeline         (by key)
Lead     n ── n SequenceSetting  (by status → sequence key)
Service / TeamMember / Claim / RejectionReason / Pipeline  — standalone catalogues
SiteSettings / AdminSettings / IntegrationSettings          — single records
AuditLog / Events                                            — append-only logs
```

### 17.3 Scale notes

Admin screens load one page of records rather than the whole table: leads 300, tasks 300, meetings 300, buildings 500, open tasks for the dashboard 200, public buildings 60, analytics 800 events + 500 leads + 200 buildings. Above those volumes the counters and lists need pagination or server-side aggregation — see [section 29](#29-known-limitations).

## 18. Backend functions

All in `base44/functions/*/entry.ts`. Admin-only functions call `requireAdminOrDemo(base44)` from `base44/shared/guards.ts`.

| Function | Access | Purpose |
| --- | --- | --- |
| `submitLead` | public | Lead intake: validation, honeypot, IP rate limit, building match, pipeline / cluster / role inference, ClientID + UTM capture, `StatusHistory`, notification e-mail |
| `changeLeadStatus` | admin | Funnel rules (checklist, contract, rejection reason), timestamps, history, then Metrica conversion and sequence trigger |
| `sendEmail` | admin | Client e-mail from the lead card: template merge, `Communication` record |
| `sendSms` | admin | SMS via the chosen provider, consent-aware, `Communication` record |
| `startCall` | admin | Two-step click-to-call: administrator first, then the client |
| `commsTest` | admin | Provider status and test sends for `/admin/integrations` |
| `commsWebhook` | token | Delivery and call-status callbacks, protected by `COMMS_WEBHOOK_TOKEN` |
| `dispatchSequences` | admin / workflow | Sends the queue of delayed and after-hours sequence messages |
| `sendTaskReminders` | admin / workflow | Groups open tasks due today or overdue per assignee and mails each one |
| `sendDigest` | admin / workflow | Daily digest (`mode: "digest"`) or a saved report (`mode: "report"`) to the admins |
| `getDocumentUrl` | admin | Short-lived signed URL for a private document + audit entry |
| `deleteDocument` | admin | Deletes a document record and writes the audit entry |
| `metricaConfig` | admin | Reads / saves Metrica settings, reports whether the token is present, checks the counter |
| `fetchMetricaStats` | admin | Metrica reporting for `/admin/metrica` (visits, users, goals, sources, pages, devices), 10-minute cache |
| `uploadOfflineConversion` | admin | Offline conversion by ClientID (qualified / contract / deal) |
| `logLeadExport` | admin | Writes a CSV export of the request log to the audit trail |
| `migrateLeadStatuses` | admin | Migrates legacy lead statuses to the ten-stage funnel (dry-run by default) |
| `backfillLeadPipeline` | admin | Fills an empty `pipeline` on existing leads from the request type (dry-run by default) |

All functions are invoked from the browser through the SDK (`base44.functions.invoke(name, payload)`); registered webhooks use the published URL `https://grant-home-inside.base44.app/functions/<functionName>`.

## 19. Shared server modules

| Module | Responsibility |
| --- | --- |
| `guards.ts` | `requireAdminOrDemo` — the single access check used by every admin function |
| `leadFunnel.ts` | Server-side funnel: status keys, checklist requirements, contract and rejection rules, suggestions |
| `comms.ts` | Channel/provider helpers, consent checks, `Communication` writing |
| `sequences.ts` | Sequence keys, transactional vs consent-required, working-hours queueing, template rendering, dispatch |
| `metrica.ts` | Metrica API access, goal mapping, offline conversion payloads |
| `audit.ts` | `writeAudit` helper for `AuditLog` records |

Shared logic lives here only — functions never carry a copy of it.

## 20. Workflows

| Workflow | Cron | Timezone | Action |
| --- | --- | --- | --- |
| `DailyDigest` | `30 9 * * *` | Europe/Moscow | `sendDigest` with `mode: "digest"` |
| `TaskReminders` | `30 9 * * *` | Europe/Moscow | `sendTaskReminders` |
| `SequenceDispatcher` | `*/15 * * * *` | Europe/Moscow | `dispatchSequences` |

Runs, their step graphs and errors are visible in the dashboard's Workflows tab.

## 21. Bilingual interface

- Dictionaries: `src/content/ru.js` and `src/content/en.js` — one file per language, **identical key sets** (1 272 keys each); homepage copy in `src/content/homepage.js` is exported per language and merged into `t.homepage`.
- `src/lib/i18n.js` exports the live `t` object, `applyLanguage(code)`, `dateLocale()` (`ru-RU` / `en-GB`) and `LANGS`.
- `components/LanguageProvider.jsx` keeps the choice in `localStorage` (`grant_lang`), defaults to Russian, and re-mounts the subtree (`key={lang}`) on switch — so no screen can keep stale strings or stale memoised labels.
- `LanguageSwitcher` sits in the site header and in the admin sidebar.
- Interface strings come from `t.*` only. Data coming from the database (a building description, a template name) is displayed as stored.
- **What stays Russian by design:** client-facing message bodies, e-mail subjects generated for a client, CSV sample rows and stored log notes. They are content, not chrome.
- **Adding a language:** create `src/content/<code>.js` with the same keys, add one entry to `LANGS`, done.
- **Adding a string:** add the key to both dictionaries in the same commit; a missing English key renders blank rather than falling back, so keep the files in sync.

## 22. SEO

- `src/lib/seo.js` sets title, description, robots, canonical, Open Graph, locale and JSON-LD per page. `organizationJsonLd(settings)` produces `RealEstateAgent` + `LocalBusiness` markup for the agency; the building page passes its own building JSON-LD to `applySeo`, which removes every injected script on unmount.
- `public/sitemap.xml` and `public/robots.txt` exist; `robots.txt` disallows `/admin`, `/login`, `/register`, `/mfa`.
- `*.base44.app` hosts are forced to `noindex`.
- Unknown routes render `PageNotFound` with `<meta name="prerender-status-code" content="404">`; a building page whose record no longer exists does the same after loading.

⚠️ **Domain:** `SITE_URL` in `src/lib/seo.js`, the `<loc>` entries in `public/sitemap.xml`, the `Sitemap:` line in `public/robots.txt` and the canonical / OG tags in `index.html` still point at `https://rieltorcenter.ru`. Replace all of them when the final domain is connected.

## 23. Events and analytics

`src/lib/track.js` is the single tracking entry point. It writes to the `Events` entity with a per-session id (`sessionStorage: grant_sid`) and a JSON `meta` payload, and never blocks the interface.

Events: `page_view`, `address_search` (with `matched`), `building_view`, `cta_click`, `lead_submit`, `form_start`, `form_submit_success`, `phone_click`, `telegram_click`, `whatsapp_click`.

`/admin/analytics` reads the newest 800 events, 500 leads and 200 buildings for the last 30 days and derives: top search queries, unmatched searches (buildings worth adding next), most viewed buildings, qualified conversations by source and landing page, funnel conversion between stages, owners vs buyers, cluster share, rejection reasons, form start → submit drop-off, and the by-agent table (`lib/agentStats.js`, 7 / 30 / 90-day presets: requests, qualified, meetings held, contracts, deals, deal sum, commission per currency).

## 24. Design system

Warm dark editorial theme with square geometry and a single accent family.

| Token | Value | Role |
| --- | --- | --- |
| `--background` | `#2D2A26` | Page base |
| `--card` | `#37342F` range | Panels, dashboard cards |
| `--secondary` / `--muted` | `#3A3732` range | Inputs, hovers, secondary surfaces |
| `--paper` | `#EDECE8` | Light "paper" blocks |
| `--foreground` | `#FAF9F6` | Text |
| `--primary` | `#8E4A49` | Terracotta accent: buttons, rules, active states |
| `--accent` | `#D4A373` | Sand accent: eyebrows, links, highlights |
| `--muted-foreground` / `--subtle-foreground` | warm greys | Secondary text |
| `--radius` | `0.25rem` | Square geometry everywhere |

Typography: **Cormorant Garamond** (`--font-heading`, 300–700), **Montserrat** (`--font-body`, 300–700), **JetBrains Mono** (`--font-mono`). Headings 1–2 are weight 400, level 3 is 500.

Utilities in `src/index.css`: `.rule` (hairline ending in a small terracotta square), `.pulse` (warm hero glow), `.eyebrow` (uppercase tracking label), `.link-underline`, `.fade-up`, `.metrica-dot` (staggered reveal of Metrica chart dots, reduced-motion aware), plus `@media print` rules that print only `#lead-print` and `#report-print`.

Rules:

- Tokens live in `src/index.css` (both `:root` and `.dark`) and are mapped in `tailwind.config.js`; the palette changes in one place.
- Historic hex utilities (`bg-[#1a2025]`, `text-[#c8102e]`, …) are aliased to tokens at the bottom of `src/index.css`, so legacy markup follows the theme.
- New components use token classes (`bg-card`, `text-muted-foreground`, `font-heading`), never raw hex.
- Tailwind class names must be literal strings — no `bg-${color}-500` construction.
- Everything is responsive; dashboards and the admin sidebar are checked at phone and desktop widths.
- Content images render through `components/ui/image.jsx` (resized, responsive srcset) rather than a plain `<img>`.

## 25. Project structure

```
base44/
  entities/        24 schemas — Building, ApartmentNote, Lead, StatusHistory, Pipeline,
                   OwnerAnalysis, Communication, MessageTemplate, SequenceSetting,
                   RejectionReason, Task, Meeting, Document, AuditLog, Report, LaunchItem,
                   Claim, Service, TeamMember, SiteSettings, AdminSettings,
                   IntegrationSettings, Events, User
  functions/       18 functions — submitLead, changeLeadStatus, sendEmail, sendSms, startCall,
                   commsTest, commsWebhook, dispatchSequences, sendTaskReminders, sendDigest,
                   getDocumentUrl, deleteDocument, metricaConfig, fetchMetricaStats,
                   uploadOfflineConversion, logLeadExport, migrateLeadStatuses,
                   backfillLeadPipeline
  shared/          guards.ts, leadFunnel.ts, comms.ts, sequences.ts, metrica.ts, audit.ts
  workflows/       DailyDigest, TaskReminders, SequenceDispatcher
  config.jsonc     install / build / serve commands for Base44
public/            robots.txt, sitemap.xml
src/
  pages/           public pages, auth pages, pages/admin/*
  components/      Header, Footer, Layout, AddressSearch, BuildingCard, BuildingsMap,
                   PropertyCollection, SectionHeading, LeadDialog / LeadForm / LeadProvider,
                   LanguageProvider / LanguageSwitcher, MFA screens,
                   home/*, cluster/*, map/*, ui/*,
                   admin/dashboard/*, admin/lead/*, admin/leads/*, admin/meetings/*,
                   admin/tasks/*, admin/today/*, admin/metrica/*, admin/analytics/*,
                   admin/integrations/*, admin/settings/*
  content/         ru.js, en.js, homepage.js
  hooks/           useBuildings, useSiteSettings, useThirdPartyTags, use-mobile, use-size
  lib/             i18n, seo, track, leadStatus, leadFunnel helpers, leadJourney, pipeline,
                   deal, tasks, sla, mskTime, ics, price, csv, documents, metricaConfig,
                   sequences, launchDefaults, agentStats, khamovniki, sample-buildings,
                   auth helpers (AuthContext, authMfa, authMfaFlow, authReturnTo, app-params)
  App.jsx          routes, providers, auth gate
  index.css        design tokens, utilities, print rules
```

## 26. Authentication and access

- Sign-in by e-mail and password (`loginWithMfa`, including the MFA step when enabled), Google sign-in, password recovery (`/forgot-password`, `/reset-password?token=…`) and two-factor authentication (`/mfa`, `MfaFlow`, `MfaManage`, `MfaMethodSetup`).
- New users join through the app's **App Users** page; roles are `admin` and `user`.
- **Intended model:** `/admin` renders only for `role = "admin"`; lead reads are limited to the author or an admin; catalogue, settings and CRM writes are admin-only.
- **Current state (demo):** the admin gate is disabled (`GATE_DISABLED = true` in `AdminLayout.jsx`), the `/admin` routes in `App.jsx` are not wrapped in `ProtectedRoute`, `requireAdminOrDemo` lets requests without a session through, and entity `rls` blocks are open. This is for showcasing only — the app behaves as if every visitor were an administrator.

**To restore production access:**

1. Set `GATE_DISABLED = false` in `src/pages/admin/AdminLayout.jsx` and wrap the `/admin` routes in `src/App.jsx` with `<Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>`.
2. Replace the demo body of `requireAdminOrDemo` in `base44/shared/guards.ts` with a strict `user.role === "admin"` check returning 403 — every admin function calls it.
3. Tighten the entity `rls` blocks: public read for `Building`, `Service`, `SiteSettings`, `ApartmentNote` and published `TeamMember`; create-only for `Events` and `Lead`; admin-only for leads, communications, documents, tasks, meetings, reports, sequences, pipelines and settings.
4. Re-check `/admin/today` and the dashboard after the change: they must load for an admin and show the access-denied screen for everyone else.

## 27. Local development

The repository is how the app is run and edited locally; any change pushed to git is reflected in the Base44 builder.

### Prerequisites

1. Clone the repository.
2. `npm install`.
3. `npm install -g base44@latest` (Base44 CLI).
4. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) — the local Base44 backend runs on it.

`base44 --help` lists the full command surface ([CLI reference](https://docs.base44.com/developers/references/cli/commands/introduction)).

### Run

```bash
base44 login   # once per machine
base44 link    # once per clone
base44 dev     # local backend + frontend together
```

Open the frontend URL printed by `base44 dev` (typically `http://localhost:5173`).

Notes:

- **Every fresh clone needs `base44 link`** — it writes `base44/.app.jsonc`, the app-id pointer, which is gitignored on purpose.
- **`base44 dev` starts the frontend itself** (via `site.serveCommand`), so do not run `npm run dev` separately.
- **Publish the app at least once**, otherwise the UI will not load under `base44 dev`.
- Entities, functions and auth run locally; entity data is **in-memory** and wiped on restart. Core integrations and OAuth login are forwarded to the deployed app.

### Frontend only, hosted backend

```bash
base44 dev --remote
```

⚠️ Writes in this mode go to the app's **production data**.

### Publishing

After pushing to git, publish from the dashboard (`base44 dashboard open`). Repo sync happens through git; a CLI deploy would ship the local tree directly.

### Quality gates

```bash
npm run lint        # eslint --quiet
npm run typecheck   # tsc -p ./jsconfig.json
npm run build       # production build
```

## 28. Operations runbook

**Add a building**
`/admin/buildings` → "Add building" → address (unique), city, district, deal type, price, area, year, floors, entrances, series, description, features, coordinates, photos → publish flag. Priority and "expert verified" raise it in listings and the homepage selection.

**Bulk-fill the database**
`/admin/buildings` → "Import CSV". The file is matched by address: existing rows are updated, new rows are created, and the dialog reports created / updated / failed. Download the template from the same dialog.

**Change the palette or fonts**
Edit the token values in `src/index.css` (`:root` and `.dark`); everything else follows through `tailwind.config.js`. Do not add hex values in components.

**Change working hours or the SLA**
`AdminSettings.working_hours_start`, `working_hours_end`, `first_response_sla_minutes`, `timezone`. The SLA, "Today", the dashboard and the digest read the same record.

**Change who receives notifications**
`AdminSettings.default_responsible` (primary) and `backup_responsible` (fallback), plus `SiteSettings.admin_email`. The digest also goes to every admin user.

**Turn on SMS or calls**
`/admin/integrations`: choose the provider, set the sender name and the admin number, add the provider keys in app Secrets, then use "Send test". Give the provider the webhook address with `?token=` matching `COMMS_WEBHOOK_TOKEN`.

**Turn on Metrica reporting**
Add `METRICA_OAUTH_TOKEN` to Secrets, set the counter number and goal IDs on `/admin/integrations`, enable the counter, then "Check connection".

**Add or reword an automated message**
`MessageTemplate` holds the text; `SequenceSetting` binds a template to a sequence and channel with `auto_send`, `delay_hours` and `is_active`. Test with the lead card's "Sequence suggestion" before enabling auto-send.

**Change funnel rules**
`base44/shared/leadFunnel.ts` (server) and `src/lib/leadStatus.js` (client) must stay in agreement — checklists, required data and legacy mapping live in both.

**Investigate a failed automation**
Dashboard → Workflows → the workflow's runs (steps, errors, definition version); function logs for the specific function; `/admin/settings` for the audit trail of sensitive actions.

**Rotate the webhook token**
Generate a new value in Secrets as `COMMS_WEBHOOK_TOKEN` and update the URL in the provider's dashboard.

## 29. Known limitations

- **Demo access**: the admin gate, the route gate and entity RLS are open (see [section 26](#26-authentication-and-access)).
- **Domain**: SEO canonical, sitemap, robots and `index.html` metadata still use `https://rieltorcenter.ru`.
- **Contacts** in `SiteSettings` are placeholders — confirm phone, e-mail and office before launch.
- **Privacy policy** is a structured draft: it needs company details and a legal review.
- **SMS, telephony and messengers**: adapters are implemented; production sending needs provider keys and the webhook token. WhatsApp works as a link plus manual logging — there is no API integration.
- **Metrica**: reporting and offline conversions require `METRICA_OAUTH_TOKEN`; the counter, goals and ClientID capture work without it.
- **E-mail to non-registered addresses** requires a connected custom domain on a paid plan; until then only registered app users receive mail.
- **No payments and no online booking**: the site works through requests and meetings only.
- **No automated valuations** by design; the owner analysis is written by hand in the lead workspace.
- **Report e-mail delivery** is subject to the same registered-recipient limitation as above.
- **Pagination**: admin screens load one page of records (300–800 depending on the screen); above those volumes lists and counters need server-side aggregation.
- **Media** is stored as URLs; building and team photos are uploaded from the admin, client documents go to private storage.

### Roadmap

- Per-agent reporting beyond the current 7 / 30 / 90-day table (agent-level source mix and win reasons).
- Server-side pagination and aggregates for the request log and analytics.
- Property-preparation and management services, once demand is confirmed (kept as `planned` until then).

## 30. Glossary

| Term | Meaning |
| --- | --- |
| **Building / дом** | A specific address with its own facts, features and history — the unit of the whole product |
| **Cluster / кластер** | A working district; the first and only one is Khamovniki |
| **Lead / обращение** | One inbound request; the only thing the CRM really stores at entry |
| **Qualified conversation** | A conversation on the substance; the agency's KPI, not a form submission |
| **Non-target** | A request the agency declines, always with a recorded reason |
| **Pipeline / воронка** | The path a lead walks: `owner_sale`, `buyer_search`, `rental` |
| **Owner analysis** | Hand-written expert note about price, liquidity, competitors, risks and strategy — never an automatic valuation |
| **Sequence / сценарий** | A status-triggered message playbook per channel |
| **Portfolio / портфель** | The set of published buildings; private items are shown on request only |
| **Agency / exclusive agreement** | The two contract types stored in `contract_type` |
| **Digest / дайджест** | The daily 09:30 summary e-mail to the team |

## 31. Docs and support

- GitHub integration and local development: <https://docs.base44.com/developers/app-code/local-development/github>
- Local development overview: <https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview>
- Support: <https://app.base44.com/support>