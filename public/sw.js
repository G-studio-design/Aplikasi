// public/sw.js

// Version: 1.0.8 - Reliable Navigation Fix

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  if (!event.data) {
    console.error('[Service Worker] Push event but no data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.warn('[Service Worker] Could not parse push data as JSON, falling back to text.');
    const textData = event.data.text();
    payload = {
      title: 'Msarch App Notification',
      body: textData || 'You have a new update.',
      data: { url: '/' },
    };
  }

  const title = payload.title || 'Msarch App Notification';
  const options = {
    body: payload.body || 'You have a new update.',
    icon: '/msarch-logo-192.png',
    badge: '/msarch-logo-72.png',
    data: {
      url: payload.url || payload.data?.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = clients.openWindow(urlToOpen);
  event.waitUntil(promiseChain);
});
