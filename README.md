# ГРАНТ — Дом изнутри (Grant Agency)

A hyperlocal real-estate agency site and back-office for **Khamovniki, Moscow**: an address-first database of buildings, editorial pages for owners and buyers, a services catalogue, and a full in-house CRM — lead funnel, communications, message sequences, meetings, tasks, documents, reports and Yandex Metrica — in a bilingual interface (RU/EN).

- Live app: <https://grant-home-inside.base44.app>
- Русская версия этого документа: [README.ru.md](README.ru.md)

> The public interface is Russian by default; English is available through the RU/EN switch in the site header and in the admin sidebar.

---

## 1. What the product is

The site is built around **the building, not the listing**, and around **one district**: Khamovniki is the first cluster the agency works in. Instead of an automated valuation the site leads to a conversation — one lead form opens everywhere and creates a request that lands in the admin CRM.

- Positioning: "Наш район. Ваша недвижимость." — local knowledge of houses, courtyards and surroundings, applied to buying and selling.
- No automated price estimates anywhere: the owner gets a human consultation, not a number.
- Editorial, quiet tone; the private-portfolio feel is preserved by publishing only selected buildings.

---

## 2. Public site

| Route | Page | What it does |
| --- | --- | --- |
| `/` | `Home` | Hero with address search, agency story, owner form, building discoverer, map, services, premium collections, video tours, contacts |
| `/search` | `Search` | Portfolio with URL-driven filters, list and map views, capture of addresses that are not in the database |
| `/house/:id` | `House` | Building page: facts, features, apartment notes, gallery, video, map, lead actions |
| `/khamovniki` | `Khamovniki` | Cluster landing page: why Khamovniki, how the work goes, limits, contact block |
| `/sobstvennikam` | `Owners` | For owners: questions, how the consultation works, "what we do not do", request form |
| `/pokupatelyam` | `Buyers` | For buyers: questions, pre-purchase checklist, request form |
| `/uslugi` | `Services` | Active and planned services from the database, plus a roadmap |
| `/o-nas` | `About` | Positioning, story, three pillars, verified claims (`Claim.is_verified`), public team members |
| `/kontakty` | `Contacts` | Phone, e-mail, office address and landmark, office map, request form |
| `/politika-konfidencialnosti` | `Privacy` | Privacy policy (152-FZ structure) |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/mfa` | Auth | Sign-in, sign-up with OTP, password recovery, two-factor authentication |
| `/admin/*` | Admin workspace | See section 4 |

Only published buildings (`is_published: true`) appear on the public site. Priority (`is_priority`) and expert-verified (`expert_verified`) buildings sort first.

### Homepage sections

`src/components/home/*`, copy in `src/content/homepage.js`:

`KhamovnikiHero` · `AgencySection` · `HelpSection` (owner / buyer paths) · `OwnerFormSection` · `BuildingsDiscoverySection` · `MapSection` · `ServicesSection` · `PremiumCollections` (offices & corporate housing, apartments & penthouses, country houses & estates) · `VideosSection` · `ContactsSection`

Featured buildings are chosen with `is_featured` and ordered by `featured_order`; the hero cover falls back to the first published building.

### Address search

`AddressSearch` matches what the visitor types against the loaded buildings (address, street, district, city). A match opens the building page; anything else goes to `/search?q=…`. Both outcomes are tracked (`address_search` with `matched: true/false`).

### Search page

Filters live in the URL, so any view can be shared: `?q=` full-text · `?district=` · `?street=` · `?group=offices|residences|estates` · `?deal=sale|rent`. Views: **list** (cards) and **map**. When nothing matches, the page offers to leave the address as a request.

### Building page

Facts at a glance (year, floors, entrances, apartments, series, area, price, deal type, ceilings, lift, metro), editorial description, features, apartment notes (`ApartmentNote`: layout type, area range, typical questions, liquidity note), photo gallery, video, Leaflet map, and decision buttons that open the lead form pre-filled with the building and the right request type.

---

## 3. Lead capture

One form (`LeadForm`) inside one dialog (`LeadDialog`), opened from anywhere through `LeadProvider` / `useLead()`: header CTA, hero buttons, building page, cluster page, search empty state, owners / buyers / contacts pages.

Fields: request type, address (with suggestions from the database), name, phone, preferred channel (phone / Telegram / WhatsApp), sell timeline, comment, consent checkbox, plus a hidden honeypot.

Request types: `owner_appraise`, `owner_sell`, `buyer_buy`, `buyer_check`, `general`, `rent`.

Server rules (`submitLead`):

- name ≥ 2 characters, phone = 11 digits, consent must be `true`;
- honeypot filled → silent success, nothing stored;
- per-IP rate limit (10-minute window) → `429 rate_limited`;
- the address is matched to a building and stored as `building_id`;
- `pipeline` (owner_sale / buyer_search / rental), `cluster` (`khamovniki` / `other`) and `person_role` (owner / buyer / tenant / other) are inferred, `area_flag` marks whether the object is inside the target cluster;
- the source comes from UTM parameters (kept in `sessionStorage` for the session), otherwise the referrer, otherwise `direct`; UTM, `referrer`, `page_path` and the Yandex Metrica **ClientID** are stored on the lead;
- the lead is created with `status: "new_inquiry"`, `consent_at`, and the first `StatusHistory` record;
- the agency is notified at `AdminSettings.default_responsible`, falling back to `SiteSettings.admin_email`.

After a successful send the visitor sees a confirmation with "what happens next".

---

## 4. Admin workspace

Routes in `src/pages/admin/*`, shell and navigation in `AdminLayout`. The sidebar is grouped by workflow: **Каждый день** (Dashboard, Today, Tasks, Requests, Pipeline), **Клиенты** (Meetings, Sequences, Reports), **Каталог** (Buildings, Services, Team), **Система** (Analytics, Metrica, Integrations, Project launch, Settings). At the bottom: "На сайт", sign-out and the signed-in e-mail; on phones the same menu opens from the header button.

### 4.1 Dashboard — `/admin`

Four priority tiers:

1. **Action Center** — SLA-overdue first responses, tasks due today / overdue (with up to three urgent tasks and a one-click "Выполнено" toggle that strikes the task through), and new enquiries without a reply.
2. **Funnel Health** — the 10-stage funnel grouped into "in progress" and "outcome", plus Khamovniki share, owners vs buyers and qualified conversations.
3. **Distribution** — two cards: requests by type and requests by source (UTM), top five with the rest folded into "other".
4. **Recent requests** — the last five enquiries with type, status and date; the type moves to its own line on phones.

### 4.2 Everything else

| Section | Capability |
| --- | --- |
| `/admin/today` | Operational list: SLA-overdue first responses with worked time, new enquiries, today's calls, today's meetings, next actions due, enquiries with no next step; filter by responsible (all / mine / backup) |
| `/admin/leads` | Single request log: table and kanban (9 funnel columns, drag to move), filters by status / type / cluster / source, date range, search by name / phone / address, CSV export (logged to the audit trail), status transition dialog |
| `/admin/pipeline` | The same kanban restricted to one pipeline (`?pipeline=owner_sale|buyer_search|rental`, stored in the URL); the pipeline list comes from the `Pipeline` entity |
| `/admin/leads/:id` | Lead workspace, six tabs: **overview** (contacts, funnel, deal value and commission, attribution, responsible and next step, journey checklist, Metrica conversion card), **communications** (timeline, quick actions, sequence suggestion), **analysis** (manual owner analysis, print, e-mail), **meetings**, **history** (status changes), **documents** |
| `/admin/meetings` | List and calendar of meetings, create / edit, results, `.ics` export per meeting |
| `/admin/reports` | Weekly / monthly reports: period metrics computed automatically, six narrative blocks, save, print / PDF, e-mail the report, send the digest now, history of saved reports |
| `/admin/tasks` | Tasks for today and overdue, "my tasks", filters by assignee / status / priority / overdue, bulk complete or cancel, lead-specific view (`?lead_id=`), create / edit, manual "send reminders" |
| `/admin/sequences` | Message sequences: per sequence and channel — auto-send toggle, delay in hours, template, active switch; 7-day send summary; "send queued" flush |
| `/admin/buildings` | Create / edit / delete, photo upload, coordinate picker on the map, publish / priority / expert flags, CSV export and import (updates by address, reports created / updated / failed) |
| `/admin/services` | CRUD for services, audience, status (`active` / `planned`), display order |
| `/admin/team` | CRUD for team members shown on the About page, photo upload |
| `/admin/analytics` | Last 30 days: top search queries, unmatched searches, most viewed buildings, qualified conversations by source and landing page, funnel conversion, owners vs buyers, inside / outside the cluster, rejection reasons, form start → submit drop-off, and a by-agent table (7 / 30 / 90 days: requests, qualified, meetings held, contracts, deals, deal sum, commission) |
| `/admin/metrica` | Yandex Metrica next to the CRM: visits, users and goal stats for 7 / 30 / 90 days or a custom range, sources joined to requests and deals, pages that produce qualified conversations |
| `/admin/integrations` | SMS and telephony providers, sender names, admin number for click-to-call and tests, provider connection status, test sends, delivery webhook address, Metrica counter / goals / token badge, editable contact details |
| `/admin/launch` | Project launch checklist in 12 groups (contract, EDO, accesses, developer, ad history, buildings, YouTube, terms, claims, backup, CRM, first-10-days plan) with statuses, owners, due dates; one-click seeding of the default list |
| `/admin/settings` | Site contacts and the notification e-mail, plus the read-only audit log (last 100 entries) |

Uploads in the admin: building photos and team photos are stored publicly (anyone with the link can open them) because they are shown on the public site; client documents are stored privately and open only through a temporary signed link.

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

- The first nine are the kanban columns; `non_target` is reached through the transition dialog with a mandatory `rejection_reason`.
- `qualified_conversation` requires the qualification checklist: owner need confirmed, object confirmed, real intent, timeframe recorded, meeting agreed, terms fit.
- `target_inquiry` for a lead with `area_flag = "outside"` also requires the checklist.
- `contract_signed` requires a contract type (`agency` / `exclusive`) and a contract link.
- Every change goes through `changeLeadStatus`, which validates the rules, stamps `first_response_at` and `qualified_at`, writes a `StatusHistory` record, and then triggers the Metrica offline conversion and the status-based message sequence (integration failures never block the status change).
- Legacy statuses (`new`, `contacted`, `qualified`, `meeting_set`, `agreement`, `closed`, `spam`) are mapped on read; `migrateLeadStatuses` migrates them in the database (dry-run by default).
- The lead workspace shows a **journey checklist** (`leadJourney`) with the steps relevant to the person's role — owner, buyer or generic.

---

## 6. First-response SLA and "Today"

`src/lib/sla.js` counts **working minutes only**: Monday–Friday inside the agency window from `AdminSettings` (default 10:00–20:00, Europe/Moscow). Target is `first_response_sla_minutes` (default 30).

- A lead with no `first_response_at`, not closed, whose worked minutes exceed the target is **overdue**.
- `/admin/today` lists overdue leads with the worked time, new enquiries, today's calls and meetings, planned next actions and leads without a next step.
- The dashboard shows the same count in the Action Center; the daily digest repeats it in the morning e-mail.

---

## 7. Tasks

`Task` records: what to do, due date and time, assignee (admin e-mail), priority (`low` / `normal` / `high`), status (`open` / `done` / `cancelled`), optional link to a lead, notes, `reminder_sent`.

- Managed on `/admin/tasks` (create, edit, bulk complete / cancel, filters, overdue flag), from the lead overview card, and on the dashboard Action Center.
- **TaskReminders** workflow runs daily at 09:30 Europe/Moscow and calls `sendTaskReminders`, which groups open tasks due today or overdue by assignee and e-mails each one; `reminder_sent` prevents repeats. The same send can be triggered by hand from `/admin/tasks`.

---

## 8. Communications hub

Every lead has a communication timeline (`Communication`: channel, direction, subject, body, status, provider id, duration, recording link, `sequence_key`).

- **Email** — `sendEmail` renders a `MessageTemplate` (placeholders `{имя}`, `{адрес}`, `{ответственный}`, `{телефон}`, `{время_встречи}`) and sends it from the lead card; built-in sending, no keys needed.
- **SMS** — `sendSms` uses the provider chosen on `/admin/integrations`: sms.ru, SMSC.ru or Twilio. Marketing texts require the client's consent.
- **Calls** — `startCall` is click-to-call: the provider rings the administrator first, then the client. Supported: Zadarma, Novofon, Telphin, Mango Office.
- **Delivery statuses** — `commsWebhook` receives provider callbacks (delivered / answered / missed / failed …) and updates the record; it is protected by a secret token and reachable at `/functions/commsWebhook?token=…`.
- **Manual logging** — a call, message or note can always be logged by hand when no provider is connected; WhatsApp works as a link plus a manual entry.
- **Sequence suggestion** — the lead card proposes a ready text for the current status and sends it in one click per channel.

Provider keys live in app **Secrets** and never reach the browser:
`SMSRU_API_ID` · `SMSC_LOGIN` + `SMSC_PASSWORD` · `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM` · `ZADARMA_KEY` + `ZADARMA_SECRET` · `NOVOFON_KEY` + `NOVOFON_SECRET` · `TELPHIN_TOKEN` · `MANGO_API_KEY` + `MANGO_API_SALT` · `COMMS_WEBHOOK_TOKEN` · `METRICA_OAUTH_TOKEN`.

---

## 9. Message sequences

`SequenceSetting` — one row per sequence and channel (`email`, `sms`, `whatsapp`) with template, auto-send, delay in hours and an active switch.

Five sequences, triggered by the lead status (`base44/shared/sequences.ts`):

| Sequence | Trigger |
| --- | --- |
| `first_reply` | status `new_inquiry` |
| `meeting_confirmation` | status `meeting_scheduled` |
| `thank_you_after_meeting` | status `meeting_held` |
| `no_answer` | status `contact_made` with no answered outbound call in the last 24 h |
| `price_analysis_followup` | status `qualified_conversation` once the owner analysis has content |

Rules:

- `first_reply` and `meeting_confirmation` are transactional and need no consent; the other three require `consent_at`.
- Outside working hours (10:00–20:00 MSK) an auto-send is queued to the next working morning instead of going out immediately.
- A delay greater than zero also queues the message; `dispatchSequences` (every 15 minutes) sends everything that is due.
- WhatsApp has no API here: the message is prepared as a link and marked as sent by hand.

---

## 10. Meetings

`Meeting` records (in the apartment, in the office, video) with date, place, responsible person, status (`planned` / `held` / `cancelled` / `no_show`) and result notes. Managed from the lead workspace and from `/admin/meetings` (calendar + list), exported as `.ics` via `src/lib/ics.js`. Scheduling a meeting moves the lead to `meeting_scheduled`; marking it held moves it to `meeting_held`. Meetings feed the dashboard, Today and the digest.

---

## 11. Documents

`Document` records belong to a lead (`contract`, `passport`, `extract`, `valuation`, `other`).

- Files are uploaded with `UploadPrivateFile` — **stored privately**: no public URL, the browser never receives a permanent link.
- `getDocumentUrl` issues a short-lived signed URL and writes `document.url_issued` to the audit log; `deleteDocument` writes `document.deleted`.
- The Documents tab on the lead card lists title, type, author, date and size, and handles open / download / delete. An external link can be stored instead of a file.

---

## 12. Audit log

`AuditLog` records who did what, read-only on `/admin/settings`: actor (admin e-mail or `demo`), action, entity, entity id, meta, timestamp. Actions written today: `document.url_issued`, `document.deleted`, `lead.exported`, `metrica.offline_conversion`, `metrica.offline_conversion_failed`.

---

## 13. Reports and the daily digest

- `/admin/reports` builds a weekly or monthly `Report`: period metrics are computed from the CRM (requests, qualified, meetings held, contracts, deals, non-target, Khamovniki share, conversion); the narrative blocks (done / implemented / checked / data / blocked / next) are typed by hand. A report can be printed to PDF, saved and sent by e-mail (`sendDigest` in `mode: "report"`).
- **Daily Digest** workflow runs every day at **09:30 Europe/Moscow** and calls `sendDigest` in `mode: "digest"`: new enquiries, SLA-overdue first responses, today's meetings and next actions, with deep links into the app.
- Recipients: `AdminSettings.admin_email`, `default_responsible`, `backup_responsible` and the app's admin users — deduplicated.
- The same digest can be triggered manually from `/admin/reports`.

---

## 14. Yandex Metrica

Configuration in `IntegrationSettings` (single record), edited on `/admin/integrations`; the OAuth token lives only in Secrets as `METRICA_OAUTH_TOKEN`.

- **Client side** — with the counter enabled, `Layout` / `useThirdPartyTags` inject the Metrica tag; `src/lib/track.js` fires the interface events, and client goals (`lead_submit`, `phone_click`, `form_start`) are sent with `ym('reachGoal')`. Goal IDs come from `IntegrationSettings.metrica_goal_ids`. The ClientID is captured on the lead, which is what makes offline conversions possible.
- **Offline conversions** — `uploadOfflineConversion` sends `qualified_conversation`, `contract_signed` and `deal_closed` by ClientID (with the deal value for a closed deal). It fires automatically from `changeLeadStatus` and can be sent by hand from the lead overview card; `Lead.offline_conversions_sent` blocks duplicates.
- **Reporting** — `fetchMetricaStats` reads the Metrica Reporting API (10-minute cache) for `/admin/metrica`; `metricaConfig` validates the counter and connection.
- Without a token the counter, goals and ClientID capture still work; only the reporting and offline conversions are unavailable.

---

## 15. Data model

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `Building` | Address database | `address` (unique), `city`, `district`, `street`, `house_number`, `property_type`, `deal_type`, `price`, `area`, `year_built`, `series_or_type`, `floors`, `entrances`, `apartments_count`, `ceilings`, `has_lift`, `metro`, `description`, `features[]`, `photos[]`, `videos[]`, `latitude`, `longitude`, `is_published`, `is_priority`, `expert_verified`, `is_featured`, `featured_order`, `neighborhood_group`, `verified_at`, `verified_by`, `source_url`, `updated_at` |
| `Lead` | Requests and the whole funnel | `type`, `pipeline`, `cluster`, `person_role`, `area_flag`, `building_id`, `address_text`, `name`, `phone`, `email`, `telegram_username`, `preferred_contact`, `message`, `status`, `rejection_reason`, `sell_timeline`, `timeframe_hint`, `intent_rating`, `agreement`, `contract_type`, `contract_url`, `deal_value`, `deal_currency`, `commission_percent`, `commission_note`, `expected_close_date`, `closed_at`, `meeting_result`, `qualified_at`, `first_response_at`, `consent_at`, `consent_text_version`, `responsible`, `next_action_date`, `next_action_note`, `client_id`, `offline_conversions_sent[]`, `is_repeat`, `tags[]`, UTM fields, `referrer`, `page_path`, `admin_notes` |
| `StatusHistory` | Funnel audit trail | `lead_id`, `from_status`, `to_status`, `changed_by`, `note` |
| `Pipeline` | Funnel definitions | `key`, `title_ru`, `title_en`, `is_active`, `sort_order` |
| `Communication` | Communication timeline | `lead_id`, `channel`, `direction`, `subject`, `body`, `status`, `provider_id`, `duration_seconds`, `recording_url`, `created_by`, `scheduled_at`, `sent_at`, `sequence_key` |
| `SequenceSetting` | Message automation | `key`, `channel`, `template_key`, `auto_send`, `delay_hours`, `is_active` |
| `Task` | To-dos with reminders | `lead_id`, `title`, `due_at`, `assignee`, `status`, `priority`, `reminder_sent`, `notes`, `created_by` |
| `Meeting` | Meetings and calendar | `lead_id`, `type`, `starts_at`, `address`, `responsible`, `status`, `result_notes` |
| `Document` | Lead files | `lead_id`, `title`, `doc_type`, `file_ref` (private `file_uri`), `external_link`, `file_size`, `uploaded_by`, `notes` |
| `AuditLog` | Sensitive-action trail | `actor`, `action`, `entity`, `entity_id`, `meta`, `at` |
| `OwnerAnalysis` | Manual owner analysis | `lead_id`, `price_range_note`, `liquidity`, `competitors`, `long_sale_reasons`, `market_risks`, `objections_and_answers`, `recommended_strategy` |
| `MessageTemplate` | Message templates | `channel`, `name`, `subject`, `body` |
| `RejectionReason` | Reasons for non-target | `label`, `is_active`, `sort_order` |
| `Report` | Weekly/monthly reports | `period_type`, `period_start`, `period_end`, `metrics`, `done_text`, `implemented_text`, `checked_text`, `data_text`, `blocked_text`, `next_text`, `sent_at`, `author` |
| `LaunchItem` | Launch checklist | `group`, `title`, `status`, `owner`, `due_date`, `notes`, `sort_order` |
| `Claim` | Verifiable agency claims | `text`, `is_verified`, `proof_note`, `approved_by` |
| `AdminSettings` | Internal rules (single record) | `target_districts`, `target_streets[]`, `first_response_sla_minutes`, `working_hours_start` / `working_hours_end`, `timezone`, `default_responsible`, `backup_responsible`, `sms_provider`, `sms_sender`, `telephony_provider`, `call_first_number`, `email_from_name`, `comms_webhook_path`, `digest_enabled` |
| `IntegrationSettings` | Metrica and GSC (single record) | `metrica_counter_id`, `metrica_goal_ids`, `metrica_enabled`, `gsc_verification`, `updated_at` |
| `SiteSettings` | Public contacts (single record) | `phone`, `email`, `office_address`, `office_landmark`, `working_hours`, `telegram`, `whatsapp`, `vk`, `admin_email`, `metrica_counter_id`, `gsc_verification` |
| `Service` | Services catalogue | `title`, `short_description`, `audience`, `status`, `sort_order` |
| `TeamMember` | People on the About page | `name`, `role`, `local_bio`, `photo_url`, `is_public` |
| `ApartmentNote` | Editorial notes per building | `building_id`, `layout_type`, `area_range`, `typical_issues`, `liquidity_note` |
| `Events` | Interface analytics | `event_name`, `path`, `session_id`, `building_id`, `search_query`, `matched`, `meta` |
| `User` | Built-in platform entity | `role`: `admin` / `user` |

> ⚠️ **Access rules**: while the app is in demo mode the admin gate is disabled and row-level security on the entities is open. Before going live, restore the admin gate and the RLS rules described in section 20.

---

## 16. Backend functions

All in `base44/functions/*/entry.ts`; shared logic in `base44/shared/*` (`leadFunnel.ts`, `comms.ts`, `sequences.ts`, `metrica.ts`, `audit.ts`, `guards.ts`).

| Function | Purpose |
| --- | --- |
| `submitLead` | Public lead intake: validation, honeypot, rate limit, building match, pipeline / cluster / role inference, ClientID and UTM capture, `StatusHistory`, notification e-mail |
| `changeLeadStatus` | Server-side funnel rules: checklist, contract, rejection reason, timestamps, history, then Metrica conversion and sequence trigger |
| `sendEmail` | E-mail to the client from the lead card: template merge, `Communication` record |
| `sendSms` | SMS via the chosen provider, consent-aware, `Communication` record |
| `startCall` | Click-to-call: administrator first, then the client |
| `commsTest` | Provider status and test sends for `/admin/integrations` |
| `commsWebhook` | Delivery and call-status callbacks, protected by `COMMS_WEBHOOK_TOKEN` |
| `dispatchSequences` | Sends the queue of delayed and after-hours sequence messages |
| `sendTaskReminders` | Groups open tasks due today or overdue by assignee and e-mails each one |
| `sendDigest` | Daily digest (`mode: "digest"`) or a saved report (`mode: "report"`) to the admins |
| `getDocumentUrl` | Short-lived signed URL for a private document + audit entry |
| `deleteDocument` | Deletes a document record and its audit entry |
| `metricaConfig` | Reads and saves Metrica settings, reports whether the token is present, checks the counter |
| `fetchMetricaStats` | Metrica reporting for `/admin/metrica` (visits, users, goals, sources, pages, devices) |
| `uploadOfflineConversion` | Sends an offline conversion by ClientID (qualified / contract / deal) |
| `logLeadExport` | Writes the CSV export of the request log to the audit trail |
| `migrateLeadStatuses` | Migrates legacy lead statuses to the 10-stage funnel (dry-run by default) |
| `backfillLeadPipeline` | Fills the empty `pipeline` on existing leads by request type (dry-run by default) |

---

## 17. Workflows

| Workflow | Schedule | What it does |
| --- | --- | --- |
| `DailyDigest` | Every day 09:30 Europe/Moscow | `sendDigest` in `mode: "digest"` |
| `TaskReminders` | Every day 09:30 Europe/Moscow | `sendTaskReminders`: open tasks due today and overdue |
| `SequenceDispatcher` | Every 15 minutes | `dispatchSequences`: delayed and after-hours sequence messages |

Runs and their graphs are visible in the dashboard's Workflows tab.

---

## 18. Bilingual interface (RU / EN)

- Dictionaries: `src/content/ru.js`, `src/content/en.js` — one file per language, same keys; homepage copy in `src/content/homepage.js`.
- `src/lib/i18n.js` exposes the live `t` object, `applyLanguage()`, `dateLocale()`, `LANGS`.
- `LanguageProvider` re-mounts the tree on switch; the choice is kept in `localStorage` (`grant_lang`), Russian is the default.
- The switch lives in the site header and in the admin sidebar (`LanguageSwitcher`). Adding a language = one dictionary + one entry in `LANGS`.

---

## 19. SEO

- `src/lib/seo.js` sets title, description, robots, canonical, Open Graph and locale per page, plus JSON-LD (`Organization` on the site, building data on building pages); `applySeo` cleans up injected structured data on unmount. `*.base44.app` hosts are forced to `noindex`.
- `public/sitemap.xml` and `public/robots.txt` exist; `robots.txt` disallows `/admin`, `/login`, `/register`, `/mfa`.
- Unknown routes render `PageNotFound` with a `prerender-status-code: 404` meta tag; a building page that no longer exists does the same.

⚠️ **Domain**: `SITE_URL` in `src/lib/seo.js`, the `<loc>` entries in `public/sitemap.xml`, the `Sitemap:` line in `public/robots.txt` and the canonical / OG tags in `index.html` still point at `https://rieltorcenter.ru`. Update all of them when the final domain is connected.

---

## 20. Events and analytics

`src/lib/track.js` is the single tracking entry point. It writes to the `Events` entity with a per-session id (`sessionStorage: grant_sid`) and a JSON `meta` payload; nothing blocks the interface.

Events: `page_view`, `address_search` (with `matched`), `building_view`, `cta_click`, `lead_submit`, `form_start`, `form_submit_success`, `phone_click`, `telegram_click`, `whatsapp_click`.

`/admin/analytics` reads the last 800 events for the last 30 days and shows top search queries, unmatched searches (buildings worth adding), most viewed buildings, qualified conversations by source and page, funnel conversion, owner / buyer split, cluster share, rejection reasons and form drop-off; the by-agent table uses 7 / 30 / 90-day presets.

---

## 21. Design system

- Warm dark editorial theme: base `#2D2A26`, cards `#37342F`-range surfaces, light paper `#EDECE8`, text `#FAF9F6`.
- Accents: terracotta `#8E4A49` (`--primary` — buttons, rules, active states) and sand `#D4A373` (`--accent` — eyebrows, links, highlights).
- Type: **Cormorant Garamond** (`--font-heading`), **Montserrat** (`--font-body`), **JetBrains Mono** (`--font-mono`).
- Square geometry (`--radius: 0.25rem`), hairline borders, utilities in `src/index.css`: `.rule`, `.pulse`, `.eyebrow`, `.link-underline`, `.fade-up`, `.metrica-dot`.
- Tokens live in `src/index.css` and are mapped in `tailwind.config.js`; legacy hex utilities are aliased to the tokens there, so the palette changes in one place.
- Responsive everywhere; dashboards and the admin sidebar are checked at phone and desktop widths.

---

## 22. Project structure

```
base44/
  entities/        24 schemas: Building, Lead, StatusHistory, Pipeline, Communication,
                   SequenceSetting, Task, Meeting, Document, AuditLog, OwnerAnalysis,
                   MessageTemplate, RejectionReason, Report, LaunchItem, Claim,
                   AdminSettings, IntegrationSettings, SiteSettings, Service,
                   TeamMember, ApartmentNote, Events, User
  functions/       submitLead, changeLeadStatus, sendEmail, sendSms, startCall, commsTest,
                   commsWebhook, dispatchSequences, sendTaskReminders, sendDigest,
                   getDocumentUrl, deleteDocument, metricaConfig, fetchMetricaStats,
                   uploadOfflineConversion, logLeadExport, migrateLeadStatuses,
                   backfillLeadPipeline
  shared/          leadFunnel.ts, comms.ts, sequences.ts, metrica.ts, audit.ts, guards.ts
  workflows/       DailyDigest, TaskReminders, SequenceDispatcher
  config.jsonc     build / serve commands for Base44
public/            robots.txt, sitemap.xml
src/
  pages/           public pages + pages/admin/*
  components/      Header, Footer, Layout, AddressSearch, BuildingCard, BuildingsMap,
                   LeadDialog / LeadForm / LeadProvider, LanguageSwitcher, home/*, cluster/*,
                   admin/dashboard/*, admin/lead/*, admin/leads/*, admin/meetings/*,
                   admin/tasks/*, admin/today/*, admin/metrica/*, admin/analytics/*, ui/*
  content/         ru.js, en.js, homepage.js
  hooks/           useBuildings, useSiteSettings, useThirdPartyTags
  lib/             i18n, seo, track, leadStatus, leadJourney, pipeline, deal, tasks, sla,
                   mskTime, ics, price, csv, documents, metricaConfig, sequences,
                   launchDefaults, agentStats, auth helpers
  App.jsx          routes
  index.css        design tokens
```

Stack: React 18 + Vite, React Router 7, Tailwind CSS + shadcn/ui, TanStack Query, react-leaflet (dark basemap, no API key), recharts, lucide-react, Base44 SDK (entities, auth, integrations, secrets), Deno for backend functions.

---

## 23. Authentication and access

- Email + password (`loginWithMfa`, with the MFA step when enabled), Google sign-in, password recovery and two-factor authentication pages.
- New users are invited from the app's **App Users** page; roles are `admin` and `user`.
- Intended model: `/admin` renders only for `role = "admin"`; lead reads are limited to the author or an admin; catalogue, settings and CRM writes are admin-only.
- **Demo mode (current state)**: the admin gate is disabled (`GATE_DISABLED` in `AdminLayout`), `requireAdminOrDemo` accepts requests without a session, and the entity RLS rules are open. This is for showcasing only.

To restore production access:

1. Set `GATE_DISABLED = false` in `src/pages/admin/AdminLayout.jsx` and wrap the `/admin` routes in `src/App.jsx` with `ProtectedRoute`.
2. Replace the demo body of `requireAdminOrDemo` in `base44/shared/guards.ts` with a strict `user.role === "admin"` check — every admin function calls it.
3. Tighten the entity `rls` blocks: public read for `Building`, `Service`, `SiteSettings`, `ApartmentNote`, published `TeamMember`; create-only for `Events` and `Lead`; admin-only for the CRM, communications, documents, tasks, reports, audit and settings entities.

---

## 24. Run locally

Use this repository to run and edit the app locally, then publish changes through Base44. Any change pushed to the repo is reflected in the Base44 Builder.

### Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.
5. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) — the local Base44 backend runs on it.

Run `base44 --help` (or see the [CLI reference](https://docs.base44.com/developers/references/cli/commands/introduction)) for the full command surface.

### Run locally

```bash
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + frontend together
```

Open the frontend URL that `base44 dev` prints (typically `http://localhost:5173`).

Notes:

- **Every fresh clone needs `base44 link`.** It writes `base44/.app.jsonc` (the app-id pointer), which is deliberately gitignored.
- **`base44 dev` runs the frontend for you** (via `site.serveCommand` in `base44/config.jsonc`) — never run `npm run dev` yourself.
- **The app must be published at least once for the UI to load under `base44 dev`.**
- Entities, functions and auth run locally — entity data is **in-memory only**, wiped when `base44 dev` restarts. Core integrations and OAuth login are forwarded to the deployed app.

### Frontend only, hosted backend

```bash
base44 dev --remote
```

⚠️ In this mode writes go to your app's **production data**.

### Publish your changes

After pushing to git, publish from the dashboard (`base44 dashboard open`) — the repo syncs through git, so a CLI deploy would ship the local tree directly.

---

## 25. Known limitations / next steps

- **Demo access**: admin gate and entity RLS are open — see section 23.
- **Domain**: SEO canonical, sitemap, robots and `index.html` metadata still use `https://rieltorcenter.ru`.
- **Contacts** (`SiteSettings`) are placeholders: phone, e-mail and office must be confirmed before launch.
- **Privacy policy** is a structured template — it needs company details and a legal review.
- **Real SMS, telephony and messengers**: adapters are implemented, production sending needs provider keys in Secrets and the webhook token. WhatsApp has no API — it works as a link plus manual logging.
- **Metrica**: reporting and offline conversions require `METRICA_OAUTH_TOKEN`; the counter, goals and ClientID capture work without it.
- **E-mail to non-registered addresses** requires a connected custom domain on a paid plan; until then only registered app users receive mail.
- **No payments and no online booking**: the site works through requests and meetings only.
- **No automated valuations** by design; the owner analysis is written by hand in the lead workspace.
- Media are stored as URLs; building and team photos are uploaded from the admin, client documents go to private storage.

---

## 26. Docs & support

- GitHub integration: <https://docs.base44.com/developers/app-code/local-development/github>
- Local development: <https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview>
- Support: <https://app.base44.com/support>