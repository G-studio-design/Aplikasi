// public/sw.js

self.addEventListener('push', event => {
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'Msarch App',
      body: 'You have a new update.',
      data: { url: '/' },
    };
  }

  const options = {
    body: payload.body,
    icon: '/msarch-logo.png',
    badge: '/msarch-logo.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  notification.close();

  const urlToOpen = new URL(notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});

self.addEventListener('install', event => {
  self.skipWaiting();
});
