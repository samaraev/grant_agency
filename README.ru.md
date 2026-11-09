# ГРАНТ — Дом изнутри

Сайт гиперлокального агентства недвижимости и рабочий кабинет для **Хамовников (Москва)**: справочник домов по адресам, редакционные страницы для собственников и покупателей, каталог услуг, приём обращений с полной воронкой CRM, центр коммуникаций, встречи, отчёты, двуязычный интерфейс (RU/EN) и админ-раздел.

- Опубликованное приложение: <https://grant-home-inside.base44.app>
- English version of this document: [README.md](README.md)

> Публичный интерфейс по умолчанию русский, английский включается переключателем RU/EN в шапке сайта и в боковом меню админки.

---

## 1. Что это за продукт

Сайт построен вокруг **дома, а не объявления**, и вокруг **одного района**: Хамовники — первый кластер агентства. Вместо автоматической оценки — разговор: единая форма обращения открывается в любом месте сайта, создаёт заявку, которая попадает в CRM админки и на почту агентства.

- Позиционирование: «Наш район. Ваша недвижимость.» — знание домов, дворов и окружения, приложенное к покупке и продаже.
- Автоматических оценок стоимости нет нигде: собственник получает консультацию человека, а не цифру.
- Редакционный, спокойный тон; ощущение частного портфолио сохраняется за счёт публикации только избранных домов.

---

## 2. Публичная часть сайта

