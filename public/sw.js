
// public/sw.js

self.addEventListener('push', (event) => {
  if (!self.Notification || self.Notification.permission !== 'granted') {
    console.warn('[SW] Notifications permission not granted.');
    return;
  }
  
  let data = {};
  if (event.data) {
    try {
      data = JSON.parse(event.data.text());
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      data = {
        title: 'Msarch App',
        body: 'Anda memiliki pembaruan baru. Klik untuk melihat.',
        data: { url: '/dashboard' }
      };
    }
  }

  const title = data.title || 'Msarch App';
  const options = {
    body: data.body || 'Anda memiliki pembaruan baru. Klik untuk melihat.',
    icon: '/msarch-logo.png',
    badge: '/msarch-logo.png', // Badge sebaiknya gambar monokrom sederhana
    data: {
      url: data.url || '/dashboard' // Mengambil URL langsung dari data
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data.url, self.location.origin).href;

  // Mencari klien/tab yang cocok atau yang terlihat
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let clientIsFound = false;

    // Cari tab yang sudah terbuka dengan URL yang sama
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === targetUrl && 'focus' in client) {
        client.focus();
        clientIsFound = true;
        break;
      }
    }

    // Jika tidak ada yang sama persis, cari tab aplikasi mana saja yang visible
    if (!clientIsFound && windowClients.length > 0) {
      const visibleClient = windowClients.find(c => c.visibilityState === "visible");
      if (visibleClient && 'focus' in visibleClient && 'navigate' in visibleClient) {
        visibleClient.navigate(targetUrl);
        visibleClient.focus();
        clientIsFound = true;
      }
    }
    
    // Jika tidak ada tab yang ditemukan atau visible, buka tab baru
    if (!clientIsFound) {
      clients.openWindow(targetUrl).then((client) => {
        if (client) client.focus();
      });
    }
  });

  event.waitUntil(promiseChain);
});
