<div align=center>

<img src="https://sitcon.org/branding/assets/logos/logo.svg" alt="Fastro Logo" width="50">

# SITCON 2026 票券系統

</div>

## 開發

此系統使用 Next.JS 與 Fastify 開發。
後端在 `backend` 資料夾，前端在 `frontend` 資料夾。

在跑起來前，請記得設定 .env 檔案，範例請看 `.env.example` 。
因為某些原因，請記得把 env 檔案放在前端跟後端的資料夾中。

如果只有要跑前端／後端記得先 `cd` 到相應的資料夾。一起跑就在根目錄。

### how to run?
首先你要裝一下套件
```bash
pnpm install # 沒有 pnpm 的話請先安裝 pnpm -> npm install -g pnpm
```

再來跑一下 database
```bash
npx prisma generate
npx prisma migrate dev --name init
```

然後你就可以開始開發了
```bash
pnpm dev
```

## i18n

在每個元件獨立編輯，不會全部塞在同一個大 JSON 。看了你就懂了不多解釋。

## 來自 Nelson 的留言:

這票券系統因為換過好幾個技術棧，從 Astro 到 React JS 再到 Next + React TSX，refactor了好幾次，如果來年還有人要維護，可以幫我完成：

- 把後端 Fastify 換成 TS，然後統一前後端 type，現在這樣真的太痛苦了
- 把 BetterAuth 移到 AuthJS
- 想不到了，加油吧
