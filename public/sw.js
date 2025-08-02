// public/sw.js

// Listener untuk menerima notifikasi push dari server
self.addEventListener('push', (event) => {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    console.warn('[SW] Notification permission not granted.');
    return;
  }

  let data = {};
  if (event.data) {
    try {
      // Selalu baca sebagai teks, lalu parse. Ini lebih andal.
      data = JSON.parse(event.data.text());
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      // Fallback jika data tidak bisa di-parse
      data = { title: "Pemberitahuan Baru", body: "Anda memiliki pembaruan baru." };
    }
  }

  const title = data.title || "Pemberitahuan Baru";
  const options = {
    body: data.body || "Anda memiliki pembaruan.",
    icon: '/msarch-logo.png', // Ikon notifikasi
    badge: '/msarch-logo.png', // Ikon kecil (biasanya untuk mobile)
    vibrate: [200, 100, 200], // Pola getaran
    data: {
      url: data.data?.url || '/', // URL untuk dibuka saat diklik
    },
  };

  // Tunda eksekusi hingga notifikasi siap ditampilkan
  event.waitUntil(self.registration.showNotification(title, options));
});


// Listener untuk menangani klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const urlToOpen = new URL(notification.data.url, self.location.origin).href;

  // Tutup notifikasi saat diklik
  notification.close();

  // Fungsi untuk membuka URL
  const openUrl = (url) => {
    return self.clients.openWindow(url);
  };

  // Cari klien (tab) yang ada
  const promiseChain = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let focusedClient = null;

    // Cari tab yang sudah fokus atau yang terlihat
    for (const client of windowClients) {
      if (client.focused) {
        focusedClient = client;
        break;
      }
    }
    
    // Jika tidak ada yang fokus, ambil saja tab pertama yang terlihat
    if (!focusedClient && windowClients.length > 0) {
      focusedClient = windowClients[0];
    }

    // Jika ada klien yang ditemukan (fokus atau tidak), gunakan itu
    if (focusedClient) {
      return focusedClient.navigate(urlToOpen).then((client) => client.focus());
    }

    // Jika tidak ada klien sama sekali, buka jendela baru
    return openUrl(urlToOpen);
  });

  event.waitUntil(promiseChain);
});
