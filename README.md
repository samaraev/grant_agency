# ГРАНТ — Дом изнутри (Grant Agency)

A hyperlocal real-estate agency site and back-office for **Khamovniki, Moscow**: an address-first database of buildings, editorial pages for owners and buyers, a services catalogue, lead capture with a full CRM funnel, a communications hub, meetings, reports, a bilingual interface (RU/EN) and an admin workspace.

- Live app: <https://grant-home-inside.base44.app>
- Русская версия этого документа: [README.ru.md](README.ru.md)

> The public interface is Russian by default; English is available through the RU/EN switch in the header and in the admin sidebar.

---

## 1. What the product is

The site is built around **the building, not the listing**, and around **one district**: Khamovniki is the first cluster the agency works in. Instead of an automated valuation the site leads to a conversation — a single lead form opens everywhere and creates a request that lands in the admin CRM and in the notification e-mail.

- Positioning: "Наш район. Ваша недвижимость." — local knowledge of houses, courtyards and surroundings, applied to buying and selling.
- No automated price estimates anywhere: the owner gets a human consultation, not a number.
- Editorial, quiet tone; the private-portfolio feel is preserved by publishing only selected buildings.

---

## 2. Public site

| Route | Page | What it does |
| --- | --- | --- |
| `/` | `Home` | Homepage 3.1: Khamovniki hero with address search, agency story, "how we help" split, owner form, building discoverer, map, services, premium collections, video tours, contacts |
| `/search` | `Search` | Portfolio with URL-driven filters, list and map views, capture of addresses that are not in the database |
| `/house/:id` | `House` | Building page: facts, features, apartment notes, gallery, video, map, lead actions |
| `/khamovniki` | `Khamovniki` | Cluster landing page: why Khamovniki, how the work goes, limits, contact block, cluster buildings |
| `/sobstvennikam` | `Owners` | For owners: questions, how the consultation works, "what we do not do", request form |
| `/pokupatelyam` | `Buyers` | For buyers: questions, pre-purchase checklist, request form |
| `/uslugi` | `Services` | Active and planned services from the database, plus a roadmap |
| `/o-nas` | `About` | Positioning, story, three pillars, verified claims (`Claim` with `is_verified`), public team members |
| `/kontakty` | `Contacts` | Phone, e-mail, office address and landmark, office map, request form |
| `/politika-konfidencialnosti` | `Privacy` | Privacy policy (152-FZ structure) |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/mfa` | Auth | Sign-in, sign-up with OTP, password recovery, two-factor authentication |
| `/admin/*` | Admin workspace | See section 4 |

Only published buildings (`is_published: true`) appear on the public site. Priority (`is_priority`) and expert-verified (`expert_verified`) buildings are sorted first.

### Homepage sections

`src/components/home/*`, copy in `src/content/homepage.js`:

`KhamovnikiHero` · `AgencySection` (local roots, agency history since 1994) · `HelpSection` (owner / buyer paths) · `OwnerFormSection` · `BuildingsDiscoverySection` · `MapSection` · `ServicesSection` · `PremiumCollections` (offices & corporate housing, apartments & penthouses, country houses & estates) · `VideosSection` · `ContactsSection`

Featured buildings on the homepage are chosen with `is_featured` and ordered by `featured_order`; the hero cover falls back to the first published building.

### Address search

`AddressSearch` matches what the visitor types against the loaded buildings (address, street, district, city). A match opens the building page; anything else goes to `/search?q=…`. Both outcomes are tracked (`address_search` with `matched: true/false`).

### Search page

Filters are stored in the URL, so any view can be shared or linked:

`?q=` full-text · `?district=` · `?street=` · `?group=offices|residences|estates` · `?deal=sale|rent`

Views: **list** (building cards) and **map**. When nothing matches, the page offers to leave the address as a request.

### Building page

Facts at a glance (year built, floors, entrances, apartments, series/type, area, price, deal type, ceilings, lift, metro), editorial description, feature list, apartment notes (`ApartmentNote`: layout type, area range, typical questions, liquidity note), photo gallery, video, Leaflet map, and decision buttons that open the lead form pre-filled with the building and the right request type.

---

## 3. Lead capture

One form (`LeadForm`) inside one dialog (`LeadDialog`), opened from anywhere through `LeadProvider` / `useLead()`: header CTA, hero buttons, building page, cluster page, search empty state, owners/buyers/contacts pages.

Fields: request type, address (with suggestions from the database), name, phone, preferred contact channel (phone / Telegram / WhatsApp), sell timeline, comment, consent checkbox, plus a hidden honeypot.

Request types: `owner_appraise`, `owner_sell`, `buyer_buy`, `buyer_check`, `general`, `rent`.
The site does **not** produce automated valuations and says so in the form and in the footer disclaimer.

Server-side rules (`submitLead`):

- name ≥ 2 characters, phone = 11 digits, consent must be `true`;
- honeypot filled → silent success, nothing stored;
- rate limit per IP (10 minutes window) → `429 rate_limited`;
- the address is matched to a building in the database and stored as `building_id`;
- the cluster (`khamovniki` / `other`) and the person role (owner / buyer / tenant / other) are inferred and stored, `area_flag` marks whether the object is inside the target cluster;
- the source is composed from UTM parameters (kept in `sessionStorage` during the session), otherwise the referrer, otherwise `direct`;
- the lead is created with `status: "new_inquiry"`, `consent_at`, and the first `StatusHistory` record;
- the agency is notified at `AdminSettings.default_responsible`, falling back to `SiteSettings.admin_email`.

After a successful send the visitor sees a confirmation with "what happens next".

---

## 4. Admin workspace

Routes live under `/admin` in `src/pages/admin/*`, navigation in `AdminLayout`.

| Section | Capability |
| --- | --- |
| `/admin` Dashboard | Last 7 days and totals, owners vs buyers, Khamovniki share, SLA-overdue counter, qualified conversations, 10-stage funnel, request types, sources |
| `/admin/today` Today | Operational "what needs an answer now": SLA-overdue first responses, new inquiries, today's calls, today's meetings, next actions due, leads with no next step, responsible filter (mine / backup / all) |
| `/admin/leads` Leads | Table and kanban (9 funnel columns, drag to move), filters by status/type/cluster/source, search by name/phone/address, CSV export, status transition dialog |
| `/admin/leads/:id` Lead workspace | Full-page card with five tabs: overview (contacts, funnel, attribution, responsible & next step, journey checklist), communications, analysis, meetings, history |
| `/admin/meetings` Meetings | Calendar and list of meetings, create/edit, results, `.ics` export per meeting |
| `/admin/reports` Reports | Weekly/monthly reports: metrics computed automatically (leads, qualified, meetings held, contracts, deals, non-target, Khamovniki, conversion), five free-text blocks, save, print/PDF, e-mail the report, send the digest now, history |
| `/admin/buildings` Buildings | Create/edit/delete, photo upload, coordinate picker on the map, publish/priority/expert flags, CSV export and CSV import (updates by address, creates new ones, reports created/updated/failed) |
| `/admin/services` Services | CRUD for services, audience, status (`active` / `planned`), display order |
| `/admin/team` Team | CRUD for team members shown on the About page |
| `/admin/analytics` Analytics | Top search queries, searches with no match, most viewed buildings (last 30 days, last 800 events) |
| `/admin/integrations` Integrations | SMS and telephony provider selection, sender names, admin number for click-to-call and tests, provider connection status, test sends, webhook address; keys live in Secrets and are never shown |
| `/admin/launch` Launch checklist | Project launch checklist in 12 groups (contract, EDO, accesses, developer, ad history, buildings, YouTube, terms, claims, backup, CRM, first-10-days plan) with statuses, owners, due dates; one-click seeding of the default list |
| `/admin/settings` Settings | Phone, e-mail, office, landmark, working hours, Telegram, WhatsApp, VK, notification e-mail |

Photos uploaded in the admin are stored publicly — anyone with the link can open them — because they are shown on the public site.

---

## 5. Lead funnel

Ten statuses (`src/lib/leadStatus.js`, mirrored server-side in `base44/shared/leadFunnel.ts`):

1. `new_inquiry` — Новое обращение
2. `contact_made` — Контакт установлен
3. `target_inquiry` — Целевое обращение
4. `qualified_conversation` — Квалифицированный разговор
5. `meeting_scheduled` — Встреча назначена
6. `meeting_held` — Встреча проведена
7. `contract_signed` — Договор подписан
8. `listed_or_search_started` — В продаже / подбор начат
9. `deal_closed` — Сделка
10. `non_target` — Нецелевое обращение

Rules:

- The first nine statuses are the kanban columns; `non_target` is reached through the transition dialog with a mandatory `rejection_reason`.
- `qualified_conversation` requires the qualification checklist: owner need confirmed, object confirmed, real intent, timeframe recorded, meeting agreed, terms fit.
- `target_inquiry` for a lead whose `area_flag = "outside"` also requires the checklist.
- `contract_signed` requires a contract type (`agency` / `exclusive`) and a contract link.
- Every change goes through `changeLeadStatus`, which validates the rules, stamps `first_response_at` and `qualified_at`, and writes a `StatusHistory` record.
- Legacy statuses (`new`, `contacted`, `qualified`, `meeting_set`, `agreement`, `closed`, `spam`) are mapped on read; `migrateLeadStatuses` migrates them in the database (dry-run by default).
- The lead workspace shows a **journey checklist** (`leadJourney`) with the steps relevant to the person's role — owner, buyer or generic.

---

## 6. First-response SLA and "Today"

`src/lib/sla.js` counts **working minutes only**: Monday–Friday inside the agency window from `AdminSettings` (default 10:00–20:00, Europe/Moscow). Target is `first_response_sla_minutes` (default 30).

- A lead with no `first_response_at`, not closed, whose worked minutes exceed the target is **overdue**.
- `/admin/today` lists overdue leads with the worked time, new inquiries, today's calls and meetings, planned next actions and leads without a next step, plus the responsible filter.
- The dashboard shows the same overdue count; the daily digest repeats it in the morning e-mail.

---

## 7. Communications hub

Every lead has a communication timeline (`Communication`: channel, direction, subject, body, status, provider id, call duration, recording link).

- **Email** — `sendEmail` renders a `MessageTemplate` (placeholders `{имя}`, `{адрес}`, `{ответственный}`, `{время_встречи}`) and sends it from the lead card; built-in sending, no keys needed.
- **SMS** — `sendSms` uses the provider chosen in `/admin/integrations`: sms.ru, SMSC.ru or Twilio. Marketing texts require the client's consent.
- **Calls** — `startCall` is click-to-call: the provider rings the administrator first, then the client. Supported: Zadarma, Novofon, Telphin, Mango Office.
- **Delivery statuses** — `commsWebhook` receives provider callbacks (delivered / answered / missed / failed …) and updates the record; it is protected by a secret token and is reachable at `/functions/commsWebhook?token=…`.
- **Manual logging** — a call, message or note can always be logged by hand when no provider is connected.

Provider keys are stored in app **Secrets** and never reach the browser:
`SMSRU_API_ID` · `SMSC_LOGIN` + `SMSC_PASSWORD` · `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM` · `ZADARMA_KEY` + `ZADARMA_SECRET` · `NOVOFON_KEY` + `NOVOFON_SECRET` · `TELPHIN_TOKEN` · `MANGO_API_KEY` + `MANGO_API_SALT` · `COMMS_WEBHOOK_TOKEN`.

---

## 8. Meetings

`Meeting` records (in the apartment, in the office, video) with date, place, responsible person, status (`planned` / `held` / `cancelled` / `no_show`) and result notes. Managed from the lead workspace tab and from `/admin/meetings` (calendar + list), exported as `.ics` via `src/lib/ics.js`. Scheduled meetings feed the dashboard, Today and the digest.

---

## 9. Reports and the daily digest

- `/admin/reports` builds a weekly or monthly `Report`: period metrics are computed from the CRM, the five narrative blocks are typed by hand. A report can be printed to PDF, saved and sent by e-mail (`sendDigest` in `mode: "report"`).
- The **Daily Digest** workflow runs every day at **09:30 Europe/Moscow** and calls `sendDigest` in `mode: "digest"`: new inquiries, SLA-overdue first responses, today's meetings and next actions, with deep links into the app.
- Recipients: `AdminSettings.admin_email`, `default_responsible`, `backup_responsible` and the app's admin users — deduplicated, at most five.
- The same digest can be triggered manually from `/admin/reports`.

---

## 10. Data model

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `Building` | The address database | `address` (unique), `city`, `district`, `street`, `house_number`, `property_type`, `deal_type`, `price`, `area`, `year_built`, `series_or_type`, `floors`, `entrances`, `apartments_count`, `ceilings`, `has_lift`, `metro`, `description`, `features[]`, `photos[]`, `videos[]`, `latitude`, `longitude`, `is_published`, `is_priority`, `expert_verified`, `is_featured`, `featured_order`, `neighborhood_group`, `verified_at`, `verified_by`, `source_url`, `updated_at` |
| `Lead` | Requests and the whole funnel | `type`, `cluster`, `person_role`, `area_flag`, `building_id`, `address_text`, `name`, `phone`, `email`, `telegram_username`, `preferred_contact`, `message`, `status`, `rejection_reason`, `sell_timeline`, `timeframe_hint`, `intent_rating`, `agreement`, `contract_type`, `contract_url`, `meeting_result`, `qualified_at`, `first_response_at`, `consent_at`, `consent_text_version`, `responsible`, `next_action_date`, `next_action_note`, `client_id`, `is_repeat`, `tags[]`, UTM fields, `page_path`, `admin_notes` |
| `StatusHistory` | Funnel audit trail | `lead_id`, `from_status`, `to_status`, `changed_by`, `note` |
| `Communication` | Communication timeline | `lead_id`, `channel`, `direction`, `subject`, `body`, `status`, `provider_id`, `duration_seconds`, `recording_url`, `created_by` |
| `Meeting` | Meetings and calendar | `lead_id`, `type`, `starts_at`, `address`, `responsible`, `status`, `result_notes` |
| `OwnerAnalysis` | Manual owner analysis | `lead_id`, `price_range_note`, `liquidity`, `competitors`, `long_sale_reasons`, `market_risks`, `objections_and_answers`, `recommended_strategy` |
| `MessageTemplate` | Message templates | `channel`, `name`, `subject`, `body` |
| `RejectionReason` | Reasons for non-target | `label`, `is_active`, `sort_order` |
| `Report` | Weekly/monthly reports | `period_type`, `period_start`, `period_end`, `metrics`, `done_text`, `implemented_text`, `checked_text`, `data_text`, `blocked_text`, `next_text`, `sent_at`, `author` |
| `LaunchItem` | Launch checklist | `group`, `title`, `status`, `owner`, `due_date`, `notes`, `sort_order` |
| `Claim` | Verifiable agency claims | `text`, `is_verified`, `proof_note`, `approved_by` |
| `AdminSettings` | Internal rules (single record) | `target_districts`, `target_streets[]`, `first_response_sla_minutes`, `working_hours_start` / `working_hours_end`, `timezone`, `default_responsible`, `backup_responsible`, `sms_provider`, `sms_sender`, `telephony_provider`, `call_first_number`, `email_from_name`, `comms_webhook_path`, `digest_enabled` |
| `SiteSettings` | Public contacts (single record) | `phone`, `email`, `office_address`, `office_landmark`, `working_hours`, `telegram`, `whatsapp`, `vk`, `admin_email`, `metrica_counter_id`, `gsc_verification` |
| `Service` | Services catalogue | `title`, `short_description`, `audience`, `status`, `sort_order` |
| `TeamMember` | People on the About page | `name`, `role`, `local_bio`, `photo_url`, `is_public` |
| `ApartmentNote` | Editorial notes per building | `building_id`, `layout_type`, `area_range`, `typical_issues`, `liquidity_note` |
| `Events` | Interface analytics | `event_name`, `path`, `session_id`, `building_id`, `search_query`, `matched`, `meta` |
| `User` | Built-in platform entity | `role`: `admin` / `user` |

> ⚠️ **Access rules**: while the app is in demo mode the admin gate is disabled and row-level security on the entities is open. Before going live, restore the admin gate and the RLS rules described in section 18.

---

## 11. Backend functions

All in `base44/functions/*/entry.ts`, shared logic in `base44/shared/comms.ts` and `base44/shared/leadFunnel.ts`.

| Function | Purpose |
| --- | --- |
| `submitLead` | Public lead intake: validation, honeypot, rate limit, building match, cluster/role inference, `StatusHistory`, notification e-mail |
| `changeLeadStatus` | Server-side funnel rules: checklist, contract, rejection reason, timestamps, history |
| `sendEmail` | E-mail to the client from the lead card: template merge, `Communication` record |
| `sendSms` | SMS via the chosen provider, consent-aware, `Communication` record |
| `startCall` | Click-to-call: administrator first, then the client |
| `commsTest` | Provider status and test sends for `/admin/integrations` |
| `commsWebhook` | Delivery and call-status callbacks, protected by `COMMS_WEBHOOK_TOKEN` |
| `sendDigest` | Daily digest (`mode: "digest"`) or a saved report (`mode: "report"`) to the admins |
| `migrateLeadStatuses` | Migrates legacy lead statuses to the 10-stage funnel (dry-run by default) |

---

## 12. Workflows

`base44/workflows/DailyDigest.jsonc` — scheduled every day at **09:30 Europe/Moscow**, one step: invoke `sendDigest` with `mode: "digest"`. Runs and their graphs are visible in the dashboard's Workflows tab.

---

## 13. Bilingual interface (RU / EN)

- Dictionaries: `src/content/ru.js`, `src/content/en.js` — one file per language, same keys; the homepage copy lives in `src/content/homepage.js`.
- `src/lib/i18n.js` exposes the live `t` object, `applyLanguage()`, `dateLocale()`, `LANGS`.
- `LanguageProvider` re-mounts the tree on switch; the choice is kept in `localStorage` (`grant_lang`), Russian is the default.
- The switch lives in the site header and in the admin sidebar (`LanguageSwitcher`). Adding a language = one dictionary + one entry in `LANGS`.

---

## 14. SEO

- `src/lib/seo.js` sets title, description, robots, canonical, Open Graph and locale per page, plus JSON-LD (`Organization` on the site, building data on building pages).
- `applySeo` cleans up injected structured data on unmount.
- `public/sitemap.xml` and `public/robots.txt` exist; `robots.txt` disallows `/admin`, `/login`, `/register`, `/mfa`.
- Unknown routes render `PageNotFound` with a `prerender-status-code: 404` meta tag; a building page that no longer exists does the same.

⚠️ **Domain**: `SITE_URL` in `src/lib/seo.js`, the `<loc>` entries in `public/sitemap.xml`, the `Sitemap:` line in `public/robots.txt` and the canonical/OG tags in `index.html` still point at `https://rieltorcenter.ru`. Update all of them when the final domain is connected.

