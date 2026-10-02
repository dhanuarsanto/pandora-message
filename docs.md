# Pandora

Aplikasi ini punya dua versi yang bisa dipakai. Pilih salah satu.

- **Versi Server** (`server/`) — ada proses Node.js yang berjalan terus. Kunci API tidak pernah sampai ke browser, cookie sesi memakai `httpOnly`, dan ada pembatas percobaan login. Butuh tempat menjalankan proses serta proxy di depannya. Ini pilihan yang benar kalau aplikasinya dipasang di server sendiri.
- **Versi Statis** (`client/`) — hanya berisi berkas HTML, CSS, dan JavaScript, tanpa proses Node.js sama sekali. Bisa diunggah ke webserver mana pun. Konsekuensinya, kunci API ikut terbawa ke browser dan cookie sesi tidak bisa dipakai.

Halaman, komponen, filter, tabel, tema, dan tata letaknya identik di kedua versi. Alamat halamannya juga sama: `/login`, `/inbox`, `/outbox`.

## Perbandingan

| Aspek                    | `server/` (adapter-node)   | `client/` (adapter-static)                 |
| ------------------------ | -------------------------- | ------------------------------------------ |
| Backend                  | Ada proses Node.js         | Tidak ada                                  |
| Titik masuk data         | Endpoint `/api/*` SvelteKit| Langsung ke API upstream                   |
| Penyimpanan token        | Cookie `httpOnly`          | `localStorage`                             |
| Pembatas percobaan login | Aktif, per alamat IP       | Tidak ada                                  |
| Kunci API                | `PRIVATE_API_KEY` di server| `PUBLIC_API_KEY` di dalam berkas JS        |
| Header keamanan          | Dipasang aplikasi          | Dipasang webserver dari `.htaccess`       |

## Memisahkan kunci API per lingkungan

Kunci API pada kedua versi dibaca dari `$env/static`, jadi **nilainya tertanam di dalam hasil build**, bukan dibaca saat aplikasi berjalan. Konsekuensinya, kunci tidak bisa dipisahkan hanya dengan cara mengganti berkas di server yang sudah jadi — harus dibangun ulang.

Karena itu tidak ada berkas `.env`. Semuanya ditulis lengkap di dua berkas per proyek, yang dipilih Vite sesuai cara build-nya:

| Cara build                | Mode          | Berk yang dipakai  |
| ------------------------- | ------------- | ------------------ |
| `pnpm dev`                | `development` | `.env.development` |
| `pnpm build`              | `production`  | `.env.production`  |
| `pnpm exec vite build --mode development` | `development` | `.env.development` |

`pnpm preview` memakai hasil `pnpm build`, jadi ikut `.env.production`.

Isi keempatnya:

**`client/.env.development`**
```env
PUBLIC_API_BASE_URL=http://localhost:8080
PUBLIC_BASE_PATH=/nama-subfolder
PUBLIC_API_KEY=kunci-pengembangan
```

**`client/.env.production`**
```env
PUBLIC_API_BASE_URL=http://localhost:8080
PUBLIC_BASE_PATH=/nama-subfolder
PUBLIC_API_KEY=kunci-produksi
```

**`server/.env.development`**
```env
PRIVATE_API_BASE_URL=http://localhost:8080
COOKIE_SECURE=false
PORT=3000
PRIVATE_API_KEY=kunci-pengembangan
```

**`server/.env.production`**
```env
PRIVATE_API_BASE_URL=http://localhost:8080
COOKIE_SECURE=false
PORT=3000
PRIVATE_API_KEY=kunci-produksi
```

Keempatnya sudah tertutup `.gitignore` (`client/.gitignore:17` dan `server/.gitignore:17` memakai pola `.env.*`), jadi tidak pernah ikut ter-commit. Jangan pernah menyalinnya ke luar repo.

Kalau berkas untuk lingkungan yang sedang dibangun tidak ada, build **gagal dengan sendirinya** dan menyebutkan variabelnya, misalnya `Build failed` beserta `"PUBLIC_API_KEY" is not exported`. Ini disengaja: lebih baik build berhenti daripada diam-diam memakai kunci dari lingkungan lain.

