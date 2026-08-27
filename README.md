# 🚨 Panic Button - Public Safety System

Panic Button Public Safety System adalah aplikasi berbasis web yang dirancang untuk membantu pengguna mengirimkan laporan darurat secara cepat kepada petugas atau pihak terkait.

Sistem mendukung pelaporan kejadian melalui aplikasi web dan perangkat IoT Panic Button. Selain itu, aplikasi menyediakan fitur monitoring laporan, manajemen pengguna, manajemen perangkat IoT, serta pencarian instansi darurat terdekat berdasarkan lokasi pengguna.

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Role Pengguna](#-role-pengguna)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Teknologi](#️-teknologi-yang-digunakan)
- [Instalasi](#-instalasi)
- [Konfigurasi](#️-konfigurasi)
- [Cara Menjalankan](#️-cara-menjalankan-aplikasi)
- [Emergency Map](#️-emergency-map)
- [Struktur Project](#-struktur-project)
- [Cara Penggunaan](#-cara-penggunaan)
- [Troubleshooting](#-troubleshooting)
- [Keamanan](#-keamanan)
- [Pengembangan Selanjutnya](#-pengembangan-selanjutnya)
- [Kontribusi](#-kontribusi)

---

## 📖 Tentang Proyek

**Panic Button Public Safety System** merupakan aplikasi yang memungkinkan pengguna untuk mengirimkan laporan darurat secara cepat.

Laporan dapat dibuat melalui aplikasi web maupun perangkat **IoT Panic Button**. Ketika laporan dikirim, backend akan memproses data dan meneruskannya ke sistem agar dapat ditangani oleh petugas.

Aplikasi juga menyediakan fitur pencarian instansi darurat terdekat berdasarkan lokasi pengguna, seperti:

- 🏥 Rumah Sakit
- 🚓 Kantor Polisi
- 🚒 Pemadam Kebakaran
- 🏥 Klinik

---

## ✨ Fitur Utama

### 👤 User

- Registrasi dan Login
- Membuat laporan
- Mengirim laporan darurat
- Melihat status laporan
- Melihat riwayat laporan
- Melihat lokasi kejadian
- Melihat instansi darurat terdekat

### 👮 Petugas

- Dashboard petugas
- Melihat laporan masuk
- Menerima laporan
- Melihat detail laporan
- Melihat lokasi kejadian
- Menangani laporan
- Memperbarui status laporan
- Melihat riwayat tugas

### 🛠️ Admin

- Dashboard Admin
- Manajemen User
- Manajemen Role
- Manajemen Petugas
- Monitoring Laporan
- Manajemen Perangkat IoT
- Monitoring Perangkat IoT
- Pengaturan Sistem

### 🔘 IoT Panic Button

- Mengirim request darurat
- Validasi perangkat
- Monitoring status perangkat
- Integrasi dengan backend Laravel

### 🗺️ Instansi Darurat Terdekat

- Mengambil lokasi pengguna menggunakan Geolocation
- Menampilkan Rumah Sakit
- Menampilkan Kantor Polisi
- Menampilkan Pemadam Kebakaran
- Menampilkan Klinik
- Filter berdasarkan kategori
- Marker berbeda untuk setiap kategori
- Menampilkan instansi berdasarkan radius lokasi pengguna

---

## 👥 Role Pengguna

| Role | Hak Akses |
|------|-----------|
| User | Membuat dan melihat laporan |
| Petugas | Menangani laporan |
| Admin | Mengelola sistem |
| IoT Device | Mengirim request Panic Button |

---

## 🏗️ Arsitektur Sistem

```text
                    ┌──────────────┐
                    │     USER     │
                    │   WEB APP    │
                    └──────┬───────┘
                           │
                           │
                    ┌──────▼───────┐
                    │   BACKEND    │
                    │   LARAVEL    │
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        ┌────────┐    ┌─────────┐   ┌────────┐
        │ ADMIN  │    │ PETUGAS │   │   IoT  │
        └────────┘    └─────────┘   └────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   DATABASE   │
                    ├──────────────┤
                    │ User         │
                    │ Device / IoT │
                    │ Laporan      │
                    │ Status       │
                    └──────────────┘
```

---

## 🛠️ Teknologi yang Digunakan

### Backend

- PHP
- Laravel

### Frontend

- HTML
- CSS
- JavaScript
- Blade Template

### Database

- MySQL

### Maps

- Leaflet.js
- OpenStreetMap
- Overpass API

### IoT

- Panic Button Device
- HTTP Request / API

---

# 💻 Instalasi

## 1. Clone Repository

```bash
git clone https://github.com/username/panic-button.git
```

Masuk ke folder project:

```bash
cd panic-button
```

---

## 2. Install Dependency

Install dependency Laravel:

```bash
composer install
```

Install dependency frontend:

```bash
npm install
```

---

## 3. Buat File Environment

Linux atau Mac:

```bash
cp .env.example .env
```

Windows:

```bash
copy .env.example .env
```

---

## 4. Generate Application Key

```bash
php artisan key:generate
```

---

# ⚙️ Konfigurasi

## Konfigurasi Database

Buka file:

```text
.env
```

Sesuaikan konfigurasi database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=panic_button
DB_USERNAME=root
DB_PASSWORD=
```

Buat database dengan nama:

```text
panic_button
```

---

## Migrasi Database

Jalankan:

```bash
php artisan migrate
```

Jika project menggunakan seeder:

```bash
php artisan db:seed
```

Atau:

```bash
php artisan migrate --seed
```

---

# ▶️ Cara Menjalankan Aplikasi

Jalankan Laravel:

```bash
php artisan serve
```

Aplikasi dapat diakses melalui:

```text
http://127.0.0.1:8000
```

Untuk menjalankan Vite:

```bash
npm run dev
```

---

# 🗺️ Emergency Map

Fitur **Instansi Darurat Terdekat** menggunakan:

- Browser Geolocation
- Leaflet.js
- OpenStreetMap
- Overpass API

## Alur Emergency Map

```text
User membuka halaman
        │
        ▼
Browser meminta izin lokasi
        │
        ▼
Lokasi User diperoleh
        │
        ▼
Latitude & Longitude dikirim ke Laravel
        │
        ▼
Laravel mengambil data instansi
        │
        ▼
Data dikembalikan dalam JSON
        │
        ▼
Leaflet menampilkan marker pada peta
```

Kategori instansi:

```text
hospital
police
fire_station
clinic
```

Contoh endpoint:

```text
/emergency-facilities
```

Contoh parameter:

```text
?lat=-7.8250&lng=110.3679
```

---

## 📍 Optimasi Performa Map

Untuk menghindari terlalu banyak marker, direkomendasikan:

```text
Radius: 3 - 5 KM
Maksimal instansi: 30 - 50
```

Contoh radius:

```php
$radius = 5000;
```

Data instansi dapat diurutkan berdasarkan jarak dan dibatasi:

```php
->sortBy('distance')
->take(50)
```

Hal ini membantu menjaga performa aplikasi, terutama pada perangkat mobile.

---

# 📂 Struktur Project

```text
panic-button/
│
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │
│   ├── Models/
│   │
│   └── Services/
│
├── database/
│   ├── migrations/
│   └── seeders/
│
├── public/
│   ├── css/
│   ├── js/
│   └── images/
│
├── resources/
│   └── views/
│       ├── admin/
│       ├── petugas/
│       ├── user/
│       └── landing/
│
├── routes/
│   └── web.php
│
├── .env
├── composer.json
├── package.json
└── README.md
```

---

# 🚀 Cara Penggunaan

## 👤 User

1. Buka aplikasi.
2. Login atau registrasi.
3. Masuk ke dashboard.
4. Buat laporan atau tekan Panic Button.
5. Sistem mengirim laporan ke backend.
6. User dapat melihat status laporan.
7. User dapat melihat riwayat laporan.
8. User dapat melihat instansi darurat terdekat.

---

## 👮 Petugas

1. Login sebagai Petugas.
2. Membuka Dashboard Petugas.
3. Melihat laporan masuk.
4. Memilih laporan yang akan ditangani.
5. Melihat detail dan lokasi kejadian.
6. Memperbarui status laporan.
7. Menyelesaikan laporan.

---

## 🛠️ Admin

1. Login sebagai Admin.
2. Membuka Dashboard Admin.
3. Mengelola User dan Role.
4. Mengelola Petugas.
5. Monitoring laporan.
6. Monitoring perangkat IoT.
7. Mengelola sistem.

---

# 🔧 Troubleshooting

## Error 404 Not Found

Periksa apakah route sudah terdaftar:

```bash
php artisan route:list
```

Kemudian bersihkan cache:

```bash
php artisan optimize:clear
```

---

## Error `Unexpected token '<'`

Error ini biasanya terjadi karena JavaScript mengharapkan response JSON, tetapi server mengembalikan halaman HTML.

Pastikan endpoint:

```text
/emergency-facilities
```

mengembalikan JSON:

```php
return response()->json([
    'success' => true,
    'data' => $data
]);
```

---

## Error 500 Internal Server Error

Periksa log Laravel:

```text
storage/logs/laravel.log
```

Kemudian jalankan:

```bash
php artisan optimize:clear
```

---

## Lokasi User Tidak Terdeteksi

Pastikan browser sudah diberikan izin untuk mengakses lokasi.

Pada deployment atau production, gunakan:

```text
HTTPS
```

karena fitur Geolocation membutuhkan secure context.

---

## Instansi Tidak Ditemukan

Kemungkinan penyebab:

- Radius pencarian terlalu kecil.
- Tidak ada data instansi pada OpenStreetMap.
- Overpass API sedang bermasalah.
- Query Overpass API gagal.

Solusi yang dapat dicoba:

```text
Gunakan radius 3 - 5 KM
```

Kemudian periksa response API pada browser console atau Laravel log.

---

# 🔐 Keamanan

Beberapa aspek keamanan yang perlu diperhatikan:

- Validasi request.
- Authentication.
- Role-based authorization.
- Validasi perangkat IoT.
- Proteksi endpoint.
- Validasi data laporan.
- Pembatasan request jika diperlukan.
- Jangan menyimpan API Key atau data sensitif langsung pada source code.

---

# 🧩 Pengembangan Selanjutnya

Beberapa fitur yang dapat dikembangkan:

- [ ] Notifikasi real-time
- [ ] WebSocket untuk monitoring laporan
- [ ] Push notification
- [ ] Integrasi WhatsApp atau SMS Gateway
- [ ] Navigasi menuju lokasi kejadian
- [ ] Marker clustering pada map
- [ ] Monitoring IoT secara real-time
- [ ] Dashboard statistik
- [ ] Penambahan kategori instansi darurat
- [ ] Deployment menggunakan Docker

---

# 🤝 Kontribusi

Kontribusi terhadap project ini sangat terbuka.

Buat branch baru:

```bash
git checkout -b fitur-baru
```

Tambahkan perubahan:

```bash
git add .
```

Buat commit:

```bash
git commit -m "Menambahkan fitur baru"
```

Push ke repository:

```bash
git push origin fitur-baru
```

Kemudian buat Pull Request.

---

# 📄 License

Project ini dibuat untuk keperluan pengembangan dan pembelajaran sistem **Panic Button Public Safety System**.

---

# 👨‍💻 Author

**Nama Anda**

Panic Button - Public Safety System