---

## 15. Events and analytics

`src/lib/track.js` is the single tracking entry point. It writes to the `Events` entity with a per-session id (`sessionStorage: grant_sid`) and a JSON `meta` payload; nothing here blocks the interface.

Events used: `page_view`, `address_search` (with `matched`), `building_view`, `cta_click`, `lead_submit`, `form_start`, `form_submit_success`, `phone_click`, `telegram_click`, `whatsapp_click`.

`/admin/analytics` reads the last 800 events, keeps 30 days, and shows top search queries, unmatched searches (a list of buildings worth adding) and most viewed buildings.

---

## 16. Design system

- Warm dark editorial theme: base `#2D2A26`, cards `#37342F`-range surfaces, light paper `#EDECE8`, text `#FAF9F6`.
- Accents: terracotta `#8E4A49` (`--primary` — buttons, rules, active states) and sand `#D4A373` (`--accent` — eyebrows, links, highlights).
- Type: **Cormorant Garamond** for headings (`--font-heading`), **Montserrat** for body (`--font-body`), **JetBrains Mono** for numerals and technical labels (`--font-mono`).
- Square geometry (`--radius: 0.25rem`), hairline borders, utility classes in `src/index.css`: `.rule`, `.pulse`, `.eyebrow`, `.link-underline`, `.fade-up`.
- Tokens live in `src/index.css` and are mapped in `tailwind.config.js`; legacy hex utilities from earlier versions are aliased to the tokens there, so the palette is changed in one place only.
- Responsive everywhere: the layouts are checked on phone and desktop widths.

