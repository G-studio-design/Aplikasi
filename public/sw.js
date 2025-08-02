// public/sw.js

self.addEventListener('push', event => {
  const data = event.data.json();
  console.log('Push notification received:', data);
  const options = {
    body: data.body,
    icon: '/msarch-logo.png',
    badge: '/msarch-badge.png',
    data: {
      url: data.url || '/'
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});


self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const urlToOpen = new URL(notification.data.url, self.location.origin).href;

  notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        
        // Kirim pesan ke klien untuk navigasi
        client.postMessage({
            type: 'navigate',
            url: urlToOpen,
        });

        return client.focus();

      }
      return clients.openWindow(urlToOpen);
    })
  );
});
