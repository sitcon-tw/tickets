<div align=center>

<img src="https://sitcon.org/branding/assets/logos/logo.svg" alt="Fastro Logo" width="50">

# SITCON 2026 票券系統

</div>

## 更新網頁文案

所有文案都是 Markdown 檔案，放在資料夾 [`frontend/src/pages/markdown`](frontend/src/pages/markdown)。

以下為一些快速連結：

- [FAQ](frontend/src/pages/markdown/faq.md)
- [intro](frontend/src/pages/markdown/intro.md)

裡面可以撰寫 Markdown 以及 HTML。如果你是工人了還想 XSS...那我也沒辦法。

## 開發

此系統使用 Astro 與 Fastify，基於 [Fastro](https://github.com/Edit-Mr/Fastro) 模板開發。

如果只有要跑前端／後端記得先 `cd` 到相應的資料夾。一起跑就在根目錄。

```bash
pnpm i
pnpm dev
```

## i18n

在每個元件獨立編輯，不會全部塞在同一個大 JSON 。看了你就懂了不多解釋。