---

## 17. Project structure

```
base44/
  entities/        Building, Lead, StatusHistory, Communication, Meeting, OwnerAnalysis,
                   MessageTemplate, RejectionReason, Report, LaunchItem, Claim,
                   AdminSettings, SiteSettings, Service, TeamMember, ApartmentNote, Events, User
  functions/       submitLead, changeLeadStatus, sendEmail, sendSms, startCall,
                   commsTest, commsWebhook, sendDigest, migrateLeadStatuses
  shared/          comms.ts (providers, secrets, template merge), leadFunnel.ts (statuses, rules)
  workflows/       DailyDigest
  config.jsonc     build/serve commands for Base44
public/            robots.txt, sitemap.xml
src/
  pages/           public pages + pages/admin/*
  components/      Header, Footer, Layout, AddressSearch, BuildingCard, BuildingsMap,
                   LeadDialog/LeadForm/LeadProvider, LanguageSwitcher,
                   home/*, cluster/*, admin/lead/*, admin/leads/*, admin/meetings/*, ui/*
  content/         ru.js, en.js, homepage.js
  hooks/           useBuildings, useSiteSettings, useThirdPartyTags
  lib/             i18n, seo, track, leadStatus, leadJourney, sla, mskTime, ics, price, csv,
                   khamovniki, launchDefaults, auth helpers
  App.jsx          routes
  index.css        design tokens
```

