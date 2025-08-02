// public/sw.js

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  
  let data = {};
  try {
    // Coba parse data sebagai JSON
    data = event.data.json();
  } catch (e) {
    console.warn('[Service Worker] Push event data is not JSON, treating as text.', e);
    // Jika gagal, coba sebagai teks
    const textData = event.data.text();
    // Jika teks ada, buat objek notifikasi darinya
    if (textData) {
      data = { title: 'Pemberitahuan', body: textData, data: { url: '/' } };
    } else {
      // Jika tidak ada data sama sekali
      data = { title: 'Pemberitahuan', body: 'Anda memiliki pembaruan baru.', data: { url: '/' } };
    }
  }

  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.body || 'Anda memiliki pembaruan baru.',
    icon: '/msarch-logo.png',
    badge: '/msarch-logo.png',
    data: {
      url: data.data?.url || self.location.origin,
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clientList => {
    // Cari klien yang sudah ada
    for (const client of clientList) {
      // Fokus pada klien yang sudah ada, lalu kirim pesan untuk navigasi
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        return client.focus().then(focusedClient => {
          // Kirim pesan ke klien yang difokuskan untuk melakukan navigasi
          focusedClient.postMessage({
            type: 'navigate',
            url: urlToOpen
          });
        });
      }
    }
    // Jika tidak ada klien yang ditemukan, buka jendela baru
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
