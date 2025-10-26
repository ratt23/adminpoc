# Admin POC - Surgical Preparation Guide

Aplikasi web full-stack yang dirancang untuk mengelola dan mendistribusikan e-booklet persiapan operasi kepada pasien. Aplikasi ini menggantikan proses manual berbasis kertas dengan alur digital yang aman dan terlacak.

Staf admin (Admin, Admin POC, Exporter) dapat mengelola data pasien melalui dashboard admin yang aman. Pasien menerima sebuah link unik (`TokenAkses`) untuk mengakses e-booklet mereka dan mengirimkan formulir persetujuan serta tanda tangan digital.

## Fitur Utama

### 1. Dashboard Admin (Frontend React)

* **Antarmuka Login Khusus:** Halaman login dengan branding khusus (logo dan nama) untuk "Admin POC".
* **Autentikasi Aman:** Sistem login berbasis JWT (JSON Web Token) untuk staf.
* **Role-Based Access Control (RBAC):** Fungsionalitas dashboard disesuaikan berdasarkan role pengguna (`admin`, `admin_poc`, `exporter`).
* **Manajemen Pasien Lengkap (CRUD + Search):**
    * **Pencarian, Filter & Sortir:** Fitur pencarian *real-time* berdasarkan Nama/Nomor MR, filter berdasarkan Status Persetujuan, dan sortir berdasarkan Tanggal Dibuat, Jadwal Operasi, atau Nama.
    * **Paginasi:** Daftar pasien dibagi per halaman (misal, 20 per halaman) untuk memastikan performa tetap cepat.
    * **Tambah & Edit:** Formulir tunggal untuk menambah pasien baru atau memperbarui data pasien yang ada (logika "UPSERT").
    * **Hapus:** Menghapus data pasien (memerlukan izin khusus).
* **Alur Kerja Pasien:**
    * **Salin Link:** Staf dapat menyalin link unik pasien ke *clipboard*.
    * **Kirim WhatsApp:** Staf dapat mengklik tombol untuk membuka WhatsApp dengan pesan dan link yang sudah diisi sebelumnya.
* **Manajemen User Lengkap (Admin-Only):**
    * Membuat user baru dengan role tertentu.
    * Mengubah password user lain.
    * Mengedit Role user yang sudah ada (misal, `exporter` -> `admin_poc`).
    * Mengaktifkan atau menonaktifkan akun user.
    * Menghapus user (dengan pengaman agar tidak menghapus diri sendiri/admin terakhir).
* **Ekspor Data:** Mengekspor seluruh data pasien ke file `.csv`, diurutkan berdasarkan data terbaru yang dibuat.
* **Zona Berbahaya (Admin-Only):**
    * Fitur untuk menghapus **semua data pasien** secara permanen, dilindungi oleh modal konfirmasi yang mewajibkan mengetik "HAPUS PERMANEN".

### 2. Alur Pasien

* Pasien menerima link unik (misalnya, melalui WhatsApp).
* Membuka link untuk mengakses e-booklet (aplikasi pasien terpisah).
* Mengisi formulir persetujuan dan memberikan tanda tangan digital.
* Menekan "Submit", yang memanggil *endpoint* `submit-approval.js`.
* Status di dashboard admin otomatis berubah menjadi "Disetujui".

## Tumpukan Teknologi (Tech Stack)

* **Frontend:** React.js
* **Backend:** Netlify Functions (Serverless Node.js)
* **Database:** PostgreSQL
* **Autentikasi:**
    * **Admin:** JSON Web Tokens (JWT)
    * **Pasien:** Token unik `crypto` (TokenAkses)
* **Keamanan:** `bcryptjs` untuk *password hashing*

## Arsitektur API (Netlify Functions)

Semua logika backend berada di dalam folder `netlify/functions`.

### Autentikasi & User

* `authorize.js`: Menangani login staf. Memverifikasi kredensial.
* `create-user.js`: (Admin) Membuat user staf baru.
* `get-all-users.js`: (Admin) Mengambil daftar semua user staf.
* `change-password.js`: (Admin) Mengubah password user staf.
* `toggle-user-status.js`: (Admin) Mengaktifkan/menonaktifkan akun user.
* `update-user-role.js`: (Admin) Mengubah role dan izin user.
* `delete-user.js`: (Admin) Menghapus user staf secara permanen.

### Manajemen Pasien (Admin)

* `create-patient-session.js`: **Endpoint UPSERT.** Digunakan untuk menambah pasien baru (INSERT) dan memperbarui pasien yang ada (UPDATE).
* `get-all-patients.js`: **Endpoint Inti.** Mengambil daftar pasien dengan paginasi, pencarian, filter, dan sortir.
* `get-patient-details.js`: Mengambil data satu pasien (digunakan untuk mengisi form edit).
* `delete-patient.js`: Menghapus data pasien berdasarkan `NomorMR`.
* `export-to-csv.js`: Meng-query semua pasien dan mengonversinya menjadi file CSV.
* `clear-all-patients.js`: (Admin) Menghapus **semua** data dari tabel `patients`.

### Alur Pasien

* `submit-approval.js`: Menerima data persetujuan dari pasien (termasuk `NomorMR`, `token`, `signature_data`).

### Utilitas & Database

* `utils/database.js`: Konfigurasi *pool* koneksi PostgreSQL pusat.
* `utils/auth.js`: Fungsi helper untuk token JWT (Admin) dan TokenAkses (Pasien).
* `utils/permissions.js`: Mendefinisikan semua role dan izin aplikasi.
* `create-table.js`: Skrip inisialisasi untuk membuat tabel `patients`.
* `migrate-*.js`: Berbagai skrip untuk mengubah skema tabel.

## Setup & Instalasi

### 1. Backend & Database

1.  **Clone Repositori**
2.  **Install Dependencies:** `npm install`
3.  **Install Netlify CLI:** `npm install -g netlify-cli`
4.  **Buat Database PostgreSQL** (misal: Neon) dan dapatkan Connection String.
5.  **Atur Environment Variables** (buat file `.env`):
    ```ini
    # URL koneksi dari database PostgreSQL Anda
    DATABASE_URL="postgresql://user:password@host:port/dbname"

    # Kunci rahasia acak yang kuat untuk menandatangani JWT
    JWT_SECRET="ganti_dengan_kunci_rahasia_anda_yang_sangat_aman"
    ```
6.  **Jalankan Netlify Dev:** `netlify dev`
7.  **Jalankan Migrasi Database** (panggil *endpoint* di terminal terpisah, cukup sekali):
    ```bash
    netlify functions:invoke create-table
    netlify functions:invoke migrate-add-new-columns
    netlify functions:invoke migrate-add-token
    # ... jalankan migrasi lain yang diperlukan ...
    ```
8.  **Inisialisasi Admin User:**
    ```bash
    node scripts/create-users.js
    ```
    (Ini akan membuat tabel `users` dan user `admin` dengan password `password123`)

### 2. Frontend (React)

1.  **Atur Environment Variables Frontend** (tambahkan ke file `.env` yang sama):
    ```ini
    # Ganti dengan URL Netlify tempat aplikasi PASIEN Anda di-deploy
    REACT_APP_PATIENT_URL="[https://url-aplikasi-pasien-anda.netlify.app/pasien/](https://url-aplikasi-pasien-anda.netlify.app/pasien/)"
    ```
2.  **Tempatkan Logo:** Pastikan logo Anda ada di `public/logobaru.png`.
3.  **Jalankan Aplikasi:** `npm start` (jika menggunakan CRA) atau `netlify dev` akan otomatis menjalankannya.