Stack: React 18 + Vite, React Router 7, Tailwind CSS + shadcn/ui, TanStack Query, react-leaflet (dark basemap, no API key), lucide-react, Base44 SDK (entities, auth, integrations, secrets), Deno for backend functions.

---

## 18. Authentication and access

- Email + password (`loginWithMfa`, with the MFA step when enabled), Google sign-in, password recovery and two-factor authentication pages.
- New users are invited from the app's **App Users** page; roles are `admin` and `user`.
- Intended model: `/admin` renders only for `role = "admin"`; lead reads are limited to the author or an admin; catalogue, settings and CRM writes are admin-only.
- **Demo mode (current state)**: the admin gate is disabled (`GATE_DISABLED` in `AdminLayout`), the backend functions accept requests without a session, and the entity RLS rules are open. This is for showcasing only.

To restore production access:

1. Set `GATE_DISABLED = false` in `src/pages/admin/AdminLayout.jsx` and wrap the `/admin` routes in `src/App.jsx` with `ProtectedRoute`.
2. Remove the "demo" bypass in `changeLeadStatus`, `sendEmail`, `sendSms`, `startCall`, `commsTest`, `sendDigest` (keep the admin-role check).
3. Tighten the entity `rls` blocks: public read for `Building`, `Service`, `SiteSettings`, `ApartmentNote`, published `TeamMember`; create-only for `Events` and `Lead`; admin-only for the CRM, communications, reports and settings entities.