| Маршрут | Страница | Что делает |
| --- | --- | --- |
| `/` | `Home` | Главная 3.1: hero по Хамовникам с поиском адреса, история агентства, «чем помогаем», форма собственника, справочник домов, карта, услуги, коллекции, видео, контакты |
| `/search` | `Search` | Портфолио: фильтры в URL, список и карта, приём адреса, которого нет в базе |
| `/house/:id` | `House` | Страница дома: факты, особенности, заметки по квартирам, галерея, видео, карта, действия с обращением |
| `/khamovniki` | `Khamovniki` | Страница кластера: почему Хамовники, как идёт работа, границы, контактный блок, дома кластера |
| `/sobstvennikam` | `Owners` | Собственникам: вопросы, как проходит консультация, «чего мы не делаем», форма обращения |
| `/pokupatelyam` | `Buyers` | Покупателям: вопросы, чек-лист перед покупкой, форма обращения |
| `/uslugi` | `Services` | Услуги из базы (доступные и планируемые) и дорожная карта |
| `/o-nas` | `About` | Позиционирование, история, три опоры, проверенные утверждения (`Claim` с `is_verified`), публичная команда |
| `/kontakty` | `Contacts` | Телефон, почта, адрес офиса и ориентир, карта офиса, форма обращения |
| `/politika-konfidencialnosti` | `Privacy` | Политика обработки персональных данных (структура по 152-ФЗ) |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/mfa` | Авторизация | Вход, регистрация с кодом, восстановление пароля, двухфакторная аутентификация |
| `/admin/*` | Админ-раздел | См. раздел 4 |

На публичной части видны только опубликованные дома (`is_published: true`). Приоритетные (`is_priority`) и проверенные экспертом (`expert_verified`) дома идут первыми.

### Блоки главной страницы

`src/components/home/*`, тексты — в `src/content/homepage.js`:

`KhamovnikiHero` · `AgencySection` (местные корни, история с 1994 года) · `HelpSection` (пути собственника и покупателя) · `OwnerFormSection` · `BuildingsDiscoverySection` · `MapSection` · `ServicesSection` · `PremiumCollections` (офисы и корпоративное жильё, квартиры и пентхаусы, загородные дома и усадьбы) · `VideosSection` · `ContactsSection`

Избранные дома на главной выбираются флагом `is_featured` и сортируются по `featured_order`; обложка hero берёт первый опубликованный дом, если избранных нет.

### Поиск по адресу

`AddressSearch` сравнивает введённое с загруженными домами (адрес, улица, район, город). Совпадение открывает страницу дома, всё остальное уходит на `/search?q=…`. Оба исхода логируются (`address_search` с `matched: true/false`).

### Страница поиска

Фильтры хранятся в URL — любую выборку можно дать ссылкой:

`?q=` полнотекст · `?district=` · `?street=` · `?group=offices|residences|estates` · `?deal=sale|rent`

Представления: **список** (карточки домов) и **карта**. Если ничего не нашлось, страница предлагает оставить адрес заявкой.

### Страница дома

Факты (год постройки, этажи, подъезды, число квартир, серия/тип, площадь, цена, тип сделки, потолки, лифт, метро), редакционное описание, особенности, заметки по квартирам (`ApartmentNote`: тип планировки, диапазон площади, типичные вопросы, заметка о ликвидности), галерея, видео, карта Leaflet и кнопки решений, открывающие форму с уже подставленным домом и нужным типом запроса.

---

## 3. Приём обращений

Одна форма (`LeadForm`) в одном диалоге (`LeadDialog`), открывается из любого места через `LeadProvider` / `useLead()`: кнопка в шапке, кнопки в hero, страница дома, страница кластера, пустой результат поиска, страницы собственникам/покупателям/контактам.

Поля: тип обращения, адрес (с подсказками из базы), имя, телефон, удобный канал связи (звонок / Telegram / WhatsApp), сроки продажи, комментарий, согласие на обработку данных и скрытое поле-ловушка.

Типы обращений: `owner_appraise`, `owner_sell`, `buyer_buy`, `buyer_check`, `general`, `rent`.
Сайт **не** считает автоматическую оценку и говорит об этом в форме и в дисклеймере подвала.

Правила на сервере (`submitLead`):

- имя не короче 2 символов, телефон — 11 цифр, согласие обязательно (`true`);
- ловушка заполнена → «успех» без записи;
- ограничение частоты по IP (окно 10 минут) → `429 rate_limited`;
- адрес сопоставляется с домом в базе и сохраняется как `building_id`;
- определяются кластер (`khamovniki` / `other`) и роль человека (собственник / покупатель / арендатор / другое), `area_flag` отмечает, внутри ли объект целевого кластера;
- источник собирается из UTM-меток (хранятся в `sessionStorage` в рамках сессии), иначе referrer, иначе `direct`;
- обращение создаётся со статусом `new_inquiry`, датой согласия и первой записью в `StatusHistory`;
- агентство получает письмо на `AdminSettings.default_responsible`, иначе на `SiteSettings.admin_email`.

После отправки человек видит подтверждение и «что будет дальше».

---

## 4. Админ-раздел

Маршруты — `/admin` в `src/pages/admin/*`, навигация — в `AdminLayout`.

| Раздел | Возможности |
| --- | --- |
| `/admin` Дашборд | Обращения за 7 дней и всего, собственники и покупатели, доля Хамовников, счётчик просроченного SLA, квалифицированные разговоры, воронка из 10 ступеней, типы запросов, источники |
| `/admin/today` «Сегодня» | Что требует ответа сейчас: просрочен первый ответ, новые обращения, звонки сегодня, встречи сегодня, следующие действия на дату, обращения без следующего шага, фильтр по ответственному (мои / резерв / все) |
| `/admin/leads` Обращения | Таблица и канбан (9 колонок воронки, перенос перетаскиванием), фильтры по статусу/типу/кластеру/источнику, поиск по имени, телефону, адресу, экспорт CSV, диалог смены статуса |
| `/admin/leads/:id` Карточка обращения | Полноэкранная карточка с пятью вкладками: обзор (контакты, воронка, атрибуция, ответственный и следующий шаг, чек-лист пути), коммуникации, анализ, встречи, история |
| `/admin/meetings` Встречи | Календарь и список, создание и редактирование, итоги, экспорт `.ics` |
| `/admin/reports` Отчёты | Недельный и месячный отчёт: цифры считаются автоматически (обращения, квалификации, проведённые встречи, договоры, сделки, нецелевые, Хамовники, конверсия), пять текстовых блоков, сохранение, печать/PDF, отправка отчёта на почту, отправка дайджеста сейчас, история отчётов |
| `/admin/buildings` Дома | Создание, редактирование, удаление, загрузка фото, выбор координат на карте, флаги публикации / приоритета / проверки, экспорт CSV и импорт CSV (обновляет по адресу, создаёт новые, отчитывается по created/updated/failed) |
| `/admin/services` Услуги | CRUD услуг, аудитория, статус (`active` / `planned`), порядок вывода |
| `/admin/team` Команда | CRUD участников, показываемых на странице «О нас» |
| `/admin/analytics` Аналитика | Топ поисковых запросов, поиски без совпадения, самые просматриваемые дома (30 дней, последние 800 событий) |
| `/admin/integrations` Интеграции | Выбор SMS-провайдера и провайдера телефонии, подписи отправителя, номер администратора для звонка и тестов, статус подключения, тестовые отправки, адрес вебхука; ключи хранятся в Secrets и не отображаются |
| `/admin/launch` Чек-лист запуска | Этапы запуска проекта в 12 блоках (договор, ЭДО, доступы, разработчик, история рекламы, дома, YouTube, условия, утверждения, бэкап, CRM, план первых 10 дней) со статусами, ответственными и сроками; заполнение шаблоном в один клик |
| `/admin/settings` Настройки | Телефон, почта, офис, ориентир, часы работы, Telegram, WhatsApp, VK, почта для уведомлений |

Фотографии из админки хранятся публично — открыть по ссылке может любой, — потому что они показываются на публичном сайте.

---

## 5. Воронка обращений

Десять статусов (`src/lib/leadStatus.js`, зеркально на сервере в `base44/shared/leadFunnel.ts`):

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

Правила:

- Первые девять статусов — колонки канбана; `non_target` ставится через диалог смены статуса с обязательной причиной отказа.
- `qualified_conversation` требует чек-листа квалификации: подтверждена потребность собственника, подтверждён объект, реальное намерение, зафиксирован срок, согласована встреча, условия подходят.
- `target_inquiry` для обращения с `area_flag = "outside"` тоже требует чек-листа.
- `contract_signed` требует типа договора (`agency` / `exclusive`) и ссылки на договор.
- Любая смена идёт через `changeLeadStatus`: сервер проверяет правила, проставляет `first_response_at` и `qualified_at` и пишет запись в `StatusHistory`.
- Устаревшие статусы (`new`, `contacted`, `qualified`, `meeting_set`, `agreement`, `closed`, `spam`) распознаются при чтении; `migrateLeadStatuses` переносит их в базе (по умолчанию — пробный прогон).
- В карточке обращения показывается **чек-лист пути** (`leadJourney`) с шагами для роли человека — собственник, покупатель или общий сценарий.

---

## 6. Норматив первого ответа и «Сегодня»

`src/lib/sla.js` считает **только рабочие минуты**: понедельник–пятница внутри окна из `AdminSettings` (по умолчанию 10:00–20:00, Europe/Moscow). Норматив — `first_response_sla_minutes` (по умолчанию 30 минут).

- Обращение без `first_response_at`, не закрытое и с превышением рабочих минут считается **просроченным**.
- `/admin/today` показывает просроченные обращения с затраченным временем, новые обращения, звонки и встречи на сегодня, запланированные следующие действия и обращения без следующего шага, плюс фильтр по ответственному.
- Дашборд показывает тот же счётчик, а утренний дайджест повторяет его в письме.

---

## 7. Центр коммуникаций

У каждого обращения есть лента коммуникаций (`Communication`: канал, направление, тема, текст, статус, id у провайдера, длительность звонка, ссылка на запись).

- **Почта** — `sendEmail` собирает письмо по `MessageTemplate` (подстановки `{имя}`, `{адрес}`, `{ответственный}`, `{время_встречи}`) и отправляет из карточки; встроенная отправка, ключи не нужны.
- **SMS** — `sendSms` через провайдера, выбранного в `/admin/integrations`: sms.ru, SMSC.ru или Twilio. Маркетинговые тексты — только при наличии согласия.
- **Звонки** — `startCall` работает как click-to-call: провайдер сначала звонит администратору, затем клиенту. Поддержаны Zadarma, Novofon, Telphin, Mango Office.
- **Статусы доставки** — `commsWebhook` принимает колбэки провайдеров (доставлено / отвечено / пропущено / ошибка …) и обновляет запись; защищён секретным токеном и доступен по адресу `/functions/commsWebhook?token=…`.
- **Ручная фиксация** — звонок, сообщение или заметку всегда можно записать вручную, если провайдер не подключён.

Ключи провайдеров хранятся в **секретах** приложения и не попадают в браузер:
`SMSRU_API_ID` · `SMSC_LOGIN` + `SMSC_PASSWORD` · `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM` · `ZADARMA_KEY` + `ZADARMA_SECRET` · `NOVOFON_KEY` + `NOVOFON_SECRET` · `TELPHIN_TOKEN` · `MANGO_API_KEY` + `MANGO_API_SALT` · `COMMS_WEBHOOK_TOKEN`.

---

## 8. Встречи

Записи `Meeting` (в квартире, в офисе, по видео) с датой, местом, ответственным, статусом (`planned` / `held` / `cancelled` / `no_show`) и итогами. Ведутся из вкладки карточки обращения и из `/admin/meetings` (календарь и список), экспортируются в `.ics` через `src/lib/ics.js`. Назначенные встречи попадают на дашборд, в «Сегодня» и в дайджест.

---

## 9. Отчёты и ежедневный дайджест

- `/admin/reports` собирает недельный или месячный `Report`: цифры периода считаются из CRM, пять текстовых блоков заполняются вручную. Отчёт можно распечатать в PDF, сохранить и отправить на почту (`sendDigest` в режиме `mode: "report"`).
- Сценарий **Daily Digest** запускается каждый день в **09:30 Europe/Moscow** и вызывает `sendDigest` в режиме `mode: "digest"`: новые обращения, просроченный первый ответ, встречи на сегодня и следующие действия, со ссылками внутрь приложения.
- Получатели: `AdminSettings.admin_email`, `default_responsible`, `backup_responsible` и администраторы приложения — без дублей, не более пяти адресов.
- Тот же дайджест можно отправить вручную из `/admin/reports`.

---

## 10. Модель данных

| Сущность | Назначение | Ключевые поля |
| --- | --- | --- |
| `Building` | База адресов | `address` (уникальный), `city`, `district`, `street`, `house_number`, `property_type`, `deal_type`, `price`, `area`, `year_built`, `series_or_type`, `floors`, `entrances`, `apartments_count`, `ceilings`, `has_lift`, `metro`, `description`, `features[]`, `photos[]`, `videos[]`, `latitude`, `longitude`, `is_published`, `is_priority`, `expert_verified`, `is_featured`, `featured_order`, `neighborhood_group`, `verified_at`, `verified_by`, `source_url`, `updated_at` |
| `Lead` | Обращения и вся воронка | `type`, `cluster`, `person_role`, `area_flag`, `building_id`, `address_text`, `name`, `phone`, `email`, `telegram_username`, `preferred_contact`, `message`, `status`, `rejection_reason`, `sell_timeline`, `timeframe_hint`, `intent_rating`, `agreement`, `contract_type`, `contract_url`, `meeting_result`, `qualified_at`, `first_response_at`, `consent_at`, `consent_text_version`, `responsible`, `next_action_date`, `next_action_note`, `client_id`, `is_repeat`, `tags[]`, UTM-поля, `page_path`, `admin_notes` |
| `StatusHistory` | История воронки | `lead_id`, `from_status`, `to_status`, `changed_by`, `note` |
| `Communication` | Лента коммуникаций | `lead_id`, `channel`, `direction`, `subject`, `body`, `status`, `provider_id`, `duration_seconds`, `recording_url`, `created_by` |
| `Meeting` | Встречи и календарь | `lead_id`, `type`, `starts_at`, `address`, `responsible`, `status`, `result_notes` |
| `OwnerAnalysis` | Ручной анализ объекта | `lead_id`, `price_range_note`, `liquidity`, `competitors`, `long_sale_reasons`, `market_risks`, `objections_and_answers`, `recommended_strategy` |
| `MessageTemplate` | Шаблоны сообщений | `channel`, `name`, `subject`, `body` |
| `RejectionReason` | Причины отказа | `label`, `is_active`, `sort_order` |
| `Report` | Недельные и месячные отчёты | `period_type`, `period_start`, `period_end`, `metrics`, `done_text`, `implemented_text`, `checked_text`, `data_text`, `blocked_text`, `next_text`, `sent_at`, `author` |
| `LaunchItem` | Чек-лист запуска | `group`, `title`, `status`, `owner`, `due_date`, `notes`, `sort_order` |
| `Claim` | Проверяемые утверждения об агентстве | `text`, `is_verified`, `proof_note`, `approved_by` |
| `AdminSettings` | Внутренние правила (одна запись) | `target_districts`, `target_streets[]`, `first_response_sla_minutes`, `working_hours_start` / `working_hours_end`, `timezone`, `default_responsible`, `backup_responsible`, `sms_provider`, `sms_sender`, `telephony_provider`, `call_first_number`, `email_from_name`, `comms_webhook_path`, `digest_enabled` |
| `SiteSettings` | Публичные контакты (одна запись) | `phone`, `email`, `office_address`, `office_landmark`, `working_hours`, `telegram`, `whatsapp`, `vk`, `admin_email`, `metrica_counter_id`, `gsc_verification` |
| `Service` | Каталог услуг | `title`, `short_description`, `audience`, `status`, `sort_order` |
| `TeamMember` | Люди на странице «О нас» | `name`, `role`, `local_bio`, `photo_url`, `is_public` |
| `ApartmentNote` | Редакционные заметки по домам | `building_id`, `layout_type`, `area_range`, `typical_issues`, `liquidity_note` |
| `Events` | Аналитика интерфейса | `event_name`, `path`, `session_id`, `building_id`, `search_query`, `matched`, `meta` |
| `User` | Встроенная сущность платформы | `role`: `admin` / `user` |

> ⚠️ **Права доступа**: пока приложение работает в демонстрационном режиме, вход в админку отключён, а правила доступа (RLS) на сущностях открыты. Перед запуском верните ограничения из раздела 18.

---

## 11. Серверные функции

Все — в `base44/functions/*/entry.ts`, общая логика — в `base44/shared/comms.ts` и `base44/shared/leadFunnel.ts`.

| Функция | Назначение |
| --- | --- |
| `submitLead` | Приём обращений: валидация, ловушка, лимит по IP, подбор дома, кластер и роль, `StatusHistory`, письмо-уведомление |
| `changeLeadStatus` | Серверные правила воронки: чек-лист, договор, причина отказа, отметки времени, история |
| `sendEmail` | Письмо клиенту из карточки: подстановки шаблона, запись в коммуникации |
| `sendSms` | SMS через выбранного провайдера с учётом согласия, запись в коммуникации |
| `startCall` | Click-to-call: сначала администратор, затем клиент |
| `commsTest` | Состояние провайдеров и тестовые отправки для `/admin/integrations` |
| `commsWebhook` | Колбэки доставки и звонков, защищён `COMMS_WEBHOOK_TOKEN` |
| `sendDigest` | Ежедневный дайджест (`mode: "digest"`) или сохранённый отчёт (`mode: "report"`) администраторам |
| `migrateLeadStatuses` | Перенос старых статусов обращений на воронку из 10 ступеней (по умолчанию — пробный прогон) |

---

## 12. Сценарии (workflows)

`base44/workflows/DailyDigest.jsonc` — запуск каждый день в **09:30 Europe/Moscow**, один шаг: вызов `sendDigest` с `mode: "digest"`. Запуски и их граф видны на вкладке «Workflows» в дашборде.

---

## 13. Двуязычный интерфейс (RU / EN)

- Словари: `src/content/ru.js`, `src/content/en.js` — один файл на язык, одинаковые ключи; тексты главной — в `src/content/homepage.js`.
- `src/lib/i18n.js` отдаёт живой объект `t`, `applyLanguage()`, `dateLocale()`, `LANGS`.
- `LanguageProvider` перемонтирует дерево при переключении; выбор хранится в `localStorage` (`grant_lang`), по умолчанию — русский.
- Переключатель — в шапке сайта и в боковом меню админки (`LanguageSwitcher`). Новый язык = один словарь + одна запись в `LANGS`.

---

## 14. SEO

- `src/lib/seo.js` задаёт title, description, robots, canonical, Open Graph, локаль и JSON-LD (`Organization` для сайта, данные дома на странице дома).
- `applySeo` убирает вставленные структурированные данные при размонтировании.
- Есть `public/sitemap.xml` и `public/robots.txt`; в `robots.txt` закрыты `/admin`, `/login`, `/register`, `/mfa`.
- Неизвестный маршрут отдаёт `PageNotFound` с мета-тегом `prerender-status-code: 404`; так же ведёт себя страница удалённого дома.

⚠️ **Домен**: `SITE_URL` в `src/lib/seo.js`, адреса в `public/sitemap.xml`, строка `Sitemap:` в `public/robots.txt` и canonical/OG в `index.html` всё ещё указывают на `https://rieltorcenter.ru`. Их нужно обновить, когда будет подключён финальный домен.

