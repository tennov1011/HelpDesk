# Panduan Instalasi Sistem Reset Password

## Prasyarat
- Node.js versi 16 atau lebih tinggi
- NPM versi 7 atau lebih tinggi
- Project Firebase yang sudah dikonfigurasi

## Langkah 1: Instalasi Dependensi
```bash
npm install firebase firebase-admin
```

## Langkah 2: Konfigurasi Environment Variables
Buat file `.env` di root project dengan isi sebagai berikut:

```
# Firebase Client SDK
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_ADMIN_CONFIG={"type":"service_account","project_id":"your_project_id",...}
```

Ganti nilai-nilai di atas dengan nilai sebenarnya dari project Firebase Anda.

## Langkah 3: Konfigurasi Firebase Authentication

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Pergi ke Authentication > Sign-in method
4. Aktifkan metode autentikasi "Email/Password"
5. Di tab "Templates", sesuaikan template email untuk "Password reset"

## Langkah 4: Mengaktifkan API Endpoint

Pastikan server SvelteKit Anda dikonfigurasi untuk menggunakan adapter yang mendukung API endpoints (seperti adapter-node atau adapter-vercel).

## Langkah 5: Menjalankan Aplikasi

```bash
npm run dev
```

## Pengujian

1. Buka aplikasi di browser
2. Klik "Lupa Password" di halaman login
3. Masukkan email yang terdaftar
4. Cek inbox email untuk link reset password
5. Klik link dan ikuti instruksi untuk mereset password

## Troubleshooting

### Email Reset Password Tidak Diterima
- Periksa folder spam/junk
- Pastikan email terdaftar di Firebase Authentication
- Periksa log Firebase untuk error

### Error "Firebase Admin tidak tersedia"
- Pastikan `FIREBASE_ADMIN_CONFIG` dikonfigurasi dengan benar
- Pastikan service account memiliki izin yang cukup

### Error "Token reset password tidak valid"
- Token mungkin sudah kadaluarsa (biasanya berlaku 1 jam)
- Token mungkin sudah digunakan sebelumnya
- Minta link reset password baru

## Catatan Keamanan

- Jangan pernah menyimpan `FIREBASE_ADMIN_CONFIG` di client-side atau repository publik
- Gunakan HTTPS untuk semua komunikasi
- Terapkan rate limiting untuk mencegah brute force attacks
- Pertimbangkan untuk menambahkan CAPTCHA pada form lupa password 