# ГРАНТ — Дом изнутри (Grant Agency)

A private real-estate agency website for **Moscow and the Moscow Region**: an address-first portfolio of buildings, editorial pages for owners and buyers, a services catalogue, lead capture with a small CRM, a bilingual interface (RU/EN) and an admin workspace.

- Live app: <https://grant-home-inside.base44.app>
- Русская версия этого документа: [README.ru.md](README.ru.md)

> The public interface is Russian by default; English is available through the RU/EN switch in the header.

---

## 1. What the product is

The site is built around **the building, not the listing**. Every published building has its own page with facts, editorial notes, apartment notes, photographs, video and a location map. Instead of an automated valuation the site leads to a conversation: a single lead form opens everywhere and creates a request that lands in the admin workspace and in the notification e-mail.

Three property collections are presented on the home page:

| Collection | `property_type` values | Meaning |
| --- | --- | --- |
| Offices and corporate housing | `office`, `corporate_housing` | Mansions for headquarters and executive residences |
| Apartments and penthouses | `apartment`, `penthouse` | Residences in the historic centre |
| Country houses and estates | `dacha`, `estate` | Houses and estates outside the city |

`residential` (a house as such) is also a valid type and is shown in the general list.

---

## 2. Public site

| Route | Page | What it does |
| --- | --- | --- |
| `/` | `Home` | Hero with slogan, address search, trust blocks, process steps, selected addresses, three collections, map, owner/buyer split, foundations, final CTA |
| `/search` | `Search` | Portfolio with filters, list and map views, unmatched-address capture |
| `/house/:id` | `House` | Building page: facts, features, apartment notes, gallery, video, map, lead actions |
| `/sobstvennikam` | `Owners` | For owners: questions, how the consultation works, "what we do not do", request form |
| `/pokupatelyam` | `Buyers` | For buyers: questions, pre-purchase checklist, request form |
| `/uslugi` | `Services` | Active and planned services from the database, plus a roadmap |
| `/o-nas` | `About` | Positioning, story, three pillars, public team members |
| `/kontakty` | `Contacts` | Phone, e-mail, office address and landmark, office map, request form |
| `/politika-konfidencialnosti` | `Privacy` | Privacy policy (152-FZ structure) |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/mfa` | Auth | Sign-in, sign-up with OTP, password recovery, two-factor authentication |

Only published buildings (`is_published: true`) appear on the public site.

### Address search

`AddressSearch` matches what the visitor types against the loaded buildings (address, street, district, city). A match opens the building page; anything else goes to `/search?q=…`. Both outcomes are tracked (`address_search` with `matched: true/false`).

### Search page

Filters are stored in the URL, so any view can be shared or linked from the home page collections:

`?q=` full-text · `?district=` · `?street=` · `?group=offices|residences|estates` · `?deal=sale|rent`

Views: **list** (building cards) and **map**. When nothing matches, the page offers to leave the address as a request.

### Building page

Facts at a glance (year built, floors, entrances, apartments, series/type, area, price, deal type), editorial description, feature list, apartment notes (`ApartmentNote`: layout type, area range, typical questions, liquidity note), photo gallery, video, Leaflet map, and decision buttons that open the lead form pre-filled with the building and the right request type.

---

## 3. Lead capture

One form (`LeadForm`) inside one dialog (`LeadDialog`), opened from anywhere through `LeadProvider` / `useLead()`: header CTA, hero buttons, building page, search empty state, owners/buyers/contacts pages.

Fields: request type, building address (with suggestions from the database), name, phone, preferred contact channel (phone / Telegram / WhatsApp), comment, consent checkbox.

Server-side rules (`submitLead`):

- name ≥ 2 characters, phone = 11 digits, consent must be `true`;
- hidden honeypot field — filled means a bot, answered with a silent success;
- rate limit: 5 requests per IP per 10 minutes (`429 rate_limited`);
- the address is matched to a building in the database and stored as `building_id`;
- the source is composed from UTM parameters (kept in `sessionStorage` during the session), otherwise the referrer, otherwise `direct`.

After a successful send the visitor sees a confirmation with "what happens next", and the agency receives an e-mail at `SiteSettings.admin_email`.

Request types: `owner_appraise`, `owner_sell`, `buyer_buy`, `buyer_check`, `general`.
The site does **not** produce automated valuations and says so in the form and in the footer disclaimer.

---

## 4. Admin workspace

`/admin` is protected: any signed-in user reaches the route, but the workspace renders only for `role = "admin"`; everyone else sees a "no access" screen. Every write in the database is additionally guarded by row-level security (admin-only).

| Section | Capability |
| --- | --- |
| `/admin` Dashboard | Requests of the last 7 days, totals, owners vs buyers, funnel (new → contacted → meeting → closed), substantive conversations, sources, request types |
| `/admin/leads` Leads | Filter by status/type/source/date, search by name/phone/address, inline status change, CSV export, detail panel with notes and the "substantive conversation" flag |
| `/admin/buildings` Buildings | Create/edit/delete buildings, photo upload, coordinates picker on the map, publish toggle, CSV export, CSV import (updates by address, creates new ones, reports created/updated/failed) |
| `/admin/services` Services | CRUD for services, audience, status (`active` / `planned`), display order |
| `/admin/team` Team | CRUD for team members shown on the About page |
| `/admin/settings` Settings | Phone, e-mail, office, landmark, working hours, Telegram, WhatsApp, VK, notification e-mail |
| `/admin/analytics` Analytics | Top search addresses, searches with no match, most viewed buildings (last 30 days) |

Photos uploaded in the admin are stored publicly — anyone with the link can open them — because they are shown on the public site.

---

## 5. Data model

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `Building` | The address database | `address` (unique), `city`, `district`, `street`, `house_number`, `property_type`, `deal_type`, `price`, `area`, `year_built`, `series_or_type`, `floors`, `entrances`, `apartments_count`, `description`, `features[]`, `photos[]`, `videos[]`, `latitude`, `longitude`, `is_published`, `updated_at` |
| `Lead` | Incoming requests | `type`, `building_id`, `address_text`, `name`, `phone`, `preferred_contact`, `message`, `status`, `source`, `utm_*`, `referrer`, `page_path`, `is_meaningful`, `admin_notes` |
| `Service` | Services catalogue | `title`, `short_description`, `audience`, `status`, `sort_order` |
| `TeamMember` | People on the About page | `name`, `role`, `local_bio`, `photo_url`, `is_public` |
| `SiteSettings` | Site-wide contacts | `phone`, `email`, `office_address`, `office_landmark`, `working_hours`, `telegram`, `whatsapp`, `vk`, `admin_email` |
| `Events` | Interface analytics | `event_name`, `path`, `session_id`, `building_id`, `search_query`, `matched`, `meta` |
| `ApartmentNote` | Editorial notes per building | `building_id`, `layout_type`, `area_range`, `typical_issues`, `liquidity_note` |
| `User` | Built-in platform entity | `role`: `admin` / `user` |

Access rules:

- **Public read**: `Building`, `Service`, `SiteSettings`, `ApartmentNote`, public `TeamMember`.
- **Anyone may create** a `Lead` and an `Events` record (the visitor is usually not signed in).
- **Read a lead**: its author or an admin. **Update/delete**: admin only.
- **Events read**: admin only.
- **All writes to the catalogue and settings**: admin only.

---

## 6. Backend function

`base44/functions/submitLead` — the only custom backend function:

1. Reads and validates the request body (`type`, `name`, `phone`, `preferred_contact`, `message`, `address_text`, `building_id`, `consent`, `honeypot`, UTM data).
2. Applies the honeypot and the per-IP rate limit.
3. Resolves `building_id` by id or exact address match.
4. Creates the `Lead` record with `status: "new"`.
5. Sends a notification e-mail to `SiteSettings.admin_email` (failures here never cancel the stored lead).
6. Returns `{ ok: true, id }`, or `400` (`name` / `phone` / `consent`), `429` (`rate_limited`), `500`.

---

## 7. Services catalogue

Maintained in the admin panel; the public page splits services into **Available now** and **Planned** (`status = planned` is never presented as a working service).

Current content:

| Service | Audience | Status |
| --- | --- | --- |
| Private consultation on a property | owners | active |
| Preparing a residence for sale | owners | active |
| Off-market search | buyers | active |
| Transaction support | buyers | active |
| Interior restoration | owners | planned |
| Residence management | everyone | planned |

---

## 8. Bilingual interface (RU / EN)

- Dictionaries: `src/content/ru.js`, `src/content/en.js` — one file per language, same keys.
- `src/lib/i18n.js` exposes the live `t` object, `applyLanguage()`, `dateLocale()`, `LANGS`.
- `LanguageProvider` re-mounts the tree on switch; the choice is kept in `localStorage` (`grant_lang`), Russian is the default.
- The switch lives in the header (`LanguageSwitcher`). Adding a language = one dictionary + one entry in `LANGS`.

---

## 9. SEO

- `src/lib/seo.js` sets title, description, robots, canonical, Open Graph and locale per page, plus JSON-LD (`Organization` on the site, building data on building pages).
- `applySeo` cleans up injected structured data on unmount.
- `public/sitemap.xml` and `public/robots.txt` exist; `robots.txt` disallows `/admin`, `/login`, `/register`, `/mfa`.
- Unknown routes render `PageNotFound` with a `prerender-status-code: 404` meta tag; a building page that no longer exists does the same.

⚠️ **Domain**: `SITE_URL` in `src/lib/seo.js`, the `<loc>` entries in `public/sitemap.xml`, the `Sitemap:` line in `public/robots.txt` and the canonical/OG tags in `index.html` still point at `https://rieltorcenter.ru`. Update all of them when the final domain is connected.