---

## 15. События и аналитика

`src/lib/track.js` — единая точка трекинга. Пишет в сущность `Events` с идентификатором сессии (`sessionStorage: grant_sid`) и JSON в `meta`; интерфейс трекинг не блокирует.

Используемые события: `page_view`, `address_search` (с `matched`), `building_view`, `cta_click`, `lead_submit`, `form_start`, `form_submit_success`, `phone_click`, `telegram_click`, `whatsapp_click`.

`/admin/analytics` читает последние 800 событий, оставляет 30 дней и показывает топ поисковых запросов, поиски без совпадения (список адресов, которые стоит добавить) и самые просматриваемые дома.

---

## 16. Дизайн-система

- Тёплая тёмная редакционная тема: основа `#2D2A26`, поверхности карточек около `#37342F`, светлая бумага `#EDECE8`, текст `#FAF9F6`.
- Акценты: терракота `#8E4A49` (`--primary` — кнопки, линии, активные состояния) и песок `#D4A373` (`--accent` — надзаголовки, ссылки, выделения).
- Шрифты: **Cormorant Garamond** для заголовков (`--font-heading`), **Montserrat** для текста (`--font-body`), **JetBrains Mono** для цифр и технических подписей (`--font-mono`).
- Прямая геометрия (`--radius: 0.25rem`), тонкие линии, утилиты в `src/index.css`: `.rule`, `.pulse`, `.eyebrow`, `.link-underline`, `.fade-up`.
- Токены живут в `src/index.css` и подключены в `tailwind.config.js`; старые hex-классы предыдущих версий там же переведены на токены, поэтому палитра меняется в одном месте.
- Все макеты адаптивны: проверяются на телефоне и на десктопе.

