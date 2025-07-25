// public/sw.js

// Listener untuk saat notifikasi diklik
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Tutup notifikasi

  const urlToOpen = event.notification.data?.url || '/';
  
  // Fungsi ini mencari tab yang sudah terbuka dengan URL yang sama.
  // Jika ditemukan, fokus ke tab itu. Jika tidak, buka tab baru.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Listener untuk pesan dari klien (jika diperlukan di masa depan)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_USER_ID') {
    // Anda bisa menyimpan userId di sini jika diperlukan untuk logika service worker
    console.log('Service Worker received user ID:', event.data.userId);
  }
});
