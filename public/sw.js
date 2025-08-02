// public/sw.js
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');

  if (!event.data) {
    console.error('[Service Worker] Push event but no data');
    return;
  }

  try {
    const dataText = event.data.text();
    const data = JSON.parse(dataText);

    // Modern standardized payload structure
    const notificationData = data.notification || data;

    const title = notificationData.title || 'Msarch App';
    const options = {
      body: notificationData.body || 'You have a new message.',
      icon: '/msarch-logo.png',
      badge: '/msarch-logo-badge.png', // Optional: a monochrome icon
      data: {
        url: notificationData.data?.url || notificationData.url || '/'
      }
    };
    
    console.log('[Service Worker] Showing notification:', options);
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );

  } catch (e) {
    console.error('[Service Worker] Error processing push event:', e);
    // Fallback for simple string payloads
    const title = 'Msarch App';
    const options = {
      body: event.data.text(),
      icon: '/msarch-logo.png',
      badge: '/msarch-logo-badge.png',
      data: {
        url: '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});


self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a window open with the same URL.
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