---

## 17. Структура проекта

```
base44/
  entities/        Building, Lead, StatusHistory, Communication, Meeting, OwnerAnalysis,
                   MessageTemplate, RejectionReason, Report, LaunchItem, Claim,
                   AdminSettings, SiteSettings, Service, TeamMember, ApartmentNote, Events, User
  functions/       submitLead, changeLeadStatus, sendEmail, sendSms, startCall,
                   commsTest, commsWebhook, sendDigest, migrateLeadStatuses
  shared/          comms.ts (провайдеры, секреты, подстановки), leadFunnel.ts (статусы, правила)
  workflows/       DailyDigest
  config.jsonc     команды сборки и запуска для Base44
public/            robots.txt, sitemap.xml
src/
  pages/           публичные страницы + pages/admin/*
  components/      Header, Footer, Layout, AddressSearch, BuildingCard, BuildingsMap,
                   LeadDialog/LeadForm/LeadProvider, LanguageSwitcher,
                   home/*, cluster/*, admin/lead/*, admin/leads/*, admin/meetings/*, ui/*
  content/         ru.js, en.js, homepage.js
  hooks/           useBuildings, useSiteSettings, useThirdPartyTags
  lib/             i18n, seo, track, leadStatus, leadJourney, sla, mskTime, ics, price, csv,
                   khamovniki, launchDefaults, хелперы авторизации
  App.jsx          маршруты
  index.css        токены дизайна
```

