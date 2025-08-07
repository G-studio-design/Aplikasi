// public/sw.js

// Listener untuk menerima pesan push dari server.
// Ini yang bertanggung jawab untuk MENAMPILKAN notifikasi.
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  let data = {};
  try {
    // Mencoba parse payload sebagai JSON
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('[Service Worker] Push event data is not JSON, falling back.', e);
  }

  const title = data.title || 'Msarch App';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/msarch-logo.png?v=5', // Ikon notifikasi
    badge: '/msarch-logo.png?v=5', // Ikon kecil di status bar (Android)
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


// Listener untuk saat notifikasi DIKLIK.
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close(); // Tutup notifikasi yang diklik

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((windowClients) => {
    let matchingClient = null;

    // Coba cari tab yang sudah terbuka dengan URL yang sama
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === urlToOpen) {
        matchingClient = client;
        break;
      }
    }

    // Jika tab yang sama ditemukan, fokus ke tab itu
    if (matchingClient) {
      console.log('[Service Worker] Found an existing tab, focusing it.');
      return matchingClient.focus();
    } else {
      // Jika tidak ada tab yang cocok, buka tab baru
      console.log('[Service Worker] No existing tab found, opening a new one.');
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