---

## 10. Events and analytics

`src/lib/track.js` is the single tracking entry point. It writes to the `Events` entity with a per-session id (`sessionStorage: grant_sid`) and a JSON `meta` payload; nothing here blocks the interface.

Events used: `page_view`, `address_search` (with `matched`), `building_view`, `cta_click`, `lead_submit`.

`/admin/analytics` reads the last 800 events, keeps 30 days, and shows top search queries, unmatched searches (a list of buildings worth adding) and most viewed buildings.

---

## 11. Design system

- Dark editorial theme: background `#1a2025`, surfaces `#1f272b` / `#263033`, light surface `#eee7dc`.
- Accents: crimson `#c8102e` (the `--primary` token, used for emphasis and rules) and champagne `#c9b28c` (secondary accent, links, eyebrows).
- Type: **Cormorant Garamond** for headings (`--font-heading`), **Inter** for body (`--font-body`).
- Square geometry (`--radius: 0.25rem`), hairline borders, utility classes in `src/index.css`: `.rule`, `.pulse`, `.eyebrow`, `.link-underline`, `.fade-up`.
- Tokens live in `src/index.css` and are mapped in `tailwind.config.js` — change them there, not in components.
- Responsive everywhere: the layouts are checked on phone and desktop widths.

---

## 12. Project structure

