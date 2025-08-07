'use strict';

self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
      data = {
        title: 'Notifikasi Baru',
        body: event.data.text(),
        url: '/dashboard',
      };
    }
  }

  const title = data.title || 'Msarch App';
  const options = {
    body: data.body || 'Anda memiliki pembaruan baru.',
    icon: '/msarch-logo.png',
    badge: '/msarch-logo.png',
    data: {
      url: data.url || '/dashboard',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(function (clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        
        // If a matching client is found, focus it and post a message
        if (client) {
          client.focus();
          client.postMessage({
            type: 'navigate',
            url: urlToOpen,
          });
          return;
        }
      }

      // If no matching client is found, open a new window
      return clients.openWindow(urlToOpen);
    })
  );
});
