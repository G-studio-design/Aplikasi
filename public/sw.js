// public/sw.js

// Event listener untuk push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json(); // Mengurai data payload dari push event

  const title = data.title || 'Msarch App Notification';
  const options = {
    body: data.message,
    icon: '/msarch-logo.png', // Ikon notifikasi
    badge: '/msarch-logo.png', // Ikon kecil untuk status bar Android
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/', // URL untuk dibuka saat notifikasi diklik
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Event listener untuk klik notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Menutup notifikasi setelah diklik

  const urlToOpen = event.notification.data.url;

  // Membuka tab baru atau fokus ke tab yang sudah ada dengan URL yang dituju
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
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
