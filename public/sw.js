// public/sw.js

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  if (!event.data) {
    console.error('[Service Worker] Push event but no data');
    return;
  }

  let data;
  try {
    // Correctly parse the text payload from the server
    data = JSON.parse(event.data.text());
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    // Fallback for simple text pushes
    data = { title: 'New Notification', body: event.data.text() };
  }

  const { title, body, url } = data;

  const options = {
    body: body,
    icon: '/msarch-logo-192.png',
    badge: '/msarch-logo-72.png',
    data: {
      url: url || '/', // Pass the URL to the notification's data payload
    }
  };

  const notificationPromise = self.registration.showNotification(title, options);
  event.waitUntil(notificationPromise);
});


self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const targetUrl = event.notification.data.url;

  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    if (clientList.length > 0) {
      let client = clientList.find(c => c.url === urlToOpen && 'focus' in c);
      if (client) {
        return client.focus();
      }
      // If no exact match, focus any client and navigate
      if (clientList[0].navigate && typeof clientList[0].navigate === 'function') {
        return clientList[0].navigate(urlToOpen).then(c => c.focus());
      }
    }
    // If no clients are open, open a new one
    return clients.openWindow(urlToOpen);
  });

  event.waitUntil(promiseChain);
});