Стек: React 18 + Vite, React Router 7, Tailwind CSS + shadcn/ui, TanStack Query, react-leaflet (тёмная подложка, без API-ключа), lucide-react, Base44 SDK (сущности, авторизация, интеграции, секреты), Deno для серверных функций.

---

## 18. Авторизация и доступ

- Почта и пароль (`loginWithMfa`, с шагом двухфакторной аутентификации, если она включена), вход через Google, восстановление пароля и страницы 2FA.
- Новые пользователи приглашаются со страницы **App Users** приложения; роли — `admin` и `user`.
- Задуманная модель: `/admin` открывается только при `role = "admin"`; обращения видит автор или админ; каталог, настройки и CRM меняет только админ.
- **Демонстрационный режим (текущее состояние)**: проверка входа в админке отключена (`GATE_DISABLED` в `AdminLayout`), серверные функции принимают запросы без сессии, правила доступа на сущностях открыты. Это только для показа.

Чтобы вернуть продакшен-доступ:

1. Поставить `GATE_DISABLED = false` в `src/pages/admin/AdminLayout.jsx` и обернуть маршруты `/admin` в `src/App.jsx` в `ProtectedRoute`.
2. Убрать демо-обход в `changeLeadStatus`, `sendEmail`, `sendSms`, `startCall`, `commsTest`, `sendDigest` (проверку роли админа оставить).
3. Закрыть блоки `rls` у сущностей: публичное чтение для `Building`, `Service`, `SiteSettings`, `ApartmentNote`, публичных `TeamMember`; только создание — для `Events` и `Lead`; только админ — для CRM, коммуникаций, отчётов и настроек.

