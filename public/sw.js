self.addEventListener('push', function (event) {
  const data = event.data.json();
  const title = data.title || 'Msarch App';
  const options = {
    body: data.message,
    icon: '/msarch-logo.png',
    badge: '/msarch-logo.png',
    data: {
      url: data.url || '/dashboard' 
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Tutup notifikasi

  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function (clientList) {
      // Cek apakah ada tab yang sudah membuka URL target
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        let clientUrl = new URL(client.url);
        let targetUrlObj = new URL(targetUrl, self.location.origin);

        // Jika path-nya sama, fokus ke tab tersebut
        if (clientUrl.pathname === targetUrlObj.pathname && 'focus' in client) {
          return client.focus();
        }
      }

      // Jika tidak ada tab yang cocok, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
