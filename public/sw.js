// public/sw.js

// This forces the waiting service worker to become the active service worker.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// This claims control over all clients (tabs) as soon as the service worker activates.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener for push notifications from the server
self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('Push event data is not valid JSON:', event.data?.text());
    data = {};
  }

  const title = data.title || 'Msarch App';
  const options = {
    body: data.message || 'Anda memiliki pemberitahuan baru.',
    icon: '/msarch-logo.png', // Main icon
    badge: '/msarch-logo.png', // Small icon for notification bar on Android
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


// Listener for when a user clicks on a notification
self.addEventListener('notificationclick', (event) => {
  // Close the notification
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientsArr) => {
        // Check if there is already a window/tab open with the target URL
        const hadWindowToFocus = clientsArr.some((windowClient) => {
          if (windowClient.url === urlToOpen) {
            windowClient.focus();
            return true;
          }
          return false;
        });

        // If not, then open a new window/tab
        if (!hadWindowToFocus) {
          self.clients
            .openWindow(urlToOpen)
            .then((windowClient) => (windowClient ? windowClient.focus() : null));
        }
      })
  );
});