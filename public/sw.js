
// public/sw.js

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Push event data is not valid JSON.', e);
    // Fallback for plain text notifications if needed
    data = {
      title: 'Pemberitahuan Baru',
      body: event.data.text(),
      data: { url: '/' }
    };
  }
  
  console.log('[Service Worker] Notification data:', data);

  const title = data.title || 'Msarch App';
  const options = {
    body: data.body || 'Anda memiliki pembaruan baru.',
    icon: '/msarch-logo.png', // Main app icon
    badge: '/msarch-logo-badge.png', // A smaller badge icon
    vibrate: [200, 100, 200],
    data: {
      url: data.data?.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  console.log(`[Service Worker] Attempting to open window for: ${urlToOpen}`);

  const promiseChain = clients.openWindow(urlToOpen);
  event.waitUntil(promiseChain);
});
