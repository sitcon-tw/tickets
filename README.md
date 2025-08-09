<div align=center>

<img src="https://raw.githubusercontent.com/Edit-Mr/Fastro/main/frontend/src/assets/img/icon/EM.svg" alt="Fastro Logo" width="50">

# Fastro

EM's Website starter template using Astro and Fastify.

![Astro](https://img.shields.io/badge/Astro-5f3cbe?logo=astro) ![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify)

</div>

> [繁體中文](README.zh-Hant.md) | English

## Features

- **Astro**: With Sitemap and i18n intergration.
    - Auto redirect to system language.
    - Save language preference in local storage.
- **Fastify**: A fast and low overhead web framework for Node.js.
- **Prettier**: Code formatter to maintain consistent style.
- **concurrently**: Run frontend and backend at the same time.

> i18n details [below](#i18n)

## How to use

Press the "Use this template" button at the top right to create a new repository with this template.

<img src=https://docs.github.com/assets/cb-76823/mw-1440/images/help/repository/use-this-template-button.webp width=500>

> No need to include all branches, though there's only one branch.

## Project Structure

```plaintext
.
├── frontend/   # Astro
├── backend/    # Fastify
```

if you only want to use one of them, just simply delete the other folder, and move all files to the root.

## Development

> Make sure you have [pnpm](https://pnpm.io/) installed.

Both frontend and backend package will be installed or run if you run this command at the root of the project.

### Install dependencies

```bash
pnpm install
```

### Local development

```bash
pnpm dev
```

### Build (For Astro)

```bash
pnpm build:frontend
```

## How to Deploy

Deploying Node.js app is easy AF. Astro is a static site generator, so you can deploy it to any static hosting service, GitHub Pages, Vercel, Cloudflare Pages, Netlify, Zeabur... whatever you like. Fastify can be deployed to any Node.js hosting service.

<details>
<summary>Zeabur (Astro + Fastify)</summary>

### Zeabur (Astro + Fastify)

Choose to deploy from GitHub or wherever you want. Frontend should be deployed as default since it is the first one.

If you wanna deploy backend, you can add the following environment variables:

```plaintext
ZBPACK_APP_DIR=backend
```

Both projects can be deployed in one Project, but as two separate services. You can use Caddy or Nginx for reverse proxy.

Here's a simple Caddyfile example that reverse proxies `/api` path requests and `/openapi.json` to the backend service, and everything else to the frontend:

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

GitHub Pages only supports static files, so you can only deploy the frontend. Config the workflow in `.github/workflows/gh-pages.yml` to your repository to turn on the trigger.

```yml
on:
    push:
        branches: ["main"]
        paths: ["frontend/**"]
    workflow_dispatch:
```

</details>

## i18n

This project supports i18n (internationalization). To use it, please follow these steps:

1. Import the i18n module in your Astro component.
2. Set the `t` function with the desired locale.
3. Use the `l` function to generate localized URLs. Enter relative paths. For example,

- Link to the "About" page with current lang: `l("/about/")`.
- Link to current page with English lang: `l("", "en")`.

Here's a full example frm `frontend/src/components/Nav.astro`:

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

## License

This project is made by Elvis Mao, licensed under [Apache 2.0](LICENSE).
