<<<<<<< HEAD
# Msarch App

Aplikasi starter Next.js untuk manajemen proyek dan tugas karyawan.

## Prasyarat

Sebelum Anda dapat menjalankan aplikasi ini, pastikan Node.js dan npm (yang terinstal bersama Node.js) sudah terpasang di komputer Anda.

- **Node.js**: Unduh versi LTS dari [nodejs.org](https://nodejs.org/).
- **Editor Kode**: Disarankan menggunakan [Visual Studio Code](https://code.visualstudio.com/).

## Menjalankan Secara Lokal

1.  **Instal Dependensi**

    Buka terminal di direktori root proyek dan jalankan:
    ```bash
    npm install
    ```

2.  **Jalankan Server Pengembangan**

    Setelah dependensi terinstal, jalankan server:
    ```bash
    npm run dev
    ```

    Aplikasi sekarang akan berjalan di `http://localhost:4000`. Jika Anda ingin mengaksesnya dari perangkat lain di jaringan yang sama, gunakan alamat IP lokal komputer Anda (misalnya, `http://192.168.1.10:4000`).

## Konfigurasi Variabel Lingkungan

Untuk mengintegrasikan dengan layanan Google (seperti Google Calendar), Anda perlu membuat file `.env` di direktori root proyek.

1.  Buat file baru bernama `.env`.
2.  Salin dan tempel konten di bawah ini ke dalam file `.env`, lalu ganti placeholder dengan kredensial Anda yang sebenarnya.

```env
# Kredensial Google OAuth 2.0
# Dapatkan ini dari Google Cloud Console: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="GANTI_DENGAN_CLIENT_ID_ANDA"
GOOGLE_CLIENT_SECRET="GANTI_DENGAN_CLIENT_SECRET_ANDA"

# URI Pengalihan harus sama persis dengan yang dikonfigurasi di Google Cloud Console.
# Untuk pengembangan lokal, biasanya seperti ini.
NEXT_PUBLIC_GOOGLE_REDIRECT_URI="http://localhost:4000/api/auth/google/callback"
```

**PENTING**: File `.env` berisi informasi sensitif. File ini sudah tercantum di dalam `.gitignore` untuk mencegahnya diunggah ke GitHub secara tidak sengaja. Jangan pernah membagikan file `.env` Anda atau memasukkannya ke dalam riwayat Git.
=======
# Aplikasi

