
// public/sw.js

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  let data;
  try {
    // The server sends a stringified JSON payload.
    data = JSON.parse(event.data.text());
  } catch (e) {
    console.error('[Service Worker] Failed to parse push data:', e);
    // Create a fallback notification if data parsing fails.
    data = {
      title: 'Notifikasi Baru',
      body: 'Anda memiliki pembaruan baru.',
      url: '/'
    };
  }

  const title = data.title || 'Msarch App';
  const options = {
    body: data.body || 'Anda memiliki pesan baru.',
    icon: '/msarch-logo.png',
    badge: '/msarch-logo.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard' // Ensure there is always a URL
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