---

## 19. Локальный запуск

Репозиторий нужен, чтобы запускать и править приложение локально, а затем публиковать изменения через Base44. Любой пуш в репозиторий отражается в Base44 Builder.

### Что понадобится

1. Клонировать репозиторий по Git-адресу проекта.
2. Перейти в каталог проекта.
3. Установить зависимости: `npm install`.
4. Установить Base44 CLI: `npm install -g base44@latest`.
5. Установить [Deno](https://docs.deno.com/runtime/getting_started/installation/) — на нём работает локальный бэкенд Base44.

Полный набор команд — `base44 --help` (или [справочник CLI](https://docs.base44.com/developers/references/cli/commands/introduction)).

### Запуск

Три команды из корня проекта:

```bash
base44 login   # один раз на машину
base44 link    # один раз на клон
base44 dev     # локальный бэкенд + фронтенд
```

Откройте адрес фронтенда, который напечатает `base44 dev` (обычно `http://localhost:5173`).

Важно:

- **Каждому свежему клону нужен `base44 link`.** Он пишет `base44/.app.jsonc` (указатель на id приложения), который намеренно в .gitignore. Флаги для неинтерактивного запуска — в `base44 link --help`.
- **`base44 dev` сам запускает фронтенд** (через `site.serveCommand` в `base44/config.jsonc`) — не запускайте `npm run dev` отдельно: без бэкенда каждая `/api`-ручка падает, а рядом с `base44 dev` второй Vite молча займёт следующий порт.
- **Приложение должно быть опубликовано хотя бы раз**, иначе интерфейс под `base44 dev` не загрузится.
- Сущности, функции и авторизация работают локально — данные сущностей **только в памяти** и стираются при перезапуске `base44 dev`. Core-интеграции и OAuth-вход проксируются в развёрнутое приложение. Подробнее: [Local development overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview).

### Только фронтенд, бэкенд хостинга

```bash
base44 dev --remote
```

⚠️ В этом режиме записи идут в **prod-данные** приложения.

### Публикация изменений

После пуша в git публикуйте из дашборда:

```bash
base44 dashboard open
```

Репозиторий синхронизируется с Base44 через git, поэтому публикуйте из дашборда, а не через `base44 deploy` — CLI-деплой отправляет локальное дерево напрямую в обход синхронизации.

---

## 20. Известные ограничения и что дальше

- **Демо-доступ**: вход в админку и правила доступа на сущностях открыты — см. раздел 18.
- **Домен**: SEO-canonical, sitemap, robots и метаданные `index.html` всё ещё используют `https://rieltorcenter.ru`.
- **Контакты** (`SiteSettings`) — заготовки: телефон, почта и адрес офиса нужно подтвердить до запуска.
- **Политика конфиденциальности** — структурированный шаблон: нужны реквизиты компании и юридическая проверка.
- **Реальные SMS, телефония и мессенджеры**: адаптеры готовы, но для боевой отправки нужны ключи провайдеров в Secrets и токен вебхука. Telegram и WhatsApp пока фиксируются вручную.
- **Нет платежей и онлайн-записи**: сайт работает только через обращения и встречи.
- **Автоматических оценок** нет намеренно; анализ объекта пишется вручную в карточке обращения.
- Медиа хранятся ссылками; отдельной медиатеки, кроме загрузки фото в админке, нет.

---

## 21. Документация и поддержка

- Интеграция с GitHub: <https://docs.base44.com/developers/app-code/local-development/github>
- Локальная разработка: <https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview>
- Поддержка: <https://app.base44.com/support>