---

## 19. Run locally

Use this repository to run and edit the app locally, then publish changes back through Base44. Any change pushed to the repo is reflected in the Base44 Builder.

### Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.
5. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) — the local Base44 backend runs on it.

Run `base44 --help` (or see the [CLI reference](https://docs.base44.com/developers/references/cli/commands/introduction)) for the full command surface.

### Run locally

Three commands, from the project root:

```bash
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + frontend together
```

Open the frontend URL that `base44 dev` prints (typically `http://localhost:5173`).

Notes:

- **Every fresh clone needs `base44 link`.** It writes `base44/.app.jsonc` (the app-id pointer), which is deliberately gitignored. `base44 link --help` shows the non-interactive flags.
- **`base44 dev` runs the frontend for you** (via `site.serveCommand` in `base44/config.jsonc`) — never run `npm run dev` yourself: alone it serves a UI with no backend behind it, and alongside `base44 dev` the second Vite silently takes the next port.
- **The app must be published at least once for the UI to load under `base44 dev`.**
- Entities, functions and auth run locally — entity data is **in-memory only**, wiped when `base44 dev` restarts. Core integrations and OAuth login are forwarded to the deployed app. Full breakdown: [Local development overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview).

### Frontend only, hosted backend

```bash
base44 dev --remote
```

⚠️ In this mode writes go to your app's **production data**.

### Publish your changes

After pushing to git, publish from the dashboard:

```bash
base44 dashboard open
```

This repo syncs to Base44 through git, so publish from the dashboard rather than `base44 deploy` — a CLI deploy ships your local tree directly, bypassing the sync.

---

## 20. Known limitations / next steps

- **Demo access**: admin gate and entity RLS are open — see section 18.
- **Domain**: SEO canonical, sitemap, robots and `index.html` metadata still use `https://rieltorcenter.ru`.
- **Contacts** (`SiteSettings`) are placeholders: phone, e-mail and office must be confirmed before launch.
- **Privacy policy** is a structured template — it needs company details and a legal review.
- **Real SMS, telephony and messengers**: the adapters are implemented, but production sending needs provider keys in Secrets and the webhook token configured. Telegram and WhatsApp are logged manually for now.
- **No payments and no online booking**: the site works through requests and meetings only.
- **No automated valuations** by design; the owner analysis is written by hand in the lead workspace.
- Media are stored as URLs; there is no media library beyond the photo upload in the admin.

---

## 21. Docs & support

- GitHub integration: <https://docs.base44.com/developers/app-code/local-development/github>
- Local development: <https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview>
- Support: <https://app.base44.com/support>