`COOKIE_SECURE` dan `PORT` tidak ikut proses build — keduanya dibaca dari environment proses saat aplikasi berjalan, dan `ecosystem.config.cjs` sudah menyuntikkannya sendiri. Nilai di berkas mode hanya dipakai `pnpm dev`.

Untuk memastikan kunci yang benar sudah masuk hasil build, cari sisa placeholder-nya di berkas hasil build. Selama nilai itu belum diganti, teksnya masih muncul apa adanya di dalam berkas JavaScript:

```sh
pnpm build
grep -r "GANTI_DENGAN_KUNCI_API_PRODUKSI" build/
```

Kalau pencarian itu masih menemukan jejaknya, berarti kunci produksi belum diisi dan hasil build tidak boleh diunggah.

## Peringatan penting soal header keamanan

Proteksi clickjacking dan pemaksaan HTTPS hanya berhasil kalau header-nya dikirim lewat respons webserver, bukan lewat `<meta>` di dalam HTML.

Pada **Versi Statis**, Content-Security-Policy hanya bisa dikirim lewat `<meta http-equiv>`. Direktif `frame-ancestors` tidak bisa dikirim lewat meta sehingga diabaikan browser, dan karena itu sengaja **tidak** dideklarasikan di konfigurasi build. Jadi proteksi clickjacking harus datang dari webserver. Berkas `.htaccess` sudah disertakan dan sudah memuat `X-Frame-Options "DENY"`.

