<div align=center>

<img src="https://raw.githubusercontent.com/Edit-Mr/Fastro/main/frontend/src/assets/img/icon/EM.svg" alt="Fastro Logo" width="50">

# Fastro

毛哥EM的網站起始模板，使用 Astro 與 Fastify。

![Astro](https://img.shields.io/badge/Astro-5f3cbe?logo=astro) ![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify)

</div>

> 繁體中文 | [English](README.md)

## 功能特點

- **Astro**：整合了 Sitemap 和 i18n。
    - 自動重定向至系統語言。
    - 在本地儲存中保存語言偏好設定。
- **Fastify**：一個快速且輕量的 Node.js 網頁框架。
- **Prettier**：程式碼格式化工具，維持一致的風格。
- **concurrently**：前後端同時執行。

> i18n 詳細資訊請參考[下方](#i18n)

## 如何使用

點擊右上角的「Use this template」按鈕，使用此模板創建新的儲存庫。

<img src=https://docs.github.com/assets/cb-76823/mw-1440/images/help/repository/use-this-template-button.webp width=500>

> 無需包含所有分支，但其實也只有一個分支。

## 專案結構

```plaintext
.
├── frontend/   # Astro
├── backend/    # Fastify
```

如果你只想使用其中一個，只需刪除另一個資料夾，並將所有檔案移至根目錄。

## 開發

> 確保你已安裝 [pnpm](https://pnpm.io/)。

如果你在專案根目錄執行以下命令，前後端套件都會被安裝或執行。

### 安裝依賴套件

```bash
pnpm install
```

### 本地開發

```bash
pnpm dev
```

### 構建（適用於 Astro）

```bash
pnpm build:frontend
```

## 如何部署

部署 Node.js 應用程式非常簡單。Astro 是靜態網站生成器，因此可以部署到任何靜態託管服務，GitHub pages、三角形公司 Vercel、網路活佛 Cloudflare Pages、Netlify、Zeabur... 你爽就好。Fastify 可以部署到任何 Node.js 託管服務。

<details>
<summary>Zeabur (Astro + Fastify)</summary>

### Zeabur (Astro + Fastify)

選擇從 GitHub 或任何你想要的地方部署。前端應該預設部署，因為它是第一個。

如果你想部署後端，可以添加以下環境變數：

```plaintext
ZBPACK_APP_DIR=backend
```

兩個專案可以部署在一個 Project 中，但是兩個分開的服務。可以使用 Caddy 或 Nginx 來反向代理。

這裡是一個簡單的 Caddyfile 範例，把 `/api` 路徑的請求以及 `/openapi.json` 反向代理到後端服務，其他的都丟給前端：

```plaintext
:80 {
    @backend path /api* /openapi.json
    reverse_proxy @backend backend.zeabur.internal:8000
    reverse_proxy frontend.zeabur.internal:8080
}
```

</details>

<details>
<summary>Github Pages (Astro)</summary>

### Github Pages (Astro)

GitHub Pages 只支援靜態檔案，所以你只能部署前端。在你的儲存庫中配置 `.github/workflows/gh-pages.yml` 工作流程以開啟觸發器。

```yml
on:
    push:
        branches: ["main"]
        paths: ["frontend/**"]
    workflow_dispatch:
```

</details>

## i18n

此專案支援 i18n（國際化）。基本上幾乎是我自己寫的。要使用它，請遵循以下步驟：

1. 在你的 Astro 組件中導入 i18n 模組。
2. 使用所需的語言設定 `t` 函數。
3. 使用 `l` 函數生成本地化 URL。輸入相對路徑。例如，
    - 連結到目前語言的「關於」頁面：`l("/about/")`。
    - 連結到目前頁面的英語版本：`l("", "en")`。

這裡是來自 `frontend/src/components/Nav.astro` 的完整範例：

```astro
---
import * as i18n from "src/i18n";
const l = i18n.l(Astro.url);
const t = i18n.t(i18n.local(Astro.url.pathname), {
	about: {
		en: "About",
		"zh-Hant": "關於",
		"zh-Hans": "关于"
	},
	blog: {
		en: "Blog",
		"zh-Hant": "部落格",
		"zh-Hans": "博客"
	}
});
---

<nav>
	<a href={l("/about/")}><span>{t.about}</span></a>
	<a href={l("", "en")} data-lang="en">English</a>
	<a href={l("", "zh-Hant")} data-lang="zh-Hant">繁體中文</a>
	<a href={l("", "zh-Hans")} data-lang="zh-Hans">简体中文</a>
</nav>
```

## 授權條款

此專案由毛哥EM製作，採用 [Apache 2.0](LICENSE) 授權。
