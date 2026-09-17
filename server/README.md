# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@0.17.0 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:typography" sveltekit-adapter="adapter:node" --install pnpm .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Deploy lokal dengan PM2

PM2 menangani **auto-restart saat crash, log, monitor, dan jalan di background** (termasuk nyala ulang setelah reboot via `pm2 startup`). Cocok untuk Windows dan Linux.

### 1. Instalasi PM2

```sh
npm install -g pm2
```

### 2. Build produksi

Pastikan `.env` sudah benar **sebelum** build (nilai di-embed saat build):

```env
PRIVATE_API_KEY=...
PRIVATE_API_BASE_URL=http://<host-backend>:8080
COOKIE_SECURE=false   # false jika diakses via HTTP; hapus/set true jika sudah HTTPS
```

```sh
pnpm install
pnpm build
```

### 3. Menjalankan lewat PM2

Gunakan `ecosystem.config.cjs` yang sudah tersedia di `server/` (menyuntik `PORT` & `COOKIE_SECURE` ke env app, `script` absolut):

```js
module.exports = {
	apps: [
		{
			name: 'pandora',
			script: __dirname + '/build/index.js',
			cwd: __dirname,
			env: { PORT: 3000, COOKIE_SECURE: 'false' }
		}
	]
};
```

Agar mau ganti port: ubah `PORT` di config ini (misal `PORT: 4000`), lalu `pm2 restart pandora`. Catatan: `COOKIE_SECURE: 'false'` dipakai saat akses via HTTP; hapus/hilangkan bila sudah HTTPS.

lalu jalankan `pm2 start ecosystem.config.cjs`.

### 4. Status & log

```sh
pm2 status            # daftar & status proses
pm2 logs pandora      # lihat log (ctrl+c untuk keluar)
pm2 monit            # pantau memori/CPU (interaktif)
pm2 restart pandora  # restart manual
pm2 delete pandora   # berhenti & hapus dari PM2
```

### 5. Auto-start setelah reboot (opsional)

```sh
pm2 save            # simpan daftar proses
pm2 startup         # ikuti instruksi yang ditampilkan
```

### Catatan

- Jalankan **hanya satu instance** batang (`node build/index.js` / `pm2 start ...`). Instance ganda dari build berbeda bisa memicu kode file rusak (mis. `ENOENT ... .gz`) karena manifest hash bertabrakan.
- Jika akses lewat **HTTP** (bukan HTTPS), wajib `COOKIE_SECURE=false` di `.env` — kalau tidak, browser membuang cookie `Secure` dan login gagal.
- Mutasi `.env` perlu `pm2 restart pandora` agar efek (dan sesudahnya `pm2 save`).