Pada **Versi Server**, `server/src/hooks.server.ts` sudah memasang sendiri `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, dan `Strict-Transport-Security` pada setiap respons, jadi tidak perlu diulang di proxy.

HSTS hanya dipatuhi browser kalau halaman diakses lewat HTTPS. Kalau aplikasinya hanya bisa diakses lewat HTTP biasa, baris itu tidak berpengaruh. Selain itu `Strict-Transport-Security` sengaja tidak memakai `includeSubDomains`, supaya subdomain lain milik domain yang sama tidak ikut teraksa HTTPS. Tambahkan `includeSubDomains` hanya bila seluruh subdomain domain itu sudah HTTPS.

# Versi Server

Pilih bagian ini kalau aplikasinya dijalankan di server sendiri lewat Node.js.

## Menyiapkan

Tidak ada berkas `.env`. Buat dua berkas sendiri, satu untuk pengembangan dan satu untuk produksi:

```sh
cd server
printf 'PRIVATE_API_BASE_URL=http://<host-backend>:8080\nCOOKIE_SECURE=false\nPORT=3000\nPRIVATE_API_KEY=kunci-pengembangan\n' > .env.development
printf 'PRIVATE_API_BASE_URL=http://<host-backend>:8080\nCOOKIE_SECURE=false\nPORT=3000\nPRIVATE_API_KEY=kunci-produksi\n'      > .env.production
```

`pnpm dev` membaca `.env.development`, sedangkan `pnpm build` membaca `.env.production`. Kalau berkas untuk lingkungan yang sedang dibangun tidak ada, build gagal dengan sendirinya. Lihat [Memisahkan kunci API per lingkungan](#memisahkan-kunci-api-per-lingkungan).

| Variabel               | Arti                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `PRIVATE_API_BASE_URL` | Alamat API hulu. Boleh HTTP bila hanya dipakai di jaringan internal.                                                           |
| `PRIVATE_API_KEY`      | Kunci API. Wajib diisi di kedua berkas. Tidak pernah dikirim ke browser.                                                        |
| `COOKIE_SECURE`        | `false` kalau aplikasinya diakses lewat HTTP, `true` kalau HTTPS. Selain `false` dianggap `true` pada build produksi.         |

`PRIVATE_API_BASE_URL` dan `PRIVATE_API_KEY` dibaca saat build dan ikut tertanam di hasil build. Mengubahnya berarti build ulang.

`COOKIE_SECURE` dibaca saat proses berjalan, jadi harus tersedia di lingkungan proses. `ecosystem.config.cjs` sudah menyuntikkannya; ubah di sana lalu mulai ulang prosesnya. Kalau nilainya `true` sementara aplikasinya hanya bisa diakses lewat HTTP, browser membuang cookie `Secure` sehingga login selalu gagal.

## Membangun

```sh
cd server
pnpm install
pnpm build
```

Pastikan `.env.production` sudah benar **sebelum** build, karena nilainya ikut tertanam.

## Menjalankan dengan PM2

PM2 menjalankan proses di background, memulai ulang otomatis saat crash, menyimpan log, dan bisa dijalankan lagi setelah reboot. Cocok untuk Windows dan Linux.

```sh
npm install -g pm2
cd server
pm2 start ecosystem.config.cjs
```

Berkas `ecosystem.config.cjs` sudah menyertakan nama proses, `script`, `cwd`, `PORT`, dan `COOKIE_SECURE`:

```js
module.exports = {
	apps: [
		{
			name: '<nama-proses>',
			script: __dirname + '/build/index.js',
			cwd: __dirname,
			env: { PORT: 3000, COOKIE_SECURE: 'false' }
		}
	]
};
```

Ganti port dengan mengubah `PORT` di berkas itu, lalu `pm2 restart <nama-proses>`.

`name` di berkas itu adalah nama proses PM2, bukan nama folder. Isi dengan nama apa pun yang mudah diingat, misalnya `nama-aplikasi`. Namanya hanya perlu sama antara perintah `pm2 start`, `restart`, `logs`, dan `delete`.

Status dan log:

```sh
pm2 status                   # daftar dan status proses
pm2 logs <nama-proses>       # lihat log, ctrl+c untuk keluar
pm2 monit                    # pantau memori dan CPU secara interaktif
pm2 restart <nama-proses>
pm2 delete <nama-proses>     # berhenti dan hapus dari PM2
```

Nyala ulang otomatis setelah reboot:

```sh
pm2 save     # simpan daftar proses
pm2 startup  # ikuti instruksi yang ditampilkan
```

## Menyediakan HTTPS lewat proxy terbalik

Aplikasi hanya mendengarkan di `127.0.0.1:3000`. TLS diurus oleh Nginx atau Caddy di depannya, lalu permintaannya diteruskan ke aplikasi. Contoh Nginx:

```nginx
server {
    listen 80;
    server_name contoh.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name contoh.com;

    ssl_certificate     /etc/letsencrypt/live/contoh.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/contoh.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

`Host` dan `X-Forwarded-Proto` wajib diteruskan, supaya aplikasi tahu alamat mana yang dipakai pengunjung. `X-Forwarded-For` juga wajib diteruskan, karena pembatas percobaan login membaca alamat IP dari situ. Kalau salah satu tidak diteruskan, aplikasi tetap jalan tetapi semua alamat IP terlihat sama.

Tidak perlu menambahkan `X-Frame-Options` atau `Referrer-Policy` di proxy, karena `server/src/hooks.server.ts` sudah memasangkannya.

Kalau aplikasinya dipindahkan dari HTTP ke HTTPS, ubah `COOKIE_SECURE` menjadi `true` di `ecosystem.config.cjs`, lalu `pm2 restart <nama-proses>` supaya cookie baru terpasang dengan penanda `Secure`. Build ulang tidak perlu, karena nilai itu dibaca saat runtime.

## Yang perlu dijaga

- **Hanya satu instance.** Pembatas percobaan login dan cache data reseller disimpan di memori proses. Jalankan satu proses saja; dua instance dari build yang sama bisa saling menimpa berkas hasil build dan memicu galat `ENOENT`.
- **Pembatas percobaan login** membatasi 5 percobaan per menit per alamat IP.
- **Cookie sesi berlaku 24 jam** dan memakai `sameSite strict`.

## Pembaruan

```sh
cd server
pnpm install
pnpm build
pm2 restart <nama-proses>
pm2 save
```

# Versi Statis

Pilih bagian ini kalau aplikasinya hanya perlu berkas statis, misalnya untuk hosting berbagi. Hasil build berisi berkas HTML, CSS, dan JavaScript saja, dan bisa diunggah ke Apache, Nginx, IIS Windows Server, atau cPanel.

Secara bawaan aplikasi ini diletakkan di root domain, misalnya `https://contoh.com/login`. Kalau perlu diletakkan di dalam subfolder, misalnya `https://contoh.com/nama-subfolder/login`, lihat bagian [Menaruh di subfolder](#menaruh-di-subfolder).

## Peringatan penting soal kunci API

Pada versi statis, kunci API tertanam di dalam berkas JavaScript yang dikirim ke setiap pengunjung. Siapa pun yang membuka DevTools dapat membacanya dan memakainya untuk memanggil API secara langsung, melewati seluruh antarmuka aplikasi.

Yang hilang akibatnya:

- **Tidak ada penyaringan di sisi server.** Kunci API menjadi satu-satunya penjaga. Siapa pun yang memilikinya bisa mengambil seluruh data pesan.
- **Token sesi bisa dibaca skrip halaman.** Token tersimpan di `localStorage`, bukan cookie `httpOnly`. Skrip pihak ketiga yang masuk ke halaman bisa membacanya.
- **Tidak ada pembatas percobaan login.** Di versi server, pembatas per alamat IP menahan serangan tebak password. Di sini tidak ada apa pun yang menahannya.

Mitigasi yang hanya bisa dilakukan di sisi backend:

1. Buat kunci API khusus versi statis, terpisah dari kunci versi server, dengan hak akses paling kecil yang mungkin.
2. Batasi CORS di backend hanya untuk domain yang memang memakai aplikasi ini.
3. Pastikan backend punya pembatas percobaan login sendiri, karena pemanggilnya sekarang adalah browser secara langsung.

## Menyiapkan

Tidak ada berkas `.env`. Buat dua berkas sendiri, satu untuk pengembangan dan satu untuk produksi:

```sh
cd client
printf 'PUBLIC_API_BASE_URL=http://host-backend:8080\nPUBLIC_BASE_PATH=\nPUBLIC_API_KEY=kunci-pengembangan\n' > .env.development
printf 'PUBLIC_API_BASE_URL=http://host-backend:8080\nPUBLIC_BASE_PATH=\nPUBLIC_API_KEY=kunci-produksi\n'     > .env.production
```

`pnpm dev` membaca `.env.development`, sedangkan `pnpm build` membaca `.env.production`. Kalau berkas untuk lingkungan yang sedang dibangun tidak ada, build gagal dengan sendirinya. Lihat [Memisahkan kunci API per lingkungan](#memisahkan-kunci-api-per-lingkungan).

`PUBLIC_BASE_PATH` dikosongkan kalau aplikasinya diletakkan di root domain. Isi dengan `/nama-subfolder` kalau diletakkan di subfolder.

`PUBLIC_API_BASE_URL` boleh juga berupa HTTPS. Nilainya akan ikut terembed di hasil build, jadi folder `build/` tidak boleh dibagikan sembarangan. Kunci API-nya juga ikut terembed, dan karena ada di dalam berkas JavaScript, ia terbaca oleh siapa pun yang membuka halaman itu. Buat kunci khusus versi statis dengan hak akses paling kecil yang mungkin.

## Membangun

```sh
cd client
pnpm install
pnpm build
```

Hasilnya ada di `client/build/`. Perintah lain yang tersedia:

```sh
pnpm dev      # server pengembangan
pnpm preview  # mencoba hasil build secara lokal
pnpm test     # menjalankan pengujian
pnpm check    # pemeriksaan tipe
pnpm lint     # pemeriksaan format dan gaya kode
pnpm icons    # membuat ulang favicon dari icon.svg
```

## Mengunggah

Salin seluruh isi folder `build/` ke document root webserver:

```sh
cp -r client/build/* /var/www/html/
```

Pastikan berkas tidak berubah ekstensi menjadi `.txt` atau `.htm` saat diunggah lewat FTP.

`.htaccess` adalah berkas tersembunyi dan sebagian klien FTP tidak menampilkannya. Pastikan berkas itu ikut terunggah, karena dialah yang mengatur penulisan ulang alamat.

Webserver wajib punya aturan penulisan ulang, supaya alamat seperti `/login` dan `/inbox` tetap dilayani oleh `index.html`. Tanpa aturan itu, kedua alamat tersebut akan menghasilkan galat 404. Konfigurasinya ada di bagian berikut.

## Konfigurasi webserver

### Nginx

Untuk di root domain:

```nginx
server {
    listen 80;
    server_name contoh.com;
    root /var/www/html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /_app/immutable/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

Untuk di subfolder, cukup ganti awalan path-nya. Contoh di bawah memakai `nama-subfolder`:

```nginx
server {
    listen 80;
    server_name contoh.com;
    root /var/www/html;

    location /nama-subfolder/ {
        try_files $uri $uri/ /nama-subfolder/index.html;
    }

    location /nama-subfolder/_app/immutable/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

### Apache

Berkas `.htaccess` sudah ikut di dalam `build/`, jadi tidak perlu dibuat manual di hosting Apache. Isinya:

```apache
<IfModule mod_rewrite.c>
	RewriteEngine On

	RewriteRule ^index\.html$ - [L]

	RewriteCond %{REQUEST_URI} !/_app/
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteCond %{REQUEST_FILENAME} !-d
	RewriteRule . index.html [L]
</IfModule>

<IfModule mod_mime.c>
	AddType application/manifest+json .webmanifest
</IfModule>

<IfModule mod_setenvif.c>
	SetEnvIf Request_URI "/_app/immutable/" immutable_asset
</IfModule>

<IfModule mod_headers.c>
	Header always set X-Content-Type-Options "nosniff"
	Header always set X-Frame-Options "DENY"
	Header always set Referrer-Policy "strict-origin-when-cross-origin"
	Header always set Strict-Transport-Security "max-age=31536000"

	Header set Cache-Control "public, max-age=31536000, immutable" env=immutable_asset

	<FilesMatch "^index\.html$">
		Header set Cache-Control "no-cache"
	</FilesMatch>
</IfModule>

<IfModule mod_filter.c>
	<IfModule mod_deflate.c>
		AddOutputFilterByType DEFLATE text/css application/javascript application/json image/svg+xml
	</IfModule>
</IfModule>
```

`Cache-Control immutable` hanya diberikan ke berkas di `_app/immutable/`, yang namanya ber-hash. `preloader.js` dan `theme-init.js` sengaja tidak dikunci lama, supaya pembaruannya langsung terpakai.

Pastikan modul `mod_rewrite`, `mod_headers`, `mod_setenvif`, `mod_mime`, dan `mod_filter` aktif, serta `AllowOverride All` berlaku untuk folder tersebut. Bagian pemampatan disisipkan di dalam dua penjaga `<IfModule>`, jadi modul yang tidak ada hanya membuat barisnya dilewati, bukan membuat permintaan gagal. Tambahkan `includeSubDomains` ke baris HSTS hanya bila seluruh subdomain domain ini sudah HTTPS.

### cPanel dan hosting berbagi

Sebagian besar hosting cPanel sudah mendukung `.htaccess`. Unggah seluruh isi folder `build/`, lalu pastikan ada berkas `.htaccess` di folder yang sama. Jangan pakai hosting yang melarang `.htaccess`, karena tanpa itu tautan dalam aplikasi tidak akan bekerja.

### Windows Server (IIS)

Pasang modul URL Rewrite, lalu buat `web.config` di dalam folder aplikasi:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
	<system.webServer>
		<rewrite>
			<rules>
				<rule name="Spa" stopProcessing="true">
					<match url=".*" />
					<conditions logicalGrouping="MatchAll">
						<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
						<add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
					</conditions>
					<action type="Rewrite" url="index.html" />
				</rule>
			</rules>
		</rewrite>
		<httpProtocol>
			<customHeaders>
				<add name="X-Content-Type-Options" value="nosniff" />
				<add name="X-Frame-Options" value="DENY" />
				<add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
			</customHeaders>
		</httpProtocol>
	</system.webServer>
</configuration>
```

Berkas ini ditulis relatif, jadi tetap benar di dalam subfolder. Yang perlu dijaga adalah letaknya: `web.config` harus berada satu folder dengan `index.html`. Kalau aplikasinya diletakkan di subfolder, tempatkan `web.config` di dalam subfolder itu, bukan di document root.

### Hosting berbasis JavaScript

Jika hosting tidak mendukung `.htaccess` maupun konfigurasi rewrite, minta pengaturan rewrite dari penyedia, atau pakai layanan yang menyediakannya.

## Struktur berkas hasil build

Struktur di dalam `build/` sama saja, baik untuk root maupun untuk subfolder. Yang berbeda hanya letaknya di webserver: untuk subfolder, seluruh isi folder ini diletakkan di dalam folder subfolder.

```
build/
|-- index.html          <- halaman cadangan, dilayani untuk semua alamat
|-- .htaccess           <- penulisan ulang + header keamanan (Apache)
|-- _app/               <- berkas JavaScript dan CSS
|-- icon.svg
|-- favicon.ico
|-- favicon-192.png
|-- favicon-512.png
|-- apple-touch-icon.png
|-- manifest.webmanifest
|-- preloader.js
|-- theme-init.js
```

## Menaruh di subfolder

Aplikasi bisa diletakkan di dalam subfolder, misalnya `https://contoh.com/nama-subfolder/login`, supaya tidak memakai root domain. Yang perlu diubah hanya satu variabel lingkungan.

### Menyiapkan

```env
PUBLIC_BASE_PATH=/nama-subfolder
```

| Nilai                 | Arti                                            |
| --------------------- | ----------------------------------------------- |
| Kosong atau tidak ada | Diletakkan di root domain. Ini nilai bawaan.   |
| `/nama-subfolder`     | Diletakkan di subfolder `nama-subfolder`.       |
| `/a/b`                | Boleh beberapa tingkat, selama diawali `/`.     |

Nilai ini dibaca saat build dan ikut tertanam di hasil build. Mengubahnya berarti build ulang. Garis miring di akhir otomatis dibuang, jadi `/nama-subfolder/` sama dengan `/nama-subfolder`.

### Membangun

```sh
cd client
pnpm build
```

Hasilnya tetap di `client/build/`. Tidak ada perubahan lain yang perlu dilakukan — navigasi, panggilan API, dan penyimpanan sesi sudah otomatis mengikuti subfolder.

### Mengunggah

Unggah **isi** folder `build/` ke dalam folder subfolder, bukan folder build itu sendiri. Kalau subfoldernya `/nama-subfolder`, maka `index.html` harus berada di `/nama-subfolder/index.html`:

```sh
cp -r client/build/. /var/www/html/nama-subfolder/
```

Perhatikan titik di akhir `build/.` — tanpanya, berkas tersembunyi seperti `.htaccess` tidak ikut tersalin.

Berkas `.htaccess` ikut terunggah bersama isi lain dan sudah menuliskan aturan yang tidak mengasumsikan lokasi folder, jadi tidak perlu diedit manual.

### Yang perlu diperiksa setelah mengunggah

| Yang diperiksa                                          | Hasil yang diharapkan                  |
| ------------------------------------------------------- | ------------------------------------- |
| `https://contoh.com/nama-subfolder/login`               | Halaman masuk terbuka                 |
| `https://contoh.com/nama-subfolder/inbox`               | Halaman terbuka, tanpa galat 404      |
| `https://contoh.com/nama-subfolder/_app/...`            | Aset termuat, tanpa galat di konsol   |
| Muat ulang pada `/nama-subfolder/inbox`                 | Tetap terbuka, tidak lompat ke `/login` |

Kalau galat 404 muncul pada alamat di dalam subfolder padahal berkasnya ada, berarti aturan penulisan ulang webserver belum bekerja. Periksa bagian penulisan ulang pada konfigurasi di atas.

### Kalau dua versi hidup di satu host

Versi server dan versi statis bisa berdampingan di domain yang sama, misalnya server di `/` dan statis di `/nama-subfolder`. Keduanya tidak saling menimpa karena berkas hasil build masing-masing berada di foldernya sendiri.

Kalau keduanya memakai nama folder yang sama, yang belakangan diunggah akan menimpa yang duluan.

Preferensi tema dan preferensi kolom disimpan di `localStorage` dengan nama kunci yang sama pada kedua versi. Kalau keduanya hidup di satu domain, mengubah tema di salah satunya ikut mengubah yang lain. Ini terjadi karena `localStorage` dibedakan berdasarkan domain, bukan berdasarkan folder. Sesi tidak terpengaruh: versi server memakai cookie `httpOnly`, sedangkan versi statis memakai `localStorage`.

## Membuat ulang ikon

Bila `icon.svg` diubah, buat ulang favicon:

```sh
cd client
pnpm icons
```