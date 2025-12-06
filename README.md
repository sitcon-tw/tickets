<div align=center>

<img src="https://sitcon.org/branding/assets/logos/logo.svg" alt="Fastro Logo" width="50">

# SITCONTIX

SITCON 報名系統

</div>

## 開發

此系統使用 Next.JS 與 Fastify 開發。後端在 `backend` 資料夾，前端在 `frontend` 資料夾。

在跑起來前，請記得設定 .env 檔案，範例請看 `.env.example` 。因為某些原因，請記得把 env 檔案放在前端跟後端的資料夾中。

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

在每個元件獨立編輯，不會全部塞在同一個大 JSON。看了你就懂了不多解釋。

## contributing

想要增加新功能或發現 bug 的話，歡迎開 issue；如果你直接寫好 code 的話可以直接發 PR！PR 請丟到 dev branch
