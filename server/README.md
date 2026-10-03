# Pandora Server (SvelteKit + Node Adapter)

Bagian server (API + SSR) untuk aplikasi Pandara. SvelteKit + `@sveltejs/adapter-node`.

---

## Prasyarat

- Node.js 20+
- pnpm
- Backend API internal: `http://localhost:8080`

---

## Clone & Install

```bash
git clone <repo-url> server
cd server
pnpm install
```

---

## Development

Salin `.env.example` ke `.env.development` lalu isi `PRIVATE_API_KEY`:

```bash
cp .env.example .env.development
# edit .env.development, isi PRIVATE_API_KEY
```

Jalankan:

```bash
pnpm run dev
```

Server: `http://localhost:3000` (hot-reload).

---

## Deploy Production (PM2)

Variabel production di `ecosystem.config.cjs`.

### 1. Build

```bash
pnpm run build
```

### 2. Konfigurasi `ecosystem.config.cjs`

Edit property `env` dengan nilai production:
- `PRIVATE_API_BASE_URL` — URL backend production
- `COOKIE_SECURE` — `true` kalau HTTPS, `false` kalau HTTP
- `PORT` — port server (default 3000)
- `PRIVATE_API_KEY` — key production dari BE

### 3. Jalankan

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
```

### 4. Auto-start (opsional)

```bash
pm2 save
pm2 startup
```