```
base44/
  entities/        Building, Lead, Service, TeamMember, SiteSettings, Events, ApartmentNote, User
  functions/       submitLead (lead intake + notification)
  config.jsonc     build/serve commands for Base44
public/            robots.txt, sitemap.xml
src/
  pages/           public pages + pages/admin/*
  components/      Header, Footer, Layout, AddressSearch, BuildingCard, BuildingsMap,
                   LeadDialog/LeadForm/LeadProvider, LanguageSwitcher, admin/BuildingForm, ui/*
  content/         ru.js, en.js
  hooks/           useBuildings, useSiteSettings
  lib/             i18n, seo, track, price, csv, sample-buildings, auth helpers
  App.jsx          routes
  index.css        design tokens
```

Stack: React 18 + Vite, React Router 7, Tailwind CSS + shadcn/ui, TanStack Query, react-leaflet (Esri dark basemap, no API key), lucide-react, Base44 SDK (entities, auth, integrations), Deno for the backend function.

---

## 13. Authentication

- Email + password (`loginWithMfa`, with the MFA step when enabled), Google sign-in, password recovery and two-factor authentication pages.
- New users are invited from the app's **App Users** page; roles are `admin` and `user`.
- Only admins can see requests, edit buildings, services, team and settings.

---

## 14. Run locally

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

## 15. Known limitations / next steps

- **Domain**: SEO canonical, sitemap, robots and `index.html` metadata still use `https://rieltorcenter.ru`.
- **Contacts** (`SiteSettings`) are placeholders: phone, e-mail and office must be confirmed before launch.
- **Privacy policy** is a structured template — it needs company details and a legal review.
- **No payments or online booking**: the site works through requests only.
- Property photographs and videos are stored as URLs; there is no media library beyond the photo upload in the admin.
- The building page has no automatic valuation by design.

---

## 16. Docs & support

- GitHub integration: <https://docs.base44.com/developers/app-code/local-development/github>
- Local development: <https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview>
- Support: <https://app.base44.com/support>