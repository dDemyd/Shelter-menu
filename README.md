# SHELTER · QR menu (Бункер)

Premium QR-меню для лаунж/арт-хаус закладу **Shelter** на Vue 3 + Vite + Tailwind, з адмін-панеллю та Telegram-сповіщеннями.

База дизайну — варіант **v1 «Бункер»** з Claude Design handoff: бетонна текстура, hazard-смуги, accent `#ff5a1f`, шрифти Unbounded + Manrope + JetBrains Mono. Поверх — точкові неонові glow на FAB, активних табах і primary-кнопках.

## Стек

- **Frontend**: Vue 3 (Composition API), Vite, Tailwind CSS, Pinia, vue-router, `@vueuse/core`
- **Backend / БД / Auth**: Supabase (Postgres + Auth + Realtime + RLS)
- **Serverless**: Vercel Functions (`/api/call-bartender`, `/api/telegram-webhook`)
- **Deploy**: Vercel

## Структура

```
src/
├── components/public/   # Header, ItemCard, ListRow, CartSheet, DetailSheet, SwipeDeck …
├── composables/         # useToast, useSwipe
├── lib/                 # supabase client, i18n, formatters, types
├── router/              # public + admin guards
├── stores/              # cart, menu, session, auth
├── styles/              # tokens.css, tailwind.css
└── views/               # public/* + admin/*
api/                     # Vercel serverless functions
supabase/migrations/     # 0001_schema.sql, 0002_rls.sql
supabase/seed-from-handoff.ts  # seed з design-handoff/.../data.js
```

## Локальний запуск (Docker / Supabase CLI)

**Передумови:** Docker Desktop запущено + встановлено `supabase` CLI (`brew install supabase/tap/supabase`).

```bash
# 1. Залежності
npm install

# 2. .env (включає дефолтні локальні ключі Supabase)
cp .env.example .env

# 3. Підняти весь стек Supabase у Docker (Postgres + Auth + Realtime + Storage + Studio)
npm run db:start
# або: supabase start

# 4. Засіяти меню з handoff (categories + subcategories + products)
npm run seed

# 5. Створити адміна (за замовчуванням admin@shelter.local / shelter1234)
npm run admin:create

# 6. Запустити Vite dev
npm run dev
```

Або в одну команду після `npm install` та `cp .env.example .env`:
```bash
npm run bootstrap && npm run dev
```

**URL'и:**
| Що | URL |
|---|---|
| Меню гостя | http://localhost:5173/menu?table=7 |
| Swipe-режим | http://localhost:5173/menu/swipe?table=7&cat=bar |
| Помилка «немає столика» | http://localhost:5173/menu |
| Адмінка | http://localhost:5173/admin/login |
| Supabase Studio | http://127.0.0.1:54323 |
| Mailpit (тест-пошта) | http://127.0.0.1:54324 |

**Управління стеком:**
```bash
npm run db:start     # підняти контейнери
npm run db:stop      # зупинити
npm run db:reset     # стерти БД + наново застосувати міграції
npm run db:status    # перевірити статус і ключі
npm run studio       # відкрити Studio
```

## Telegram (опційно локально)

Без Telegram заявка все одно записується в `call_requests` — її видно в `/admin/call-requests` через Supabase Realtime.

Щоб тестувати реальну відправку:
1. Створи бота через `@BotFather`, отримай токен.
2. Дізнайся `chat_id` робочого чата (`@RawDataBot`).
3. Допиши в `.env`: `TG_BOT_TOKEN`, `TG_CHAT_ID`.
4. Vite сам не запускає serverless — використовуй **`vercel dev`** замість `npm run dev`, або задеплой і тестуй на проді.

## Продакшн (хостед Supabase + Vercel)

## Telegram webhook

Після деплою на Vercel:
```bash
curl -X POST "https://api.telegram.org/bot<TG_BOT_TOKEN>/setWebhook" \
  -d "url=https://YOUR-DOMAIN.vercel.app/api/telegram-webhook" \
  -d "secret_token=<TG_WEBHOOK_SECRET>"
```

Тоді кнопки «Прийнято / Готово / Скасувати» під повідомленням працюватимуть і автоматично оновлюватимуть статус у БД.

## Сценарії

- `GET /menu?table=7` — публічне меню (список / картки)
- `GET /menu/swipe?table=7&cat=bar` — Tinder-режим: swipe right = ♥ + швидке додавання, left = приховати в сесії, down = додати в замовлення
- `GET /admin/login` → CRUD усього меню, банерів, налаштувань і живий стрім заявок з Supabase Realtime
- `POST /api/call-bartender` — створює запис у `call_requests`, шле повідомлення в Telegram з inline-кнопками

## Кастомізація

- **Логотип**: `src/components/public/BrandLogo.vue` (SVG)
- **Палітра**: `src/styles/tokens.css` (CSS-змінні `--accent`, `--bg`)
- **Шрифти**: `index.html` (Google Fonts) + `tailwind.config.js`
- **Конструктор кальянних міксів**: налаштовується в `/admin/settings` → `hookah_constructor_url`

## Деплой

```bash
vercel deploy --prod
```

У dashboard Vercel додай env vars зі списку вище. Frontend і `/api/*` функції піднімаються одним білдом.
