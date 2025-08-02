// public/sw.js

self.addEventListener('push', (event) => {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  let data = {};
  if (event.data) {
    try {
      // Try parsing as JSON from a text string first
      data = JSON.parse(event.data.text());
    } catch (e) {
      console.error('Failed to parse push data as JSON text:', e);
      return; // Exit if data is not valid JSON
    }
  }

  const notification = data.notification || {};
  const title = notification.title || 'Msarch App Notification';
  const body = notification.body || 'You have a new update.';
  const icon = notification.icon || '/msarch-logo.png?v=5';
  const notificationData = notification.data || { url: '/' };

  const options = {
    body,
    icon,
    badge: '/msarch-logo.png?v=5',
    data: notificationData,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
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
