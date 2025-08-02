// public/sw.js

// Listener untuk instalasi Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  // event.waitUntil(self.skipWaiting()); // Opsi: aktifkan worker baru segera
});

// Listener untuk aktivasi Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  // event.waitUntil(self.clients.claim()); // Opsi: ambil kontrol atas klien yang ada
});

// Listener untuk menerima notifikasi push dari server
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received.');

  let notificationData = {};
  try {
    // Selalu baca data sebagai teks dan parse secara manual untuk keandalan maksimum
    const dataText = event.data.text();
    if (dataText) {
      notificationData = JSON.parse(dataText);
    }
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
  }
  
  const title = notificationData.title || 'Msarch App Notification';
  const options = {
    body: notificationData.body || 'You have a new update.',
    icon: '/msarch-logo.png', // Ikon utama
    badge: '/msarch-logo.png', // Ikon kecil untuk status bar Android
    vibrate: [200, 100, 200], // Pola getar
    data: {
      url: notificationData.data?.url || '/', // URL tujuan saat notifikasi diklik
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Listener untuk menangani klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const urlToOpen = notification.data?.url || '/';

  console.log(`[SW] Notification clicked. URL to open: ${urlToOpen}`);

  notification.close();

  // Ini adalah pendekatan yang paling andal untuk menangani klik notifikasi.
  // Ia akan membuka tab baru ke URL yang dituju. Browser kemudian akan
  // secara otomatis menangani pemfokusan tab jika URL tersebut sudah terbuka.
  // Pendekatan ini menghindari masalah otentikasi yang kompleks yang terjadi
  // saat mencoba menavigasi ulang tab yang ada secara manual dari Service Worker.
  const promiseChain = clients.openWindow(urlToOpen);
  event.waitUntil(promiseChain);
});
