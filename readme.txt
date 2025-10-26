```
PROYEK E-BOOKLET PERSIAPAN OPERASI

Aplikasi web full-stack yang dirancang untuk mengelola dan mendistribusikan e-booklet persiapan operasi kepada pasien. Aplikasi ini menggantikan proses manual berbasis kertas dengan alur digital yang aman dan terlacak.

Staf admin (Admin, Admin POC, Exporter) dapat mengelola data pasien melalui dashboard admin yang aman. Pasien menerima sebuah link unik (TokenAkses) untuk mengakses e-booklet mereka dan mengirimkan formulir persetujuan serta tanda tangan digital.

=========================
FITUR UTAMA
=========================

1. DASHBOARD ADMIN (FRONTEND REACT)

- Autentikasi Aman: Sistem login berbasis JWT (JSON Web Token) untuk staf.
- Role-Based Access Control (RBAC): Fungsionalitas dashboard disesuaikan berdasarkan role pengguna (admin, admin_poc, exporter).
- Manajemen Pasien (CRUD):
    - Tambah & Edit: Formulir tunggal untuk menambah pasien baru atau memperbarui data pasien yang ada (logika "UPSERT").
    - Lihat: Daftar pasien lengkap dengan paginasi dan status persetujuan.
    - Hapus: Menghapus data pasien (memerlukan izin khusus).
- Alur Kerja Pasien:
    - Salin Link: Staf dapat menyalin link unik pasien ke clipboard.
    - Kirim WhatsApp: Staf dapat mengklik tombol untuk membuka WhatsApp dengan pesan dan link yang sudah diisi sebelumnya.
- Manajemen User (Admin-Only):
    - Membuat user baru dengan role tertentu.
    - Mengubah password user lain.
    - Mengaktifkan atau menonaktifkan akun user.
- Ekspor Data: Mengekspor seluruh data pasien ke file .csv (memerlukan izin khusus).

2. ALUR PASIEN

- Pasien menerima link unik (misalnya, melalui WhatsApp).
- Membuka link untuk mengakses e-booklet (aplikasi pasien, tidak termasuk dalam file ini).
- Mengisi formulir persetujuan dan memberikan tanda tangan digital.
- Menekan "Submit", yang memanggil endpoint submit-approval.js.
- Status pasien di dashboard admin otomatis berubah menjadi "Disetujui".

=========================
TUMPUKAN TEKNOLOGI (TECH STACK)
=========================

- Frontend: React.js
- Backend: Netlify Functions (Serverless Node.js)
- Database: PostgreSQL
- Autentikasi:
    - Admin: JSON Web Tokens (JWT)
    - Pasien: Token unik crypto (TokenAkses)
- Keamanan: bcryptjs for password hashing

=========================
KEAMANAN: ROLE-BASED ACCESS CONTROL (RBAC)
=========================

Sistem ini memiliki sistem permission yang ketat yang divalidasi di backend dan direfleksikan di frontend.

- Definisi Role (di permissions.js):
    - `admin`: Akses penuh. Dapat mengelola pasien dan mengelola user lain (manage_users).
    - `admin_poc`: Akses manajemen pasien penuh (Tambah, Edit, Hapus, Lihat).
    - `exporter`: Akses terbatas. Hanya dapat melihat pasien (view_patients) dan mengekspor CSV (export_csv).
- Validasi Backend: Setiap endpoint API sensitif memverifikasi token JWT admin DAN memeriksa izin spesifik (misalnya, checkPermission(decoded, 'delete_patient')) sebelum melanjutkan.
- UI Frontend: Tombol di React (seperti "Edit", "Hapus", "Management User") disembunyikan secara dinamis menggunakan fungsi can(...) jika pengguna tidak memiliki izin yang sesuai.

=========================
ARSITEKTUR API (NETLIFY FUNCTIONS)
=========================

Semua logika backend berada di dalam folder netlify/functions.

AUTENTIKASI & USER

- authorize.js: Menangani login staf. Memverifikasi kredensial terhadap database.
- create-user.js: (Admin) Membuat user staf baru.
- get-all-users.js: (Admin) Mengambil daftar semua user staf.
- change-password.js: (Admin) Mengubah password user staf.
- toggle-user-status.js: (Admin) Mengaktifkan/menonaktifkan akun user.

MANAJEMEN PASIEN (ADMIN)

- create-patient-session.js: Endpoint UPSERT. Digunakan untuk menambah pasien baru (INSERT) dan memperbarui pasien yang ada (UPDATE). Juga men-generate TokenAkses unik untuk pasien.
- get-all-patients.js: Mengambil daftar pasien dengan paginasi untuk tabel dashboard.
- get-patient-details.js: Mengambil data satu pasien (digunakan untuk mengisi form edit).
- delete-patient.js: Menghapus data pasien berdasarkan NomorMR.
- export-to-csv.js: Meng-query semua pasien dan mengonversinya menjadi file CSV.

ALUR PASIEN

- submit-approval.js: Menerima data persetujuan dari pasien (termasuk NomorMR, token, signature_data). Memvalidasi token dan memperbarui status pasien menjadi "Disetujui".

UTILITAS & DATABASE

- utils/database.js: Konfigurasi pool koneksi PostgreSQL pusat.
- utils/auth.js: Fungsi helper untuk membuat dan memverifikasi token JWT (Admin) dan TokenAkses (Pasien).
- utils/permissions.js: Mendefinisikan semua role dan izin aplikasi.
- create-table.js: Skrip inisialisasi untuk membuat tabel `patients`.
- migrate-*.js: Berbagai skrip untuk mengubah skema tabel (misalnya, migrate-add-new-columns.js, migrate-add-petugas.js).

=========================
INSTALASI & SETUP
=========================

1. BACKEND & DATABASE

1.  Clone Repositori:
    git clone [URL_REPOSITORI_ANDA]
    cd [NAMA_REPOSITORI]

2.  Install Dependencies:
    npm install

3.  Install Netlify CLI:
    npm install -g netlify-cli

4.  Buat Database PostgreSQL:
    - Buat database PostgreSQL baru (misalnya, di Neon, Supabase, atau local).
    - Dapatkan Connection String (URL Database).

5.  Atur Environment Variables:
    - Buat file .env di root proyek.
    - Tambahkan variabel yang diperlukan:

        # URL koneksi dari database PostgreSQL Anda
        DATABASE_URL="postgresql://user:password@host:port/dbname"

        # Kunci rahasia acak yang kuat untuk menandatangani JWT
        JWT_SECRET="ganti_dengan_kunci_rahasia_anda_yang_sangat_aman"

6.  Jalankan Migrasi Database:
    - Jalankan Netlify dev server di satu terminal:
        netlify dev
    - Di terminal lain, panggil endpoint migrasi untuk membuat tabel Anda (cukup sekali):
        
        # 1. Buat tabel 'patients' (jika belum ada)
        netlify functions:invoke create-table

        # 2. Tambahkan kolom-kolom baru
        netlify functions:invoke migrate-add-new-columns
        netlify functions:invoke migrate-add-token
        netlify functions:invoke migrate-add-petugas
        netlify functions:invoke migrate-add-catatan

7.  Inisialisasi Admin User:
    - Jalankan skrip create-users.js untuk membuat tabel `users` dan menambahkan user default (misalnya, `admin` dengan password `password123`).
    - Pastikan DATABASE_URL Anda terbaca oleh skrip.
        
        node scripts/create-users.js
        
    - PENTING: Hapus skrip fallback HARDCODE_USERS di authorize.js setelah Anda berhasil menjalankan ini.

2. FRONTEND (REACT)

1.  Atur Environment Variables Frontend:
    - Buat file .env di root (jika belum ada) atau di folder frontend (jika terpisah).
    - Tambahkan URL aplikasi pasien Anda (agar tombol "Salin Link" dan "Kirim WA" berfungsi):

        # Ganti dengan URL Netlify tempat aplikasi pasien Anda di-deploy
        REACT_APP_PATIENT_URL="https://url-aplikasi-pasien-anda.netlify.app/pasien/"

2.  Jalankan Aplikasi:
    - Jika React Anda berada di root yang sama dan di-build oleh Netlify, `netlify dev` sudah cukup.
    - Jika ini adalah create-react-app di root, jalankan:
        
        npm start
```