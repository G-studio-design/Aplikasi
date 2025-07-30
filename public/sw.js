// public/sw.js
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error parsing push data:', e);
      // Fallback for plain text notifications
      data = {
        title: 'Notification',
        body: event.data.text(),
        url: '/'
      };
    }
  }

  const title = data.title || 'Msarch App Notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/msarch-logo-192.png',
    badge: '/msarch-logo-72.png',
    data: {
      url: data.url || '/dashboard', // Ensure there is always a URL
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(function(clientList) {
      // Check if there's an already-open window/tab with the same origin
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // If a window is found, focus it and navigate to the target URL
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      // If no window was found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
