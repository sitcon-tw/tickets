<div align=center>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="frontend/public/assets/SITCONTIX.svg">
  <source media="(prefers-color-scheme: light)" srcset="frontend/public/assets/SITCONTIX_gray.svg">
  <img alt="EM Logo" src="frontend/public/assets/SITCONTIX_gray.svg" width="200" style=margin-bottom:1rem />
</picture>

SITCON 活動報名／票券系統

</div>

---

- 前端：Next.js（App Router）+ next-intl
- 後端：Fastify + Prisma + Better Auth
- DB：PostgreSQL（必要）
- Redis（選用）：用於 Prisma query cache / cache（可關閉）
- Turnstile（建議）：保護 magic link 登入
- Mailtrap（建議）：寄送登入信與通知信
- Grafana（建議）：OpenTelemetry traces 收集與瀏覽

## 目錄

- `frontend/`：Next.js 前端
- `backend/`：Fastify API（含 Prisma schema、email templates）

## 快速開始（同時跑前後端）

### 1) 安裝依賴

```bash
pnpm install
```

### 2) 設定環境變數

本專案會分別從 `frontend/` 與 `backend/` 讀取環境變數，請把檔案放在各自資料夾內。

#### backend/.env（必要/常用）

```bash
# Server
PORT=3000
NODE_ENV=development

# URLs（請務必對應你本機實際 port）
BACKEND_URI=http://localhost:3000
FRONTEND_URI=http://localhost:4322

# Database (PostgreSQL)
POSTGRES_URI=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public

# Auth
BETTER_AUTH_SECRET=replace_me_with_a_long_random_string

# Turnstile (server secret)
TURNSTILE_SECRET_KEY=replace_me

# Email (Mailtrap)
MAILTRAP_TOKEN=replace_me
MAILTRAP_SENDER_EMAIL=noreply@example.com
MAIL_FROM_NAME=SITCONTIX

# OpenTelemetry
# OTEL_SDK_DISABLED=true
OTEL_SERVICE_NAME=tickets-backend
OTEL_TRACES_EXPORTER=console
# OTEL_TRACES_EXPORTER=otlp
# OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://tempo:4318/v1/traces

# Redis
# REDIS_URI=redis://localhost:6379
# REDIS_DISABLED=true

# Optional
# ADMIN_EMAILS=admin1@example.com,admin2@example.com
# RATE_LIMIT_MAX=30000
# RATE_LIMIT_WINDOW=10 minutes
# AUTH_RATE_LIMIT_MAX=20000
# MAX_BODY_SIZE=1048576
# MAX_JSON_SIZE=524288
# GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
# TWSMS_USERNAME=...
# TWSMS_PASSWORD=...
```

#### frontend/.env.local（常用）

```bash
# 用於 Next.js rewrite / sitemap / metadata 等 server-side fetch
BACKEND_URI=http://localhost:3000
FRONTEND_URI=http://localhost:4322

# Turnstile (site key, 前端可公開)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=replace_me

# 產生 OpenGraph / metadata 使用
# SITE=https://tickets.sitcon.org
```

### 3) 啟動開發環境

```bash
pnpm dev
```

備註：後端啟動時會執行 `backend/scripts/db-init.ts`，在 development 會用 `prisma db push` 同步 schema，並在 schema 變更時自動 `prisma generate`。

## 只跑單一服務

```bash
# 只跑前端（預設由根目錄腳本指定 port=4322）
pnpm dev:frontend

# 只跑後端（預設 PORT=3000）
pnpm dev:backend
```

## 常用網址

- 前端：http://localhost:4322
- API：http://localhost:3000/api
- Swagger UI：http://localhost:3000/docs
- Health check：http://localhost:3000/health
- Metrics（Prometheus）：http://localhost:3000/metrics

## 資料庫（Prisma）

- Prisma schema：`backend/prisma/schema.prisma`
- 常用指令（在根目錄執行）：

```bash
pnpm --filter backend db:sync      # prisma db push
pnpm --filter backend db:migrate   # prisma migrate dev
pnpm --filter backend type-check
```

## i18n

本專案使用 `next-intl`，並採用「分散式」的翻譯結構（不把所有字串塞進單一巨大 JSON）。主要設定在 `frontend/i18n/`，頁面路由在 `frontend/app/[locale]/`。

## 格式化

```bash
pnpm format       # prettier --write
pnpm check-format # prettier --check
```

## Contributing

- 發現 bug / 想提需求：請開 issue
- 有修正或新功能：歡迎 PR（請送到 `dev` branch）
